"use client";

import { usePracticeStore } from "@/stores/practice-store";
import { cn } from "@/lib/utils";

export function PracticePrompt() {
  const question = usePracticeStore((s) => s.session.question);
  const status = usePracticeStore((s) => s.session.status);
  const phraseIndex = usePracticeStore((s) => s.session.phraseIndex);
  const showPinyin = usePracticeStore((s) => s.settings.showPinyin);

  if (status === "ready" || !question) {
    return (
      <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
        准备开始…
      </div>
    );
  }

  if (status === "paused") {
    return (
      <div className="flex h-24 flex-col items-center justify-center text-center">
        <p className="text-lg font-medium">已暂停</p>
        <p className="mt-1 text-xs text-muted-foreground">按 Space 继续</p>
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className="flex h-24 items-center justify-center text-center">
        <p className="text-lg font-medium">本组完成 🎉</p>
      </div>
    );
  }

  const wrong = status === "wrong";

  return (
    <div className="flex h-24 w-full flex-col items-center justify-center">
      {question.kind === "mapping" && (
        <>
          <span className="h-4 text-[0.65rem] uppercase tracking-widest text-muted-foreground">
            {question.hint}
          </span>
          <span className="mt-1 font-mono text-5xl font-bold tracking-tight sm:text-6xl">
            {question.display}
          </span>
        </>
      )}

      {question.kind === "character" && (
        <>
          <span className="text-6xl font-bold leading-none sm:text-7xl">
            {question.character}
          </span>
          <span
            className={cn(
              "mt-2 h-5 text-sm text-muted-foreground",
              (!showPinyin || wrong) && "invisible",
            )}
          >
            {question.pinyin}
          </span>
        </>
      )}

      {question.kind === "phrase" && (
        <div className="flex h-full flex-col items-center justify-center">
          <span className="text-4xl font-bold leading-none tracking-wide sm:text-5xl">
            {[...question.text].map((ch, i) => (
              <span
                key={i}
                className={cn(
                  "transition-colors",
                  i === phraseIndex && "rounded px-0.5",
                  i === phraseIndex &&
                    (wrong
                      ? "bg-[var(--error-soft)] text-[var(--error)]"
                      : "bg-[var(--brand-soft)]"),
                  i < phraseIndex && "text-muted-foreground/35",
                )}
              >
                {ch}
              </span>
            ))}
          </span>
          <span
            className={cn(
              "mt-2 h-5 text-xs text-muted-foreground",
              (!showPinyin || wrong) && "invisible",
            )}
          >
            {question.syllables[phraseIndex]}
          </span>
        </div>
      )}
    </div>
  );
}
