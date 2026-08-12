"use client";

import { Input } from "@/components/ui/input";

export const PRACTICE_INPUT_ID = "practice-input";

export function focusPracticeInput() {
  if (typeof document !== "undefined") {
    document.getElementById(PRACTICE_INPUT_ID)?.focus();
  }
}

/**
 * Overlay controls (Select / Popover / Drawer) restore focus after their close
 * animation/focus management has completed. A frame delay avoids Base UI
 * immediately taking focus back to the trigger.
 */
export function restorePracticeFocus() {
  if (typeof window === "undefined") return;
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => focusPracticeInput());
  });
}

interface PracticeInputProps {
  value: string;
  expectedLength: number;
  disabled: boolean;
  onInput: (value: string) => void;
}

/**
 * Visually hidden input used by mobile keyboards and accessibility.
 * Submission is handled only by PracticeWorkspace so every input source shares
 * the same linear buffer -> submit -> clear flow.
 */
export function PracticeInput({
  value,
  expectedLength,
  disabled,
  onInput,
}: PracticeInputProps) {
  return (
    <Input
      id={PRACTICE_INPUT_ID}
      value={value}
      disabled={disabled}
      maxLength={expectedLength}
      autoComplete="off"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      inputMode="text"
      aria-label="请输入双拼编码"
      className="sr-only"
      onChange={(event) => onInput(event.target.value)}
    />
  );
}
