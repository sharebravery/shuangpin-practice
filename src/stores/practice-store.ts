import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";

import { CHARACTERS } from "@/data/characters";
import { PHRASES } from "@/data/phrases";
import { getScheme } from "@/data/schemes";
import type {
  GeneratedQuestion,
  GenerateOptions,
} from "@/lib/shuangpin/generate-question";
import { generateQuestion } from "@/lib/shuangpin/generate-question";
import { isAcceptedAnswer, normalizeAnswer } from "@/lib/shuangpin/validate";
import type {
  MistakeRecord,
  PracticeMode,
  PracticeSettings,
  SchemeId,
} from "@/lib/shuangpin/types";

/** 练习会话状态（实现细则 §11）。 */
export type SessionStatus =
  | "ready"
  | "answering"
  | "wrong"
  | "paused"
  | "completed";

/** 答题反馈（正确反馈用于 autoNext=false 时短暂展示）。 */
export type Feedback = "none" | "correct";

export interface PracticeSession {
  status: SessionStatus;
  question: GeneratedQuestion | null;
  questionId: string;
  /** 词组模式当前汉字索引（逐字输入）。 */
  phraseIndex: number;
  completed: number;
  correct: number;
  streak: number;
  longestStreak: number;
  /** 本组题数。 */
  total: number;
  /** 最近若干题 id，用于连续去重。 */
  recentIds: string[];
  /** 本组答错的题目 id（用于「练习错题」）。 */
  sessionMistakes: string[];
  /** 当前题池：主池或错题池。 */
  pool: "main" | "mistakes";
  feedback: Feedback;
}

export interface PracticeTotals {
  completed: number;
  correct: number;
}

export const DEFAULT_SETTINGS: PracticeSettings = {
  scheme: "xiaohe",
  mode: "character",
  questionsPerSession: 20,
  showPinyin: true,
  showKeyboard: true,
  autoNext: true,
  mistakePriority: true,
  sound: false,
};

const DEFAULT_SESSION: PracticeSession = {
  status: "ready",
  question: null,
  questionId: "",
  phraseIndex: 0,
  completed: 0,
  correct: 0,
  streak: 0,
  longestStreak: 0,
  total: DEFAULT_SETTINGS.questionsPerSession,
  recentIds: [],
  sessionMistakes: [],
  pool: "main",
  feedback: "none",
};

export { DEFAULT_SESSION };

const DEFAULT_TOTALS: PracticeTotals = { completed: 0, correct: 0 };

export { DEFAULT_TOTALS };

/** 去重窗口：最近 N 道题不再立即重复。 */
const RECENT_WINDOW = 4;

/** 持久化的状态切片（partialize 返回值类型）。 */
type PersistedState = {
  version: 1;
  settings: PracticeSettings;
  mistakes: Record<string, MistakeRecord>;
  totals: PracticeTotals;
};

/**
 * 安全的 JSON 存储（实现细则 §8.4 损坏数据恢复）：
 * 解析失败时视为空数据，避免白屏；写入/删除也忽略隐私模式或配额错误。
 */
const safeJsonStorage: PersistStorage<PersistedState> = {
  getItem: (name) => {
    if (typeof localStorage === "undefined") return null;
    const str = localStorage.getItem(name);
    if (!str) return null;
    try {
      return JSON.parse(str) as StorageValue<PersistedState>;
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, JSON.stringify(value));
    } catch {
      // 忽略配额或隐私模式错误
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // 忽略
    }
  },
};

interface PracticeStoreState {
  version: 1;
  settings: PracticeSettings;
  session: PracticeSession;
  mistakes: Record<string, MistakeRecord>;
  totals: PracticeTotals;
  hasHydrated: boolean;

  setScheme: (scheme: SchemeId) => void;
  setMode: (mode: PracticeMode) => void;
  updateSettings: (patch: Partial<PracticeSettings>) => void;
  startSession: () => void;
  submit: (input: string) => void;
  next: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  startMistakeSession: () => void;
  clearHistory: () => void;
  setHasHydrated: (value: boolean) => void;
}

/** 出题：根据设置与当前池生成下一题。 */
function makeQuestion(
  settings: PracticeSettings,
  mistakes: Record<string, MistakeRecord>,
  recentIds: string[],
  pool: "main" | "mistakes",
  sessionMistakes: string[],
): { question: GeneratedQuestion; id: string } | null {
  const scheme = getScheme(settings.scheme);
  if (!scheme) return null;

  const mistakeSet = new Set(sessionMistakes);
  const characters =
    pool === "mistakes" && settings.mode === "character"
      ? CHARACTERS.filter((c) => mistakeSet.has(c.id))
      : CHARACTERS;
  const phrases =
    pool === "mistakes" && settings.mode === "phrase"
      ? PHRASES.filter((p) => mistakeSet.has(p.id))
      : PHRASES;

  const opts: GenerateOptions = {
    scheme,
    mode: settings.mode,
    characters,
    phrases,
    recentIds,
    mistakes,
    mistakePriority: settings.mistakePriority,
    random: Math.random,
  };
  const result = generateQuestion(opts);
  if (!result.ok) return null;
  return { question: result.question, id: result.id };
}

/** 推进 recentIds，保留最近 RECENT_WINDOW 个。 */
function pushRecent(recentIds: string[], id: string): string[] {
  return [...recentIds, id].slice(-RECENT_WINDOW);
}

export const usePracticeStore = create<PracticeStoreState>()(
  persist(
    (set, get) => ({
      version: 1,
      settings: DEFAULT_SETTINGS,
      session: { ...DEFAULT_SESSION, total: DEFAULT_SETTINGS.questionsPerSession },
      mistakes: {},
      totals: { ...DEFAULT_TOTALS },
      hasHydrated: false,

      setScheme: (scheme) => {
        set((state) => ({
          settings: { ...state.settings, scheme },
        }));
        get().startSession();
      },

      setMode: (mode) => {
        set((state) => ({ settings: { ...state.settings, mode } }));
        get().startSession();
      },

      updateSettings: (patch) => {
        set((state) => ({
          settings: { ...state.settings, ...patch },
        }));
        // 切换每组题数需重置本组（实现细则 §11）。
        if (
          patch.questionsPerSession !== undefined &&
          patch.questionsPerSession !== get().session.total
        ) {
          get().startSession();
        }
      },

      startSession: () => {
        const { settings, mistakes } = get();
        const generated = makeQuestion(
          settings,
          mistakes,
          [],
          "main",
          [],
        );
        if (!generated) {
          set({
            session: {
              ...DEFAULT_SESSION,
              total: settings.questionsPerSession,
              status: "ready",
            },
          });
          return;
        }
        set({
          session: {
            ...DEFAULT_SESSION,
            total: settings.questionsPerSession,
            status: "answering",
            question: generated.question,
            questionId: generated.id,
            recentIds: pushRecent([], generated.id),
            pool: "main",
          },
        });
      },

      submit: (input) => {
        const { session } = get();
        if (session.status !== "answering" || session.feedback !== "none") return;
        const q = session.question;
        if (!q) return;

        const norm = normalizeAnswer(input);

        // 词组：逐字判断。
        if (q.kind === "phrase") {
          const accepted = q.charAccepted[session.phraseIndex] ?? [];
          if (isAcceptedAnswer(norm, accepted)) {
            const nextIdx = session.phraseIndex + 1;
            if (nextIdx >= q.charCodes.length) {
              resolveCorrect(get, set);
            } else {
              set((state) => ({
                session: { ...state.session, phraseIndex: nextIdx },
              }));
            }
            return;
          }
          resolveWrong(get, set);
          return;
        }

        // 键位 / 单字：整体判断。
        if (isAcceptedAnswer(norm, q.accepted)) {
          resolveCorrect(get, set);
        } else {
          resolveWrong(get, set);
        }
      },

      next: () => {
        const { session } = get();
        if (session.status === "completed") {
          get().restart();
          return;
        }
        if (session.status === "wrong" || session.feedback === "correct") {
          advance(get, set);
        }
      },

      pause: () => {
        const { session } = get();
        if (session.status === "answering" && session.feedback === "none") {
          set((state) => ({ session: { ...state.session, status: "paused" } }));
        }
      },

      resume: () => {
        const { session } = get();
        if (session.status === "paused") {
          set((state) => ({ session: { ...state.session, status: "answering" } }));
        }
      },

      restart: () => {
        const { settings, mistakes } = get();
        const generated = makeQuestion(settings, mistakes, [], "main", []);
        set({
          session: generated
            ? {
                ...DEFAULT_SESSION,
                total: settings.questionsPerSession,
                status: "answering",
                question: generated.question,
                questionId: generated.id,
                recentIds: pushRecent([], generated.id),
                pool: "main",
              }
            : { ...DEFAULT_SESSION, total: settings.questionsPerSession },
        });
      },

      startMistakeSession: () => {
        const { settings, mistakes, session } = get();
        if (session.sessionMistakes.length === 0) {
          get().restart();
          return;
        }
        const generated = makeQuestion(
          settings,
          mistakes,
          [],
          "mistakes",
          session.sessionMistakes,
        );
        set({
          session: generated
            ? {
                ...DEFAULT_SESSION,
                total: session.sessionMistakes.length,
                status: "answering",
                question: generated.question,
                questionId: generated.id,
                recentIds: pushRecent([], generated.id),
                pool: "mistakes",
              }
            : { ...DEFAULT_SESSION, total: settings.questionsPerSession },
        });
      },

      clearHistory: () => {
        set({ mistakes: {}, totals: { ...DEFAULT_TOTALS } });
      },

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "shuangpin-practice",
      version: 1,
      storage: safeJsonStorage,
      partialize: (state) => ({
        version: state.version,
        settings: state.settings,
        mistakes: state.mistakes,
        totals: state.totals,
      }),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

/** 答对：更新统计，按 autoNext 决定自动下一题或短暂反馈。 */
function resolveCorrect(
  get: () => PracticeStoreState,
  set: (
    partial:
      | Partial<PracticeStoreState>
      | ((state: PracticeStoreState) => Partial<PracticeStoreState>),
  ) => void,
) {
  const { session, settings, totals, mistakes } = get();
  const completed = session.completed + 1;
  const correct = session.correct + 1;
  const streak = session.streak + 1;
  const longestStreak = Math.max(session.longestStreak, streak);

  set({
    totals: {
      completed: totals.completed + 1,
      correct: totals.correct + 1,
    },
  });

  if (completed >= session.total) {
    set((state) => ({
      session: {
        ...state.session,
        status: "completed",
        completed,
        correct,
        streak,
        longestStreak,
        feedback: "none",
      },
    }));
    return;
  }

  if (settings.autoNext) {
    const generated = makeQuestion(
      settings,
      mistakes,
      session.recentIds,
      session.pool,
      session.sessionMistakes,
    );
    if (generated) {
      set((state) => ({
        session: {
          ...state.session,
          status: "answering",
          question: generated.question,
          questionId: generated.id,
          phraseIndex: 0,
          completed,
          correct,
          streak,
          longestStreak,
          feedback: "none",
          recentIds: pushRecent(state.session.recentIds, generated.id),
        },
      }));
    } else {
      set((state) => ({
        session: { ...state.session, completed, correct, streak, longestStreak },
      }));
    }
  } else {
    set((state) => ({
      session: {
        ...state.session,
        completed,
        correct,
        streak,
        longestStreak,
        feedback: "correct",
      },
    }));
  }
}

/** 答错：记录错题，进入 wrong 状态展示答案。 */
function resolveWrong(
  get: () => PracticeStoreState,
  set: (
    partial:
      | Partial<PracticeStoreState>
      | ((state: PracticeStoreState) => Partial<PracticeStoreState>),
  ) => void,
) {
  const { session } = get();
  const completed = session.completed + 1;
  const id = session.questionId;
  const mistake: MistakeRecord = {
    count: (get().mistakes[id]?.count ?? 0) + 1,
    lastSeen: completed,
  };
  const sessionMistakes = session.sessionMistakes.includes(id)
    ? session.sessionMistakes
    : [...session.sessionMistakes, id];

  set((state) => ({
    mistakes: { ...state.mistakes, [id]: mistake },
    totals: { ...state.totals, completed: state.totals.completed + 1 },
    session: {
      ...state.session,
      status: "wrong",
      completed,
      streak: 0,
      sessionMistakes,
      feedback: "none",
    },
  }));
}

/** 推进到下一题或结束本组（wrong / correct 反馈后由 next 调用）。 */
function advance(
  get: () => PracticeStoreState,
  set: (
    partial:
      | Partial<PracticeStoreState>
      | ((state: PracticeStoreState) => Partial<PracticeStoreState>),
  ) => void,
) {
  const { session, settings, mistakes } = get();
  if (session.completed >= session.total) {
    set((state) => ({
      session: { ...state.session, status: "completed", feedback: "none" },
    }));
    return;
  }
  const generated = makeQuestion(
    settings,
    mistakes,
    session.recentIds,
    session.pool,
    session.sessionMistakes,
  );
  if (generated) {
    set((state) => ({
      session: {
        ...state.session,
        status: "answering",
        question: generated.question,
        questionId: generated.id,
        phraseIndex: 0,
        feedback: "none",
        recentIds: pushRecent(state.session.recentIds, generated.id),
      },
    }));
  } else {
    set((state) => ({
      session: { ...state.session, status: "answering", feedback: "none" },
    }));
  }
}
