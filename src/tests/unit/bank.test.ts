import { describe, it, expect } from "vitest";

import { CHARACTERS } from "@/data/characters";
import { PHRASES } from "@/data/phrases";

describe("单字题库完整性", () => {
  it("数量为 200", () => {
    expect(CHARACTERS).toHaveLength(200);
  });

  it("无重复 ID", () => {
    const ids = CHARACTERS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("无重复字符", () => {
    const chars = CHARACTERS.map((c) => c.character);
    expect(new Set(chars).size).toBe(chars.length);
  });

  it("无空拼音与空字符", () => {
    for (const c of CHARACTERS) {
      expect(c.pinyin.length).toBeGreaterThan(0);
      expect(c.character.length).toBeGreaterThan(0);
    }
  });
});

describe("词组题库完整性", () => {
  it("数量为 50", () => {
    expect(PHRASES).toHaveLength(50);
  });

  it("无重复 ID", () => {
    const ids = PHRASES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("字数与拼音数一致", () => {
    for (const p of PHRASES) {
      expect([...p.text].length).toBe(p.syllables.length);
    }
  });

  it("无空拼音", () => {
    for (const p of PHRASES) {
      for (const syl of p.syllables) {
        expect(syl.length).toBeGreaterThan(0);
      }
    }
  });
});
