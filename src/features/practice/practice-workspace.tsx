"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { usePracticeStore } from "@/stores/practice-store";
import { PracticeToolbar } from "./practice-toolbar";
import { PracticePrompt } from "./practice-prompt";
import { PracticeInput, focusPracticeInput } from "./practice-input";
import { PracticeStats } from "./practice-stats";
import { KeyboardMap } from "./keyboard-map";
import { ResultDialog } from "./result-dialog";

const WRONG_AUTO_ADVANCE_MS = 800;
const CORRECT_FEEDBACK_MS = 400;

function cleanKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z;]/g, "");
}

export function PracticeWorkspace() {
  const question = usePracticeStore((s) => s.session.question);
  const phraseIndex = usePracticeStore((s) => s.session.phraseIndex);
  const questionId = usePracticeStore((s) => s.session.questionId);
  const status = usePracticeStore((s) => s.session.status);
  const feedback = usePracticeStore((s) => s.session.feedback);
  const hasHydrated = usePracticeStore((s) => s.hasHydrated);
  const startSession = usePracticeStore((s) => s.startSession);
  const submit = usePracticeStore((s) => s.submit);
  const next = usePracticeStore((s) => s.next);

  const [input, setInput] = useState("");
  const [lastInput, setLastInput] = useState("");
  const inputRef = useRef(input);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  // hydration 后开始会话
  useEffect(() => {
    if (hasHydrated && usePracticeStore.getState().session.status === "ready") {
      startSession();
    }
  }, [hasHydrated, startSession]);

  // 新题目/新字时清空输入
  const questionResetKey = `${questionId}:${phraseIndex}`;
  const [lastResetKey, setLastResetKey] = useState(questionResetKey);
  if (lastResetKey !== questionResetKey) {
    setLastResetKey(questionResetKey);
    setInput("");
    setLastInput("");
  }

  // 聚焦：答题中聚焦输入框，否则聚焦 body
  useEffect(() => {
    if (status === "answering" && feedback === "none") {
      focusPracticeInput();
    } else if (typeof document !== "undefined") {
      document.body.focus();
    }
  }, [questionResetKey, status, feedback]);

  // 自动继续：wrong 800ms / correct 400ms 后自动进入下一题
  useEffect(() => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
    if (status === "wrong") {
      autoAdvanceRef.current = setTimeout(() => next(), WRONG_AUTO_ADVANCE_MS);
    } else if (feedback === "correct") {
      autoAdvanceRef.current = setTimeout(() => next(), CORRECT_FEEDBACK_MS);
    }
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, [status, feedback, questionResetKey, next]);

  // 全局键盘监听
  useEffect(() => {
    const inOverlay = (el: HTMLElement | null) =>
      !!el?.closest(
        "[data-slot='select-trigger'],[data-slot='select-content'],[data-slot='popover-content'],[data-slot='drawer-popup'],[role='dialog'],[role='option']",
      );
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (inOverlay(target)) return;
      const { session, next: doNext, pause: doPause, resume: doResume } = usePracticeStore.getState();
      const curInput = inputRef.current;

      if (e.key === "Enter") {
        if (target?.closest("button, a")) return;
        if (session.status === "wrong" || session.feedback === "correct" || session.status === "completed") {
          e.preventDefault();
          doNext();
        }
        return;
      }
      if (e.key === " ") {
        if (target?.closest("button, a")) return;
        if (session.status === "answering" && session.feedback === "none") {
          e.preventDefault();
          if (curInput === "") doPause();
        } else if (session.status === "paused") {
          e.preventDefault();
          doResume();
        } else {
          e.preventDefault();
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

  // 点击键盘输入（与实体键盘共用 input + submit 逻辑）
  const handleKeyClick = useCallback(
    (key: string) => {
      if (inputDisabled) return;
      const cleaned = cleanKey(key);
      if (!cleaned) return;
      const newInput = (input + cleaned).slice(0, expectedLength);
      setInput(newInput);
      if (newInput.length >= expectedLength) {
        setLastInput(newInput);
        submit(newInput);
        setInput("");
      }
    },
    [input, expectedLength, inputDisabled, submit],
  );

  // 键位高亮
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
    <div className="flex flex-col items-center gap-6">
      <PracticeToolbar />

      {/* 题目 + 输入 */}
      <div className="flex w-full flex-col items-center gap-3">
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
      </div>

      {/* 键盘（核心视觉） */}
      <KeyboardMap
        pressedKeys={pressedKeys}
        correctKeys={correctKeys}
        errorKeys={errorKeys}
        onKeyClick={handleKeyClick}
        disabled={inputDisabled}
      />

      {/* 统计 */}
      <PracticeStats />

      <ResultDialog />
    </div>
  );
}
