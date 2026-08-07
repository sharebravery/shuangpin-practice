import { describe, it, expect } from "vitest";

import {
  selectWeightedQuestion,
  generateQuestion,
} from "@/lib/shuangpin/generate-question";
import type {
  CharacterQuestion,
  MistakeRecord,
  PhraseQuestion,
} from "@/lib/shuangpin/types";
import { MOCK_SCHEME, sequenceRandom } from "./mock-scheme";

const characters: CharacterQuestion[] = [
  { id: "c1", character: "窗", pinyin: "chuang" },
  { id: "c2", character: "你", pinyin: "ni" },
  { id: "c3", character: "好", pinyin: "hao" },
];

const phrases: PhraseQuestion[] = [
  { id: "p1", text: "你好", syllables: ["ni", "hao"] },
  { id: "p2", text: "爱人", syllables: ["ai", "ren"] },
];

describe("selectWeightedQuestion", () => {
  it("无错题时等概率选取", () => {
    const pool = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const mistakes: Record<string, MistakeRecord> = {};
    // random=0 -> 第一项；random=0.5 -> 第二项；random=0.99 -> 第三项
    expect(selectWeightedQuestion(pool, mistakes, [], sequenceRandom([0]), true)?.id).toBe("a");
    expect(selectWeightedQuestion(pool, mistakes, [], sequenceRandom([0.5]), true)?.id).toBe("b");
    expect(selectWeightedQuestion(pool, mistakes, [], sequenceRandom([0.99]), true)?.id).toBe("c");
  });

  it("错题权重随错误次数提高", () => {
    const pool = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const mistakes: Record<string, MistakeRecord> = {
      b: { count: 10, lastSeen: 0 },
    };
    // b 权重 11，总权重 13；r 落在 [1, 12) 命中 b
    expect(selectWeightedQuestion(pool, mistakes, [], sequenceRandom([0.5]), true)?.id).toBe("b");
    expect(selectWeightedQuestion(pool, mistakes, [], sequenceRandom([0.9]), true)?.id).toBe("b");
  });

  it("weighted=false 时不受错题影响", () => {
    const pool = [{ id: "a" }, { id: "b" }];
    const mistakes: Record<string, MistakeRecord> = {
      b: { count: 100, lastSeen: 0 },
    };
    // 关闭加权：candidates=[a,b]，random=0 -> a
    expect(selectWeightedQuestion(pool, mistakes, [], sequenceRandom([0]), false)?.id).toBe("a");
  });

  it("excludeIds 实现连续去重", () => {
    const pool = [{ id: "a" }, { id: "b" }];
    expect(selectWeightedQuestion(pool, {}, ["a"], sequenceRandom([0, 0.99]), false)?.id).toBe("b");
  });

  it("池子被全部排除时回退", () => {
    const pool = [{ id: "a" }];
    // 唯一候选被排除，回退后仍返回 a
    expect(selectWeightedQuestion(pool, {}, ["a"], sequenceRandom([0]), false)?.id).toBe("a");
  });

  it("空池返回 null", () => {
    expect(selectWeightedQuestion([], {}, [], sequenceRandom([0]), true)).toBeNull();
  });
});

describe("generateQuestion", () => {
  const baseOpts = {
    scheme: MOCK_SCHEME,
    characters,
    phrases,
    recentIds: [],
    mistakes: {} as Record<string, MistakeRecord>,
    mistakePriority: true,
  };

  it("键位模式生成声母/韵母题目", () => {
    const r = generateQuestion({ ...baseOpts, mode: "mapping", random: sequenceRandom([0]) });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.question.kind).toBe("mapping");
      const q = r.question as { display: string; answer: string; hint: string };
      expect(q.answer).toBe(MOCK_SCHEME.initials[q.display] ?? MOCK_SCHEME.finals[q.display]);
    }
  });

  it("单字模式生成带拆解的题目", () => {
    // 选中 c1（窗 chuang -> id）
    const r = generateQuestion({
      ...baseOpts,
      mode: "character",
      random: sequenceRandom([0]),
    });
    expect(r).toMatchObject({
      ok: true,
      id: "c1",
      question: {
        kind: "character",
        character: "窗",
        pinyin: "chuang",
        answer: "id",
        breakdown: { initial: "ch", final: "uang", initialKey: "i", finalKey: "d" },
      },
    });
  });

  it("词组模式拼接各字编码", () => {
    const r = generateQuestion({
      ...baseOpts,
      mode: "phrase",
      random: sequenceRandom([0]),
    });
    expect(r).toMatchObject({
      ok: true,
      id: "p1",
      question: {
        kind: "phrase",
        text: "你好",
        syllables: ["ni", "hao"],
        answer: "nihk",
        charCodes: ["ni", "hk"],
      },
    });
  });

  it("连续去重：排除最近题目", () => {
    const r = generateQuestion({
      ...baseOpts,
      mode: "character",
      recentIds: ["c1"],
      random: sequenceRandom([0]),
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.id).not.toBe("c1");
  });

  it("空题库返回错误", () => {
    const r = generateQuestion({
      ...baseOpts,
      mode: "character",
      characters: [],
      random: sequenceRandom([0]),
    });
    expect(r.ok).toBe(false);
  });
});
