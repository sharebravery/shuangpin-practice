import { describe, it, expect } from "vitest";

import { SCHEMES, getScheme } from "@/data/schemes";
import { CHARACTERS } from "@/data/characters";
import { PHRASES } from "@/data/phrases";
import {
  encodeSyllable,
  validateScheme,
} from "@/lib/shuangpin/encode";
import { isAcceptedAnswer } from "@/lib/shuangpin/validate";

describe("方案数据完整性", () => {
  for (const scheme of SCHEMES) {
    it(`${scheme.name} 声母/韵母/零声母齐全`, () => {
      const r = validateScheme(scheme);
      expect(r.valid, r.missing.join(", ")).toBe(true);
    });
  }
});

describe("题库可被各方案编码", () => {
  for (const scheme of SCHEMES) {
    it(`${scheme.name} 可编码全部单字与词组`, () => {
      const failed: string[] = [];
      for (const c of CHARACTERS) {
        const r = encodeSyllable(c.pinyin, scheme);
        if (!r.ok) failed.push(`${c.character}(${c.pinyin}): ${r.reason}`);
      }
      for (const p of PHRASES) {
        for (const syl of p.syllables) {
          const r = encodeSyllable(syl, scheme);
          if (!r.ok) failed.push(`${p.text}/${syl}: ${r.reason}`);
        }
      }
      expect(failed, failed.join("; ")).toEqual([]);
    });
  }
});

// 实现细则 §10 固定编码样例。每个方案的预期结果独立列出，不共享。
describe("小鹤双拼编码样例（§10）", () => {
  const scheme = getScheme("xiaohe")!;
  const cases: Array<[string, string]> = [
    ["shuang", "ul"], ["chuang", "il"], ["zhong", "vs"], ["xiao", "xn"],
    ["guang", "gl"], ["liu", "lq"], ["ming", "mk"], ["yue", "yt"],
    ["lve", "lt"], ["ju", "jv"], ["jun", "jy"], ["qing", "qk"],
    ["kuai", "kk"], ["shui", "uv"], ["qiong", "qs"], ["zhuang", "vl"],
    ["ai", "ai"], ["ang", "ah"], ["er", "er"], ["ou", "ou"],
    ["nv", "nv"], ["wei", "ww"], ["yuan", "yr"],
  ];
  for (const [pinyin, expected] of cases) {
    it(`${pinyin} -> ${expected}`, () => {
      expect(encodeSyllable(pinyin, scheme)).toMatchObject({ ok: true, code: expected });
    });
  }
});

describe("自然码双拼编码样例（§10）", () => {
  const scheme = getScheme("ziranma")!;
  const cases: Array<[string, string]> = [
    ["shuang", "ud"], ["chuang", "id"], ["zhong", "vs"], ["xiao", "xc"],
    ["guang", "gd"], ["liu", "lq"], ["ming", "my"], ["yue", "yt"],
    ["lve", "lt"], ["ju", "jv"], ["jun", "jp"], ["qing", "qy"],
    ["kuai", "ky"], ["shui", "uv"], ["qiong", "qs"], ["zhuang", "vd"],
    ["ai", "ai"], ["ang", "ah"], ["er", "er"], ["ou", "ou"],
    ["nv", "nv"], ["wei", "wz"], ["yuan", "yr"],
  ];
  for (const [pinyin, expected] of cases) {
    it(`${pinyin} -> ${expected}`, () => {
      expect(encodeSyllable(pinyin, scheme)).toMatchObject({ ok: true, code: expected });
    });
  }
});

describe("搜狗双拼编码样例（§10）", () => {
  const scheme = getScheme("sogou")!;
  const cases: Array<[string, string]> = [
    ["shuang", "ud"], ["chuang", "id"], ["zhong", "vs"], ["xiao", "xc"],
    ["guang", "gd"], ["liu", "lq"], ["ming", "m;"], ["yue", "yt"],
    ["lve", "lt"], ["ju", "jy"], ["jun", "jp"], ["qing", "q;"],
    ["kuai", "ky"], ["shui", "uv"], ["qiong", "qs"], ["zhuang", "vd"],
    ["ai", "ol"], ["ang", "oh"], ["er", "or"], ["ou", "ob"],
    ["nv", "ny"], ["wei", "wz"], ["yuan", "yr"],
  ];
  for (const [pinyin, expected] of cases) {
    it(`${pinyin} -> ${expected}`, () => {
      expect(encodeSyllable(pinyin, scheme)).toMatchObject({ ok: true, code: expected });
    });
  }
});

describe("微软双拼编码样例（§10）", () => {
  const scheme = getScheme("microsoft")!;
  const cases: Array<[string, string]> = [
    ["shuang", "ud"], ["chuang", "id"], ["zhong", "vs"], ["xiao", "xc"],
    ["guang", "gd"], ["liu", "lq"], ["ming", "m;"], ["yue", "yt"],
    ["lve", "lt"], ["ju", "jy"], ["jun", "jp"], ["qing", "q;"],
    ["kuai", "ky"], ["shui", "uv"], ["qiong", "qs"], ["zhuang", "vd"],
    ["ai", "ol"], ["ang", "oh"], ["er", "or"], ["ou", "ob"],
    ["nv", "ny"], ["wei", "wz"], ["yuan", "yr"],
  ];
  for (const [pinyin, expected] of cases) {
    it(`${pinyin} -> ${expected}`, () => {
      expect(encodeSyllable(pinyin, scheme)).toMatchObject({ ok: true, code: expected });
    });
  }
});

describe("微软双拼 ve 兼容码（§10 额外）", () => {
  const scheme = getScheme("microsoft")!;

  it("lve 标准为 lt，同时接受 lv", () => {
    const r = encodeSyllable("lve", scheme);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.code).toBe("lt");
      expect(r.accepted).toEqual(["lt", "lv"]);
      expect(isAcceptedAnswer("lv", r.accepted)).toBe(true);
      expect(isAcceptedAnswer("lt", r.accepted)).toBe(true);
    }
  });

  it("nve 标准为 nt，同时接受 nv", () => {
    const r = encodeSyllable("nve", scheme);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.code).toBe("nt");
      expect(r.accepted).toEqual(["nt", "nv"]);
    }
  });

  it("搜狗无 ve 兼容码", () => {
    const r = encodeSyllable("lve", getScheme("sogou")!);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.accepted).toEqual(["lt"]);
  });
});
