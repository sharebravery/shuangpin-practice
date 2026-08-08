"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { PaletteIcon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { restorePracticeFocus } from "@/features/practice/practice-input";

const THEMES = [
  { value: "clean", label: "天青", dot: "#1677B3" },
  { value: "ink", label: "纸墨", dot: "#B93A2F" },
  { value: "graphite", label: "石墨", dot: "#38BDF8" },
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
        className="h-8 w-[104px] gap-1.5 border-border/70 bg-card px-2 text-xs shadow-none hover:bg-muted/70"
      >
        <PaletteIcon className="size-3.5 text-muted-foreground" />
        <SelectValue>
          {(value: ThemeName) => THEMES.find((item) => item.value === value)?.label ?? "天青"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {THEMES.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            <span className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full ring-1 ring-foreground/10"
                style={{ backgroundColor: item.dot }}
                aria-hidden="true"
              />
              {item.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
