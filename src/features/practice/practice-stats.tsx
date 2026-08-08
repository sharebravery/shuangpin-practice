"use client";

import { usePracticeStore } from "@/stores/practice-store";
import { calculateAccuracy } from "@/lib/shuangpin/statistics";

export function PracticeStats() {
  const completed = usePracticeStore((s) => s.session.completed);
  const correct = usePracticeStore((s) => s.session.correct);
  const total = usePracticeStore((s) => s.session.total);
  const streak = usePracticeStore((s) => s.session.streak);

  const accuracy = Math.round(calculateAccuracy(correct, completed) * 100);

  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      <span>正确率 <span className="font-semibold text-foreground tabular-nums">{accuracy}%</span></span>
      <span className="text-border">·</span>
      <span>进度 <span className="font-semibold text-foreground tabular-nums">{completed}</span>/{total}</span>
      <span className="text-border">·</span>
      <span>连击 <span className="font-semibold text-foreground tabular-nums">{streak}</span></span>
    </div>
  );
}
