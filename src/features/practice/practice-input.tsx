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
}

/**
 * 练习输入框（实现细则 §13）：
 * - 关闭自动更正/大写/拼写检查。
 * - 仅保留 a-z 与分号；输入法组合期间不判断，compositionend 后清理。
 * - 达到答案长度自动判断。
 * - 练习级快捷键（Esc/Enter/Space）由 PracticeWorkspace 的全局键盘监听处理，
 *   不依赖本输入框（wrong/paused 等状态下输入框被禁用仍可触发）。
 */
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
      placeholder="请输入双拼编码"
      className="mx-auto max-w-56 text-center font-mono text-lg"
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
