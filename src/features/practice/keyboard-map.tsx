"use client";

import { CheckIcon, XIcon } from "lucide-react";

import { usePracticeStore } from "@/stores/practice-store";
import { SCHEMES } from "@/data/schemes";
import { cn } from "@/lib/utils";

const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
  ["z", "x", "c", "v", "b", "n", "m"],
] as const;

const SCHEME_DATA: Record<
  string,
  { initials: Record<string, string>; finals: Record<string, string> }
> = Object.fromEntries(
  SCHEMES.map((s) => [s.id, { initials: s.initials, finals: s.finals }]),
);

/** 将内部 v 表示还原为 ü 用于展示。 */
function displayFinal(f: string): string {
  return f.replaceAll("v", "ü");
}

interface KeyContent {
  initials: string[];
  finals: string[];
}

function buildKeyContent(scheme: {
  initials: Record<string, string>;
  finals: Record<string, string>;
}): Record<string, KeyContent> {
  const map: Record<string, KeyContent> = {};
  const ensure = (key: string): KeyContent => {
    if (!map[key]) map[key] = { initials: [], finals: [] };
    return map[key];
  };
  for (const [initial, key] of Object.entries(scheme.initials)) {
    ensure(key).initials.push(initial);
  }
  for (const [final, key] of Object.entries(scheme.finals)) {
    ensure(key).finals.push(final);
  }
  return map;
}

interface KeyboardMapProps {
  pressedKeys: string[];
  correctKeys: string[];
  errorKeys: string[];
}

/**
 * 双拼键位图（实现细则 §16，业务专用组件，自行实现）。
 * 三行字母 + 分号；每个键显示键名、韵母、声母。
 * 状态：已输入（强调）、正确答案（成功）、错误输入（错误），正确优先。
 */
export function KeyboardMap({ pressedKeys, correctKeys, errorKeys }: KeyboardMapProps) {
  const schemeId = usePracticeStore((s) => s.settings.scheme);
  const content = buildKeyContent(
    SCHEME_DATA[schemeId] ?? { initials: {}, finals: {} },
  );

  const pressed = new Set(pressedKeys);
  const correct = new Set(correctKeys);
  const error = new Set(errorKeys);

  return (
    <div className="overflow-x-auto" aria-label="双拼键位图" role="group">
      <div className="mx-auto flex w-fit flex-col gap-1.5">
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-1.5">
            {row.map((key) => {
              const c = content[key];
              const isCorrect = correct.has(key);
              const isError = error.has(key);
              const isPressed = pressed.has(key);
              return (
                <div
                  key={key}
                  className={cn(
                    "relative flex h-16 w-12 shrink-0 flex-col items-center justify-center rounded-md border bg-card text-card-foreground",
                    isCorrect && "border-emerald-500 bg-emerald-500/10 dark:border-emerald-400",
                    !isCorrect && isError && "border-destructive bg-destructive/10",
                    !isCorrect && !isError && isPressed && "border-primary bg-primary/10",
                  )}
                >
                  <span className="absolute right-1 top-1">
                    {isCorrect && (
                      <CheckIcon className="size-3 text-emerald-600 dark:text-emerald-400" />
                    )}
                    {isError && !isCorrect && (
                      <XIcon className="size-3 text-destructive" />
                    )}
                  </span>
                  <span className="text-sm font-semibold uppercase">{key}</span>
                  {c && c.finals.length > 0 && (
                    <span className="text-[0.65rem] text-muted-foreground">
                      {c.finals.map(displayFinal).join("/")}
                    </span>
                  )}
                  {c && c.initials.length > 0 && (
                    <span className="text-[0.65rem] font-medium">
                      {c.initials.join("/")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
