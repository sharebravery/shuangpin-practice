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
const TRACE_HOLD_MS = 560;
const ACTIVE_KEY_TIMEOUT_MS = 150;

function cleanSingleKey(key: string): string {
  return /^[a-z;]$/i.test(key) ? key.toLowerCase() : "";
}

function cleanInput(value: string): string {
  return value.toLowerCase().replace(/[^a-z;]/g, "");
}

function inOverlay(el: HTMLElement | null): boolean {
  return !!el?.closest(
    "[data-slot='select-trigger'],[data-slot='select-content'],[data-slot='popover-content'],[data-slot='drawer-popup'],[role='dialog'],[role='option']",
  );
}

function isEditableAwayFromPractice(el: HTMLElement | null): boolean {
  if (!el || el.id === PRACTICE_INPUT_ID) return false;
  return !!el.closest("input, textarea, [contenteditable='true']");
}

export function PracticeWorkspace() {
  const question = usePracticeStore((s) => s.session.question);
  const phraseIndex = usePracticeStore((s) => s.session.phraseIndex);
  const questionId = usePracticeStore((s) => s.session.questionId);
  const status = usePracticeStore((s) => s.session.status);
  const feedback = usePracticeStore((s) => s.session.feedback);
  const layout = usePracticeStore((s) => s.settings.layout ?? "score");
  const showTrace = usePracticeStore((s) => s.settings.showTrace ?? true);
  const hasHydrated = usePracticeStore((s) => s.hasHydrated);
  const startSession = usePracticeStore((s) => s.startSession);
  const submit = usePracticeStore((s) => s.submit);
  const next = usePracticeStore((s) => s.next);

  const [input, setInput] = useState("");
  const [lastInput, setLastInput] = useState("");
  const inputRef = useRef("");

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [typedKeys, setTypedKeys] = useState<string[]>([]);
  const [traceKeys, setTraceKeys] = useState<string[]>([]);
  const activeKeyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const traceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      if (traceTimerRef.current) clearTimeout(traceTimerRef.current);
    },
    [],
  );

  const expectedLength = question?.kind === "mapping" ? 1 : 2;
  const inputDisabled = status !== "answering" || feedback !== "none";

  const flashKey = useCallback((key: string) => {
    setActiveKey(key);
    if (activeKeyTimerRef.current) clearTimeout(activeKeyTimerRef.current);
    activeKeyTimerRef.current = setTimeout(() => {
      setActiveKey((current) => (current === key ? null : current));
    }, ACTIVE_KEY_TIMEOUT_MS);
  }, []);

  const holdSubmittedTrace = useCallback((keys: string[]) => {
    if (keys.length === 0) return;
    setTraceKeys(keys);
    if (traceTimerRef.current) clearTimeout(traceTimerRef.current);

    const afterSubmit = usePracticeStore.getState().session;
    const delay = afterSubmit.status === "wrong" ? WRONG_AUTO_ADVANCE_MS : TRACE_HOLD_MS;
    traceTimerRef.current = setTimeout(() => setTraceKeys([]), delay);
  }, []);

  const processKey = useCallback(
    (rawKey: string) => {
      if (inputDisabled) return;
      const key = cleanSingleKey(rawKey);
      if (!key) return;

      flashKey(key);

      if (traceTimerRef.current) {
        clearTimeout(traceTimerRef.current);
        traceTimerRef.current = null;
      }

      const newInput = (inputRef.current + key).slice(0, expectedLength);
      const visualKeys = newInput.split("");
      inputRef.current = newInput;
      setInput(newInput);
      setTypedKeys(visualKeys);
      setTraceKeys(visualKeys);

      if (newInput.length >= expectedLength) {
        setLastInput(newInput);
        submit(newInput);
        holdSubmittedTrace(visualKeys);
        inputRef.current = "";
        setInput("");
      }
    },
    [expectedLength, flashKey, holdSubmittedTrace, inputDisabled, submit],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (inOverlay(target) || isEditableAwayFromPractice(target)) return;

      const { session, next: doNext, pause: doPause, resume: doResume } =
        usePracticeStore.getState();
      const curInput = inputRef.current;

      if (
        !e.isComposing &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        /^[a-z;]$/i.test(e.key) &&
        session.status === "answering" &&
        session.feedback === "none"
      ) {
        e.preventDefault();
        processKey(e.key);
        return;
      }

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
          setTraceKeys([]);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [processKey]);

  useEffect(() => {
    const restore = () => {
      const session = usePracticeStore.getState().session;
      const active = document.activeElement as HTMLElement | null;
      if (
        session.status === "answering" &&
        session.feedback === "none" &&
        !inOverlay(active) &&
        !isEditableAwayFromPractice(active)
      ) {
        focusPracticeInput();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") restore();
    };

    window.addEventListener("focus", restore);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", restore);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

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
  const traceErrorIndexes =
    status === "wrong"
      ? lastInput
          .split("")
          .map((key, index) => (key !== answerChars[index] ? index : -1))
          .filter((index) => index >= 0)
      : [];

  return (
    <div
      className="flex flex-col items-center py-1 sm:py-2"
      onPointerDown={(event) => {
        const target = event.target as HTMLElement;
        if (
          target.closest(
            "button, a, input, textarea, [contenteditable='true'], [data-slot='select-trigger'], [role='dialog']",
          )
        ) {
          return;
        }
        window.requestAnimationFrame(() => focusPracticeInput());
      }}
    >
      <div className="flex min-h-8 w-full items-center justify-between gap-3">
        <PracticeToolbar />
        <PracticeStats />
      </div>

      <div className="relative flex min-h-[280px] w-full flex-col items-center justify-center py-7 sm:min-h-[320px] sm:py-9">
        <PracticePrompt />

        <div
          className="flex h-[76px] items-center justify-center gap-7 font-mono text-[2.6rem] font-bold tracking-wide text-[var(--brand)] sm:h-20 sm:text-[2.9rem]"
          aria-live="polite"
          aria-atomic="true"
        >
          {echoKeys.map((key, index) => {
            const isWrongKey = status === "wrong" && key !== answerChars[index];
            return (
              <span
                key={`${index}-${key}`}
                className={
                  isWrongKey
                    ? "animate-in fade-in slide-in-from-bottom-1 text-[var(--error)] duration-150"
                    : "animate-in fade-in slide-in-from-bottom-1 duration-150"
                }
              >
                {key}
              </span>
            );
          })}
        </div>

        <div className="flex h-5 items-center justify-center font-mono text-[0.68rem] text-muted-foreground">
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
          onChange={(value) => {
            const cleaned = cleanInput(value).slice(0, expectedLength);
            const visualKeys = cleaned.split("");
            inputRef.current = cleaned;
            setInput(cleaned);
            setTypedKeys(visualKeys);
            setTraceKeys(visualKeys);
            const lastKey = cleaned.at(-1);
            if (lastKey) flashKey(lastKey);
          }}
          onSubmit={(value) => {
            const cleaned = cleanInput(value).slice(0, expectedLength);
            const submittedKeys = cleaned.split("");
            setLastInput(cleaned);
            setTypedKeys(submittedKeys);
            submit(cleaned);
            holdSubmittedTrace(submittedKeys);
            inputRef.current = "";
            setInput("");
          }}
        />
      </div>

      <KeyboardMap
        layout={layout}
        showTrace={showTrace}
        activeKey={activeKey}
        typedKeys={echoKeys}
        traceKeys={traceKeys}
        traceErrorIndexes={traceErrorIndexes}
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
