import { describe, it, expect } from "vitest";

import { normalizePinyin } from "@/lib/shuangpin/normalize-pinyin";

describe("normalizePinyin", () => {
  it("小写化纯 ASCII 拼音", () => {
    expect(normalizePinyin("Chuang")).toBe("chuang");
    expect(normalizePinyin("NV")).toBe("nv");
  });

  it("去除声调标记", () => {
    expect(normalizePinyin("chuáng")).toBe("chuang");
    expect(normalizePinyin("nǚ")).toBe("nv");
    expect(normalizePinyin("ā á ǎ à")).toBe("aaaa");
  });

  it("把 ü 转为 v（预组合与分解形式）", () => {
    expect(normalizePinyin("nü")).toBe("nv");
    expect(normalizePinyin("lüe")).toBe("lve");
    // 分解形式：u + 组合分音符
    expect(normalizePinyin("n" + "ü")).toBe("nv");
  });

  it("u: 转为 v（ü 的另一种输入）", () => {
    expect(normalizePinyin("nu:")).toBe("nv");
    expect(normalizePinyin("lu:e")).toBe("lve");
  });

  it("移除数字声调 1–5", () => {
    expect(normalizePinyin("ma3")).toBe("ma");
    expect(normalizePinyin("lv4")).toBe("lv");
  });

  it("仅保留字母", () => {
    expect(normalizePinyin("chuang!")).toBe("chuang");
    expect(normalizePinyin("ni hao")).toBe("nihao");
  });

  it("空输入返回空串", () => {
    expect(normalizePinyin("")).toBe("");
  });
});
