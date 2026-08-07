"use client";

import { useEffect } from "react";

import { usePracticeStore } from "@/stores/practice-store";

/**
 * 在客户端挂载后手动触发 Zustand persist 恢复。
 * Store 配置了 skipHydration，保证静态导出预渲染与首次客户端渲染一致，
 * 恢复完成后 hasHydrated 置 true（见 practice-store onRehydrateStorage）。
 */
export function StoreHydration() {
  useEffect(() => {
    usePracticeStore.persist.rehydrate();
  }, []);
  return null;
}
