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
    <div className="flex flex-col items-center gap-0.5 text-sm text-muted-foreground">
      <span>
        <span className="font-mono text-base font-semibold text-[var(--vermilion)]">{answer}</span>
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
    return <div className="py-4 text-sm text-muted-foreground">准备开始…</div>;
  }

  if (status === "paused") {
    return (
      <div className="py-4 text-center">
        <p className="text-lg font-medium">已暂停</p>
        <p className="mt-0.5 text-xs text-muted-foreground">按 Space 继续</p>
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className="py-4 text-center">
        <p className="text-lg font-medium">本组完成 🎉</p>
      </div>
    );
  }

  const wrong = status === "wrong";
  const correctFeedback = feedback === "correct";

  return (
    <div className="flex flex-col items-center gap-1">
      {question.kind === "mapping" && (
        <>
          <span className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">
            {question.hint}
          </span>
          <span className="font-mono text-4xl font-bold tracking-tight sm:text-5xl">
            {question.display}
          </span>
        </>
      )}

      {question.kind === "character" && (
        <>
          <span className="text-5xl font-bold leading-none sm:text-6xl">
            {question.character}
          </span>
          {showPinyin && !wrong && (
            <span className="text-sm text-muted-foreground">{question.pinyin}</span>
          )}
        </>
      )}

      {question.kind === "phrase" && (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-3xl font-bold leading-none tracking-wide sm:text-4xl">
            {[...question.text].map((ch, i) => (
              <span
                key={i}
                className={cn(
                  "transition-colors",
                  i === phraseIndex && "rounded px-0.5",
                  i === phraseIndex && (wrong ? "bg-[var(--vermilion)]/15 text-[var(--vermilion)]" : "bg-[var(--vermilion)]/8"),
                  i < phraseIndex && "text-muted-foreground/35",
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

      {wrong && (
        <div className="flex flex-col items-center gap-0.5 pt-1">
          {question.kind === "character" && (
            <Breakdown breakdown={question.breakdown} answer={question.answer} />
          )}
          {question.kind === "phrase" && (
            <span className="text-sm text-muted-foreground">
              <span className="font-mono text-base font-semibold text-[var(--vermilion)]">{question.charCodes[phraseIndex]}</span>
            </span>
          )}
          {question.kind === "mapping" && (
            <span className="text-sm text-muted-foreground">
              <span className="font-mono text-base font-semibold text-[var(--vermilion)]">{question.answer}</span>
            </span>
          )}
        </div>
      )}

      {correctFeedback && (
        <span className="pt-0.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">正确</span>
      )}
    </div>
  );
}
