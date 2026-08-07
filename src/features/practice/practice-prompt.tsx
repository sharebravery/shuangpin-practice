"use client";

import { usePracticeStore } from "@/stores/practice-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** 单字错误拆解：ch -> i, uang -> d。 */
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
        正确编码：<span className="font-mono text-foreground">{answer}</span>
      </span>
      {breakdown.initial ? (
        <span className="font-mono">
          {breakdown.initial} -&gt; {breakdown.initialKey}　{breakdown.final} -&gt;{" "}
          {breakdown.finalKey}
        </span>
      ) : (
        <span className="font-mono">
          {breakdown.final} -&gt; {answer}
        </span>
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
  const next = usePracticeStore((s) => s.next);
  const resume = usePracticeStore((s) => s.resume);

  if (status === "ready" || !question) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        准备开始练习…
      </div>
    );
  }

  if (status === "paused") {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <p className="text-lg font-medium">已暂停</p>
        <Button onClick={() => resume()}>继续</Button>
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className="py-12 text-center">
        <p className="text-lg font-medium">本组完成 🎉</p>
        <p className="mt-1 text-sm text-muted-foreground">结果见弹窗</p>
      </div>
    );
  }

  const wrong = status === "wrong";
  const correctFeedback = feedback === "correct";

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      {question.kind === "mapping" && (
        <>
          <span className="text-xs text-muted-foreground">{question.hint}</span>
          <span className="font-mono text-5xl font-semibold tracking-tight">
            {question.display}
          </span>
        </>
      )}

      {question.kind === "character" && (
        <>
          <span className="text-6xl font-semibold leading-none">
            {question.character}
          </span>
          {showPinyin && (
            <span className="text-lg text-muted-foreground">{question.pinyin}</span>
          )}
        </>
      )}

      {question.kind === "phrase" && (
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl font-semibold leading-none tracking-wide">
            {[...question.text].map((ch, i) => (
              <span
                key={i}
                className={cn(
                  i === phraseIndex && "rounded px-0.5",
                  i === phraseIndex && (wrong ? "bg-destructive/15 text-destructive" : "bg-primary/10"),
                  i < phraseIndex && "text-muted-foreground/50"
                )}
              >
                {ch}
              </span>
            ))}
          </span>
          {showPinyin && (
            <span className="text-sm text-muted-foreground">
              {question.syllables[phraseIndex]}
            </span>
          )}
        </div>
      )}

      {/* 反馈区 */}
      {wrong && (
        <div className="flex flex-col items-center gap-3">
          {question.kind === "character" && (
            <Breakdown breakdown={question.breakdown} answer={question.answer} />
          )}
          {question.kind === "phrase" && (
            <span className="text-sm text-muted-foreground">
              正确编码：
              <span className="font-mono text-foreground">
                {question.charCodes[phraseIndex]}
              </span>
            </span>
          )}
          {question.kind === "mapping" && (
            <span className="text-sm text-muted-foreground">
              正确键位：
              <span className="font-mono text-foreground">{question.answer}</span>
            </span>
          )}
          <Button onClick={() => next()}>下一题</Button>
        </div>
      )}

      {!wrong && correctFeedback && (
        <div className="flex flex-col items-center gap-3">
          <span className="text-sm font-medium text-primary">正确</span>
          <Button onClick={() => next()}>下一题</Button>
        </div>
      )}
    </div>
  );
}
