"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { usePracticeStore } from "@/stores/practice-store";
import { PracticeToolbar } from "./practice-toolbar";
import { PracticePrompt } from "./practice-prompt";
import { PracticeInput, focusPracticeInput, PRACTICE_INPUT_ID } from "./practice-input";
import { PracticeStats } from "./practice-stats";
import { KeyboardMap } from "./keyboard-map";

const TRACE_HOLD_MS = 560;
const ACTIVE_KEY_TIMEOUT_MS = 150;

function cleanSingleKey(key: string): string {
  return /^[a-z;]$/i.test(key) ? key.toLowerCase() : "";
}

function cleanInput(value: string): string {
  return value.toLowerCase().replace(/[^a-z;]/g, "");
}

function physicalKey(event: KeyboardEvent): string {
  if (event.code === "Semicolon") return ";";
  if (/^Key[A-Z]$/.test(event.code)) return event.code.slice(3).toLowerCase();
  return cleanSingleKey(event.key);
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

function displayPart(value: string): string {
  return value.replaceAll("v", "ü");
}

function canAnswer(status: string): boolean {
  return status === "answering" || status === "wrong";
}

export function PracticeWorkspace() {
  const question = usePracticeStore((s) => s.session.question);
  const phraseIndex = usePracticeStore((s) => s.session.phraseIndex);
  const questionId = usePracticeStore((s) => s.session.questionId);
  const status = usePracticeStore((s) => s.session.status);
  const layout = usePracticeStore((s) =>
    s.settings.layout === "keyboard" ? "keyboard" : "score",
  );
  const showTrace = usePracticeStore((s) => s.settings.showTrace ?? true);
  const showKeyboard = usePracticeStore((s) => s.settings.showKeyboard);
  const hasHydrated = usePracticeStore((s) => s.hasHydrated);
  const startSession = usePracticeStore((s) => s.startSession);
  const submit = usePracticeStore((s) => s.submit);

  const [input, setInput] = useState("");
  const inputRef = useRef("");
  const [lastAttempt, setLastAttempt] = useState("");

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [traceKeys, setTraceKeys] = useState<string[]>([]);
  const activeKeyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const traceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setLastAttempt("");
  }

  useEffect(() => {
    inputRef.current = "";
  }, [questionResetKey]);

  useEffect(() => {
    if (canAnswer(status)) {
      focusPracticeInput();
    } else if (typeof document !== "undefined") {
      document.body.focus();
    }
  }, [questionResetKey, status]);

  useEffect(
    () => () => {
      if (activeKeyTimerRef.current) clearTimeout(activeKeyTimerRef.current);
      if (traceTimerRef.current) clearTimeout(traceTimerRef.current);
    },
    [],
  );

  const expectedLength = question?.kind === "mapping" ? 1 : 2;
  const inputDisabled = !canAnswer(status);

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

    if (usePracticeStore.getState().session.status === "wrong") {
      traceTimerRef.current = null;
      return;
    }

    traceTimerRef.current = setTimeout(() => setTraceKeys([]), TRACE_HOLD_MS);
  }, []);

  const clearInput = useCallback(() => {
    inputRef.current = "";
    setInput("");
  }, []);

  const submitAttempt = useCallback(
    (attempt: string) => {
      const submittedKeys = attempt.split("");
      setLastAttempt(attempt);
      submit(attempt);
      holdSubmittedTrace(submittedKeys);
      clearInput();
    },
    [clearInput, holdSubmittedTrace, submit],
  );

  const updateInput = useCallback(
    (rawValue: string) => {
      const nextInput = cleanInput(rawValue).slice(0, expectedLength);
      const visualKeys = nextInput.split("");

      if (traceTimerRef.current) {
        clearTimeout(traceTimerRef.current);
        traceTimerRef.current = null;
      }

      inputRef.current = nextInput;
      setInput(nextInput);
      setTraceKeys(visualKeys);

      const lastKey = visualKeys.at(-1);
      if (lastKey) flashKey(lastKey);

      if (nextInput.length >= expectedLength) {
        submitAttempt(nextInput);
      }
    },
    [expectedLength, flashKey, submitAttempt],
  );

  const processKey = useCallback(
    (rawKey: string) => {
      if (inputDisabled) return;
      const key = cleanSingleKey(rawKey);
      if (!key) return;
      updateInput(inputRef.current + key);
    },
    [inputDisabled, updateInput],
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (inOverlay(target) || isEditableAwayFromPractice(target)) return;

      const { session, pause: doPause, resume: doResume } = usePracticeStore.getState();
      const curInput = inputRef.current;
      const key = physicalKey(event);

      if (
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        key &&
        canAnswer(session.status)
      ) {
        event.preventDefault();
        processKey(key);
        return;
      }

      if (event.key === " ") {
        if (target?.closest("button, a, [data-keycap]")) return;
        if (session.status === "answering") {
          event.preventDefault();
          if (curInput === "") doPause();
        } else if (session.status === "paused") {
          event.preventDefault();
          doResume();
        } else {
          event.preventDefault();
        }
        return;
      }

      if (event.key === "Escape" && canAnswer(session.status) && curInput !== "") {
        event.preventDefault();
        clearInput();
        setTraceKeys([]);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [clearInput, processKey]);

  useEffect(() => {
    const restore = () => {
      const session = usePracticeStore.getState().session;
      const active = document.activeElement as HTMLElement | null;
      if (
        canAnswer(session.status) &&
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
  const showingWrongAttempt = status === "wrong" && input === "" && lastAttempt !== "";
  const echoKeys = input
    ? input.split("")
    : showingWrongAttempt
      ? lastAttempt.split("")
      : [];

  const correctKeys = status === "wrong" ? answerChars : [];
  const errorKeys = showingWrongAttempt
    ? echoKeys.filter((key, index) => key !== answerChars[index])
    : [];
  const traceErrorIndexes = showingWrongAttempt
    ? echoKeys
        .map((key, index) => (key !== answerChars[index] ? index : -1))
        .filter((index) => index >= 0)
    : [];

  const breakdown =
    status === "wrong" && question?.kind === "character"
      ? [
          question.breakdown.initial
            ? `${displayPart(question.breakdown.initial)}→${question.breakdown.initialKey}`
            : "",
          question.breakdown.final
            ? `${displayPart(question.breakdown.final)}→${question.breakdown.finalKey}`
            : "",
        ].filter(Boolean)
      : [];

  return (
    <div
      className="flex w-full flex-col items-center py-0.5 sm:py-1"
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
      <div className="flex h-8 w-full items-center justify-between gap-3">
        <PracticeToolbar />
        <PracticeStats />
      </div>

      <div className="relative mt-3 flex min-h-[218px] w-full flex-col items-center justify-center py-2 sm:mt-5 sm:min-h-[238px] sm:py-3">
        <PracticePrompt />

        <div
          className="flex h-16 items-center justify-center gap-6 font-mono text-[2.45rem] font-bold tracking-wide text-[var(--brand)] sm:h-[68px] sm:gap-7 sm:text-[2.7rem]"
          aria-live="polite"
          aria-atomic="true"
        >
          {echoKeys.map((key, index) => {
            const isWrongKey = showingWrongAttempt && key !== answerChars[index];
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

        <div className="flex h-[18px] items-center justify-center font-mono text-[0.68rem] text-muted-foreground">
          {status === "wrong" && (
            <span>
              正确&nbsp;
              <span className="font-semibold text-[var(--correct)]">
                {answerChars.join(" ")}
              </span>
              {breakdown.length > 0 && (
                <span className="ml-2 text-muted-foreground/80">· {breakdown.join(" · ")}</span>
              )}
            </span>
          )}
        </div>

        <PracticeInput
          value={input}
          expectedLength={expectedLength}
          disabled={inputDisabled}
          onInput={updateInput}
        />
      </div>

      {showKeyboard && (
        <div data-layout-stage data-layout={layout} className="w-full">
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
        </div>
      )}
    </div>
  );
}

export { PRACTICE_INPUT_ID };
