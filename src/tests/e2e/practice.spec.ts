import { test, expect } from "@playwright/test";

import { encodeSyllable } from "../../lib/shuangpin/encode";
import { getScheme } from "../../data/schemes";

/**
 * 完成一道单字题（实现细则 §18 用例 1）。
 * 读取展示的拼音，用编码逻辑算出标准答案并输入，验证进度增加。
 */
test("完成一道单字题", async ({ page }) => {
  await page.goto("/");

  // 等待输入框出现（确认工作区已挂载）。
  const input = page.locator("#practice-input");
  await expect(input).toBeVisible({ timeout: 10_000 });

  // 等待题目渲染（大字号汉字）。
  const character = page.locator("span.text-6xl").first();
  await expect(character).toBeVisible({ timeout: 10_000 });

  // 读取拼音（默认显示拼音）。
  const pinyinEl = page.locator("span.text-base.text-muted-foreground").first();
  await expect(pinyinEl).toBeVisible();
  const pinyin = (await pinyinEl.textContent()) ?? "";

  // 计算小鹤双拼标准答案。
  const scheme = getScheme("xiaohe")!;
  const res = encodeSyllable(pinyin, scheme);
  expect(res.ok).toBe(true);
  if (!res.ok) return;

  // 聚焦输入框并输入答案。
  await input.click();
  await page.keyboard.type(res.code);

  // 进度应增加（0/20 -> 1/20）。
  await expect(page.getByText(/进度\s*1\s*\/\s*20/)).toBeVisible({ timeout: 5_000 });
});
