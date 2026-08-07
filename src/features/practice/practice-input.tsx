"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

export const PRACTICE_INPUT_ID = "practice-input";

/** 聚焦练习输入框。 */
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
  onEnter: () => void;
  onEsc: () => void;
  onSpace: () => void;
}

/**
 * 练习输入框（实现细则 §13）：
 * - 关闭自动更正/大写/拼写检查。
 * - 仅保留 a-z 与分号；输入法组合期间不判断，compositionend 后清理。
 * - 达到答案长度自动判断；Esc 清空、Space 暂停/继续、Enter 继续/下一题。
 */
export function PracticeInput({
  value,
  expectedLength,
  disabled,
  onChange,
  onSubmit,
  onEnter,
  onEsc,
  onSpace,
}: PracticeInputProps) {
  const [composing, setComposing] = useState(false);

  const trySubmit = (raw: string) => {
    const filtered = clean(raw);
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
      placeholder="请输入双拼编码"
      className="mx-auto max-w-56 text-center font-mono text-lg"
      onChange={(e) => {
        const v = e.target.value;
        if (composing) {
          onChange(v);
          return;
        }
        const filtered = clean(v);
        onChange(filtered);
        trySubmit(filtered);
      }}
      onCompositionStart={() => setComposing(true)}
      onCompositionEnd={(e) => {
        setComposing(false);
        const v = (e.target as HTMLInputElement).value;
        const filtered = clean(v);
        onChange(filtered);
        if (filtered.length >= expectedLength) {
          onSubmit(filtered);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onEsc();
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          onEnter();
          return;
        }
        if (e.key === " ") {
          // Space 仅在输入为空时控制暂停；否则阻止（输入不接受空格）。
          if (value === "" && !disabled) {
            e.preventDefault();
            onSpace();
          } else {
            e.preventDefault();
          }
        }
      }}
    />
  );
}
