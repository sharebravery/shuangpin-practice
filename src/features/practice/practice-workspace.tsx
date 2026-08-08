"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { usePracticeStore } from "@/stores/practice-store";
import { PracticeToolbar } from "./practice-toolbar";
import { PracticePrompt } from "./practice-prompt";
import { PracticeInput, focusPracticeInput, PRACTICE_INPUT_ID } from "./practice-input";
import { PracticeStats } from "./practice-stats";
import { KeyboardMap } from "./keyboard-map";
import { ResultDialog } from "./result-dialog";

const WRONG_AUTO_ADVANCE_MS = 800;
const CORRECT_FEEDBACK_MS = 400;
const ACTIVE_KEY_TIMEOUT_MS = 150;

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

  // Business input state
  const [input, setInput] = useState("");
  const [lastInput, setLastInput] = useState("");
  const inputRef = useRef(input);
  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  // Visual key state: separated from business input
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [typedKeys, setTypedKeys] = useState<string[]>([]);
  const activeKeyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (hasHydrated && usePracticeStore.getState().session.status === "ready") {
      startSession();
    }
  }, [hasHydrated, startSession]);

  // Reset on new question / new phrase char
  const questionResetKey = `${questionId}:${phraseIndex}`;
  const [lastResetKey, setLastResetKey] = useState(questionResetKey);
  if (lastResetKey !== questionResetKey) {
    setLastResetKey(questionResetKey);
    setInput("");
    setLastInput("");
    setTypedKeys([]);
    setActiveKey(null);
  }

  useEffect(() => {
    if (status === "answering" && feedback === "none") {
      focusPracticeInput();
    } else if (typeof document !== "undefined") {
      document.body.focus();
    }
  }, [questionResetKey, status, feedback]);

  // Auto-advance
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

  // Global keyboard listener
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
        if (target?.closest("button, a, [data-keycap]")) return;
        if (session.status === "wrong" || session.feedback === "correct" || session.status === "completed") {
          e.preventDefault();
          doNext();
        }
        return;
      }
      if (e.key === " ") {
        if (target?.closest("button, a, [data-keycap]")) return;
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
          setTypedKeys([]);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const expectedLength = question?.kind === "mapping" ? 1 : 2;
  const inputDisabled = status !== "answering" || feedback !== "none";

  // Unified key input: physical keyboard + click share this
  const processKey = useCallback(
    (rawKey: string) => {
      if (inputDisabled) return;
      const cleaned = cleanKey(rawKey);
      if (!cleaned) return;

      // Visual: flash active key + accumulate typedKeys
      setActiveKey(cleaned);
      setTypedKeys((prev) => [...prev, cleaned].slice(0, expectedLength));
      if (activeKeyTimerRef.current) clearTimeout(activeKeyTimerRef.current);
      activeKeyTimerRef.current = setTimeout(() => setActiveKey(null), ACTIVE_KEY_TIMEOUT_MS);

      // Business: accumulate + submit
      const newInput = (input + cleaned).slice(0, expectedLength);
      setInput(newInput);
      if (newInput.length >= expectedLength) {
        setLastInput(newInput);
        submit(newInput);
        // DON'T clear typedKeys here — let them persist until next question
        setInput("");
      }
    },
    [input, expectedLength, inputDisabled, submit],
  );

  const handleKeyClick = useCallback(
    (key: string) => processKey(key),
    [processKey],
  );

  // Compute keyboard highlight sets
  const answerStr =
    question?.kind === "phrase"
      ? question.charCodes[phraseIndex] ?? ""
      : question?.answer ?? "";
  const answerChars = answerStr.split("");
  let correctKeys: string[] = [];
  let errorKeys: string[] = [];
  if (status === "wrong") {
    correctKeys = answerChars;
    errorKeys = lastInput.split("");
  } else if (feedback === "correct") {
    correctKeys = answerChars;
  }

  // Echo display: typedKeys during answering, lastInput during wrong
  const echoKeys = status === "wrong" ? lastInput.split("") : typedKeys;
  const showEcho = echoKeys.length > 0 || status === "wrong";

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      {/* Toolbar: left controls, right stats */}
      <div className="flex w-full items-center justify-between">
        <PracticeToolbar />
        <PracticeStats />
      </div>

      {/* Display: question + echo */}
      <div className="flex min-h-[140px] flex-col items-center justify-center gap-3">
        <PracticePrompt />

        {/* Echo: large typed key display */}
        {showEcho && (
          <div className="flex items-center gap-2 font-mono text-3xl font-bold tracking-wider text-[var(--brand)] sm:text-4xl" aria-hidden="true">
            {echoKeys.map((k, i) => (
              <span key={i} className={status === "wrong" && i === echoKeys.length - 1 ? "text-[var(--error)]" : ""}>
                {k}
              </span>
            ))}
          </div>
        )}

        {/* Hidden input: handles focus / IME / accessibility */}
        <PracticeInput
          value={input}
          expectedLength={expectedLength}
          disabled={inputDisabled}
          onChange={(v) => {
            setInput(v);
            const cleaned = cleanKey(v);
            if (cleaned.length < typedKeys.length) {
              setTypedKeys(cleaned.split(""));
            }
          }}
          onSubmit={(v) => {
            setLastInput(v);
            submit(v);
            setInput("");
          }}
        />
      </div>

      {/* Keyboard: absolute main visual */}
      <KeyboardMap
        activeKey={activeKey}
        typedKeys={typedKeys}
        correctKeys={correctKeys}
        errorKeys={errorKeys}
        onKeyClick={handleKeyClick}
        disabled={inputDisabled}
      />

      <ResultDialog />
    </div>
  );
}

// Keep export for backward compat
export { PRACTICE_INPUT_ID };
