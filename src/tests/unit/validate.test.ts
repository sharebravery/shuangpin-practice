import { describe, it, expect } from "vitest";

import {
  validateAnswer,
  normalizeAnswer,
  isAnswerComplete,
} from "@/lib/shuangpin/validate";

describe("normalizeAnswer", () => {
  it("小写并去除非字母（保留分号）", () => {
    expect(normalizeAnswer("ID")).toBe("id");
    expect(normalizeAnswer(" Id ")).toBe("id");
    expect(normalizeAnswer("id1")).toBe("id");
    expect(normalizeAnswer("B;")).toBe("b;");
  });
  it("空输入返回空串", () => {
    expect(normalizeAnswer("")).toBe("");
  });
});

describe("validateAnswer", () => {
  it("不区分大小写", () => {
    expect(validateAnswer("ID", "id")).toBe(true);
    expect(validateAnswer("id", "ID")).toBe(true);
  });
  it("忽略空白", () => {
    expect(validateAnswer(" id ", "id")).toBe(true);
  });
  it("不同答案判错", () => {
    expect(validateAnswer("ix", "id")).toBe(false);
    expect(validateAnswer("idd", "id")).toBe(false);
  });
});

describe("isAnswerComplete", () => {
  it("达到预期长度即完成", () => {
    expect(isAnswerComplete("id", "id")).toBe(true);
    expect(isAnswerComplete("idd", "id")).toBe(true);
  });
  it("未达长度未完成", () => {
    expect(isAnswerComplete("i", "id")).toBe(false);
    expect(isAnswerComplete("", "id")).toBe(false);
  });
});
