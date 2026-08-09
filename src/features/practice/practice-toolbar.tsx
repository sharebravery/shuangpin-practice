"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PracticeMode, SchemeId } from "@/lib/shuangpin/types";
import { MoreSettings } from "./more-settings";
import { PracticeLayoutSwitch } from "./practice-layout-switch";
import { SCHEMES } from "@/data/schemes";
import { usePracticeStore } from "@/stores/practice-store";
import { restorePracticeFocus } from "./practice-input";

const MODES: { value: PracticeMode; label: string }[] = [
  { value: "mapping", label: "键位" },
  { value: "character", label: "单字" },
  { value: "phrase", label: "词组" },
];

export function PracticeToolbar() {
  const scheme = usePracticeStore((s) => s.settings.scheme);
  const mode = usePracticeStore((s) => s.settings.mode);
  const setScheme = usePracticeStore((s) => s.setScheme);
  const setMode = usePracticeStore((s) => s.setMode);

  const restoreOnClose = (open: boolean) => {
    if (!open) restorePracticeFocus();
  };

  return (
    <div data-practice-toolbar className="flex min-w-0 items-center gap-0.5">
      <Select
        value={scheme}
        onValueChange={(v) => setScheme(v as SchemeId)}
        onOpenChange={restoreOnClose}
      >
        <SelectTrigger
          aria-label="双拼方案"
          className="h-7 min-w-20 border-none bg-transparent px-1.5 text-xs font-medium shadow-none hover:bg-[var(--surface)]"
        >
          <SelectValue placeholder="方案">
            {(value: SchemeId) => SCHEMES.find((s) => s.id === value)?.name ?? value}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SCHEMES.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={mode}
        onValueChange={(v) => setMode(v as PracticeMode)}
        onOpenChange={restoreOnClose}
      >
        <SelectTrigger
          aria-label="练习模式"
          className="h-7 min-w-14 border-none bg-transparent px-1.5 text-xs font-medium shadow-none hover:bg-[var(--surface)]"
        >
          <SelectValue placeholder="模式">
            {(value: PracticeMode) => MODES.find((m) => m.value === value)?.label ?? value}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {MODES.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <PracticeLayoutSwitch />
      <MoreSettings />
    </div>
  );
}
