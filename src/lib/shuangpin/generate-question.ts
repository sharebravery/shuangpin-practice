/**
 * 出题逻辑（对应架构文档第 7 节 generateQuestion / selectWeightedQuestion）。
 *
 * - 纯函数，不依赖 React / Zustand / DOM。
 * - 允许注入随机函数与权重函数，便于测试。
 * - 支持连续去重（excludeIds）。
 * - 权重由调用方通过 weightFor 提供（错题优先时错题为普通题 3 倍，非无限增长）。
 */

import type {
  CharacterQuestion,
  PhraseQuestion,
  PracticeMode,
  ShuangpinScheme,
} from "./types";
import { encodePhrase, encodeSyllableDetailed } from "./encode";

/** 键位练习题目。 */
export interface MappingQuestion {
  kind: "mapping";
  /** 显示的声母或韵母，如 "uang"。 */
  display: string;
  /** 对应键位，如 "d"。 */
  answer: string;
  /** 提示：声母 / 韵母。 */
  hint: string;
  /** 可接受答案（键位练习无兼容码，即为 [answer]）。 */
  accepted: string[];
}

/** 单字练习题目（含编码拆解，供错误时展示）。 */
export interface CharacterGeneratedQuestion {
  kind: "character";
  character: string;
  pinyin: string;
  answer: string;
  /** 可接受答案（含标准答案与方案兼容码）。 */
  accepted: string[];
  breakdown: { initial: string; final: string; initialKey: string; finalKey: string };
}

/** 词组练习题目。 */
export interface PhraseGeneratedQuestion {
  kind: "phrase";
  text: string;
  syllables: string[];
  /** 各字标准编码（逐字输入）。 */
  charCodes: string[];
  /** 各字可接受答案（逐字校验，含兼容码）。 */
  charAccepted: string[][];
  /** 拼接标准答案（统计/展示用）。 */
  answer: string;
}

export type GeneratedQuestion =
  | MappingQuestion
  | CharacterGeneratedQuestion
  | PhraseGeneratedQuestion;

export interface GenerateOptions {
  scheme: ShuangpinScheme;
  mode: PracticeMode;
  characters: CharacterQuestion[];
  phrases: PhraseQuestion[];
  /** 最近若干题的 id，用于连续去重（同一题不会连续出现）。 */
  recentIds: string[];
  /** 权重函数：返回该题权重（>=1）。错题优先时错题返回 3，普通题返回 1。 */
  weightFor: (id: string) => number;
  /** 注入的随机函数，返回 [0,1)。 */
  random: () => number;
}

export type GenerateResult =
  | { ok: true; question: GeneratedQuestion; id: string }
  | { ok: false; reason: string };

interface PoolItem {
  id: string;
  display: string;
  answer: string;
  hint: string;
}

/** 由方案生成键位练习候选池（声母 + 韵母）。 */
function buildMappingPool(scheme: ShuangpinScheme): PoolItem[] {
  const items: PoolItem[] = [];
  for (const [initial, key] of Object.entries(scheme.initials)) {
    items.push({ id: `i:${initial}`, display: initial, answer: key, hint: "声母" });
  }
  for (const [final, key] of Object.entries(scheme.finals)) {
    items.push({ id: `f:${final}`, display: final, answer: key, hint: "韵母" });
  }
  return items;
}

/**
 * 从候选池中按权重选取一题。
 * - excludeIds 中的题目会被跳过（连续去重）。
 * - 权重由 weightFor 提供（>=1）；全部为 1 时即等概率。
 * - 池子过小导致全部被排除时，退回到「排除最后一个」或整池。
 */
export function selectWeightedQuestion<T extends { id: string }>(
  pool: T[],
  weightFor: (id: string) => number,
  excludeIds: string[],
  random: () => number,
): T | null {
  if (pool.length === 0) return null;

  const exclude = new Set(excludeIds);
  let candidates = pool.filter((q) => !exclude.has(q.id));
  if (candidates.length === 0) {
    const last = excludeIds[excludeIds.length - 1];
    candidates = last ? pool.filter((q) => q.id !== last) : pool.slice();
    if (candidates.length === 0) candidates = pool.slice();
  }

  const weights = candidates.map((q) => Math.max(1, weightFor(q.id) ?? 1));
  const total = weights.reduce((sum, w) => sum + w, 0);
  let r = random() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return candidates[i]!;
  }
  return candidates[candidates.length - 1]!;
}

/** 生成下一道题目（随机选取，不含强制重现逻辑）。 */
export function generateQuestion(options: GenerateOptions): GenerateResult {
  const { scheme, mode, characters, phrases, recentIds, weightFor, random } = options;

  if (mode === "mapping") {
    const pool = buildMappingPool(scheme);
    const selected = selectWeightedQuestion(pool, weightFor, recentIds, random);
    if (!selected) return { ok: false, reason: "无可用的键位题目" };
    return {
      ok: true,
      id: selected.id,
      question: {
        kind: "mapping",
        display: selected.display,
        answer: selected.answer,
        hint: selected.hint,
        accepted: [selected.answer],
      },
    };
  }

  if (mode === "character") {
    const selected = selectWeightedQuestion(characters, weightFor, recentIds, random);
    if (!selected) return { ok: false, reason: "无可用的单字" };
    const enc = encodeSyllableDetailed(selected.pinyin, scheme);
    if (!enc.ok) return { ok: false, reason: `${selected.pinyin}: ${enc.reason}` };
    return {
      ok: true,
      id: selected.id,
      question: {
        kind: "character",
        character: selected.character,
        pinyin: selected.pinyin,
        answer: enc.code,
        accepted: enc.accepted,
        breakdown: {
          initial: enc.initial,
          final: enc.final,
          initialKey: enc.initialKey,
          finalKey: enc.finalKey,
        },
      },
    };
  }

  // phrase
  const selected = selectWeightedQuestion(phrases, weightFor, recentIds, random);
  if (!selected) return { ok: false, reason: "无可用的词组" };
  const enc = encodePhrase(selected.syllables, scheme);
  if (!enc.ok) return { ok: false, reason: enc.reason };
  return {
    ok: true,
    id: selected.id,
    question: {
      kind: "phrase",
      text: selected.text,
      syllables: selected.syllables,
      charCodes: enc.charCodes,
      charAccepted: enc.charAccepted,
      answer: enc.code,
    },
  };
}
