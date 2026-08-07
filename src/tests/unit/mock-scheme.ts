import type { ShuangpinScheme } from "@/lib/shuangpin/types";

/**
 * 测试用方案：自洽但非真实方案，用于验证编码算法（拆分、ü 转换、零声母、错误处理、兼容码）。
 * 真实四种方案的编码正确性由 schemes.test.ts 用实现细则 §10 固定样例验证。
 */
export const MOCK_SCHEME: ShuangpinScheme = {
  id: "xiaohe",
  name: "测试方案",
  initials: {
    b: "b", p: "p", m: "m", f: "f", d: "d", t: "t", n: "n", l: "l",
    g: "g", k: "k", h: "h", j: "j", q: "q", x: "x",
    zh: "v", ch: "i", sh: "u", r: "r", z: "z", c: "c", s: "s",
    y: "y", w: "w",
  },
  finals: {
    a: "a", o: "o", uo: "o", e: "e", i: "i", u: "u", v: "v",
    ai: "l", ei: "z", ui: "v", ao: "k", ou: "b", iu: "q",
    ie: "x", ve: "t",
    an: "j", en: "f", in: "n", un: "p",
    ang: "h", eng: "g", ing: ";", ong: "s", iong: "s",
    iang: "d", uang: "d",
    ia: "w", ua: "w", uai: "y", iao: "n", ian: "m", uan: "r",
  },
  zeroInitials: {
    a: "aa", o: "oo", e: "ee",
    ai: "al", ei: "ez", ao: "ak", ou: "ob",
    an: "aj", en: "af", ang: "ah", eng: "eg", er: "or",
  },
};

/** 构造一个按序返回固定值的随机函数（用于出题测试）。 */
export function sequenceRandom(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[Math.min(i, values.length - 1)] ?? 0;
    i += 1;
    return v;
  };
}
