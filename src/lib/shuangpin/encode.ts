/**
 * 双拼编码（对应实现细则第 9 节）。
 *
 * 编码算法与具体方案解耦：方案只提供 initials/finals/zeroInitials(+finalCompat)，
 * 拆分与特殊规则对所有方案一致。
 *
 * 拆分规则（实现细则 §5、§6）：
 * - 以 a/o/e 开头的音节为零声母（y/w 视为声母，不算零声母），优先查 zeroInitials。
 * - 否则按最长声母前缀匹配（zh/ch/sh 优先于单字母），剩余部分为韵母。
 * - ju/qu/xu/yu 的 u 按 v(ü) 编码；jue/xue/yue 的 ue 按 ve(üe) 编码。
 * - juan/quan/xuan 按 uan 键编码、jun/qun/xun 按 un 键编码（üan/ün 与 uan/un 共键，不转换）。
 */

import type { ShuangpinScheme } from "./types";
import { normalizePinyin } from "./normalize-pinyin";

/** 双字母声母（优先匹配）。 */
const INITIALS_LONG = ["zh", "ch", "sh"] as const;
/** 单字母声母（含 y/w）。 */
const INITIALS_SHORT = [
  "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x",
  "r", "z", "c", "s", "y", "w",
] as const;

/** 零声母起始元音。 */
const ZERO_INITIAL_VOWELS = ["a", "o", "e"] as const;

/** 主流输入法常见的两键拼音兼容，仅限 j/q/x/y + u（实际为 ü）。 */
const PINYIN_U_COMPAT_SYLLABLES = new Set(["ju", "qu", "xu", "yu"]);

export type SplitResult =
  | { initial: string; final: string }
  | { zeroInitial: true; syllable: string }
  | { error: string };

/** 判断标准化后的拼音是否为零声母音节。 */
export function isZeroInitial(normalized: string): boolean {
  return (ZERO_INITIAL_VOWELS as readonly string[]).includes(normalized[0] ?? "");
}

/**
 * j/q/x/y 后的韵母转换（实现细则 §5）：
 * u -> v（ü）、ue -> ve（üe）。
 * uan/un 不转换：juan 按 uan 键、jun 按 un 键编码。
 */
function convertFinalAfterIinitial(initial: string, final: string): string {
  if (!["j", "q", "x", "y"].includes(initial)) return final;
  switch (final) {
    case "u":
      return "v";
    case "ue":
      return "ve";
    default:
      return final;
  }
}

/** 将标准化拼音拆分为声母 + 韵母，或识别为零声母。 */
export function splitSyllable(normalized: string): SplitResult {
  const s = normalized;
  if (!s) return { error: "空拼音" };
  if (!/^[a-z]+$/.test(s)) return { error: `非法字符: ${s}` };

  if (isZeroInitial(s)) {
    return { zeroInitial: true, syllable: s };
  }

  let initial: string;
  if (s.length >= 2 && (INITIALS_LONG as readonly string[]).includes(s.slice(0, 2))) {
    initial = s.slice(0, 2);
  } else if ((INITIALS_SHORT as readonly string[]).includes(s[0]!)) {
    initial = s[0]!;
  } else {
    return { error: `无法识别声母: ${s}` };
  }

  const rawFinal = s.slice(initial.length);
  if (!rawFinal) return { error: `缺少韵母: ${s}` };
  const final = convertFinalAfterIinitial(initial, rawFinal);
  return { initial, final };
}

export type EncodeResult =
  | { ok: true; code: string; accepted: string[] }
  | { ok: false; reason: string };

export interface EncodeDetailed {
  ok: true;
  normalized: string;
  initial: string;
  final: string;
  initialKey: string;
  finalKey: string;
  /** 标准答案（canonical）。 */
  code: string;
  /** 全部可接受答案（含标准答案，如微软 ve 兼容 v）。 */
  accepted: string[];
}

export type EncodeDetailedResult = EncodeDetailed | { ok: false; reason: string };

/** 编码单个音节，返回标准答案与可接受答案。 */
export function encodeSyllable(pinyin: string, scheme: ShuangpinScheme): EncodeResult {
  const detailed = encodeSyllableDetailed(pinyin, scheme);
  if (!detailed.ok) return detailed;
  return { ok: true, code: detailed.code, accepted: detailed.accepted };
}

/** 计算某韵母的可接受键位（含兼容键）。 */
function acceptedFinalKeys(scheme: ShuangpinScheme, final: string): string[] {
  const standard = scheme.finals[final];
  if (!standard) return [];
  const compat = scheme.finalCompat?.[final] ?? [];
  return [standard, ...compat];
}

/** 编码单个音节，附带拆解与可接受答案（用于错误展示与答案校验）。 */
export function encodeSyllableDetailed(
  pinyin: string,
  scheme: ShuangpinScheme,
): EncodeDetailedResult {
  const norm = normalizePinyin(pinyin);
  if (!norm) return { ok: false, reason: "空拼音" };

  const split = splitSyllable(norm);
  if ("error" in split) return { ok: false, reason: split.error };

  if ("zeroInitial" in split) {
    const code = scheme.zeroInitials[split.syllable];
    if (!code) {
      return { ok: false, reason: `零声母 ${split.syllable} 未在方案中定义` };
    }
    return {
      ok: true,
      normalized: norm,
      initial: "",
      final: split.syllable,
      initialKey: code[0] ?? "",
      finalKey: code[1] ?? "",
      code,
      accepted: [code],
    };
  }

  const initialKey = scheme.initials[split.initial];
  if (!initialKey) {
    return { ok: false, reason: `声母 ${split.initial} 未在方案中定义` };
  }
  const finalKeys = acceptedFinalKeys(scheme, split.final);
  if (finalKeys.length === 0) {
    return { ok: false, reason: `韵母 ${split.final} 未在方案中定义` };
  }

  const code = initialKey + finalKeys[0]!;
  const accepted = finalKeys.map((k) => initialKey + k);
  if (PINYIN_U_COMPAT_SYLLABLES.has(norm) && !accepted.includes(norm)) {
    accepted.push(norm);
  }

  return {
    ok: true,
    normalized: norm,
    initial: split.initial,
    final: split.final,
    initialKey,
    finalKey: finalKeys[0]!,
    code,
    accepted,
  };
}

/** 编码词组：逐字编码，返回拼接标准答案与每字的可接受答案（词组为逐字输入）。 */
export function encodePhrase(
  syllables: string[],
  scheme: ShuangpinScheme,
):
  | { ok: true; code: string; charCodes: string[]; charAccepted: string[][] }
  | { ok: false; reason: string } {
  const charCodes: string[] = [];
  const charAccepted: string[][] = [];
  for (const syl of syllables) {
    const res = encodeSyllable(syl, scheme);
    if (!res.ok) {
      return { ok: false, reason: `${syl}: ${res.reason}` };
    }
    charCodes.push(res.code);
    charAccepted.push(res.accepted);
  }
  return { ok: true, code: charCodes.join(""), charCodes, charAccepted };
}

/** 方案必须覆盖的全部声母。 */
export const REQUIRED_INITIALS: readonly string[] = [
  ...INITIALS_LONG,
  ...INITIALS_SHORT,
];

/**
 * 方案必须覆盖的全部韵母（实现细则 §7）。
 * 不含 er（仅零声母）、ueng（仅 weng，题库未用）、van/vn（编码器不产生）。
 */
export const REQUIRED_FINALS: readonly string[] = [
  "a", "o", "uo", "e", "i", "u", "v",
  "ai", "ei", "ui", "ao", "ou", "iu", "ie", "ve",
  "an", "en", "in", "un", "ang", "eng", "ing", "ong", "iong",
  "iang", "uang", "ia", "ua", "uai", "iao", "ian", "uan",
];

/** 方案必须覆盖的全部零声母音节。 */
export const REQUIRED_ZERO_INITIALS: readonly string[] = [
  "a", "o", "e", "ai", "ei", "ao", "ou", "an", "en", "ang", "eng", "er",
];

export interface SchemeValidation {
  valid: boolean;
  missing: string[];
}

/**
 * 校验方案数据完整性：声母、韵母、零声母是否齐全。
 * 用于在测试阶段发现方案数据错误。
 */
export function validateScheme(scheme: ShuangpinScheme): SchemeValidation {
  const missing: string[] = [];
  for (const k of REQUIRED_INITIALS) {
    if (!scheme.initials[k]) missing.push(`initials.${k}`);
  }
  for (const k of REQUIRED_FINALS) {
    if (!scheme.finals[k]) missing.push(`finals.${k}`);
  }
  for (const k of REQUIRED_ZERO_INITIALS) {
    if (!scheme.zeroInitials[k]) missing.push(`zeroInitials.${k}`);
  }
  return { valid: missing.length === 0, missing };
}
