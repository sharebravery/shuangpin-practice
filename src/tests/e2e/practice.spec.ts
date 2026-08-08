import { test, expect } from "@playwright/test";

import { encodeSyllable } from "../../lib/shuangpin/encode";
import { getScheme } from "../../data/schemes";

/**
 * 完成一道单字题（实现细则 §18 用例 1）。
 * 读取展示的拼音，用编码逻辑算出标准答案并输入，验证进度增加。
 */
test("完成一道单字题", async ({ page }) => {
  await page.goto("/");

  const input = page.locator("#practice-input");
  await expect(input).toBeAttached();

  const character = page.locator("[data-practice-character]");
  await expect(character).toBeVisible({ timeout: 10_000 });

  const pinyinEl = page.locator("span.text-sm.text-muted-foreground").first();
  await expect(pinyinEl).toBeVisible();
  const pinyin = (await pinyinEl.textContent()) ?? "";

  const scheme = getScheme("xiaohe")!;
  const res = encodeSyllable(pinyin, scheme);
  expect(res.ok).toBe(true);
  if (!res.ok) return;

  await input.focus();
  await page.keyboard.type(res.code);

  await expect(page.getByText(/进度\s*1\s*\/\s*20/)).toBeVisible({ timeout: 5_000 });
});
