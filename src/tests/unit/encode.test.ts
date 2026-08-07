import { describe, it, expect } from "vitest";

import {
  splitSyllable,
  encodeSyllable,
  encodeSyllableDetailed,
  encodePhrase,
  isZeroInitial,
  validateScheme,
} from "@/lib/shuangpin/encode";
import { MOCK_SCHEME } from "./mock-scheme";

describe("isZeroInitial", () => {
  it("a/o/e 开头为零声母", () => {
    expect(isZeroInitial("ai")).toBe(true);
    expect(isZeroInitial("ang")).toBe(true);
    expect(isZeroInitial("er")).toBe(true);
    expect(isZeroInitial("a")).toBe(true);
  });

  it("y/w 及辅音开头非零声母", () => {
    expect(isZeroInitial("ya")).toBe(false);
    expect(isZeroInitial("wu")).toBe(false);
    expect(isZeroInitial("chuang")).toBe(false);
  });
});

describe("splitSyllable", () => {
  it("拆出双字母声母", () => {
    expect(splitSyllable("chuang")).toEqual({ initial: "ch", final: "uang" });
    expect(splitSyllable("shuang")).toEqual({ initial: "sh", final: "uang" });
    expect(splitSyllable("zhi")).toEqual({ initial: "zh", final: "i" });
  });

  it("拆出单字母声母", () => {
    expect(splitSyllable("ni")).toEqual({ initial: "n", final: "i" });
    expect(splitSyllable("hao")).toEqual({ initial: "h", final: "ao" });
  });

  it("识别零声母", () => {
    expect(splitSyllable("ai")).toEqual({ zeroInitial: true, syllable: "ai" });
    expect(splitSyllable("er")).toEqual({ zeroInitial: true, syllable: "er" });
    expect(splitSyllable("a")).toEqual({ zeroInitial: true, syllable: "a" });
  });

  it("ju/qu/xu 的 u 转为 v（ü）", () => {
    expect(splitSyllable("ju")).toEqual({ initial: "j", final: "v" });
    expect(splitSyllable("qu")).toEqual({ initial: "q", final: "v" });
    expect(splitSyllable("xue")).toEqual({ initial: "x", final: "ve" });
  });

  it("juan/jun 按 uan/un 键编码（不转换为 van/vn）", () => {
    expect(splitSyllable("juan")).toEqual({ initial: "j", final: "uan" });
    expect(splitSyllable("jun")).toEqual({ initial: "j", final: "un" });
    expect(splitSyllable("yuan")).toEqual({ initial: "y", final: "uan" });
    expect(splitSyllable("yun")).toEqual({ initial: "y", final: "un" });
  });

  it("y 后 u 转为 v，其余按书写形式", () => {
    expect(splitSyllable("yu")).toEqual({ initial: "y", final: "v" });
    expect(splitSyllable("yue")).toEqual({ initial: "y", final: "ve" });
    expect(splitSyllable("ya")).toEqual({ initial: "y", final: "a" });
    expect(splitSyllable("you")).toEqual({ initial: "y", final: "ou" });
    expect(splitSyllable("yong")).toEqual({ initial: "y", final: "ong" });
    expect(splitSyllable("yi")).toEqual({ initial: "y", final: "i" });
  });

  it("w 不做 ü 转换", () => {
    expect(splitSyllable("wa")).toEqual({ initial: "w", final: "a" });
    expect(splitSyllable("wu")).toEqual({ initial: "w", final: "u" });
    expect(splitSyllable("wang")).toEqual({ initial: "w", final: "ang" });
  });

  it("n/l 后 v 保持 v（如 nv/lv）", () => {
    expect(splitSyllable("nv")).toEqual({ initial: "n", final: "v" });
    expect(splitSyllable("lve")).toEqual({ initial: "l", final: "ve" });
  });

  it("非法输入返回错误", () => {
    expect(splitSyllable("b")).toEqual({ error: expect.any(String) });
    expect(splitSyllable("")).toEqual({ error: expect.any(String) });
  });

  it("可拆分但韵母非法时由编码阶段报错", () => {
    expect(splitSyllable("xyz")).toEqual({ initial: "x", final: "yz" });
  });
});

describe("encodeSyllable", () => {
  it("声母 + 韵母编码为 2 键", () => {
    expect(encodeSyllable("chuang", MOCK_SCHEME)).toMatchObject({ ok: true, code: "id" });
    expect(encodeSyllable("shuang", MOCK_SCHEME)).toMatchObject({ ok: true, code: "ud" });
    expect(encodeSyllable("hao", MOCK_SCHEME)).toMatchObject({ ok: true, code: "hk" });
    expect(encodeSyllable("ni", MOCK_SCHEME)).toMatchObject({ ok: true, code: "ni" });
  });

  it("零声母使用 zeroInitials 表", () => {
    expect(encodeSyllable("ai", MOCK_SCHEME)).toMatchObject({ ok: true, code: "al" });
    expect(encodeSyllable("a", MOCK_SCHEME)).toMatchObject({ ok: true, code: "aa" });
    expect(encodeSyllable("er", MOCK_SCHEME)).toMatchObject({ ok: true, code: "or" });
  });

  it("ü 类音节正确编码", () => {
    expect(encodeSyllable("nv", MOCK_SCHEME)).toMatchObject({ ok: true, code: "nv" });
    expect(encodeSyllable("ju", MOCK_SCHEME)).toMatchObject({ ok: true, code: "jv" });
    expect(encodeSyllable("juan", MOCK_SCHEME)).toMatchObject({ ok: true, code: "jr" });
    expect(encodeSyllable("yu", MOCK_SCHEME)).toMatchObject({ ok: true, code: "yv" });
    expect(encodeSyllable("yuan", MOCK_SCHEME)).toMatchObject({ ok: true, code: "yr" });
  });

  it("y/w 音节按书写韵母编码", () => {
    expect(encodeSyllable("ya", MOCK_SCHEME)).toMatchObject({ ok: true, code: "ya" });
    expect(encodeSyllable("you", MOCK_SCHEME)).toMatchObject({ ok: true, code: "yb" });
    expect(encodeSyllable("yong", MOCK_SCHEME)).toMatchObject({ ok: true, code: "ys" });
    expect(encodeSyllable("wa", MOCK_SCHEME)).toMatchObject({ ok: true, code: "wa" });
  });

  it("兼容带声调与 ü 字符输入", () => {
    expect(encodeSyllable("chuáng", MOCK_SCHEME)).toMatchObject({ ok: true, code: "id" });
    expect(encodeSyllable("nü", MOCK_SCHEME)).toMatchObject({ ok: true, code: "nv" });
    expect(encodeSyllable("lǜe", MOCK_SCHEME)).toMatchObject({ ok: true, code: "lt" });
  });

  it("无兼容码时 accepted 只含标准答案", () => {
    const r = encodeSyllable("chuang", MOCK_SCHEME);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.accepted).toEqual(["id"]);
  });

  it("无效拼音返回错误", () => {
    expect(encodeSyllable("xyz", MOCK_SCHEME)).toEqual({ ok: false, reason: expect.any(String) });
    expect(encodeSyllable("b", MOCK_SCHEME)).toEqual({ ok: false, reason: expect.any(String) });
    expect(encodeSyllable("", MOCK_SCHEME)).toEqual({ ok: false, reason: expect.any(String) });
  });

  it("encodeSyllableDetailed 提供拆解与可接受答案", () => {
    const r = encodeSyllableDetailed("chuang", MOCK_SCHEME);
    expect(r).toMatchObject({
      ok: true,
      code: "id",
      initial: "ch",
      final: "uang",
      initialKey: "i",
      finalKey: "d",
    });
  });
});

describe("encodePhrase", () => {
  it("逐字编码并拼接，返回每字可接受答案", () => {
    expect(encodePhrase(["ni", "hao"], MOCK_SCHEME)).toMatchObject({
      ok: true,
      code: "nihk",
      charCodes: ["ni", "hk"],
      charAccepted: [["ni"], ["hk"]],
    });
  });

  it("包含零声母字", () => {
    expect(encodePhrase(["ai", "ren"], MOCK_SCHEME)).toMatchObject({
      ok: true,
      code: "alrf",
      charCodes: ["al", "rf"],
    });
  });

  it("任一字编码失败则整体失败", () => {
    const r = encodePhrase(["ni", "xyz"], MOCK_SCHEME);
    expect(r.ok).toBe(false);
  });
});

describe("validateScheme", () => {
  it("完整方案通过校验", () => {
    expect(validateScheme(MOCK_SCHEME).valid).toBe(true);
  });

  it("缺失项被列出", () => {
    const incomplete = {
      ...MOCK_SCHEME,
      finals: { ...MOCK_SCHEME.finals, uang: undefined as unknown as string },
    };
    const r = validateScheme(incomplete);
    expect(r.valid).toBe(false);
    expect(r.missing).toContain("finals.uang");
  });
});
