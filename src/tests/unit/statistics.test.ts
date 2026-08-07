import { describe, it, expect } from "vitest";

import {
  calculateAccuracy,
  calculateLongestStreak,
} from "@/lib/shuangpin/statistics";

describe("calculateAccuracy", () => {
  it("返回 0..1 的正确率", () => {
    expect(calculateAccuracy(8, 10)).toBeCloseTo(0.8);
    expect(calculateAccuracy(0, 10)).toBe(0);
    expect(calculateAccuracy(10, 10)).toBe(1);
  });
  it("未做题返回 0", () => {
    expect(calculateAccuracy(0, 0)).toBe(0);
  });
  it("correct 超过 completed 时钳制", () => {
    expect(calculateAccuracy(15, 10)).toBe(1);
  });
});

describe("calculateLongestStreak", () => {
  it("计算最长连续正确", () => {
    expect(calculateLongestStreak([true, true, false, true, true, true])).toBe(3);
    expect(calculateLongestStreak([true, true])).toBe(2);
  });
  it("空数组返回 0", () => {
    expect(calculateLongestStreak([])).toBe(0);
  });
  it("全错返回 0", () => {
    expect(calculateLongestStreak([false, false])).toBe(0);
  });
});
