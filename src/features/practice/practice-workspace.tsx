"use client";

import { useEffect, useRef, useState } from "react";

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
 * 处理自动聚焦、点击聚焦与练习级键盘交互。
 *
 * 练习级快捷键（Enter/Space/Escape）通过 window 全局监听处理，
 * 这样在 wrong / paused / 正确反馈状态下（输入框被禁用）仍可触发。
 */
export function PracticeWorkspace() {
  const question = usePracticeStore((s) => s.session.question);
  const phraseIndex = usePracticeStore((s) => s.session.phraseIndex);
  const questionId = usePracticeStore((s) => s.session.questionId);
  const status = usePracticeStore((s) => s.session.status);
  const feedback = usePracticeStore((s) => s.session.feedback);
  const hasHydrated = usePracticeStore((s) => s.hasHydrated);
  const showKeyboard = usePracticeStore((s) => s.settings.showKeyboard);
  const startSession = usePracticeStore((s) => s.startSession);
  const submit = usePracticeStore((s) => s.submit);

  const [input, setInput] = useState("");
  const [lastInput, setLastInput] = useState("");
  const inputRef = useRef(input);
  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  // hydration 完成后若仍为 ready，则开始会话（使用已恢复的设置）。
  useEffect(() => {
    if (hasHydrated && usePracticeStore.getState().session.status === "ready") {
      startSession();
    }
  }, [hasHydrated, startSession]);

  // 题目/字索引/状态/反馈变化时清空输入（渲染期调整 state，避免 effect 内 setState）。
  const resetKey = `${questionId}:${phraseIndex}:${status}:${feedback}`;
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  if (lastResetKey !== resetKey) {
    setLastResetKey(resetKey);
    setInput("");
    setLastInput("");
  }

  // 变化后重新聚焦：答题中聚焦输入框，否则聚焦操作按钮（下一题/继续），
  // 使 Enter/Space 在禁用输入框状态下仍可由按钮原生触发。
  useEffect(() => {
    if (status === "answering" && feedback === "none") {
      focusPracticeInput();
    } else {
      document.getElementById("practice-action")?.focus();
    }
  }, [resetKey, status, feedback]);

  // 练习级全局键盘监听（Enter/Space/Escape）。
  useEffect(() => {
    const inOverlay = (el: HTMLElement | null) =>
      !!el?.closest(
        "[data-slot='select-trigger'],[data-slot='select-content'],[data-slot='popover-content'],[data-slot='drawer-popup'],[role='dialog'],[role='option']",
      );
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      // 覆盖层（Select/Popover/Drawer/Dialog）内交由它们自己处理。
      if (inOverlay(target)) return;
      const { session, next, pause, resume } = usePracticeStore.getState();
      const curInput = inputRef.current;

      if (e.key === "Enter") {
        // Button/链接自身的 Enter 激活不重复处理。
        if (target?.closest("button, a")) return;
        if (session.status === "wrong" || session.feedback === "correct" || session.status === "completed") {
          e.preventDefault();
          next();
        }
        return;
      }
      if (e.key === " ") {
        if (target?.closest("button, a")) return;
        if (session.status === "answering" && session.feedback === "none") {
          e.preventDefault();
          if (curInput === "") pause();
        } else if (session.status === "paused") {
          e.preventDefault();
          resume();
        }
        return;
      }
      if (e.key === "Escape") {
        if (session.status === "answering" && session.feedback === "none" && curInput !== "") {
          e.preventDefault();
          setInput("");
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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
