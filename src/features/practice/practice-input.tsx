"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

export const PRACTICE_INPUT_ID = "practice-input";

export function focusPracticeInput() {
  if (typeof document !== "undefined") {
    document.getElementById(PRACTICE_INPUT_ID)?.focus();
  }
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

export function PracticeInput({
  value,
  expectedLength,
  disabled,
  onChange,
  onSubmit,
}: PracticeInputProps) {
  const [composing, setComposing] = useState(false);

  const handle = (raw: string) => {
    const filtered = clean(raw);
    onChange(filtered);
    if (filtered.length >= expectedLength) {
      onSubmit(filtered);
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
      placeholder="—"
      className="w-24 border-none bg-transparent text-center font-mono text-lg tracking-[0.3em] text-foreground caret-[var(--vermilion)] placeholder:text-muted-foreground/20 focus-visible:ring-0 sm:w-28 sm:text-xl"
      onChange={(e) => {
        if (composing) {
          onChange(e.target.value);
          return;
        }
        handle(e.target.value);
      }}
      onCompositionStart={() => setComposing(true)}
      onCompositionEnd={(e) => {
        setComposing(false);
        handle((e.target as HTMLInputElement).value);
      }}
    />
  );
}
