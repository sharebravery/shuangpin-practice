"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

const ORDER = ["light", "dark", "system"] as const;
type ThemeName = (typeof ORDER)[number];
const LABEL: Record<ThemeName, string> = {
  light: "浅色",
  dark: "深色",
  system: "跟随系统",
};

// SSR 安全的挂载检测：服务端返回 false，客户端返回 true，避免 setState-in-effect。
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const current: ThemeName = (theme as ThemeName | undefined) ?? "system";
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
  const Icon =
    current === "dark" ? MoonIcon : current === "system" ? MonitorIcon : SunIcon;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`切换主题，当前${LABEL[current]}`}
            onClick={() => setTheme(next)}
          />
        }
      >
        {/* 未挂载时统一渲染太阳图标，避免与服务端不一致。 */}
        {mounted ? <Icon className="size-4" /> : <SunIcon className="size-4" />}
      </TooltipTrigger>
      <TooltipContent>主题：{mounted ? LABEL[current] : "…"}</TooltipContent>
    </Tooltip>
  );
}
