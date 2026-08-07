"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

import { usePracticeStore } from "@/stores/practice-store";
import { calculateAccuracy } from "@/lib/shuangpin/statistics";

export function PracticeStats() {
  const completed = usePracticeStore((s) => s.session.completed);
  const correct = usePracticeStore((s) => s.session.correct);
  const total = usePracticeStore((s) => s.session.total);
  const streak = usePracticeStore((s) => s.session.streak);

  const accuracy = Math.round(calculateAccuracy(correct, completed) * 100);
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-2">
      <Progress value={progress} aria-label="练习进度" />
      <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
        <span>
          正确率 <span className="font-semibold text-foreground">{accuracy}%</span>
        </span>
        <span>
          进度 <span className="font-semibold text-foreground">{completed}/{total}</span>
        </span>
        <Badge variant={streak >= 5 ? "default" : "secondary"}>连击 {streak}</Badge>
      </div>
    </div>
  );
}
