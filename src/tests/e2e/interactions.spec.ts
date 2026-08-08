import { test, expect } from "@playwright/test";

import { encodeSyllable } from "../../lib/shuangpin/encode";
import { getScheme } from "../../data/schemes";

/** 答错后自动进入下一题 */
test("答错 -> 自动进入下一题", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached", timeout: 10_000 });

  await page.locator("#practice-input").focus();
  await page.keyboard.type("zz");

  await expect(page.getByText(/进度\s*1\s*\/\s*20/)).toBeVisible({ timeout: 5_000 });
});

/** 答错时键位图高亮错误键与正确键 */
test("答错时键位图高亮错误键与正确键", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached", timeout: 10_000 });
  await page.locator("#practice-input").focus();
  await page.keyboard.type("zz");

  // Wait for wrong state: error key has border-[var(--error)] class
  // Use the data-keycap attribute and check for error border class
  const keyboard = page.getByRole("group", { name: "双拼键位图" });
  // z key should have error styling
  const zKey = keyboard.locator("button[data-keycap='z']");
  await expect(zKey).toBeVisible({ timeout: 700 });
  // Check that it has the error class (border-[var(--error)])
  const zClass = await zKey.getAttribute("class") ?? "";
  expect(zClass).toContain("border-[var(--error)]");

  // At least one correct key should have brand border
  const allKeys = keyboard.locator("button[data-keycap]");
  const keyCount = await allKeys.count();
  let hasCorrectKey = false;
  for (let i = 0; i < keyCount; i++) {
    const cls = await allKeys.nth(i).getAttribute("class") ?? "";
    if (cls.includes("border-[var(--brand)]") && !cls.includes("border-[var(--error)]")) {
      hasCorrectKey = true;
      break;
    }
  }
  expect(hasCorrectKey).toBe(true);
});

/** Space 暂停，Space 恢复 */
test("Space -> 暂停 -> Space -> 恢复", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached", timeout: 10_000 });

  await page.locator("#practice-input").focus();
  await page.keyboard.press("Space");
  await expect(page.getByText("已暂停")).toBeVisible();

  await page.keyboard.press("Space");
  await expect(page.getByText("已暂停")).toBeHidden();
  await expect(page.locator("#practice-input")).toBeAttached();
});

/** autoNext=false 时答对后自动进入下一题 */
test("autoNext=false -> 答对 -> 自动进入下一题", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 768, "桌面端 Popover 专用");
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached", timeout: 10_000 });

  await page.locator("[data-slot='popover-trigger']").click();
  await page.getByLabel("答对自动下一题").click();
  await page.keyboard.press("Escape");

  const pinyin = (await page.locator("span.text-sm.text-muted-foreground").first().textContent()) ?? "";
  const res = encodeSyllable(pinyin, getScheme("xiaohe")!);
  expect(res.ok).toBe(true);
  if (!res.ok) return;

  await page.locator("#practice-input").focus();
  await page.keyboard.type(res.code);

  await expect(page.getByText(/进度\s*1\s*\/\s*20/)).toBeVisible({ timeout: 5_000 });
});

/** 关闭桌面 Popover 后重新聚焦练习输入框 */
test("关闭 Popover 后重新聚焦输入框", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 768, "桌面端 Popover 专用");
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached", timeout: 10_000 });

  await page.locator("[data-slot='popover-trigger']").click();
  await expect(page.getByLabel("显示拼音")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("显示拼音")).toBeHidden();

  const pinyin = (await page.locator("span.text-sm.text-muted-foreground").first().textContent()) ?? "";
  const res = encodeSyllable(pinyin, getScheme("xiaohe")!);
  expect(res.ok).toBe(true);
  if (!res.ok) return;

  await page.keyboard.type(res.code);
  await expect(page.getByText(/进度\s*1\s*\/\s*20/)).toBeVisible({ timeout: 5_000 });
});

/** 点击键盘完成 mapping 练习 */
test("点击键盘完成 mapping", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached", timeout: 10_000 });

  await page.getByLabel("练习模式").click();
  await page.getByRole("option", { name: "键位" }).click();

  await page.locator("#practice-input").waitFor({ state: "attached", timeout: 10_000 });

  const display = (await page.locator("span.font-mono.text-4xl, span.font-mono.text-5xl").first().textContent()) ?? "";
  const scheme = getScheme("xiaohe")!;
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

  await page.locator(`button[data-keycap="${answerKey}"]`).click();

  await expect(page.getByText(/进度\s*1\s*\/\s*20/)).toBeVisible({ timeout: 5_000 });
});

/** 点击键盘完成 character 练习 */
test("点击键盘完成 character", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached", timeout: 10_000 });

  const pinyin = (await page.locator("span.text-sm.text-muted-foreground").first().textContent()) ?? "";
  const res = encodeSyllable(pinyin, getScheme("xiaohe")!);
  expect(res.ok).toBe(true);
  if (!res.ok) return;

  for (const key of res.code) {
    await page.locator(`button[data-keycap="${key}"]`).click();
  }

  await expect(page.getByText(/进度\s*1\s*\/\s*20/)).toBeVisible({ timeout: 5_000 });
});
