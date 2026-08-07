import { describe, it, expect } from "vitest";

import {
  selectWeightedQuestion,
  generateQuestion,
} from "@/lib/shuangpin/generate-question";
import type {
  CharacterQuestion,
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
  const pool = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("等概率选取（weightFor 全为 1）", () => {
    const wf = () => 1;
    expect(selectWeightedQuestion(pool, wf, [], sequenceRandom([0]))?.id).toBe("a");
    expect(selectWeightedQuestion(pool, wf, [], sequenceRandom([0.5]))?.id).toBe("b");
    expect(selectWeightedQuestion(pool, wf, [], sequenceRandom([0.99]))?.id).toBe("c");
  });

  it("错题权重为普通题 3 倍", () => {
    const wf = (id: string) => (id === "b" ? 3 : 1);
    // weights [1,3,1], total 5；r 落在 [1,4) 命中 b
    expect(selectWeightedQuestion(pool, wf, [], sequenceRandom([0.3]))?.id).toBe("b");
    expect(selectWeightedQuestion(pool, wf, [], sequenceRandom([0.7]))?.id).toBe("b");
    expect(selectWeightedQuestion(pool, wf, [], sequenceRandom([0.05]))?.id).toBe("a");
  });

  it("excludeIds 实现连续去重", () => {
    expect(
      selectWeightedQuestion(pool, () => 1, ["a"], sequenceRandom([0]))?.id,
    ).toBe("b");
  });

  it("池子被全部排除时回退", () => {
    expect(
      selectWeightedQuestion([{ id: "a" }], () => 1, ["a"], sequenceRandom([0]))?.id,
    ).toBe("a");
  });

  it("空池返回 null", () => {
    expect(selectWeightedQuestion([], () => 1, [], sequenceRandom([0]))).toBeNull();
  });
});

describe("generateQuestion", () => {
  const baseOpts = {
    scheme: MOCK_SCHEME,
    characters,
    phrases,
    recentIds: [] as string[],
    weightFor: () => 1 as const,
    random: sequenceRandom([0]),
  };

  it("键位模式生成声母/韵母题目", () => {
    const r = generateQuestion({ ...baseOpts, mode: "mapping" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.question.kind).toBe("mapping");
    }
  });

  it("单字模式生成带拆解的题目", () => {
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
