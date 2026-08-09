"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { calculateAccuracy } from "@/lib/shuangpin/statistics";
import { SITE } from "@/lib/site";
import { usePracticeStore } from "@/stores/practice-store";

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center gap-1 px-3 py-4 sm:px-5">
      <span className="text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">
        {value}
      </span>
      <span className="text-[0.7rem] text-muted-foreground">{label}</span>
    </div>
  );
}

/**
 * 一组完成后的内联结算面板。
 * 不使用模态层，不遮挡页面；Enter 仍由 PracticeWorkspace 直接开始下一组。
 */
export function ResultDialog() {
  const status = usePracticeStore((s) => s.session.status);
  const completed = usePracticeStore((s) => s.session.completed);
  const correct = usePracticeStore((s) => s.session.correct);
  const longestStreak = usePracticeStore((s) => s.session.longestStreak);
  const mistakeCount = usePracticeStore((s) => s.session.sessionMistakes.length);
  const restart = usePracticeStore((s) => s.restart);
  const startMistakeSession = usePracticeStore((s) => s.startMistakeSession);

  if (status !== "completed") return null;

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
    <section
      data-result-panel
      aria-label="本组练习结果"
      className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 text-center"
    >
      <span
        aria-hidden="true"
        className="mb-5 size-2 rounded-full bg-[var(--brand)] shadow-[0_0_18px_color-mix(in_srgb,var(--brand)_36%,transparent)]"
      />
      <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.7rem]">本组完成</h2>
      <p className="mt-2 text-sm text-muted-foreground">保持手感，按 Enter 继续下一组</p>

      <div className="mt-7 grid w-full grid-cols-2 border-y border-border/70 sm:grid-cols-4 sm:divide-x sm:divide-border/70">
        <Stat label="完成题数" value={completed} />
        <Stat label="正确率" value={`${accuracy}%`} />
        <Stat label="最长连击" value={longestStreak} />
        <Stat label="本组错题" value={mistakeCount} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button variant="ghost" size="sm" onClick={copyResult}>
          复制成绩
        </Button>
        {mistakeCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => startMistakeSession()}>
            练习错题
          </Button>
        )}
        <Button size="sm" className="min-w-28" onClick={() => restart()}>
          继续下一组
          <span className="ml-1 text-[0.68rem] opacity-70">↵</span>
        </Button>
      </div>
    </section>
  );
}
