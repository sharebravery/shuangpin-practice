"use client";

import { useEffect, useState } from "react";

import { usePracticeStore } from "@/stores/practice-store";
import { PracticeToolbar } from "./practice-toolbar";
import { PracticePrompt } from "./practice-prompt";
import { PracticeInput, focusPracticeInput } from "./practice-input";
import { PracticeStats } from "./practice-stats";
import { KeyboardMap } from "./keyboard-map";
import { ResultDialog } from "./result-dialog";

/**
 * 练习工作区（Client Component）。
 * 持有输入框本地状态，串联 Toolbar / Prompt / Input / Stats / KeyboardMap，
 * 处理自动聚焦、点击聚焦与键盘交互。
 */
export function PracticeWorkspace() {
  const status = usePracticeStore((s) => s.session.status);
  const feedback = usePracticeStore((s) => s.session.feedback);
  const question = usePracticeStore((s) => s.session.question);
  const phraseIndex = usePracticeStore((s) => s.session.phraseIndex);
  const questionId = usePracticeStore((s) => s.session.questionId);
  const hasHydrated = usePracticeStore((s) => s.hasHydrated);
  const showKeyboard = usePracticeStore((s) => s.settings.showKeyboard);
  const startSession = usePracticeStore((s) => s.startSession);
  const submit = usePracticeStore((s) => s.submit);
  const next = usePracticeStore((s) => s.next);
  const pause = usePracticeStore((s) => s.pause);
  const resume = usePracticeStore((s) => s.resume);

  const [input, setInput] = useState("");
  const [lastInput, setLastInput] = useState("");

  // hydration 完成后若仍为 ready，则开始会话（使用已恢复的设置）。
  useEffect(() => {
    if (hasHydrated && usePracticeStore.getState().session.status === "ready") {
      startSession();
    }
  }, [hasHydrated, startSession]);

  // 题目/字索引/状态变化时清空输入（渲染期调整 state，避免 effect 内 setState）。
  const resetKey = `${questionId}:${phraseIndex}:${status}`;
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  if (lastResetKey !== resetKey) {
    setLastResetKey(resetKey);
    setInput("");
    setLastInput("");
  }

  // 变化后重新聚焦（仅 DOM 副作用，不涉及 setState）。
  useEffect(() => {
    focusPracticeInput();
  }, [resetKey]);

  const expectedLength = question?.kind === "mapping" ? 1 : 2;
  const inputDisabled = status !== "answering" || feedback !== "none";

  // 键位图高亮键。
  const answerStr =
    question?.kind === "phrase"
      ? question.charCodes[phraseIndex] ?? ""
      : question?.answer ?? "";
  const answerChars = answerStr.split("");
  let pressedKeys: string[] = [];
  let correctKeys: string[] = [];
  let errorKeys: string[] = [];
  if (status === "answering" && feedback === "none") {
    pressedKeys = input.split("");
  } else if (status === "wrong") {
    correctKeys = answerChars;
    errorKeys = lastInput.split("");
  } else if (feedback === "correct") {
    correctKeys = answerChars;
  }

  return (
    <div className="flex flex-col gap-6">
      <PracticeToolbar />
      <section
        className="flex flex-col gap-6"
        onClick={() => focusPracticeInput()}
      >
        <PracticePrompt />
        <PracticeInput
          value={input}
          expectedLength={expectedLength}
          disabled={inputDisabled}
          onChange={setInput}
          onSubmit={(v) => {
            setLastInput(v);
            submit(v);
            setInput("");
          }}
          onEnter={() => next()}
          onEsc={() => setInput("")}
          onSpace={() => {
            if (status === "answering") pause();
            else if (status === "paused") resume();
          }}
        />
      </section>
      <PracticeStats />
      {showKeyboard && (
        <KeyboardMap
          pressedKeys={pressedKeys}
          correctKeys={correctKeys}
          errorKeys={errorKeys}
        />
      )}
      <ResultDialog />
    </div>
  );
}
