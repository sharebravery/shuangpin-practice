"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { KeyboardIcon } from "lucide-react";

import { usePracticeStore } from "@/stores/practice-store";
import { SCHEMES } from "@/data/schemes";
import type { PracticeMode, SchemeId } from "@/lib/shuangpin/types";
import { MoreSettings } from "./more-settings";

const MODES: { value: PracticeMode; label: string }[] = [
  { value: "mapping", label: "键位练习" },
  { value: "character", label: "单字练习" },
  { value: "phrase", label: "词组练习" },
];

export function PracticeToolbar() {
  const scheme = usePracticeStore((s) => s.settings.scheme);
  const mode = usePracticeStore((s) => s.settings.mode);
  const showKeyboard = usePracticeStore((s) => s.settings.showKeyboard);
  const setScheme = usePracticeStore((s) => s.setScheme);
  const setMode = usePracticeStore((s) => s.setMode);
  const updateSettings = usePracticeStore((s) => s.updateSettings);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={scheme} onValueChange={(v) => setScheme(v as SchemeId)}>
        <SelectTrigger aria-label="双拼方案" className="min-w-32">
          <SelectValue placeholder="选择方案">
            {(value: SchemeId) =>
              SCHEMES.find((s) => s.id === value)?.name ?? value
            }
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

      <Select value={mode} onValueChange={(v) => setMode(v as PracticeMode)}>
        <SelectTrigger aria-label="练习模式" className="min-w-32">
          <SelectValue placeholder="选择模式">
            {(value: PracticeMode) =>
              MODES.find((m) => m.value === value)?.label ?? value
            }
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

      <Button
        variant={showKeyboard ? "default" : "outline"}
        size="icon"
        aria-label={showKeyboard ? "隐藏键位图" : "显示键位图"}
        aria-pressed={showKeyboard}
        onClick={() => updateSettings({ showKeyboard: !showKeyboard })}
      >
        <KeyboardIcon className="size-4" />
      </Button>

      <MoreSettings />
    </div>
  );
}
