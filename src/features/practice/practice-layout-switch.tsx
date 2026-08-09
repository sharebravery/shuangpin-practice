"use client";

import { Button } from "@/components/ui/button";
import type { PracticeLayout } from "@/lib/shuangpin/types";
import { usePracticeStore } from "@/stores/practice-store";
import { restorePracticeFocus } from "./practice-input";

const LAYOUTS: { value: PracticeLayout; label: string }[] = [
  { value: "score", label: "谱面" },
  { value: "keyboard", label: "键盘" },
];

export function PracticeLayoutSwitch() {
  const layout = usePracticeStore((s) =>
    s.settings.layout === "keyboard" ? "keyboard" : "score",
  );
  const updateSettings = usePracticeStore((s) => s.updateSettings);

  const selectLayout = (value: PracticeLayout) => {
    updateSettings({ layout: value });
    window.requestAnimationFrame(() => restorePracticeFocus());
  };

  return (
    <div
      role="group"
      aria-label="键位布局"
      className="inline-flex items-center rounded-lg border border-border/55 bg-[var(--surface)]/65 p-0.5"
    >
      {LAYOUTS.map((item) => {
        const active = layout === item.value;
        return (
          <Button
            key={item.value}
            type="button"
            variant="ghost"
            size="xs"
            aria-pressed={active}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => selectLayout(item.value)}
            className={
              active
                ? "h-6 rounded-md bg-[var(--key)] px-2.5 text-foreground shadow-sm hover:bg-[var(--key)]"
                : "h-6 rounded-md px-2.5 text-muted-foreground hover:bg-transparent hover:text-foreground"
            }
          >
            {item.label}
          </Button>
        );
      })}
    </div>
  );
}
