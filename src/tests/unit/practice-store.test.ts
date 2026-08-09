import { beforeEach, describe, expect, it } from "vitest";

import type { GeneratedQuestion } from "@/lib/shuangpin/generate-question";
import {
  DEFAULT_SESSION,
  DEFAULT_SETTINGS,
  buildWeightFor,
  computeMistakeKey,
  usePracticeStore,
} from "@/stores/practice-store";
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
    expect(usePracticeStore.getState().settings).toEqual({
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

  it("答错后停在当前题，记录错题但尚不累计已练", () => {
    setQuestion(CHAR_QUESTION, "c-test");
    usePracticeStore.getState().submit("xx");

    const { session, mistakes, totals } = usePracticeStore.getState();
    expect(session.status).toBe("wrong");
    expect(session.questionId).toBe("c-test");
    expect(session.completed).toBe(0);
    expect(session.streak).toBe(0);
    expect(totals).toEqual({ completed: 0, correct: 0 });
    expect(mistakes["xiaohe:character:c-test"]?.count).toBe(1);
    expect(session.replayQueue).toHaveLength(1);
  });

  it("答错后必须打对当前题才进入下一题，且不计为正确", () => {
    setQuestion(CHAR_QUESTION, "c-test");
    usePracticeStore.getState().submit("xx");
    usePracticeStore.getState().submit("il");

    const { session, totals } = usePracticeStore.getState();
    expect(session.status).toBe("answering");
    expect(session.completed).toBe(1);
    expect(session.correct).toBe(0);
    expect(session.streak).toBe(0);
    expect(totals).toEqual({ completed: 1, correct: 0 });
    expect(session.question).not.toBeNull();
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

  it("词组某字答错后必须先改对该字，再进入下一个字", () => {
    setQuestion(PHRASE_QUESTION, "p-test");

    usePracticeStore.getState().submit("zz");
    let state = usePracticeStore.getState();
    expect(state.session.status).toBe("wrong");
    expect(state.session.phraseIndex).toBe(0);
    expect(state.session.phraseHadError).toBe(true);
    expect(state.totals.completed).toBe(0);
    expect(state.mistakes["xiaohe:phrase:p-test:0"]).toBeDefined();

    usePracticeStore.getState().submit("ni");
    state = usePracticeStore.getState();
    expect(state.session.status).toBe("answering");
    expect(state.session.questionId).toBe("p-test");
    expect(state.session.phraseIndex).toBe(1);

    usePracticeStore.getState().submit("hk");
    state = usePracticeStore.getState();
    expect(state.totals).toEqual({ completed: 1, correct: 0 });
    expect(state.session.status).toBe("answering");
  });

  it("词组最后一个字答错后也要改对，整词只累计一次", () => {
    setQuestion(PHRASE_QUESTION, "p-test");
    usePracticeStore.getState().submit("ni");
    usePracticeStore.getState().submit("zz");

    expect(usePracticeStore.getState().totals.completed).toBe(0);
    expect(usePracticeStore.getState().session.status).toBe("wrong");

    usePracticeStore.getState().submit("hk");
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

  it("清除练习记录会清空统计、错题和当前复现状态并重新开始", () => {
    setQuestion(CHAR_QUESTION, "c-test");
    usePracticeStore.getState().submit("xx");
    expect(usePracticeStore.getState().session.replayQueue).toHaveLength(1);

    usePracticeStore.getState().clearHistory();
    const { mistakes, totals, session } = usePracticeStore.getState();
    expect(mistakes).toEqual({});
    expect(totals).toEqual({ completed: 0, correct: 0 });
    expect(session.status).toBe("answering");
    expect(session.completed).toBe(0);
    expect(session.correct).toBe(0);
    expect(session.streak).toBe(0);
    expect(session.replayQueue).toEqual([]);
    expect(session.forcedReappear).toEqual({});
    expect(session.question).not.toBeNull();
  });

  it("错题权重按方案和模式隔离", () => {
    const mistakes = {
      "xiaohe:character:c001": { count: 1, lastSeen: 0 },
      "xiaohe:phrase:p001:1": { count: 1, lastSeen: 0 },
    };

    const xiaoheCharacter = buildWeightFor(
      { ...DEFAULT_SETTINGS, scheme: "xiaohe", mode: "character" },
      mistakes,
    );
    expect(xiaoheCharacter("c001")).toBe(3);
    expect(xiaoheCharacter("c002")).toBe(1);

    const microsoftCharacter = buildWeightFor(
      { ...DEFAULT_SETTINGS, scheme: "microsoft", mode: "character" },
      mistakes,
    );
    expect(microsoftCharacter("c001")).toBe(1);

    const xiaohePhrase = buildWeightFor(
      { ...DEFAULT_SETTINGS, scheme: "xiaohe", mode: "phrase" },
      mistakes,
    );
    expect(xiaohePhrase("p001")).toBe(3);
    expect(xiaohePhrase("p002")).toBe(1);
  });

  it("错题安排在当前题改对后的 3–8 题自然复现", () => {
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

  it("computeMistakeKey 同时包含方案、模式和词组字位", () => {
    expect(
      computeMistakeKey(
        { ...DEFAULT_SETTINGS, mode: "phrase" },
        "p-test",
        PHRASE_QUESTION,
        1,
      ),
    ).toBe("xiaohe:phrase:p-test:1");
    expect(
      computeMistakeKey(DEFAULT_SETTINGS, "c-test", CHAR_QUESTION, 0),
    ).toBe("xiaohe:character:c-test");
  });

  it("持久化不保存当前题，并迁移旧设置与未分方案的错题", () => {
    usePracticeStore.getState().setScheme("microsoft");
    const raw = localStorage.getItem("shuangpin-practice");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.settings.scheme).toBe("microsoft");
    expect(parsed.state.session).toBeUndefined();
    expect(parsed.version).toBe(4);

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
          mistakes: { c001: { count: 2, lastSeen: 3 } },
          totals: { completed: 12, correct: 10 },
        },
        version: 3,
      }),
    );

    usePracticeStore.persist.rehydrate();
    const state = usePracticeStore.getState();
    const settings = state.settings as unknown as Record<string, unknown>;
    expect(settings.questionsPerSession).toBeUndefined();
    expect(settings.autoNext).toBeUndefined();
    expect(settings.mistakePriority).toBeUndefined();
    expect(settings.sound).toBeUndefined();
    expect(state.mistakes).toEqual({});
    expect(state.totals.completed).toBe(12);
  });

  it("损坏的 localStorage 不会阻断练习", () => {
    localStorage.setItem("shuangpin-practice", "{invalid json");
    expect(() => usePracticeStore.persist.rehydrate()).not.toThrow();
  });
});
