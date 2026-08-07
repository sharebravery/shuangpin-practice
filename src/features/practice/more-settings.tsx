"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
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

import { usePracticeStore } from "@/stores/practice-store";

const QUESTION_COUNTS = [10, 15, 20, 30, 50];

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm">{label}</span>
      {children}
    </div>
  );
}

/** 共享的设置面板内容。 */
function SettingsPanel() {
  const settings = usePracticeStore((s) => s.settings);
  const updateSettings = usePracticeStore((s) => s.updateSettings);
  const clearHistory = usePracticeStore((s) => s.clearHistory);
  const [clearOpen, setClearOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
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
            <SelectValue>
              {(value: string) => `${value} 题`}
            </SelectValue>
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
          render={<Button variant="destructive" size="sm" />}
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

/**
 * 更多设置：桌面端 Popover，移动端 Drawer（实现细则 §10.2）。
 */
export function MoreSettings() {
  const trigger = (open: boolean) => (
    <Button
      variant="outline"
      size="icon"
      aria-label="更多设置"
      aria-pressed={open}
    >
      <SettingsIcon className="size-4" />
    </Button>
  );

  return (
    <>
      <div className="hidden md:block">
        <Popover>
          <PopoverTrigger render={trigger(false)} />
          <PopoverContent align="end" className="w-72">
            <SettingsPanel />
          </PopoverContent>
        </Popover>
      </div>
      <div className="md:hidden">
        <Drawer>
          <DrawerTrigger render={trigger(false)} />
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
