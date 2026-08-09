"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { restorePracticeFocus } from "@/features/practice/practice-input";

const THEMES = [
  { value: "clean", label: "天青", subtitle: "汝瓷 · 天青釉", dot: "#719CA5" },
  { value: "ink", label: "朱砂", subtitle: "印泥 · 朱砂色", dot: "#B24F42" },
  { value: "graphite", label: "玄青", subtitle: "黑釉 · 暮色", dot: "#8EA9A4" },
  { value: "paper", label: "素笺", subtitle: "纸张 · 刊物", dot: "#6F756B" },
] as const;

type ThemeName = (typeof THEMES)[number]["value"];

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const current: ThemeName = THEMES.some((item) => item.value === theme)
    ? (theme as ThemeName)
    : "clean";

  return (
    <Select
      value={mounted ? current : "clean"}
      onValueChange={(value) => setTheme(value as ThemeName)}
      onOpenChange={(open) => {
        if (!open) restorePracticeFocus();
      }}
    >
      <SelectTrigger
        aria-label="界面主题"
        className="h-8 w-auto gap-1.5 border-none bg-transparent px-1.5 text-xs text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground"
      >
        <span
          className="size-1.5 rounded-full bg-[var(--brand)] ring-4 ring-[var(--brand-soft)]"
          aria-hidden="true"
        />
        <SelectValue>
          {(value: ThemeName) => THEMES.find((item) => item.value === value)?.label ?? "天青"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end" className="min-w-44">
        {THEMES.map((item) => (
          <SelectItem key={item.value} value={item.value} aria-label={item.label}>
            <span className="flex items-center gap-2.5">
              <span
                className="size-2.5 shrink-0 rounded-full ring-1 ring-foreground/10"
                style={{ backgroundColor: item.dot }}
                aria-hidden="true"
              />
              <span className="grid gap-0.5 leading-none">
                <span>{item.label}</span>
                <span className="text-[10px] font-normal text-muted-foreground">
                  {item.subtitle}
                </span>
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
