"use client";

import { usePracticeStore } from "@/stores/practice-store";
import { SCHEMES } from "@/data/schemes";
import { cn } from "@/lib/utils";

const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
  ["z", "x", "c", "v", "b", "n", "m"],
] as const;

const ROW_OFFSETS = ["0px", "28px", "62px"] as const;

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
    <div className="w-full overflow-x-auto pb-1" role="group" aria-label="双拼键位图">
      <div className="mx-auto flex w-fit min-w-full flex-col items-center gap-1.5 sm:gap-2 lg:gap-2.5">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex gap-1.5 sm:gap-2 lg:gap-2.5"
            style={{
              paddingLeft: ROW_OFFSETS[rowIndex],
              paddingRight: ROW_OFFSETS[2 - rowIndex],
            }}
          >
            {row.map((key) => {
              const keyContent = content[key];
              const isCorrect = correctSet.has(key);
              const isError = errorSet.has(key);
              const isTyped = typedSet.has(key);
              const isActive = activeKey === key;

              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onKeyClick(key)}
                  aria-label={`键位 ${key}${keyContent ? `: ${[...keyContent.initials, ...keyContent.finals.map(displayFinal)].join(", ")}` : ""}`}
                  data-keycap={key}
                  className={cn(
                    "group relative flex h-14 w-10 shrink-0 select-none flex-col items-center justify-center rounded-lg border border-b-[3px] border-[var(--border)] bg-[var(--key)] shadow-sm transition-[transform,background-color,border-color,box-shadow] duration-100",
                    "sm:h-[88px] sm:w-[72px] sm:rounded-xl lg:h-[102px] lg:w-[86px] lg:rounded-[14px]",
                    !disabled &&
                      !isCorrect &&
                      !isError &&
                      "hover:border-[var(--brand)]/55 hover:bg-[var(--key-hover)] hover:shadow-md",
                    isActive &&
                      !isCorrect &&
                      !isError &&
                      "translate-y-[2px] scale-[0.985] border-[var(--brand)] bg-[var(--brand-soft)] shadow-none",
                    isTyped &&
                      !isActive &&
                      !isCorrect &&
                      !isError &&
                      "border-[var(--brand)]/70 bg-[var(--brand-soft)]",
                    isCorrect &&
                      "border-[var(--brand)] bg-[var(--brand-soft)]",
                    isError &&
                      !isCorrect &&
                      "border-[var(--error)] bg-[var(--error-soft)]",
                  )}
                >
                  {keyContent && keyContent.initials.length > 0 && (
                    <span className="absolute right-1 top-1 text-[0.55rem] font-semibold leading-none text-[var(--brand)]/70 sm:right-2 sm:top-2 sm:text-[0.65rem] lg:text-[0.7rem]">
                      {keyContent.initials.join("/")}
                    </span>
                  )}

                  <span className="text-base font-bold leading-none text-foreground sm:text-2xl lg:text-[1.75rem]">
                    {key}
                  </span>

                  {keyContent && keyContent.finals.length > 0 && (
                    <span className="mt-1 max-w-[90%] truncate text-[0.55rem] font-medium leading-none text-muted-foreground sm:mt-2 sm:text-[0.7rem] lg:text-xs">
                      {keyContent.finals.map(displayFinal).join(" · ")}
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
