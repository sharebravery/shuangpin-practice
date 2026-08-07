"use client";

import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { usePracticeStore } from "@/stores/practice-store";
import { calculateAccuracy } from "@/lib/shuangpin/statistics";
import { SITE } from "@/lib/site";

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

/**
 * 练习结果弹窗（PRD §10、实现细则 §11 completed 状态）。
 * 完成本组后展示统计，支持再练一组、练习错题、复制成绩、关闭继续。
 */
export function ResultDialog() {
  const status = usePracticeStore((s) => s.session.status);
  const completed = usePracticeStore((s) => s.session.completed);
  const correct = usePracticeStore((s) => s.session.correct);
  const longestStreak = usePracticeStore((s) => s.session.longestStreak);
  const mistakeCount = usePracticeStore((s) => s.session.sessionMistakes.length);
  const restart = usePracticeStore((s) => s.restart);
  const startMistakeSession = usePracticeStore((s) => s.startMistakeSession);

  const open = status === "completed";
  const accuracy = Math.round(calculateAccuracy(correct, completed) * 100);

  const copyResult = async () => {
    const text = `我在${SITE.name}完成了 ${completed} 题，正确率 ${accuracy}%，最长连击 ${longestStreak} 次。${SITE.url}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("成绩已复制到剪贴板");
    } catch {
      toast.error("复制失败，请手动选择文本");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        // 关闭（Esc / 点击遮罩 / X）即继续自由练习。
        if (!o) restart();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>本组完成 🎉</DialogTitle>
          <DialogDescription>继续练习，巩固双拼键位。</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <Stat label="完成题数" value={completed} />
          <Stat label="正确率" value={`${accuracy}%`} />
          <Stat label="最长连击" value={longestStreak} />
          <Stat label="本组错题" value={mistakeCount} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={copyResult}>
            复制成绩
          </Button>
          {mistakeCount > 0 && (
            <Button variant="outline" onClick={() => startMistakeSession()}>
              练习错题
            </Button>
          )}
          <Button onClick={() => restart()}>再练一组</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
