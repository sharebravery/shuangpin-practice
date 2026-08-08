"use client";

import { CheckIcon, XIcon } from "lucide-react";

import { usePracticeStore } from "@/stores/practice-store";
import { SCHEMES } from "@/data/schemes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
  ["z", "x", "c", "v", "b", "n", "m"],
] as const;

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
  const data = SCHEME_DATA[schemeId] ?? {
    name: "键位图",
    initials: {},
    finals: {},
  };
  const content = buildKeyContent(data);

  const pressed = new Set(pressedKeys);
  const correct = new Set(correctKeys);
  const error = new Set(errorKeys);

  return (
    <div className="relative z-10 flex flex-col items-center gap-3">
      <p className="text-sm font-medium text-muted-foreground">
        {data.name} · 键位图
      </p>
      <div className="overflow-x-auto pb-2" role="group" aria-label="双拼键位图">
        <div className="mx-auto flex w-fit flex-col gap-1 sm:gap-1.5">
          {KEYBOARD_ROWS.map((row, ri) => (
            <div key={ri} className="flex gap-1 sm:gap-1.5">
              {row.map((key) => {
                const c = content[key];
                const isCorrect = correct.has(key);
                const isError = error.has(key);
                const isPressed = pressed.has(key);
                return (
                  <Button
                    key={key}
                    variant="ghost"
                    disabled={disabled}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onKeyClick(key)}
                    aria-label={`键位 ${key}${c ? `: ${[...c.initials, ...c.finals.map(displayFinal)].join(", ")}` : ""}`}
                    className={cn(
                      "group relative flex h-14 w-9 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border bg-muted/30 p-0.5 transition-all sm:h-20 sm:w-16 sm:rounded-xl sm:p-1",
                      "hover:bg-muted/60 hover:scale-[1.03] active:scale-[0.97]",
                      isCorrect && "border-emerald-500 bg-emerald-500/10 dark:border-emerald-400",
                      !isCorrect && isError && "border-destructive bg-destructive/10",
                      !isCorrect && !isError && isPressed && "border-primary bg-primary/10 scale-[1.03]",
                    )}
                  >
                    {isCorrect && (
                      <CheckIcon className="absolute right-0.5 top-0.5 size-2.5 text-emerald-600 dark:text-emerald-400 sm:right-1 sm:top-1 sm:size-3" />
                    )}
                    {isError && !isCorrect && (
                      <XIcon className="absolute right-0.5 top-0.5 size-2.5 text-destructive sm:right-1 sm:top-1 sm:size-3" />
                    )}
                    <span className="text-base font-bold leading-none sm:text-2xl">
                      {key}
                    </span>
                    {c && c.finals.length > 0 && (
                      <span className="hidden text-[0.65rem] leading-tight text-muted-foreground sm:block">
                        {c.finals.map(displayFinal).join(" · ")}
                      </span>
                    )}
                    {c && c.initials.length > 0 && (
                      <span className="hidden text-[0.65rem] font-semibold leading-tight text-primary/70 sm:block">
                        {c.initials.join("/")}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
