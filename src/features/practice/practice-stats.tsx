"use client";

import { usePracticeStore } from "@/stores/practice-store";
import { calculateAccuracy } from "@/lib/shuangpin/statistics";

export function PracticeStats() {
  const completed = usePracticeStore((s) => s.totals.completed);
  const correct = usePracticeStore((s) => s.totals.correct);
  const streak = usePracticeStore((s) => s.session.streak);

  const accuracy = Math.round(calculateAccuracy(correct, completed) * 100);

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground sm:gap-3 sm:text-sm">
      <span>
        正确率 <span className="font-semibold tabular-nums text-foreground">{accuracy}%</span>
      </span>
      <span className="text-border">·</span>
      <span>
        已练 <span className="font-semibold tabular-nums text-foreground">{completed}</span>
      </span>
      <span className="text-border">·</span>
      <span>
        连击 <span className="font-semibold tabular-nums text-[var(--brand)]">{streak}</span>
      </span>
    </div>
  );
}
