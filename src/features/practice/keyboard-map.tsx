"use client";

import { usePracticeStore } from "@/stores/practice-store";
import { SCHEMES } from "@/data/schemes";
import { cn } from "@/lib/utils";

const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
  ["z", "x", "c", "v", "b", "n", "m"],
] as const;

// Row offsets for staggered layout
const ROW_OFFSETS = ["0px", "20px", "46px"] as const;

const SCHEME_DATA: Record<
  string,
  { initials: Record<string, string>; finals: Record<string, string> }
> = Object.fromEntries(
  SCHEMES.map((s) => [s.id, { initials: s.initials, finals: s.finals }]),
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
  activeKey: string | null;
  typedKeys: string[];
  correctKeys: string[];
  errorKeys: string[];
  onKeyClick: (key: string) => void;
  disabled: boolean;
}

export function KeyboardMap({
  activeKey,
  typedKeys,
  correctKeys,
  errorKeys,
  onKeyClick,
  disabled,
}: KeyboardMapProps) {
  const schemeId = usePracticeStore((s) => s.settings.scheme);
  const data = SCHEME_DATA[schemeId] ?? { initials: {}, finals: {} };
  const content = buildKeyContent(data);

  const typedSet = new Set(typedKeys);
  const correctSet = new Set(correctKeys);
  const errorSet = new Set(errorKeys);

  return (
    <div className="w-full overflow-x-auto" role="group" aria-label="双拼键位图">
      <div className="mx-auto flex w-fit min-w-full flex-col items-center gap-1 sm:gap-1.5">
        {KEYBOARD_ROWS.map((row, ri) => (
          <div
            key={ri}
            className="flex gap-1 sm:gap-1.5"
            style={{ paddingLeft: ROW_OFFSETS[ri], paddingRight: ROW_OFFSETS[2 - ri] }}
          >
            {row.map((key) => {
              const c = content[key];
              const isCorrect = correctSet.has(key);
              const isError = errorSet.has(key);
              const isTyped = typedSet.has(key);
              const isActive = activeKey === key;

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
                    // Base keycap
                    "group relative flex h-14 w-10 shrink-0 select-none flex-col items-center justify-center rounded-lg transition-all sm:h-[72px] sm:w-[56px] sm:rounded-xl",
                    // Clean surface
                    "bg-[var(--surface)]",
                    // Bottom border = mechanical depth
                    "border border-b-2 border-[var(--border)]",
                    // Hover
                    !disabled && !isCorrect && !isError && "hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]",
                    // Active press (150ms flash)
                    isActive && !isCorrect && !isError && "border-[var(--brand)] bg-[var(--brand-soft)] scale-95",
                    // Typed keys (persist during question)
                    isTyped && !isActive && !isCorrect && !isError && "border-[var(--brand)] bg-[var(--brand-soft)]",
                    // Correct (green-blue brand)
                    isCorrect && "border-[var(--brand)] bg-[var(--brand-soft)]",
                    // Error
                    isError && !isCorrect && "border-[var(--error)] bg-[var(--error)]/8",
                  )}
                >
                  {/* Initial badge (top-right) */}
                  {c && c.initials.length > 0 && (
                    <span className="absolute right-0.5 top-0.5 text-[0.55rem] font-semibold leading-none text-[var(--brand)]/60 sm:right-1 sm:top-1 sm:text-[0.6rem]">
                      {c.initials.join("/")}
                    </span>
                  )}

                  {/* Key letter (largest) */}
                  <span className="text-base font-bold leading-none text-foreground sm:text-2xl">
                    {key}
                  </span>

                  {/* Finals (second tier) */}
                  {c && c.finals.length > 0 && (
                    <span className="mt-0.5 text-[0.55rem] leading-none text-muted-foreground sm:mt-1 sm:text-[0.65rem]">
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
