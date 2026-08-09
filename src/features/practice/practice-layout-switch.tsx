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
      className="inline-flex items-center rounded-md bg-[var(--surface)]/45 p-px"
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
                ? "h-6 rounded-[5px] bg-[var(--key)] px-1.5 text-[0.7rem] text-foreground shadow-sm hover:bg-[var(--key)]"
                : "h-6 rounded-[5px] px-1.5 text-[0.7rem] text-muted-foreground hover:bg-transparent hover:text-foreground"
            }
          >
            {item.label}
          </Button>
        );
      })}
    </div>
  );
}
