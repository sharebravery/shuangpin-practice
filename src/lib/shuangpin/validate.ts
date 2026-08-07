/**
 * 答案校验（对应架构文档第 7 节 validateAnswer）。
 *
 * - 默认不区分大小写。
 * - 忽略首尾空白。
 * - 仅保留 a-z 与分号（小鹤双拼的 ing 韵母使用 `;` 键，其余方案均为字母）。
 */

import { normalizePinyin } from "./normalize-pinyin";

/** 将用户输入或标准答案归一化为可比较形式。 */
export function normalizeAnswer(input: string): string {
  if (!input) return "";
  return input.toLowerCase().trim().replace(/[^a-z;]/g, "");
}

/** 判断输入是否等于预期答案（不区分大小写）。 */
export function validateAnswer(input: string, expected: string): boolean {
  return normalizeAnswer(input) === normalizeAnswer(expected);
}

/** 判断输入是否匹配任意一个可接受答案（用于方案兼容，如微软 ve 接受 v）。 */
export function isAcceptedAnswer(input: string, accepted: string[]): boolean {
  const norm = normalizeAnswer(input);
  return accepted.some((a) => normalizeAnswer(a) === norm);
}

/**
 * 校验输入长度是否达到预期答案长度。
 * 用于「达到答案长度后自动判断」的交互。
 */
export function isAnswerComplete(input: string, expected: string): boolean {
  return normalizeAnswer(input).length >= normalizeAnswer(expected).length;
}

/** 拼音归一化（复用，便于 UI 展示统一）。 */
export { normalizePinyin };
