"use client";

import { usePracticeStore } from "@/stores/practice-store";
import { cn } from "@/lib/utils";

function Breakdown({
  breakdown,
  answer,
}: {
  breakdown: { initial: string; final: string; initialKey: string; finalKey: string };
  answer: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
      <span>
        正确编码：<span className="font-mono text-base font-semibold text-foreground">{answer}</span>
      </span>
      {breakdown.initial ? (
        <span className="font-mono text-xs">
          {breakdown.initial} → {breakdown.initialKey}　{breakdown.final} → {breakdown.finalKey}
        </span>
      ) : (
        <span className="font-mono text-xs">{breakdown.final} → {answer}</span>
      )}
    </div>
  );
}

export function PracticePrompt() {
  const question = usePracticeStore((s) => s.session.question);
  const status = usePracticeStore((s) => s.session.status);
  const phraseIndex = usePracticeStore((s) => s.session.phraseIndex);
  const feedback = usePracticeStore((s) => s.session.feedback);
  const showPinyin = usePracticeStore((s) => s.settings.showPinyin);

  if (status === "ready" || !question) {
    return <div className="py-8 text-sm text-muted-foreground">准备开始练习…</div>;
  }

  if (status === "paused") {
    return (
      <div className="py-8 text-center">
        <p className="text-lg font-medium">已暂停</p>
        <p className="mt-1 text-xs text-muted-foreground">按 Space 继续</p>
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className="py-8 text-center">
        <p className="text-lg font-medium">本组完成 🎉</p>
      </div>
    );
  }

  const wrong = status === "wrong";
  const correctFeedback = feedback === "correct";

  return (
    <div className="flex flex-col items-center gap-2">
      {question.kind === "mapping" && (
        <>
          <span className="text-xs text-muted-foreground">{question.hint}</span>
          <span className="font-mono text-5xl font-bold tracking-tight">
            {question.display}
          </span>
        </>
      )}

      {question.kind === "character" && (
        <>
          <span className="text-6xl font-bold leading-none sm:text-7xl">
            {question.character}
          </span>
          {showPinyin && !wrong && (
            <span className="text-base text-muted-foreground">{question.pinyin}</span>
          )}
        </>
      )}

      {question.kind === "phrase" && (
        <div className="flex flex-col items-center gap-1">
          <span className="text-4xl font-bold leading-none tracking-wide sm:text-5xl">
            {[...question.text].map((ch, i) => (
              <span
                key={i}
                className={cn(
                  "transition-colors",
                  i === phraseIndex && "rounded px-1",
                  i === phraseIndex && (wrong ? "bg-destructive/15 text-destructive" : "bg-primary/10"),
                  i < phraseIndex && "text-muted-foreground/40",
                )}
              >
                {ch}
              </span>
            ))}
          </span>
          {showPinyin && !wrong && (
            <span className="text-xs text-muted-foreground">
              {question.syllables[phraseIndex]}
            </span>
          )}
        </div>
      )}

      {/* 反馈区 */}
      {wrong && (
        <div className="flex flex-col items-center gap-1 pt-2">
          {question.kind === "character" && (
            <Breakdown breakdown={question.breakdown} answer={question.answer} />
          )}
          {question.kind === "phrase" && (
            <span className="text-sm text-muted-foreground">
              正确编码：<span className="font-mono text-base font-semibold text-foreground">{question.charCodes[phraseIndex]}</span>
            </span>
          )}
          {question.kind === "mapping" && (
            <span className="text-sm text-muted-foreground">
              正确键位：<span className="font-mono text-base font-semibold text-foreground">{question.answer}</span>
            </span>
          )}
        </div>
      )}

      {correctFeedback && (
        <span className="pt-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">正确</span>
      )}
    </div>
  );
}
