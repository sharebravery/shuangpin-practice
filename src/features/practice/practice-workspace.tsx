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

function cleanSingleKey(key: string): string {
  return /^[a-z;]$/i.test(key) ? key.toLowerCase() : "";
}

function cleanInput(value: string): string {
  return value.toLowerCase().replace(/[^a-z;]/g, "");
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
  const inputRef = useRef("");

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [typedKeys, setTypedKeys] = useState<string[]>([]);
  const activeKeyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  useEffect(() => {
    if (hasHydrated && usePracticeStore.getState().session.status === "ready") {
      startSession();
    }
  }, [hasHydrated, startSession]);

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

  useEffect(
    () => () => {
      if (activeKeyTimerRef.current) clearTimeout(activeKeyTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    const inOverlay = (el: HTMLElement | null) =>
      !!el?.closest(
        "[data-slot='select-trigger'],[data-slot='select-content'],[data-slot='popover-content'],[data-slot='drawer-popup'],[role='dialog'],[role='option']",
      );
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (inOverlay(target)) return;
      const { session, next: doNext, pause: doPause, resume: doResume } =
        usePracticeStore.getState();
      const curInput = inputRef.current;

      if (e.key === "Enter") {
        if (target?.closest("button, a, [data-keycap]")) return;
        if (
          session.status === "wrong" ||
          session.feedback === "correct" ||
          session.status === "completed"
        ) {
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
        if (
          session.status === "answering" &&
          session.feedback === "none" &&
          curInput !== ""
        ) {
          e.preventDefault();
          inputRef.current = "";
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

  const flashKey = useCallback((key: string) => {
    setActiveKey(key);
    if (activeKeyTimerRef.current) clearTimeout(activeKeyTimerRef.current);
    activeKeyTimerRef.current = setTimeout(() => {
      setActiveKey((current) => (current === key ? null : current));
    }, ACTIVE_KEY_TIMEOUT_MS);
  }, []);

  const processKey = useCallback(
    (rawKey: string) => {
      if (inputDisabled) return;
      const key = cleanSingleKey(rawKey);
      if (!key) return;

      flashKey(key);

      const newInput = (inputRef.current + key).slice(0, expectedLength);
      inputRef.current = newInput;
      setInput(newInput);
      setTypedKeys(newInput.split(""));

      if (newInput.length >= expectedLength) {
        setLastInput(newInput);
        submit(newInput);
        inputRef.current = "";
        setInput("");
      }
    },
    [expectedLength, flashKey, inputDisabled, submit],
  );

  const answerStr =
    question?.kind === "phrase"
      ? question.charCodes[phraseIndex] ?? ""
      : question?.answer ?? "";
  const answerChars = answerStr.split("");

  let correctKeys: string[] = [];
  let errorKeys: string[] = [];
  if (status === "wrong") {
    correctKeys = answerChars;
    errorKeys = lastInput
      .split("")
      .filter((key, index) => key !== answerChars[index]);
  } else if (feedback === "correct") {
    correctKeys = answerChars;
  }

  const echoKeys = status === "wrong" ? lastInput.split("") : typedKeys;

  return (
    <div className="flex flex-col items-center gap-5 py-1 sm:gap-6 sm:py-2">
      <div className="flex min-h-8 w-full items-center justify-between gap-3">
        <PracticeToolbar />
        <PracticeStats />
      </div>

      <div className="relative flex w-full flex-col items-center">
        <PracticePrompt />

        <div
          className="flex h-14 items-center justify-center gap-5 font-mono text-4xl font-bold tracking-wide text-[var(--brand)] sm:text-[2.75rem]"
          aria-live="polite"
          aria-atomic="true"
        >
          {echoKeys.map((key, index) => {
            const isWrongKey = status === "wrong" && key !== answerChars[index];
            return (
              <span
                key={`${index}-${key}`}
                className={isWrongKey ? "text-[var(--error)]" : undefined}
              >
                {key}
              </span>
            );
          })}
        </div>

        <div className="flex h-6 items-center justify-center font-mono text-xs text-muted-foreground">
          {status === "wrong" && (
            <span>
              正确&nbsp;
              <span className="font-semibold text-[var(--brand)]">{answerStr}</span>
            </span>
          )}
        </div>

        <PracticeInput
          value={input}
          expectedLength={expectedLength}
          disabled={inputDisabled}
          onKeyPress={processKey}
          onChange={(value) => {
            const cleaned = cleanInput(value).slice(0, expectedLength);
            inputRef.current = cleaned;
            setInput(cleaned);
            setTypedKeys(cleaned.split(""));
            const lastKey = cleaned.at(-1);
            if (lastKey) flashKey(lastKey);
          }}
          onSubmit={(value) => {
            const cleaned = cleanInput(value).slice(0, expectedLength);
            setLastInput(cleaned);
            setTypedKeys(cleaned.split(""));
            submit(cleaned);
            inputRef.current = "";
            setInput("");
          }}
        />
      </div>

      <KeyboardMap
        activeKey={activeKey}
        typedKeys={typedKeys}
        correctKeys={correctKeys}
        errorKeys={errorKeys}
        onKeyClick={processKey}
        disabled={inputDisabled}
      />

      <ResultDialog />
    </div>
  );
}

export { PRACTICE_INPUT_ID };
