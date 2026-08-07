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
import { encodePhrase, encodeSyllableDetailed } from "@/lib/shuangpin/encode";
import { isAcceptedAnswer, normalizeAnswer } from "@/lib/shuangpin/validate";
import type {
  MistakeRecord,
  PracticeMode,
  PracticeSettings,
  SchemeId,
  ShuangpinScheme,
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

/** 强制重现队列项。 */
interface ReplayEntry {
  /** 错题标识（character/mapping 为题目 id，phrase 为 题目id:音节索引）。 */
  key: string;
  /** 到期题号（completed 达到该值时重现）。 */
  dueAt: number;
}

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
  /** 本组答错的错题标识（用于「练习错题」）。 */
  sessionMistakes: string[];
  /** 强制重现队列。 */
  replayQueue: ReplayEntry[];
  /** 每道错题本组已强制重现次数（上限 2）。 */
  forcedReappear: Record<string, number>;
  /** 当前题池：主池或错题池。 */
  pool: "main" | "mistakes";
  /** 进入错题专项时固定的错题池快照（直到完成前只从该池出题）。 */
  mistakePool: string[];
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
  replayQueue: [],
  forcedReappear: {},
  pool: "main",
  mistakePool: [],
  feedback: "none",
};

export { DEFAULT_SESSION };

const DEFAULT_TOTALS: PracticeTotals = { completed: 0, correct: 0 };

export { DEFAULT_TOTALS };

/** 去重窗口：最近 N 道题不再立即重复。 */
const RECENT_WINDOW = 4;

/** 强制重现延迟：未来第 3–8 题。 */
function replayDelay(): number {
  return Math.floor(Math.random() * 6) + 3;
}

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

// ===== 错题标识与出题（纯函数，便于测试） =====

/** 计算错题标识：单字/键位用题目 id，词组用 题目id:音节索引。 */
export function computeMistakeKey(
  questionId: string,
  question: GeneratedQuestion,
  phraseIndex: number,
): string {
  if (question.kind === "phrase") {
    return `${questionId}:${phraseIndex}`;
  }
  return questionId;
}

/** 由错题标识还原题目 id（用于去重判断）。 */
export function questionIdFromKey(key: string, mode: PracticeMode): string {
  if (mode === "phrase") {
    return key.split(":")[0] ?? key;
  }
  return key;
}

/** 错题优先权重：错题为普通题 3 倍，否则 1。 */
export function buildWeightFor(
  settings: PracticeSettings,
  mistakes: Record<string, MistakeRecord>,
): (id: string) => number {
  if (!settings.mistakePriority) return () => 1;
  if (settings.mode === "phrase") {
    const keys = Object.keys(mistakes);
    return (id: string) => (keys.some((k) => k.startsWith(`${id}:`)) ? 3 : 1);
  }
  return (id: string) => (mistakes[id] ? 3 : 1);
}

/** 由错题标识重建题目（用于强制重现与错题专项）。 */
export function makeQuestionByKey(
  key: string,
  scheme: ShuangpinScheme,
  mode: PracticeMode,
): { question: GeneratedQuestion; id: string } | null {
  if (mode === "character") {
    const c = CHARACTERS.find((item) => item.id === key);
    if (!c) return null;
    const enc = encodeSyllableDetailed(c.pinyin, scheme);
    if (!enc.ok) return null;
    return {
      id: c.id,
      question: {
        kind: "character",
        character: c.character,
        pinyin: c.pinyin,
        answer: enc.code,
        accepted: enc.accepted,
        breakdown: {
          initial: enc.initial,
          final: enc.final,
          initialKey: enc.initialKey,
          finalKey: enc.finalKey,
        },
      },
    };
  }
  if (mode === "phrase") {
    const phraseId = key.split(":")[0] ?? key;
    const p = PHRASES.find((item) => item.id === phraseId);
    if (!p) return null;
    const enc = encodePhrase(p.syllables, scheme);
    if (!enc.ok) return null;
    return {
      id: p.id,
      question: {
        kind: "phrase",
        text: p.text,
        syllables: p.syllables,
        charCodes: enc.charCodes,
        charAccepted: enc.charAccepted,
        answer: enc.code,
      },
    };
  }
  // mapping：key 形如 i:zh / f:uang
  const isInitial = key.startsWith("i:");
  const value = key.slice(2);
  const answer = isInitial ? scheme.initials[value] : scheme.finals[value];
  if (!answer) return null;
  return {
    id: key,
    question: {
      kind: "mapping",
      display: value,
      answer,
      hint: isInitial ? "声母" : "韵母",
      accepted: [answer],
    },
  };
}

/** 错题池去重：phrase 按题目 id 去重（同一词组只练一次）。 */
function dedupedMistakeKeys(keys: string[], mode: PracticeMode): string[] {
  if (mode !== "phrase") return [...keys];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of keys) {
    const pid = k.split(":")[0] ?? k;
    if (!seen.has(pid)) {
      seen.add(pid);
      out.push(k);
    }
  }
  return out;
}

interface PickedQuestion {
  question: GeneratedQuestion;
  id: string;
  /** 命中强制重现时的错题标识，用于消耗队列。 */
  forcedKey?: string;
}

/**
 * 主池下一题：先尝试到期强制重现，否则按权重随机。
 * completed 为「答完当前题后」的题号，用于判断到期。
 */
function pickNextMain(
  settings: PracticeSettings,
  mistakes: Record<string, MistakeRecord>,
  recentIds: string[],
  replayQueue: ReplayEntry[],
  forcedReappear: Record<string, number>,
  completed: number,
): PickedQuestion | null {
  const scheme = getScheme(settings.scheme);
  if (!scheme) return null;
  const mode = settings.mode;

  const due = replayQueue
    .filter((e) => e.dueAt <= completed && (forcedReappear[e.key] ?? 0) < 2)
    .filter((e) => !recentIds.includes(questionIdFromKey(e.key, mode)));
  if (due.length > 0) {
    const entry = due.sort((a, b) => a.dueAt - b.dueAt)[0]!;
    const made = makeQuestionByKey(entry.key, scheme, mode);
    if (made) {
      return { question: made.question, id: made.id, forcedKey: entry.key };
    }
  }

  const weightFor = buildWeightFor(settings, mistakes);
  const opts: GenerateOptions = {
    scheme,
    mode,
    characters: CHARACTERS,
    phrases: PHRASES,
    recentIds,
    weightFor,
    random: Math.random,
  };
  const result = generateQuestion(opts);
  if (!result.ok) return null;
  return { question: result.question, id: result.id };
}

/** 错题池下一题：从本组错题标识中随机抽取一题重建。 */
function pickMistake(
  settings: PracticeSettings,
  sessionMistakes: string[],
  recentIds: string[],
): PickedQuestion | null {
  const scheme = getScheme(settings.scheme);
  if (!scheme) return null;
  const mode = settings.mode;
  const keys = dedupedMistakeKeys(sessionMistakes, mode);
  if (keys.length === 0) return null;
  const exclude = new Set(recentIds);
  let candidates = keys.filter((k) => !exclude.has(questionIdFromKey(k, mode)));
  if (candidates.length === 0) candidates = keys;
  const key = candidates[Math.floor(Math.random() * candidates.length)]!;
  const made = makeQuestionByKey(key, scheme, mode);
  if (!made) return null;
  return { question: made.question, id: made.id };
}

/** 推进 recentIds，保留最近 RECENT_WINDOW 个。 */
function pushRecent(recentIds: string[], id: string): string[] {
  return [...recentIds, id].slice(-RECENT_WINDOW);
}

/** 消耗一次强制重现：自队列移除该 key 并计数 +1。 */
function consumeForced(
  replayQueue: ReplayEntry[],
  forcedReappear: Record<string, number>,
  forcedKey?: string,
): { replayQueue: ReplayEntry[]; forcedReappear: Record<string, number> } {
  if (!forcedKey) return { replayQueue, forcedReappear };
  return {
    replayQueue: replayQueue.filter((e) => e.key !== forcedKey),
    forcedReappear: {
      ...forcedReappear,
      [forcedKey]: (forcedReappear[forcedKey] ?? 0) + 1,
    },
  };
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
        set((state) => ({ settings: { ...state.settings, scheme } }));
        get().startSession();
      },

      setMode: (mode) => {
        set((state) => ({ settings: { ...state.settings, mode } }));
        get().startSession();
      },

      updateSettings: (patch) => {
        set((state) => ({ settings: { ...state.settings, ...patch } }));
        if (
          patch.questionsPerSession !== undefined &&
          patch.questionsPerSession !== get().session.total
        ) {
          get().startSession();
        }
      },

      startSession: () => {
        const { settings, mistakes } = get();
        const picked = pickNextMain(settings, mistakes, [], [], {}, 0);
        set({
          session: picked
            ? {
                ...DEFAULT_SESSION,
                total: settings.questionsPerSession,
                status: "answering",
                question: picked.question,
                questionId: picked.id,
                recentIds: pushRecent([], picked.id),
                pool: "main",
              }
            : { ...DEFAULT_SESSION, total: settings.questionsPerSession },
        });
      },

      submit: (input) => {
        const { session } = get();
        if (session.status !== "answering" || session.feedback !== "none") return;
        const q = session.question;
        if (!q) return;

        const norm = normalizeAnswer(input);

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
        const picked = pickNextMain(settings, mistakes, [], [], {}, 0);
        set({
          session: picked
            ? {
                ...DEFAULT_SESSION,
                total: settings.questionsPerSession,
                status: "answering",
                question: picked.question,
                questionId: picked.id,
                recentIds: pushRecent([], picked.id),
                pool: "main",
              }
            : { ...DEFAULT_SESSION, total: settings.questionsPerSession },
        });
      },

      startMistakeSession: () => {
        const { settings, session } = get();
        const keys = dedupedMistakeKeys(session.sessionMistakes, settings.mode);
        if (keys.length === 0) {
          get().restart();
          return;
        }
        const picked = pickMistake(settings, keys, []);
        set({
          session: picked
            ? {
                ...DEFAULT_SESSION,
                total: keys.length,
                mistakePool: keys,
                status: "answering",
                question: picked.question,
                questionId: picked.id,
                recentIds: pushRecent([], picked.id),
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
      version: 2,
      storage: safeJsonStorage,
      migrate: (persisted: unknown, version: number): PersistedState => {
        const s = persisted as PersistedState;
        if (version < 2 && s?.settings && "sound" in s.settings) {
          const { sound, ...rest } = s.settings;
          void sound;
          return { ...s, settings: rest };
        }
        return s;
      },
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
    const picked =
      session.pool === "mistakes"
        ? pickMistake(settings, session.mistakePool, session.recentIds)
        : pickNextMain(
            settings,
            mistakes,
            session.recentIds,
            session.replayQueue,
            session.forcedReappear,
            completed,
          );
    if (picked) {
      const forced = consumeForced(session.replayQueue, session.forcedReappear, picked.forcedKey);
      set((state) => ({
        session: {
          ...state.session,
          status: "answering",
          question: picked.question,
          questionId: picked.id,
          phraseIndex: 0,
          completed,
          correct,
          streak,
          longestStreak,
          feedback: "none",
          recentIds: pushRecent(state.session.recentIds, picked.id),
          replayQueue: forced.replayQueue,
          forcedReappear: forced.forcedReappear,
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

/** 答错：记录错题、安排强制重现，进入 wrong 状态展示答案。 */
function resolveWrong(
  get: () => PracticeStoreState,
  set: (
    partial:
      | Partial<PracticeStoreState>
      | ((state: PracticeStoreState) => Partial<PracticeStoreState>),
  ) => void,
) {
  const { session } = get();
  const q = session.question;
  const completed = session.completed + 1;
  const key = q
    ? computeMistakeKey(session.questionId, q, session.phraseIndex)
    : session.questionId;
  const mistake: MistakeRecord = {
    count: (get().mistakes[key]?.count ?? 0) + 1,
    lastSeen: completed,
  };
  const sessionMistakes = session.sessionMistakes.includes(key)
    ? session.sessionMistakes
    : [...session.sessionMistakes, key];

  // 安排强制重现：每组最多 2 次，且队列中无该 key 待重现。
  const forcedCount = session.forcedReappear[key] ?? 0;
  const alreadyQueued = session.replayQueue.some((e) => e.key === key);
  const replayQueue =
    forcedCount < 2 && !alreadyQueued
      ? [...session.replayQueue, { key, dueAt: completed + replayDelay() }]
      : session.replayQueue;

  set((state) => ({
    mistakes: { ...state.mistakes, [key]: mistake },
    totals: { ...state.totals, completed: state.totals.completed + 1 },
    session: {
      ...state.session,
      status: "wrong",
      completed,
      streak: 0,
      sessionMistakes,
      replayQueue,
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
  const picked =
    session.pool === "mistakes"
      ? pickMistake(settings, session.mistakePool, session.recentIds)
      : pickNextMain(
          settings,
          mistakes,
          session.recentIds,
          session.replayQueue,
          session.forcedReappear,
          session.completed,
        );
  if (picked) {
    const forced = consumeForced(session.replayQueue, session.forcedReappear, picked.forcedKey);
    set((state) => ({
      session: {
        ...state.session,
        status: "answering",
        question: picked.question,
        questionId: picked.id,
        phraseIndex: 0,
        feedback: "none",
        recentIds: pushRecent(state.session.recentIds, picked.id),
        replayQueue: forced.replayQueue,
        forcedReappear: forced.forcedReappear,
      },
    }));
  } else {
    set((state) => ({
      session: { ...state.session, status: "answering", feedback: "none" },
    }));
  }
}
