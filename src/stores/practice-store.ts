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

export type SessionStatus = "ready" | "answering" | "wrong" | "paused";

interface ReplayEntry {
  key: string;
  /** 在连续练习中达到该题号后可再次出现。 */
  dueAt: number;
}

export interface PracticeSession {
  status: SessionStatus;
  question: GeneratedQuestion | null;
  questionId: string;
  phraseIndex: number;
  /** 当前词组是否已有任意一个字答错。 */
  phraseHadError: boolean;
  /** 当前连续练习内已完成题数，仅供自动复现调度使用。 */
  completed: number;
  correct: number;
  streak: number;
  longestStreak: number;
  recentIds: string[];
  replayQueue: ReplayEntry[];
  forcedReappear: Record<string, number>;
}

export interface PracticeTotals {
  completed: number;
  correct: number;
}

export const DEFAULT_SETTINGS: PracticeSettings = {
  scheme: "xiaohe",
  mode: "character",
  showPinyin: true,
  showKeyboard: true,
};

const DEFAULT_SESSION: PracticeSession = {
  status: "ready",
  question: null,
  questionId: "",
  phraseIndex: 0,
  phraseHadError: false,
  completed: 0,
  correct: 0,
  streak: 0,
  longestStreak: 0,
  recentIds: [],
  replayQueue: [],
  forcedReappear: {},
};

export { DEFAULT_SESSION };

const DEFAULT_TOTALS: PracticeTotals = { completed: 0, correct: 0 };

export { DEFAULT_TOTALS };

const RECENT_WINDOW = 4;

/** 错题在之后 3–8 题自然重现。 */
function replayDelay(): number {
  return Math.floor(Math.random() * 6) + 3;
}

type PersistedState = {
  version: 1;
  settings: PracticeSettings;
  mistakes: Record<string, MistakeRecord>;
  totals: PracticeTotals;
};

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
      // 隐私模式或配额异常不应影响练习。
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // 同上。
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
  clearHistory: () => void;
  setHasHydrated: (value: boolean) => void;
}

export function computeMistakeKey(
  questionId: string,
  question: GeneratedQuestion,
  phraseIndex: number,
): string {
  return question.kind === "phrase" ? `${questionId}:${phraseIndex}` : questionId;
}

export function questionIdFromKey(key: string, mode: PracticeMode): string {
  return mode === "phrase" ? (key.split(":")[0] ?? key) : key;
}

/** 错题自动提高到普通题 3 倍权重；用户不需要管理这个规则。 */
export function buildWeightFor(
  settings: PracticeSettings,
  mistakes: Record<string, MistakeRecord>,
): (id: string) => number {
  if (settings.mode === "phrase") {
    const keys = Object.keys(mistakes);
    return (id: string) => (keys.some((k) => k.startsWith(`${id}:`)) ? 3 : 1);
  }
  return (id: string) => (mistakes[id] ? 3 : 1);
}

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

interface PickedQuestion {
  question: GeneratedQuestion;
  id: string;
  forcedKey?: string;
}

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

  const due = replayQueue
    .filter((entry) => entry.dueAt <= completed && (forcedReappear[entry.key] ?? 0) < 2)
    .filter((entry) => !recentIds.includes(questionIdFromKey(entry.key, settings.mode)));

  if (due.length > 0) {
    const entry = [...due].sort((a, b) => a.dueAt - b.dueAt)[0]!;
    const made = makeQuestionByKey(entry.key, scheme, settings.mode);
    if (made) return { ...made, forcedKey: entry.key };
  }

  const opts: GenerateOptions = {
    scheme,
    mode: settings.mode,
    characters: CHARACTERS,
    phrases: PHRASES,
    recentIds,
    weightFor: buildWeightFor(settings, mistakes),
    random: Math.random,
  };
  const result = generateQuestion(opts);
  return result.ok ? { question: result.question, id: result.id } : null;
}

function pushRecent(recentIds: string[], id: string): string[] {
  return [...recentIds, id].slice(-RECENT_WINDOW);
}

function consumeForced(
  replayQueue: ReplayEntry[],
  forcedReappear: Record<string, number>,
  forcedKey?: string,
): { replayQueue: ReplayEntry[]; forcedReappear: Record<string, number> } {
  if (!forcedKey) return { replayQueue, forcedReappear };
  return {
    replayQueue: replayQueue.filter((entry) => entry.key !== forcedKey),
    forcedReappear: {
      ...forcedReappear,
      [forcedKey]: (forcedReappear[forcedKey] ?? 0) + 1,
    },
  };
}

function moveToNextQuestion(
  get: () => PracticeStoreState,
  set: (
    partial:
      | Partial<PracticeStoreState>
      | ((state: PracticeStoreState) => Partial<PracticeStoreState>),
  ) => void,
  patch: Partial<PracticeSession> = {},
) {
  const { session, settings, mistakes } = get();
  const completed = patch.completed ?? session.completed;
  const replayQueue = patch.replayQueue ?? session.replayQueue;
  const forcedReappear = patch.forcedReappear ?? session.forcedReappear;
  const picked = pickNextMain(
    settings,
    mistakes,
    session.recentIds,
    replayQueue,
    forcedReappear,
    completed,
  );

  if (!picked) {
    set((state) => ({
      session: { ...state.session, ...patch, status: "answering" },
    }));
    return;
  }

  const forced = consumeForced(replayQueue, forcedReappear, picked.forcedKey);
  set((state) => ({
    session: {
      ...state.session,
      ...patch,
      status: "answering",
      question: picked.question,
      questionId: picked.id,
      phraseIndex: 0,
      phraseHadError: false,
      recentIds: pushRecent(state.session.recentIds, picked.id),
      replayQueue: forced.replayQueue,
      forcedReappear: forced.forcedReappear,
    },
  }));
}

function resolveCorrect(
  get: () => PracticeStoreState,
  set: (
    partial:
      | Partial<PracticeStoreState>
      | ((state: PracticeStoreState) => Partial<PracticeStoreState>),
  ) => void,
) {
  const { session, totals } = get();
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

  moveToNextQuestion(get, set, { completed, correct, streak, longestStreak });
}

function finishIncorrectPhrase(
  get: () => PracticeStoreState,
  set: (
    partial:
      | Partial<PracticeStoreState>
      | ((state: PracticeStoreState) => Partial<PracticeStoreState>),
  ) => void,
) {
  const { session, totals } = get();
  const completed = session.completed + 1;
  set({ totals: { ...totals, completed: totals.completed + 1 } });
  moveToNextQuestion(get, set, { completed, streak: 0, phraseHadError: false });
}

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
  if (!q) return;

  const isPhrase = q.kind === "phrase";
  const completed = isPhrase ? session.completed : session.completed + 1;
  const key = computeMistakeKey(session.questionId, q, session.phraseIndex);
  const mistake: MistakeRecord = {
    count: (get().mistakes[key]?.count ?? 0) + 1,
    lastSeen: completed,
  };

  const forcedCount = session.forcedReappear[key] ?? 0;
  const alreadyQueued = session.replayQueue.some((entry) => entry.key === key);
  const replayQueue =
    forcedCount < 2 && !alreadyQueued
      ? [...session.replayQueue, { key, dueAt: completed + replayDelay() }]
      : session.replayQueue;

  set((state) => ({
    mistakes: { ...state.mistakes, [key]: mistake },
    totals: isPhrase
      ? state.totals
      : { ...state.totals, completed: state.totals.completed + 1 },
    session: {
      ...state.session,
      status: "wrong",
      completed,
      streak: 0,
      phraseHadError: isPhrase ? true : state.session.phraseHadError,
      replayQueue,
    },
  }));
}

function advanceAfterWrong(
  get: () => PracticeStoreState,
  set: (
    partial:
      | Partial<PracticeStoreState>
      | ((state: PracticeStoreState) => Partial<PracticeStoreState>),
  ) => void,
) {
  const { session } = get();
  const q = session.question;

  if (q?.kind === "phrase") {
    const nextIdx = session.phraseIndex + 1;
    if (nextIdx < q.charCodes.length) {
      set((state) => ({
        session: { ...state.session, status: "answering", phraseIndex: nextIdx },
      }));
      return;
    }
    finishIncorrectPhrase(get, set);
    return;
  }

  moveToNextQuestion(get, set);
}

export const usePracticeStore = create<PracticeStoreState>()(
  persist(
    (set, get) => ({
      version: 1,
      settings: DEFAULT_SETTINGS,
      session: { ...DEFAULT_SESSION },
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
      },

      startSession: () => {
        const { settings, mistakes } = get();
        const picked = pickNextMain(settings, mistakes, [], [], {}, 0);
        set({
          session: picked
            ? {
                ...DEFAULT_SESSION,
                status: "answering",
                question: picked.question,
                questionId: picked.id,
                recentIds: pushRecent([], picked.id),
              }
            : { ...DEFAULT_SESSION },
        });
      },

      submit: (input) => {
        const { session } = get();
        if (session.status !== "answering") return;
        const q = session.question;
        if (!q) return;

        const norm = normalizeAnswer(input);

        if (q.kind === "phrase") {
          const accepted = q.charAccepted[session.phraseIndex] ?? [];
          if (isAcceptedAnswer(norm, accepted)) {
            const nextIdx = session.phraseIndex + 1;
            if (nextIdx >= q.charCodes.length) {
              if (session.phraseHadError) finishIncorrectPhrase(get, set);
              else resolveCorrect(get, set);
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

        if (isAcceptedAnswer(norm, q.accepted)) resolveCorrect(get, set);
        else resolveWrong(get, set);
      },

      next: () => {
        if (get().session.status === "wrong") advanceAfterWrong(get, set);
      },

      pause: () => {
        if (get().session.status === "answering") {
          set((state) => ({ session: { ...state.session, status: "paused" } }));
        }
      },

      resume: () => {
        if (get().session.status === "paused") {
          set((state) => ({ session: { ...state.session, status: "answering" } }));
        }
      },

      restart: () => get().startSession(),

      clearHistory: () => {
        set({ mistakes: {}, totals: { ...DEFAULT_TOTALS } });
      },

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "shuangpin-practice",
      version: 3,
      storage: safeJsonStorage,
      migrate: (persisted: unknown): PersistedState => {
        const old = (persisted ?? {}) as Partial<PersistedState> & {
          settings?: PracticeSettings & {
            sound?: boolean;
            questionsPerSession?: number;
            autoNext?: boolean;
            mistakePriority?: boolean;
          };
        };
        const legacySettings = { ...(old.settings ?? DEFAULT_SETTINGS) } as Record<
          string,
          unknown
        >;
        delete legacySettings.sound;
        delete legacySettings.questionsPerSession;
        delete legacySettings.autoNext;
        delete legacySettings.mistakePriority;

        return {
          version: 1,
          settings: { ...DEFAULT_SETTINGS, ...legacySettings } as PracticeSettings,
          mistakes: old.mistakes ?? {},
          totals: old.totals ?? { ...DEFAULT_TOTALS },
        };
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
