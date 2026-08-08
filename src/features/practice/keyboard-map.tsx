"use client";

import { usePracticeStore } from "@/stores/practice-store";
import { SCHEMES } from "@/data/schemes";
import { cn } from "@/lib/utils";
import { CheckIcon, XIcon } from "lucide-react";

const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
  ["z", "x", "c", "v", "b", "n", "m"],
] as const;

// Row offsets for staggered layout (real keyboard alignment)
const ROW_OFFSETS = ["0px", "18px", "42px"] as const;

const SCHEME_DATA: Record<
  string,
  { name: string; initials: Record<string, string>; finals: Record<string, string> }
> = Object.fromEntries(
  SCHEMES.map((s) => [s.id, { name: s.name, initials: s.initials, finals: s.finals }]),
);

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
  onKeyClick: (key: string) => void;
  disabled: boolean;
}

export function KeyboardMap({
  pressedKeys,
  correctKeys,
  errorKeys,
  onKeyClick,
  disabled,
}: KeyboardMapProps) {
  const schemeId = usePracticeStore((s) => s.settings.scheme);
  const data = SCHEME_DATA[schemeId] ?? { name: "", initials: {}, finals: {} };
  const content = buildKeyContent(data);

  const pressed = new Set(pressedKeys);
  const correct = new Set(correctKeys);
  const error = new Set(errorKeys);

  return (
    <div
      className="overflow-x-auto"
      role="group"
      aria-label="双拼键位图"
    >
      <div className="mx-auto flex w-fit min-w-full flex-col items-center gap-[3px] sm:gap-[5px]">
        {KEYBOARD_ROWS.map((row, ri) => (
          <div
            key={ri}
            className="flex gap-[3px] sm:gap-[5px]"
            style={{ paddingLeft: ROW_OFFSETS[ri], paddingRight: ROW_OFFSETS[2 - ri] }}
          >
            {row.map((key) => {
              const c = content[key];
              const isCorrect = correct.has(key);
              const isError = error.has(key);
              const isPressed = pressed.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onKeyClick(key)}
                  aria-label={`键位 ${key}${c ? `: ${[...c.initials, ...c.finals.map(displayFinal)].join(", ")}` : ""}`}
                  data-keycap={key}
                  className={cn(
                    "group relative flex h-12 w-8 shrink-0 select-none flex-col items-center justify-center rounded-[5px] border-b-2 transition-all sm:h-[68px] sm:w-[52px] sm:rounded-[7px] sm:border-b-[3px]",
                    "border-t-[var(--keycap-border)] border-x-[var(--keycap-border)] border-b-[var(--keycap-shadow)]",
                    "bg-[var(--keycap)]",
                    !disabled && "hover:brightness-95 active:translate-y-px active:border-b-[1px] sm:active:border-b-[2px]",
                    !disabled && !isCorrect && !isError && !isPressed && "hover:border-t-[var(--vermilion)] hover:border-x-[var(--vermilion)]",
                    isPressed && !isCorrect && !isError && "border-t-[var(--vermilion)] border-x-[var(--vermilion)] border-b-[var(--vermilion)] bg-[var(--vermilion)]/8",
                    isCorrect && "border-t-emerald-500 border-x-emerald-500 border-b-emerald-600 bg-emerald-500/8",
                    isError && !isCorrect && "border-t-[var(--vermilion)] border-x-[var(--vermilion)] border-b-[var(--vermilion)] bg-[var(--vermilion)]/10",
                  )}
                >
                  {isCorrect && (
                    <CheckIcon className="absolute right-0.5 top-0.5 size-2 text-emerald-600 dark:text-emerald-400 sm:right-1 sm:top-1 sm:size-3" />
                  )}
                  {isError && !isCorrect && (
                    <XIcon className="absolute right-0.5 top-0.5 size-2 text-[var(--vermilion)] sm:right-1 sm:top-1 sm:size-3" />
                  )}

                  {/* 声母角标（右上） */}
                  {c && c.initials.length > 0 && (
                    <span
                      className="absolute right-0.5 top-0.5 text-[0.5rem] font-semibold leading-none text-[var(--vermilion)]/70 sm:right-1 sm:top-1 sm:text-[0.6rem]"
                    >
                      {c.initials.join("/")}
                    </span>
                  )}

                  {/* 键名字母 */}
                  <span className="text-sm font-bold leading-none text-foreground sm:text-xl">
                    {key}
                  </span>

                  {/* 韵母 */}
                  {c && c.finals.length > 0 && (
                    <span className="mt-px text-[0.5rem] leading-none text-muted-foreground sm:mt-0.5 sm:text-[0.65rem]">
                      {c.finals.map(displayFinal).join(" · ")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
