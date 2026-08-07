/**
 * 统计计算（对应架构文档第 7 节 calculateAccuracy）。
 * 纯函数，不依赖任何运行时状态。
 */

/**
 * 计算正确率，返回 0..1 的小数（未做题返回 0）。
 * UI 层可自行格式化为百分比。
 */
export function calculateAccuracy(correct: number, completed: number): number {
  if (completed <= 0) return 0;
  if (correct < 0) correct = 0;
  if (correct > completed) correct = completed;
  return correct / completed;
}

/**
 * 从一段「每题对错」的布尔序列中计算最长连续正确数。
 * 用于结果弹窗展示「最长连续正确」。
 */
export function calculateLongestStreak(results: boolean[]): number {
  let longest = 0;
  let current = 0;
  for (const ok of results) {
    if (ok) {
      current += 1;
      if (current > longest) longest = current;
    } else {
      current = 0;
    }
  }
  return longest;
}
