/**
 * 拼音标准化（对应架构文档第 7 节 normalizePinyin）。
 *
 * 约定：
 * - 不带声调（题库已存为无调拼音，这里也兼容带调输入）。
 * - 用字母 `v` 表示 `ü`（如「女」写作 "nv"、"略" 写作 "lve"）。
 * - 仅保留 a-z，便于后续拆分与编码。
 */

// 组合声调标记范围（NFD 分解后的 ā á ǎ à 等）。
const COMBINING_DIACRITICS = /[̀-ͯ]/g;
// 分解后的 ü = "u" + U+0308（组合分音符）。
const DECOMPOSED_UMLAUT_U = /ü/g;

/** 将带声调/特殊字符的拼音标准化为小写无调 ASCII 形式。 */
export function normalizePinyin(input: string): string {
  if (!input) return "";
  const lower = input.toLowerCase();
  // u: -> v（ü 的另一种输入形式，实现细则 §5）
  const vForColon = lower.replace(/u:/g, "v");
  // 预组合 ü（U+00FC） -> v
  const vForPrecomposed = vForColon.replace(/ü/g, "v");
  // NFD 分解后，把 "u + 组合分音符" 还原成 v（避免被当作普通 u）
  const decomposed = vForPrecomposed.normalize("NFD");
  const vForDecomposed = decomposed.replace(DECOMPOSED_UMLAUT_U, "v");
  // 移除组合声调标记（ā á ǎ à 等）
  const noTones = vForDecomposed.replace(COMBINING_DIACRITICS, "");
  // 仅保留字母（同时移除数字声调 1–5、空格、撇号等）
  return noTones.replace(/[^a-z]/g, "");
}
