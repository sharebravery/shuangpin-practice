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
const GRID_ROW_PADDING = [
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

interface TracePoint {
  x: number;
  y: number;
  index: number;
}

interface TraceGeometry {
  path: string | null;
  points: TracePoint[];
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
  traceErrorIndexes: number[];
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
  traceErrorIndexes,
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
  const traceErrorSet = new Set(traceErrorIndexes);

  const fieldRef = useRef<HTMLDivElement>(null);
  const [traceGeometry, setTraceGeometry] = useState<TraceGeometry>({
    path: null,
    points: [],
  });

  const updateTrace = useCallback(() => {
    if (!showTrace || traceKeys.length === 0 || !fieldRef.current) {
      setTraceGeometry({ path: null, points: [] });
      return;
    }

    const field = fieldRef.current;
    const fieldRect = field.getBoundingClientRect();
    const points: TracePoint[] = [];

    for (const [index, key] of traceKeys.slice(0, 2).entries()) {
      const element = field.querySelector<HTMLElement>(
        `[data-keycap="${CSS.escape(key)}"]`,
      );
      if (!element) continue;
      const rect = element.getBoundingClientRect();
      points.push({
        x: rect.left - fieldRect.left + rect.width / 2,
        y: rect.top - fieldRect.top + rect.height / 2,
        index,
      });
    }

    if (points.length < 2) {
      setTraceGeometry({ path: null, points });
      return;
    }

    const [first, second] = points;
    const firstKey = traceKeys[0];
    const secondKey = traceKeys[1];

    if (firstKey === secondKey) {
      const firstElement = field.querySelector<HTMLElement>(
        `[data-keycap="${CSS.escape(firstKey ?? "")}"]`,
      );
      const loop = Math.max(
        24,
        (firstElement?.getBoundingClientRect().width ?? 72) * 0.34,
      );
      setTraceGeometry({
        points,
        path: `M ${first.x} ${first.y} C ${first.x + loop} ${first.y - loop}, ${first.x - loop} ${first.y - loop}, ${first.x} ${first.y}`,
      });
      return;
    }

    const dx = second.x - first.x;
    const bend = Math.max(24, Math.abs(dx) * 0.13);
    setTraceGeometry({
      points,
      path: `M ${first.x} ${first.y} C ${first.x + dx * 0.28} ${first.y - bend}, ${second.x - dx * 0.2} ${second.y + bend * 0.45}, ${second.x} ${second.y}`,
    });
  }, [showTrace, traceKeys]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(updateTrace);
    window.addEventListener("resize", updateTrace);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateTrace);
    };
  }, [layout, updateTrace]);

  const traceHasError = traceErrorIndexes.length > 0;
  const isGridLayout = layout === "score" || layout === "minimal";

  return (
    <div className="w-full overflow-x-auto pb-1" role="group" aria-label="双拼键位图">
      <div
        ref={fieldRef}
        className={cn(
          "relative mx-auto min-w-[820px] lg:min-w-0",
          layout === "score" && "py-4 sm:py-[18px]",
          layout === "minimal" && "py-2 sm:py-3",
        )}
      >
        {layout === "score" && (
          <>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/70 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border/70 to-transparent" />
          </>
        )}

        {showTrace && traceGeometry.points.length > 0 && (
          <svg
            className="pointer-events-none absolute inset-0 z-[70] h-full w-full overflow-visible"
            aria-hidden="true"
            data-input-trace
          >
            {traceGeometry.path && (
              <path
                d={traceGeometry.path}
                pathLength="1"
                className={cn(
                  "animate-[trace-draw_260ms_cubic-bezier(.22,.8,.2,1)_both] fill-none stroke-[1.8] opacity-85 [filter:drop-shadow(0_0_5px_color-mix(in_srgb,currentColor_28%,transparent))] [stroke-dasharray:1] [stroke-dashoffset:1]",
                  traceHasError
                    ? "stroke-[var(--error)] text-[var(--error)]"
                    : "stroke-[var(--brand)] text-[var(--brand)]",
                )}
              />
            )}

            {traceGeometry.points.map((point) => {
              const error = traceErrorSet.has(point.index);
              const tone = error ? "var(--error)" : "var(--brand)";
              return (
                <g
                  key={`${point.index}-${point.x}-${point.y}`}
                  data-trace-point
                  data-trace-error={error ? "true" : "false"}
                >
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="7"
                    fill={tone}
                    opacity="0.11"
                    className="animate-[trace-breathe_900ms_ease-in-out_infinite]"
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="3.25"
                    fill={tone}
                    className="animate-[trace-point_260ms_ease-out_both] [filter:drop-shadow(0_0_4px_color-mix(in_srgb,currentColor_35%,transparent))]"
                    style={{ color: tone }}
                  />
                </g>
              );
            })}
          </svg>
        )}

        <div
          className={cn(
            "relative z-10 flex flex-col",
            isGridLayout
              ? "gap-2 sm:gap-[9px]"
              : "items-center gap-1.5 sm:gap-2 lg:gap-2.5",
          )}
        >
          {KEYBOARD_ROWS.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={cn(
                isGridLayout
                  ? "grid gap-2"
                  : "flex gap-1.5 sm:gap-2 lg:gap-2.5",
              )}
              style={
                isGridLayout
                  ? {
                      gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))`,
                      paddingLeft: GRID_ROW_PADDING[rowIndex].left,
                      paddingRight: GRID_ROW_PADDING[rowIndex].right,
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
                    data-feedback={
                      isError
                        ? "error"
                        : isCorrect
                          ? "correct"
                          : isTyped
                            ? "typed"
                            : undefined
                    }
                    className={cn(
                      "group relative shrink-0 select-none border transition-[transform,background-color,border-color,box-shadow] duration-100",
                      layout === "score" &&
                        "h-[82px] w-full rounded-xl border-transparent bg-transparent sm:h-[92px] lg:h-[96px]",
                      layout === "keyboard" &&
                        "flex h-14 w-10 flex-col items-center justify-center rounded-lg border-b-[3px] border-[var(--border)] bg-[var(--key)] shadow-sm sm:h-[88px] sm:w-[72px] sm:rounded-xl lg:h-[102px] lg:w-[86px] lg:rounded-[14px]",
                      layout === "minimal" &&
                        "h-[76px] w-full rounded-2xl border-transparent bg-transparent sm:h-[82px] lg:h-[86px]",

                      layout === "score" &&
                        !disabled &&
                        !isCorrect &&
                        !isError &&
                        "hover:bg-[var(--brand-soft)]/55",
                      layout === "score" &&
                        isTyped &&
                        !isCorrect &&
                        !isError &&
                        "border-[var(--brand)]/35 bg-[var(--brand-soft)]/45",
                      layout === "score" &&
                        isCorrect &&
                        "border-[var(--brand)] bg-[var(--brand-soft)]",
                      layout === "score" &&
                        isError &&
                        "border-[var(--error)] bg-[var(--error-soft)]",
                      layout === "score" && isActive && "translate-y-px",

                      layout === "keyboard" &&
                        !disabled &&
                        !isCorrect &&
                        !isError &&
                        "hover:border-[var(--brand)]/55 hover:bg-[var(--key-hover)] hover:shadow-md",
                      layout === "keyboard" &&
                        isTyped &&
                        !isCorrect &&
                        !isError &&
                        "border-[var(--brand)]/70 bg-[var(--brand-soft)]",
                      layout === "keyboard" &&
                        isCorrect &&
                        "border-[var(--brand)] bg-[var(--brand-soft)]",
                      layout === "keyboard" &&
                        isError &&
                        "border-[var(--error)] bg-[var(--error-soft)]",
                      layout === "keyboard" &&
                        isActive &&
                        "translate-y-[3px] scale-[0.975] shadow-none ring-2 ring-[var(--brand)]/35 ring-offset-1 ring-offset-background",

                      layout === "minimal" &&
                        !disabled &&
                        "hover:bg-[var(--brand-soft)]/35",
                    )}
                  >
                    {layout === "score" && (
                      <span
                        className={cn(
                          "pointer-events-none absolute bottom-2 left-3 right-3 h-px origin-center scale-x-[0.38] bg-border/70 opacity-0 transition-all duration-150",
                          !disabled && "group-hover:scale-x-100 group-hover:opacity-100",
                          (isTyped || isCorrect || isActive) &&
                            "scale-x-100 bg-[var(--brand)] opacity-100",
                          isError &&
                            "scale-x-100 bg-[var(--error)] opacity-100",
                        )}
                      />
                    )}

                    {layout === "minimal" && (
                      <span
                        className="pointer-events-none absolute left-1/2 top-1/2 size-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-border"
                        aria-hidden="true"
                      />
                    )}

                    {layout !== "minimal" &&
                      keyContent &&
                      keyContent.initials.length > 0 && (
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
                        layout === "score" &&
                          "absolute left-3 top-3 text-2xl tracking-tight sm:text-[1.7rem] lg:left-4 lg:text-[1.9rem]",
                        layout === "keyboard" &&
                          "text-base sm:text-2xl lg:text-[1.75rem]",
                        layout === "minimal" &&
                          "absolute left-1/2 top-1 -translate-x-1/2 text-lg font-semibold tracking-tight",
                      )}
                    >
                      {key}
                    </span>

                    {keyContent && keyContent.finals.length > 0 && (
                      <span
                        className={cn(
                          "font-medium leading-none text-muted-foreground",
                          layout === "score" &&
                            "absolute bottom-[18px] left-3 right-2 truncate text-[0.62rem] sm:text-[0.7rem] lg:left-4 lg:text-xs",
                          layout === "keyboard" &&
                            "mt-1 max-w-[90%] truncate text-[0.55rem] sm:mt-2 sm:text-[0.7rem] lg:text-xs",
                          layout === "minimal" &&
                            "absolute bottom-1 left-1/2 max-w-[92%] -translate-x-1/2 truncate text-[0.58rem] sm:text-[0.62rem]",
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
