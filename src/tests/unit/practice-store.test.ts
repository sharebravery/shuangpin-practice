import { beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_SESSION,
  DEFAULT_SETTINGS,
  buildWeightFor,
  computeMistakeKey,
  usePracticeStore,
} from "@/stores/practice-store";
import type { GeneratedQuestion } from "@/lib/shuangpin/generate-question";
import { cleanup } from "./test-utils";

const CHAR_QUESTION: GeneratedQuestion = {
  kind: "character",
  character: "窗",
  pinyin: "chuang",
  answer: "il",
  accepted: ["il"],
  breakdown: { initial: "ch", final: "uang", initialKey: "i", finalKey: "l" },
};

const PHRASE_QUESTION: GeneratedQuestion = {
  kind: "phrase",
  text: "你好",
  syllables: ["ni", "hao"],
  charCodes: ["ni", "hk"],
  charAccepted: [["ni"], ["hk"]],
  answer: "nihk",
};

function resetStore() {
  usePracticeStore.setState({
    settings: { ...DEFAULT_SETTINGS },
    session: { ...DEFAULT_SESSION },
    mistakes: {},
    totals: { completed: 0, correct: 0 },
    hasHydrated: false,
  });
}

function setQuestion(question: GeneratedQuestion, id: string) {
  usePracticeStore.setState((state) => ({
    settings: {
      ...state.settings,
      mode:
        question.kind === "phrase"
          ? "phrase"
          : question.kind === "mapping"
            ? "mapping"
            : "character",
    },
    session: {
      ...DEFAULT_SESSION,
      status: "answering",
      question,
      questionId: id,
      recentIds: [id],
    },
    mistakes: {},
    totals: { completed: 0, correct: 0 },
  }));
}

describe("continuous practice store", () => {
  beforeEach(() => {
    cleanup();
    resetStore();
  });

  it("默认打开就是小鹤单字练习，设置保持精简", () => {
    const { settings } = usePracticeStore.getState();
    expect(settings).toEqual({
      scheme: "xiaohe",
      mode: "character",
      showPinyin: true,
      showKeyboard: true,
    });
  });

  it("startSession 直接开始练习，没有分组完成状态", () => {
    usePracticeStore.getState().startSession();
    const { session } = usePracticeStore.getState();
    expect(session.status).toBe("answering");
    expect(session.question).not.toBeNull();
  });

  it("答对后立即生成下一题并累计统计", () => {
    setQuestion(CHAR_QUESTION, "c-test");
    usePracticeStore.getState().submit("il");

    const { session, totals } = usePracticeStore.getState();
    expect(session.status).toBe("answering");
    expect(session.completed).toBe(1);
    expect(session.correct).toBe(1);
    expect(session.streak).toBe(1);
    expect(totals).toEqual({ completed: 1, correct: 1 });
    expect(session.question).not.toBeNull();
  });

  it("答错后短暂停留，记录错题并累计已练题数", () => {
    setQuestion(CHAR_QUESTION, "c-test");
    usePracticeStore.getState().submit("xx");

    const { session, mistakes, totals } = usePracticeStore.getState();
    expect(session.status).toBe("wrong");
    expect(session.streak).toBe(0);
    expect(totals).toEqual({ completed: 1, correct: 0 });
    expect(mistakes["c-test"]?.count).toBe(1);
    expect(session.replayQueue).toHaveLength(1);
  });

  it("错误提示后 next 自然进入下一题", () => {
    setQuestion(CHAR_QUESTION, "c-test");
    usePracticeStore.getState().submit("xx");
    usePracticeStore.getState().next();
    expect(usePracticeStore.getState().session.status).toBe("answering");
  });

  it("词组逐字正确时，整词完成后只累计一题", () => {
    setQuestion(PHRASE_QUESTION, "p-test");

    usePracticeStore.getState().submit("ni");
    expect(usePracticeStore.getState().session.phraseIndex).toBe(1);
    expect(usePracticeStore.getState().totals.completed).toBe(0);

    usePracticeStore.getState().submit("hk");
    const { totals, session } = usePracticeStore.getState();
    expect(totals).toEqual({ completed: 1, correct: 1 });
    expect(session.status).toBe("answering");
    expect(session.phraseIndex).toBe(0);
  });

  it("词组某字答错后继续同一个词组的下一个字", () => {
    setQuestion(PHRASE_QUESTION, "p-test");

    usePracticeStore.getState().submit("zz");
    let state = usePracticeStore.getState();
    expect(state.session.status).toBe("wrong");
    expect(state.session.phraseIndex).toBe(0);
    expect(state.session.phraseHadError).toBe(true);
    expect(state.totals.completed).toBe(0);
    expect(state.mistakes["p-test:0"]).toBeDefined();

    usePracticeStore.getState().next();
    state = usePracticeStore.getState();
    expect(state.session.status).toBe("answering");
    expect(state.session.questionId).toBe("p-test");
    expect(state.session.phraseIndex).toBe(1);

    usePracticeStore.getState().submit("hk");
    state = usePracticeStore.getState();
    expect(state.totals).toEqual({ completed: 1, correct: 0 });
    expect(state.session.status).toBe("answering");
  });

  it("词组最后一个字答错也只在结束时累计整词一次", () => {
    setQuestion(PHRASE_QUESTION, "p-test");
    usePracticeStore.getState().submit("ni");
    usePracticeStore.getState().submit("zz");

    expect(usePracticeStore.getState().totals.completed).toBe(0);
    usePracticeStore.getState().next();
    expect(usePracticeStore.getState().totals).toEqual({ completed: 1, correct: 0 });
  });

  it("Space 所用的 pause / resume 不改变当前题", () => {
    usePracticeStore.getState().startSession();
    const id = usePracticeStore.getState().session.questionId;
    usePracticeStore.getState().pause();
    expect(usePracticeStore.getState().session.status).toBe("paused");
    usePracticeStore.getState().resume();
    expect(usePracticeStore.getState().session.status).toBe("answering");
    expect(usePracticeStore.getState().session.questionId).toBe(id);
  });

  it("清除记录只清空累计统计和后台错题", () => {
    setQuestion(CHAR_QUESTION, "c-test");
    usePracticeStore.getState().submit("xx");
    usePracticeStore.getState().clearHistory();
    expect(usePracticeStore.getState().mistakes).toEqual({});
    expect(usePracticeStore.getState().totals).toEqual({ completed: 0, correct: 0 });
  });

  it("错题始终自动获得 3 倍权重", () => {
    const character = { ...DEFAULT_SETTINGS, mode: "character" as const };
    const weight = buildWeightFor(character, { c001: { count: 1, lastSeen: 0 } });
    expect(weight("c001")).toBe(3);
    expect(weight("c002")).toBe(1);

    const phrase = { ...DEFAULT_SETTINGS, mode: "phrase" as const };
    const phraseWeight = buildWeightFor(phrase, { "p001:1": { count: 1, lastSeen: 0 } });
    expect(phraseWeight("p001")).toBe(3);
    expect(phraseWeight("p002")).toBe(1);
  });

  it("错题安排在之后 3–8 题自动复现", () => {
    setQuestion(CHAR_QUESTION, "c001");
    usePracticeStore.getState().submit("xx");
    const entry = usePracticeStore.getState().session.replayQueue[0]!;
    expect(entry.key).toBe("c001");
    expect(entry.dueAt).toBeGreaterThanOrEqual(4);
    expect(entry.dueAt).toBeLessThanOrEqual(9);
  });

  it("同一道错题每次连续练习最多安排两次强制复现", () => {
    setQuestion(CHAR_QUESTION, "c001");
    usePracticeStore.setState((state) => ({
      session: { ...state.session, forcedReappear: { c001: 2 } },
    }));
    usePracticeStore.getState().submit("xx");
    expect(usePracticeStore.getState().session.replayQueue).toHaveLength(0);
  });

  it("computeMistakeKey 在词组模式精确记录到当前字", () => {
    expect(computeMistakeKey("p-test", PHRASE_QUESTION, 1)).toBe("p-test:1");
    expect(computeMistakeKey("c-test", CHAR_QUESTION, 0)).toBe("c-test");
  });

  it("持久化不保存当前题，并迁移掉旧的分组和节奏设置", () => {
    usePracticeStore.getState().setScheme("microsoft");
    const raw = localStorage.getItem("shuangpin-practice");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.settings.scheme).toBe("microsoft");
    expect(parsed.state.session).toBeUndefined();
    expect(parsed.version).toBe(3);

    localStorage.setItem(
      "shuangpin-practice",
      JSON.stringify({
        state: {
          version: 1,
          settings: {
            ...DEFAULT_SETTINGS,
            sound: false,
            questionsPerSession: 50,
            autoNext: false,
            mistakePriority: false,
          },
          mistakes: {},
          totals: { completed: 12, correct: 10 },
        },
        version: 2,
      }),
    );

    usePracticeStore.persist.rehydrate();
    const settings = usePracticeStore.getState().settings as unknown as Record<string, unknown>;
    expect(settings.questionsPerSession).toBeUndefined();
    expect(settings.autoNext).toBeUndefined();
    expect(settings.mistakePriority).toBeUndefined();
    expect(settings.sound).toBeUndefined();
    expect(usePracticeStore.getState().totals.completed).toBe(12);
  });

  it("损坏的 localStorage 不会阻断练习", () => {
    localStorage.setItem("shuangpin-practice", "{invalid json");
    expect(() => usePracticeStore.persist.rehydrate()).not.toThrow();
  });
});
