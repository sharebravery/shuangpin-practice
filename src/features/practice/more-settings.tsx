"use client";

import { useState } from "react";

import { Switch } from "@/components/ui/switch";
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
import { restorePracticeFocus } from "./practice-input";

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-5">
      <span className="text-sm text-foreground/90">{label}</span>
      {children}
    </div>
  );
}

function SettingsPanel() {
  const settings = usePracticeStore((s) => s.settings);
  const updateSettings = usePracticeStore((s) => s.updateSettings);
  const clearHistory = usePracticeStore((s) => s.clearHistory);
  const [clearOpen, setClearOpen] = useState(false);

  const showTrace = settings.showTrace ?? true;

  return (
    <div className="flex flex-col gap-4">
      <SettingRow label="显示键位图">
        <Switch
          checked={settings.showKeyboard}
          onCheckedChange={(checked) => updateSettings({ showKeyboard: checked })}
          aria-label="显示键位图"
        />
      </SettingRow>

      <SettingRow label="输入轨迹">
        <Switch
          checked={showTrace}
          onCheckedChange={(checked) => updateSettings({ showTrace: checked })}
          aria-label="输入轨迹"
        />
      </SettingRow>

      <SettingRow label="显示拼音">
        <Switch
          checked={settings.showPinyin}
          onCheckedChange={(checked) => updateSettings({ showPinyin: checked })}
          aria-label="显示拼音"
        />
      </SettingRow>

      <Separator className="my-1 opacity-60" />

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogTrigger className="flex w-full items-center justify-center py-1.5 text-center text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
          清除练习记录
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>清除练习记录？</AlertDialogTitle>
            <AlertDialogDescription>
              将清空累计统计和后台错题记录，并重新开始练习；方案与显示设置会保留。
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
              确认清除
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

  const triggerClassName =
    "inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent bg-transparent text-muted-foreground transition-colors hover:bg-[var(--surface)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

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
          <PopoverContent
            align="end"
            className="w-72 border border-border/70 bg-popover/98 shadow-lg"
          >
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
