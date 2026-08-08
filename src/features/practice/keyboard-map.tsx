"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { usePracticeStore } from "@/stores/practice-store";
import { SCHEMES } from "@/data/schemes";
import type { PracticeLayout } from "@/lib/shuangpin/types";
import { cn } from "@/lib/utils";

const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
  ["z", "x", "c", "v", "b", "n", "m"],
] as const;

const KEYBOARD_ROW_OFFSETS = ["0px", "28px", "62px"] as const;
const SCORE_ROW_PADDING = [
  { left: "0px", right: "0px" },
  { left: "42px", right: "42px" },
  { left: "112px", right: "164px" },
] as const;

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
  layout: PracticeLayout;
  showTrace: boolean;
  activeKey: string | null;
  typedKeys: string[];
  traceKeys: string[];
  correctKeys: string[];
  errorKeys: string[];
  onKeyClick: (key: string) => void;
  disabled: boolean;
}

export function KeyboardMap({
  layout,
  showTrace,
  activeKey,
  typedKeys,
  traceKeys,
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

  const fieldRef = useRef<HTMLDivElement>(null);
  const [tracePath, setTracePath] = useState<string | null>(null);

  const updateTrace = useCallback(() => {
    if (!showTrace || traceKeys.length < 2 || !fieldRef.current) {
      setTracePath(null);
      return;
    }

    const [firstKey, secondKey] = traceKeys;
    if (!firstKey || !secondKey) {
      setTracePath(null);
      return;
    }

    const field = fieldRef.current;
    const first = field.querySelector<HTMLElement>(`[data-keycap="${CSS.escape(firstKey)}"]`);
    const second = field.querySelector<HTMLElement>(`[data-keycap="${CSS.escape(secondKey)}"]`);
    if (!first || !second) {
      setTracePath(null);
      return;
    }

    const fieldRect = field.getBoundingClientRect();
    const firstRect = first.getBoundingClientRect();
    const secondRect = second.getBoundingClientRect();
    const x1 = firstRect.left - fieldRect.left + firstRect.width / 2;
    const y1 = firstRect.top - fieldRect.top + firstRect.height / 2;
    const x2 = secondRect.left - fieldRect.left + secondRect.width / 2;
    const y2 = secondRect.top - fieldRect.top + secondRect.height / 2;

    if (firstKey === secondKey) {
      const loop = Math.max(28, firstRect.width * 0.38);
      setTracePath(
        `M ${x1} ${y1} C ${x1 + loop} ${y1 - loop}, ${x1 - loop} ${y1 - loop}, ${x1} ${y1}`,
      );
      return;
    }

    const dx = x2 - x1;
    const bend = Math.max(28, Math.abs(dx) * 0.14);
    setTracePath(
      `M ${x1} ${y1} C ${x1 + dx * 0.28} ${y1 - bend}, ${x2 - dx * 0.2} ${y2 + bend * 0.45}, ${x2} ${y2}`,
    );
  }, [showTrace, traceKeys]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(updateTrace);
    window.addEventListener("resize", updateTrace);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateTrace);
    };
  }, [layout, updateTrace]);

  return (
    <div className="w-full overflow-x-auto pb-1" role="group" aria-label="双拼键位图">
      <div
        ref={fieldRef}
        className={cn(
          "relative mx-auto min-w-[820px] lg:min-w-0",
          layout === "score" && "py-4 sm:py-[18px]",
        )}
      >
        {layout === "score" && (
          <>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/70 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border/70 to-transparent" />
          </>
        )}

        {showTrace && tracePath && (
          <svg
            className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
            aria-hidden="true"
            data-input-trace
          >
            <path
              d={tracePath}
              pathLength="1"
              className="animate-[trace-draw_320ms_cubic-bezier(.22,.8,.2,1)_both] fill-none stroke-[var(--brand)] stroke-[2] opacity-80 [filter:drop-shadow(0_0_6px_color-mix(in_srgb,var(--brand)_35%,transparent))] [stroke-dasharray:1] [stroke-dashoffset:1]"
            />
          </svg>
        )}

        <div
          className={cn(
            "relative z-10 flex flex-col",
            layout === "score" ? "gap-2 sm:gap-[9px]" : "items-center gap-1.5 sm:gap-2 lg:gap-2.5",
          )}
        >
          {KEYBOARD_ROWS.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={cn(
                layout === "score"
                  ? "grid gap-2"
                  : "flex gap-1.5 sm:gap-2 lg:gap-2.5",
              )}
              style={
                layout === "score"
                  ? {
                      gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))`,
                      paddingLeft: SCORE_ROW_PADDING[rowIndex].left,
                      paddingRight: SCORE_ROW_PADDING[rowIndex].right,
                    }
                  : {
                      paddingLeft: KEYBOARD_ROW_OFFSETS[rowIndex],
                      paddingRight: KEYBOARD_ROW_OFFSETS[2 - rowIndex],
                    }
              }
            >
              {row.map((key) => {
                const keyContent = content[key];
                const isCorrect = correctSet.has(key);
                const isError = errorSet.has(key) && !isCorrect;
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
                    data-active={isActive ? "true" : undefined}
                    className={cn(
                      "group relative shrink-0 select-none border transition-[transform,background-color,border-color,box-shadow] duration-100",
                      layout === "score"
                        ? "h-[82px] w-full rounded-xl border-transparent bg-transparent sm:h-[92px] lg:h-[96px]"
                        : "flex h-14 w-10 flex-col items-center justify-center rounded-lg border-b-[3px] border-[var(--border)] bg-[var(--key)] shadow-sm sm:h-[88px] sm:w-[72px] sm:rounded-xl lg:h-[102px] lg:w-[86px] lg:rounded-[14px]",
                      layout === "score" &&
                        !disabled &&
                        !isCorrect &&
                        !isError &&
                        "hover:bg-[var(--brand-soft)]/55",
                      layout === "keyboard" &&
                        !disabled &&
                        !isCorrect &&
                        !isError &&
                        "hover:border-[var(--brand)]/55 hover:bg-[var(--key-hover)] hover:shadow-md",
                      isTyped &&
                        !isCorrect &&
                        !isError &&
                        (layout === "score"
                          ? "border-[var(--brand)]/35 bg-[var(--brand-soft)]/45"
                          : "border-[var(--brand)]/70 bg-[var(--brand-soft)]"),
                      isCorrect && "border-[var(--brand)] bg-[var(--brand-soft)]",
                      isError && "border-[var(--error)] bg-[var(--error-soft)]",
                      isActive && layout === "score" && "translate-y-px",
                      isActive &&
                        layout === "keyboard" &&
                        "translate-y-[3px] scale-[0.975] shadow-none ring-2 ring-[var(--brand)]/35 ring-offset-1 ring-offset-background",
                    )}
                  >
                    {layout === "score" && (
                      <span
                        className={cn(
                          "pointer-events-none absolute bottom-2 left-3 right-3 h-px origin-center scale-x-[0.38] bg-border/70 opacity-0 transition-all duration-150",
                          !disabled && "group-hover:scale-x-100 group-hover:opacity-100",
                          (isTyped || isCorrect || isActive) &&
                            "scale-x-100 bg-[var(--brand)] opacity-100",
                          isError && "scale-x-100 bg-[var(--error)] opacity-100",
                        )}
                      />
                    )}

                    {keyContent && keyContent.initials.length > 0 && (
                      <span
                        className={cn(
                          "absolute font-semibold leading-none text-[var(--brand)]/75",
                          layout === "score"
                            ? "right-3 top-3 text-[0.62rem] lg:right-4 lg:text-[0.68rem]"
                            : "right-1 top-1 text-[0.55rem] sm:right-2 sm:top-2 sm:text-[0.65rem] lg:text-[0.7rem]",
                        )}
                      >
                        {keyContent.initials.join("/")}
                      </span>
                    )}

                    <span
                      className={cn(
                        "font-bold leading-none text-foreground",
                        layout === "score"
                          ? "absolute left-3 top-3 text-2xl tracking-tight sm:text-[1.7rem] lg:left-4 lg:text-[1.9rem]"
                          : "text-base sm:text-2xl lg:text-[1.75rem]",
                      )}
                    >
                      {key}
                    </span>

                    {keyContent && keyContent.finals.length > 0 && (
                      <span
                        className={cn(
                          "font-medium leading-none text-muted-foreground",
                          layout === "score"
                            ? "absolute bottom-[18px] left-3 right-2 truncate text-[0.62rem] sm:text-[0.7rem] lg:left-4 lg:text-xs"
                            : "mt-1 max-w-[90%] truncate text-[0.55rem] sm:mt-2 sm:text-[0.7rem] lg:text-xs",
                        )}
                      >
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
    </div>
  );
}
