import { describe, it, expect, beforeEach } from "vitest";

import {
  usePracticeStore,
  DEFAULT_SETTINGS,
  DEFAULT_SESSION,
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

/** 将 session 置为已知题目，便于测试 submit。 */
function setQuestion(question: GeneratedQuestion, id: string, total = 5) {
  usePracticeStore.setState({
    session: {
      ...DEFAULT_SESSION,
      status: "answering",
      question,
      questionId: id,
      total,
      completed: 0,
    },
    mistakes: {},
    totals: { completed: 0, correct: 0 },
  });
}

describe("practice-store", () => {
  beforeEach(() => {
    cleanup();
    usePracticeStore.setState({
      settings: { ...DEFAULT_SETTINGS },
      session: { ...DEFAULT_SESSION, total: DEFAULT_SETTINGS.questionsPerSession },
      mistakes: {},
      totals: { completed: 0, correct: 0 },
      hasHydrated: false,
    });
  });

  it("默认设置为小鹤双拼 + 单字练习", () => {
    const { settings } = usePracticeStore.getState();
    expect(settings.scheme).toBe("xiaohe");
    expect(settings.mode).toBe("character");
    expect(settings.questionsPerSession).toBe(20);
  });

  it("setScheme / setMode 更新设置并重置会话", () => {
    usePracticeStore.getState().setScheme("microsoft");
    expect(usePracticeStore.getState().settings.scheme).toBe("microsoft");
    expect(usePracticeStore.getState().session.status).toBe("answering");

    usePracticeStore.getState().setMode("phrase");
    expect(usePracticeStore.getState().settings.mode).toBe("phrase");
    expect(usePracticeStore.getState().session.question?.kind).toBe("phrase");
  });

  it("startSession 生成题目并进入 answering", () => {
    usePracticeStore.getState().startSession();
    const { session } = usePracticeStore.getState();
    expect(session.status).toBe("answering");
    expect(session.question).not.toBeNull();
    expect(session.total).toBe(20);
  });

  it("submit 正确（autoNext）更新统计并进入下一题", () => {
    setQuestion(CHAR_QUESTION, "c-test");
    usePracticeStore.getState().submit("il");
    const { session, totals } = usePracticeStore.getState();
    expect(session.status).toBe("answering");
    expect(session.completed).toBe(1);
    expect(session.correct).toBe(1);
    expect(session.streak).toBe(1);
    expect(totals.completed).toBe(1);
    expect(totals.correct).toBe(1);
  });

  it("submit 错误进入 wrong 并记录错题", () => {
    setQuestion(CHAR_QUESTION, "c-test");
    usePracticeStore.getState().submit("xx");
    const { session, mistakes } = usePracticeStore.getState();
    expect(session.status).toBe("wrong");
    expect(session.completed).toBe(1);
    expect(session.correct).toBe(0);
    expect(session.streak).toBe(0);
    expect(mistakes["c-test"]?.count).toBe(1);
    expect(session.sessionMistakes).toContain("c-test");
  });

  it("答对增加 totals.completed 与 totals.correct", () => {
    setQuestion(CHAR_QUESTION, "c-test");
    usePracticeStore.getState().submit("il");
    const { totals } = usePracticeStore.getState();
    expect(totals.completed).toBe(1);
    expect(totals.correct).toBe(1);
  });

  it("答错增加 totals.completed，totals.correct 不变", () => {
    setQuestion(CHAR_QUESTION, "c-test");
    usePracticeStore.getState().submit("xx");
    const { totals } = usePracticeStore.getState();
    expect(totals.completed).toBe(1);
    expect(totals.correct).toBe(0);
  });

  it("next 从 wrong 进入下一题", () => {
    setQuestion(CHAR_QUESTION, "c-test");
    usePracticeStore.getState().submit("xx");
    usePracticeStore.getState().next();
    const { session } = usePracticeStore.getState();
    expect(session.status).toBe("answering");
    expect(session.completed).toBe(1);
    expect(session.question).not.toBeNull();
  });

  it("autoNext=false 时正确显示反馈，Enter 后下一题", () => {
    usePracticeStore.getState().updateSettings({ autoNext: false });
    setQuestion(CHAR_QUESTION, "c-test");
    usePracticeStore.getState().submit("il");
    const after = usePracticeStore.getState().session;
    expect(after.status).toBe("answering");
    expect(after.feedback).toBe("correct");
    expect(after.completed).toBe(1);

    usePracticeStore.getState().next();
    const afterNext = usePracticeStore.getState().session;
    expect(afterNext.feedback).toBe("none");
    expect(afterNext.status).toBe("answering");
  });

  it("词组逐字输入：正确逐字推进，全部完成计为一题", () => {
    setQuestion(PHRASE_QUESTION, "p-test");
    usePracticeStore.getState().submit("ni");
    let s = usePracticeStore.getState().session;
    expect(s.phraseIndex).toBe(1);
    expect(s.completed).toBe(0);

    usePracticeStore.getState().submit("hk");
    s = usePracticeStore.getState().session;
    expect(s.completed).toBe(1);
    expect(s.correct).toBe(1);
  });

  it("词组某字错误进入 wrong", () => {
    setQuestion(PHRASE_QUESTION, "p-test");
    usePracticeStore.getState().submit("ni");
    usePracticeStore.getState().submit("zz");
    const s = usePracticeStore.getState().session;
    expect(s.status).toBe("wrong");
    expect(s.completed).toBe(1);
    expect(s.correct).toBe(0);
  });

  it("完成本组题数进入 completed", () => {
    setQuestion(CHAR_QUESTION, "c-test", 1);
    usePracticeStore.getState().submit("il");
    expect(usePracticeStore.getState().session.status).toBe("completed");
  });

  it("completed 状态 next 等价于再练一组（restart）", () => {
    setQuestion(CHAR_QUESTION, "c-test", 1);
    usePracticeStore.getState().submit("il");
    expect(usePracticeStore.getState().session.status).toBe("completed");
    usePracticeStore.getState().next();
    const s = usePracticeStore.getState().session;
    expect(s.status).toBe("answering");
    expect(s.completed).toBe(0);
  });

  it("pause / resume 切换状态", () => {
    usePracticeStore.getState().startSession();
    usePracticeStore.getState().pause();
    expect(usePracticeStore.getState().session.status).toBe("paused");
    usePracticeStore.getState().resume();
    expect(usePracticeStore.getState().session.status).toBe("answering");
  });

  it("restart 清空本组统计", () => {
    setQuestion(CHAR_QUESTION, "c-test");
    usePracticeStore.getState().submit("xx");
    usePracticeStore.getState().restart();
    const s = usePracticeStore.getState().session;
    expect(s.completed).toBe(0);
    expect(s.correct).toBe(0);
    expect(s.status).toBe("answering");
  });

  it("clearHistory 清空错题与累计统计", () => {
    setQuestion(CHAR_QUESTION, "c-test");
    usePracticeStore.getState().submit("xx");
    usePracticeStore.getState().clearHistory();
    const { mistakes, totals } = usePracticeStore.getState();
    expect(mistakes).toEqual({});
    expect(totals).toEqual({ completed: 0, correct: 0 });
  });

  it("持久化仅保存 settings/mistakes/totals/version，不含 session", () => {
    usePracticeStore.getState().setScheme("sogou");
    const raw = localStorage.getItem("shuangpin-practice");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.settings.scheme).toBe("sogou");
    expect(parsed.state.totals).toBeDefined();
    expect(parsed.state.mistakes).toBeDefined();
    expect(parsed.state.session).toBeUndefined();
    expect(parsed.version).toBe(1);

    // 直接写 storage 模拟上次会话（避免 setState 回写干扰），rehydrate 应读取。
    localStorage.setItem(
      "shuangpin-practice",
      JSON.stringify({
        state: {
          settings: { ...DEFAULT_SETTINGS, scheme: "microsoft" },
          mistakes: {},
          totals: { completed: 0, correct: 0 },
        },
        version: 1,
      }),
    );
    usePracticeStore.persist.rehydrate();
    expect(usePracticeStore.getState().settings.scheme).toBe("microsoft");
    expect(usePracticeStore.getState().hasHydrated).toBe(true);
  });

  it("localStorage 数据损坏不会导致崩溃（§8.4）", () => {
    localStorage.setItem("shuangpin-practice", "{invalid json");
    expect(() => usePracticeStore.persist.rehydrate()).not.toThrow();
    expect(usePracticeStore.getState().hasHydrated).toBe(true);
    expect(usePracticeStore.getState().settings.scheme).toBe(DEFAULT_SETTINGS.scheme);
  });
});
