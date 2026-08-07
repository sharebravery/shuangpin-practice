import { test, expect } from "@playwright/test";

import { encodeSyllable } from "../../lib/shuangpin/encode";
import { getScheme } from "../../data/schemes";

/** 答错后 Enter 进入下一题。 */
test("答错 -> Enter -> 下一题", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ timeout: 10_000 });

  // 输入一个必然错误的编码（z 韵母不存在，"zz" 永不为正确答案）
  await page.locator("#practice-input").click();
  await page.keyboard.type("zz");

  // 进入 wrong 状态，出现「下一题」按钮
  await expect(page.getByRole("button", { name: "下一题" })).toBeVisible({ timeout: 5_000 });

  // Enter -> 下一题，进度增加
  await page.keyboard.press("Enter");
  await expect(page.getByText(/进度\s*1\s*\/\s*20/)).toBeVisible({ timeout: 5_000 });
});

/** 答错时键位图高亮错误键与正确键。 */
test("答错时键位图高亮错误键与正确键", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ timeout: 10_000 });
  await page.locator("#practice-input").click();
  await page.keyboard.type("zz");
  await page.getByRole("button", { name: "下一题" }).waitFor({ timeout: 5_000 });

  const keyboard = page.getByLabel("双拼键位图");
  // 错误键（z）标红
  await expect(keyboard.locator("div.border-destructive")).toHaveCount(1);
  // 正确键标绿（至少 1 个）
  const correctCount = await keyboard.locator("div.border-emerald-500").count();
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
  // 恢复后输入框可用
  await expect(page.locator("#practice-input")).toBeEnabled();
});

/** autoNext=false 时答对后 Enter 进入下一题。 */
test("autoNext=false -> 答对 -> Enter -> 下一题", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 768, "桌面端 Popover 专用");
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ timeout: 10_000 });

  // 打开更多设置，关闭「答对自动下一题」
  await page.locator("[data-slot='popover-trigger']").click();
  await page.getByLabel("答对自动下一题").click();
  await page.keyboard.press("Escape");

  // 读取拼音并输入正确编码
  const pinyin = (await page.locator("span.text-lg.text-muted-foreground").first().textContent()) ?? "";
  const res = encodeSyllable(pinyin, getScheme("xiaohe")!);
  expect(res.ok).toBe(true);
  if (!res.ok) return;

  await page.locator("#practice-input").click();
  await page.keyboard.type(res.code);

  // 正确反馈：出现「下一题」按钮（未自动进入下一题）
  await expect(page.getByRole("button", { name: "下一题" })).toBeVisible({ timeout: 5_000 });

  // Enter -> 下一题
  await page.keyboard.press("Enter");
  await expect(page.getByText(/进度\s*1\s*\/\s*20/)).toBeVisible({ timeout: 5_000 });
});

/** wrong + Space 不触发下一题，wrong + Enter 才进入下一题。 */
test("wrong + Space 不操作，wrong + Enter 进入下一题", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ timeout: 10_000 });

  await page.locator("#practice-input").click();
  await page.keyboard.type("zz");
  const nextBtn = page.getByRole("button", { name: "下一题" });
  await nextBtn.waitFor({ timeout: 5_000 });

  // Space 不触发下一题：仍处于 wrong（下一题按钮仍在、输入框仍禁用）
  await page.keyboard.press("Space");
  await expect(nextBtn).toBeVisible();
  await expect(page.locator("#practice-input")).toBeDisabled();

  // Enter 进入下一题：wrong 结束（下一题按钮消失、输入框可用）
  await page.keyboard.press("Enter");
  await expect(nextBtn).toBeHidden();
  await expect(page.locator("#practice-input")).toBeEnabled();
});

/** 关闭桌面 Popover 后重新聚焦练习输入框（无需点击即可输入）。 */
test("关闭 Popover 后重新聚焦输入框", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 768, "桌面端 Popover 专用");
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ timeout: 10_000 });

  // 打开并关闭 Popover
  await page.locator("[data-slot='popover-trigger']").click();
  await expect(page.getByLabel("显示拼音")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("显示拼音")).toBeHidden();

  // 不点击输入框，直接键盘输入（验证焦点已恢复）
  const pinyin = (await page.locator("span.text-lg.text-muted-foreground").first().textContent()) ?? "";
  const res = encodeSyllable(pinyin, getScheme("xiaohe")!);
  expect(res.ok).toBe(true);
  if (!res.ok) return;
  await page.keyboard.type(res.code);
  await expect(page.getByText(/进度\s*1\s*\/\s*20/)).toBeVisible({ timeout: 5_000 });
});
