import { test, expect } from "@playwright/test";

import { encodeSyllable } from "../../lib/shuangpin/encode";
import { getScheme } from "../../data/schemes";

/** 答错后自动进入下一题（不再需要 Enter）。 */
test("答错 -> 自动进入下一题", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ timeout: 10_000 });

  await page.locator("#practice-input").click();
  await page.keyboard.type("zz");

  // 800ms 后自动进入下一题，进度增加
  await expect(page.getByText(/进度\s*1\s*\/\s*20/)).toBeVisible({ timeout: 5_000 });
});

/** 答错时键位图高亮错误键与正确键（在 800ms 自动继续窗口内检查）。 */
test("答错时键位图高亮错误键与正确键", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ timeout: 10_000 });
  await page.locator("#practice-input").click();
  await page.keyboard.type("zz");

  const keyboard = page.getByRole("group", { name: "双拼键位图" });
  // 错误键标红（在自动继续前检查）
  await expect(keyboard.locator("button.border-destructive")).toHaveCount(1, { timeout: 700 });
  const correctCount = await keyboard.locator("button.border-emerald-500").count();
  expect(correctCount).toBeGreaterThanOrEqual(1);
});

/** Space 暂停，Space 恢复。 */
test("Space -> 暂停 -> Space -> 恢复", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ timeout: 10_000 });

  await page.locator("#practice-input").click();
  await page.keyboard.press("Space");
  await expect(page.getByText("已暂停")).toBeVisible();

  await page.keyboard.press("Space");
  await expect(page.getByText("已暂停")).toBeHidden();
  await expect(page.locator("#practice-input")).toBeEnabled();
});

/** autoNext=false 时答对后自动进入下一题。 */
test("autoNext=false -> 答对 -> 自动进入下一题", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 768, "桌面端 Popover 专用");
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ timeout: 10_000 });

  await page.locator("[data-slot='popover-trigger']").click();
  await page.getByLabel("答对自动下一题").click();
  await page.keyboard.press("Escape");

  const pinyin = (await page.locator("span.text-base.text-muted-foreground").first().textContent()) ?? "";
  const res = encodeSyllable(pinyin, getScheme("xiaohe")!);
  expect(res.ok).toBe(true);
  if (!res.ok) return;

  await page.locator("#practice-input").click();
  await page.keyboard.type(res.code);

  // 400ms 后自动进入下一题
  await expect(page.getByText(/进度\s*1\s*\/\s*20/)).toBeVisible({ timeout: 5_000 });
});

/** 关闭桌面 Popover 后重新聚焦练习输入框。 */
test("关闭 Popover 后重新聚焦输入框", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 768, "桌面端 Popover 专用");
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ timeout: 10_000 });

  await page.locator("[data-slot='popover-trigger']").click();
  await expect(page.getByLabel("显示拼音")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("显示拼音")).toBeHidden();

  const pinyin = (await page.locator("span.text-base.text-muted-foreground").first().textContent()) ?? "";
  const res = encodeSyllable(pinyin, getScheme("xiaohe")!);
  expect(res.ok).toBe(true);
  if (!res.ok) return;

  await page.keyboard.type(res.code);
  await expect(page.getByText(/进度\s*1\s*\/\s*20/)).toBeVisible({ timeout: 5_000 });
});

/** 点击键盘完成 mapping 练习。 */
test("点击键盘完成 mapping", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ timeout: 10_000 });

  // 切换到 mapping 模式
  await page.getByLabel("练习模式").click();
  await page.getByRole("option", { name: "键位" }).click();

  await page.locator("#practice-input").waitFor({ timeout: 10_000 });

  // 读取当前题目（display 是声母或韵母），找到对应键
  const display = (await page.locator("span.font-mono.text-5xl").first().textContent()) ?? "";
  const scheme = getScheme("xiaohe")!;
  // 在 initials/finals 中找到 display 对应的 key
  let answerKey = "";
  for (const [init, key] of Object.entries(scheme.initials)) {
    if (init === display) { answerKey = key; break; }
  }
  if (!answerKey) {
    for (const [fin, key] of Object.entries(scheme.finals)) {
      if (fin === display) { answerKey = key; break; }
    }
  }
  expect(answerKey).toBeTruthy();

  // 点击对应键位
  await page.locator(`button[aria-label^="键位 ${answerKey}"]`).click();

  // 进度增加
  await expect(page.getByText(/进度\s*1\s*\/\s*20/)).toBeVisible({ timeout: 5_000 });
});

/** 点击键盘完成 character 练习（连续点击两键）。 */
test("点击键盘完成 character", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ timeout: 10_000 });

  // 读取拼音，计算答案
  const pinyin = (await page.locator("span.text-base.text-muted-foreground").first().textContent()) ?? "";
  const res = encodeSyllable(pinyin, getScheme("xiaohe")!);
  expect(res.ok).toBe(true);
  if (!res.ok) return;

  // 依次点击答案的两个键
  for (const key of res.code) {
    await page.locator(`button[aria-label^="键位 ${key}"]`).click();
  }

  await expect(page.getByText(/进度\s*1\s*\/\s*20/)).toBeVisible({ timeout: 5_000 });
});
