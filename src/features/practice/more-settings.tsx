"use client";

import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SettingsIcon } from "lucide-react";

import type { PracticeLayout } from "@/lib/shuangpin/types";
import { cn } from "@/lib/utils";
import { usePracticeStore } from "@/stores/practice-store";
import { restorePracticeFocus } from "./practice-input";

const QUESTION_COUNTS = [10, 15, 20, 30, 50];
const LAYOUTS: { value: PracticeLayout; label: string }[] = [
  { value: "score", label: "谱面" },
  { value: "keyboard", label: "键盘" },
];

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-foreground">{label}</span>
      {children}
    </div>
  );
}

function SettingsPanel() {
  const settings = usePracticeStore((s) => s.settings);
  const updateSettings = usePracticeStore((s) => s.updateSettings);
  const clearHistory = usePracticeStore((s) => s.clearHistory);
  const [clearOpen, setClearOpen] = useState(false);

  // 兼容曾经持久化过的 minimal：旧值统一回落到谱面。
  const layout: PracticeLayout = settings.layout === "keyboard" ? "keyboard" : "score";
  const showTrace = settings.showTrace ?? true;

  return (
    <div className="flex flex-col gap-4">
      <SettingRow label="界面布局">
        <Select
          value={layout}
          onValueChange={(value) => updateSettings({ layout: value as PracticeLayout })}
        >
          <SelectTrigger size="sm" className="w-24" aria-label="界面布局">
            <SelectValue>
              {(value: PracticeLayout) =>
                LAYOUTS.find((item) => item.value === value)?.label ?? value
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {LAYOUTS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>
      <SettingRow label="输入轨迹">
        <Switch
          checked={showTrace}
          onCheckedChange={(checked) => updateSettings({ showTrace: checked })}
          aria-label="输入轨迹"
        />
      </SettingRow>
      <Separator />
      <SettingRow label="显示拼音">
        <Switch
          checked={settings.showPinyin}
          onCheckedChange={(c) => updateSettings({ showPinyin: c })}
          aria-label="显示拼音"
        />
      </SettingRow>
      <SettingRow label="错题优先">
        <Switch
          checked={settings.mistakePriority}
          onCheckedChange={(c) => updateSettings({ mistakePriority: c })}
          aria-label="错题优先"
        />
      </SettingRow>
      <SettingRow label="答对自动下一题">
        <Switch
          checked={settings.autoNext}
          onCheckedChange={(c) => updateSettings({ autoNext: c })}
          aria-label="答对自动下一题"
        />
      </SettingRow>
      <SettingRow label="每组题数">
        <Select
          value={String(settings.questionsPerSession)}
          onValueChange={(v) => updateSettings({ questionsPerSession: Number(v) })}
        >
          <SelectTrigger size="sm" className="w-24" aria-label="每组题数">
            <SelectValue>{(value: string) => `${value} 题`}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {QUESTION_COUNTS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} 题
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>
      <Separator />
      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogTrigger
          className={buttonVariants({ variant: "destructive", size: "sm" })}
        >
          清空记录
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>清空本地记录？</AlertDialogTitle>
            <AlertDialogDescription>
              将清空累计统计与错题记录，不影响当前设置。此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearHistory();
                setClearOpen(false);
              }}
            >
              确认清空
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function MoreSettings() {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleOpenChange =
    (setter: (open: boolean) => void) => (open: boolean) => {
      setter(open);
      if (!open) restorePracticeFocus();
    };

  const triggerClassName = cn(
    buttonVariants({ variant: "outline", size: "icon" }),
    "h-7 w-7 border-border/70 bg-card shadow-none hover:bg-muted/70",
  );

  return (
    <>
      <div className="hidden md:block">
        <Popover open={popoverOpen} onOpenChange={handleOpenChange(setPopoverOpen)}>
          <PopoverTrigger
            className={triggerClassName}
            aria-label="更多设置"
            aria-pressed={popoverOpen}
          >
            <SettingsIcon className="size-3.5" />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 border border-border bg-popover shadow-xl">
            <SettingsPanel />
          </PopoverContent>
        </Popover>
      </div>
      <div className="md:hidden">
        <Drawer open={drawerOpen} onOpenChange={handleOpenChange(setDrawerOpen)}>
          <DrawerTrigger
            className={triggerClassName}
            aria-label="更多设置"
            aria-pressed={drawerOpen}
          >
            <SettingsIcon className="size-3.5" />
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>更多设置</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6">
              <SettingsPanel />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}
