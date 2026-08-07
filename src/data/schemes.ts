import type { ShuangpinScheme } from "@/lib/shuangpin/types";

/**
 * 四种双拼方案映射（实现细则第 7、8 节）。
 *
 * 约定（与 encode.ts 一致）：
 * - initials: 拼音声母 -> 键位字母（四种方案声母相同）。
 * - finals: 拼音韵母 -> 键位字母；用 v 表示 ü。部分韵母共享同一键。
 * - zeroInitials: 零声母音节 -> 完整 2 键编码。
 * - finalCompat: 韵母兼容键（仅微软 ve 兼容 v），只用于答案接受。
 */

/** 小鹤双拼（实现细则 §7.1、§8.1）。 */
const xiaohe: ShuangpinScheme = {
  id: "xiaohe",
  name: "小鹤双拼",
  initials: {
    b: "b", p: "p", m: "m", f: "f", d: "d", t: "t", n: "n", l: "l",
    g: "g", k: "k", h: "h", j: "j", q: "q", x: "x",
    zh: "v", ch: "i", sh: "u", r: "r", z: "z", c: "c", s: "s",
    y: "y", w: "w",
  },
  finals: {
    a: "a", o: "o", uo: "o", e: "e", i: "i", u: "u", v: "v",
    iu: "q", ei: "w",
    uan: "r", ve: "t",
    un: "y", ong: "s", iong: "s",
    ie: "p", ai: "d",
    en: "f", eng: "g",
    ang: "h", an: "j",
    ing: "k", uai: "k", iang: "l", uang: "l",
    ou: "z", ia: "x", ua: "x",
    ao: "c", ui: "v",
    in: "b", iao: "n",
    ian: "m",
  },
  zeroInitials: {
    a: "aa", o: "oo", e: "ee",
    ai: "ai", ei: "ei", ao: "ao", ou: "ou",
    an: "an", en: "en", ang: "ah", eng: "eg", er: "er",
  },
};

/** 自然码双拼（实现细则 §7.2、§8.1）。 */
const ziranma: ShuangpinScheme = {
  id: "ziranma",
  name: "自然码双拼",
  initials: {
    b: "b", p: "p", m: "m", f: "f", d: "d", t: "t", n: "n", l: "l",
    g: "g", k: "k", h: "h", j: "j", q: "q", x: "x",
    zh: "v", ch: "i", sh: "u", r: "r", z: "z", c: "c", s: "s",
    y: "y", w: "w",
  },
  finals: {
    a: "a", o: "o", uo: "o", e: "e", i: "i", u: "u", v: "v",
    iu: "q", ia: "w", ua: "w",
    uan: "r", ve: "t",
    ing: "y", uai: "y", un: "p",
    ong: "s", iong: "s", iang: "d", uang: "d",
    en: "f", eng: "g",
    ang: "h", an: "j",
    ao: "k", ai: "l",
    ei: "z", ie: "x",
    iao: "c", ui: "v",
    ou: "b", in: "n",
    ian: "m",
  },
  zeroInitials: {
    a: "aa", o: "oo", e: "ee",
    ai: "ai", ei: "ei", ao: "ao", ou: "ou",
    an: "an", en: "en", ang: "ah", eng: "eg", er: "er",
  },
};

/** 搜狗双拼（实现细则 §7.3、§8.2）。 */
const sogou: ShuangpinScheme = {
  id: "sogou",
  name: "搜狗双拼",
  initials: {
    b: "b", p: "p", m: "m", f: "f", d: "d", t: "t", n: "n", l: "l",
    g: "g", k: "k", h: "h", j: "j", q: "q", x: "x",
    zh: "v", ch: "i", sh: "u", r: "r", z: "z", c: "c", s: "s",
    y: "y", w: "w",
  },
  finals: {
    a: "a", o: "o", uo: "o", e: "e", i: "i", u: "u", v: "y",
    iu: "q", ia: "w", ua: "w",
    uan: "r", ve: "t",
    uai: "y", un: "p",
    ong: "s", iong: "s", iang: "d", uang: "d",
    en: "f", eng: "g",
    ang: "h", an: "j",
    ao: "k", ai: "l",
    ing: ";", ei: "z",
    ie: "x", iao: "c",
    ui: "v", ou: "b",
    in: "n", ian: "m",
  },
  zeroInitials: {
    a: "oa", o: "oo", e: "oe",
    ai: "ol", ei: "oz", ao: "ok", ou: "ob",
    an: "oj", en: "of", ang: "oh", eng: "og", er: "or",
  },
};

/** 微软双拼（实现细则 §7.4、§8.2）；与搜狗兼容，ve 标准为 t、兼容接受 v。 */
const microsoft: ShuangpinScheme = {
  id: "microsoft",
  name: "微软双拼",
  initials: {
    b: "b", p: "p", m: "m", f: "f", d: "d", t: "t", n: "n", l: "l",
    g: "g", k: "k", h: "h", j: "j", q: "q", x: "x",
    zh: "v", ch: "i", sh: "u", r: "r", z: "z", c: "c", s: "s",
    y: "y", w: "w",
  },
  finals: {
    a: "a", o: "o", uo: "o", e: "e", i: "i", u: "u", v: "y",
    iu: "q", ia: "w", ua: "w",
    uan: "r", ve: "t",
    uai: "y", un: "p",
    ong: "s", iong: "s", iang: "d", uang: "d",
    en: "f", eng: "g",
    ang: "h", an: "j",
    ao: "k", ai: "l",
    ing: ";", ei: "z",
    ie: "x", iao: "c",
    ui: "v", ou: "b",
    in: "n", ian: "m",
  },
  zeroInitials: {
    a: "oa", o: "oo", e: "oe",
    ai: "ol", ei: "oz", ao: "ok", ou: "ob",
    an: "oj", en: "of", ang: "oh", eng: "og", er: "or",
  },
  finalCompat: {
    ve: ["v"],
  },
};

export const SCHEMES: ShuangpinScheme[] = [xiaohe, microsoft, ziranma, sogou];

export const SCHEME_BY_ID: Record<string, ShuangpinScheme> = Object.fromEntries(
  SCHEMES.map((s) => [s.id, s]),
);

export function getScheme(id: string): ShuangpinScheme | undefined {
  return SCHEME_BY_ID[id];
}
