"use client";

import { useState } from "react";
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

function clean(s: string): string {
  return s.toLowerCase().replace(/[^a-z;]/g, "");
}

interface PracticeInputProps {
  value: string;
  expectedLength: number;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
}

/**
 * Visually hidden input: keeps mobile keyboard, IME and accessibility semantics.
 * Desktop physical keydown is handled once at workspace/window level so focus
 * loss does not break practice or visual feedback.
 */
export function PracticeInput({
  value,
  expectedLength,
  disabled,
  onChange,
  onSubmit,
}: PracticeInputProps) {
  const [composing, setComposing] = useState(false);

  const handle = (raw: string, input: HTMLInputElement) => {
    const filtered = clean(raw).slice(0, expectedLength);
    onChange(filtered);
    if (filtered.length >= expectedLength) {
      onSubmit(filtered);
      input.value = "";
    }
  };

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
      onChange={(e) => {
        if (composing) {
          onChange(e.target.value);
          return;
        }
        handle(e.target.value, e.target);
      }}
      onCompositionStart={() => setComposing(true)}
      onCompositionEnd={(e) => {
        setComposing(false);
        const input = e.target as HTMLInputElement;
        handle(input.value, input);
      }}
    />
  );
}
