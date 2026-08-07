import { test, expect } from "@playwright/test";

test("键位图与折叠面板渲染", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ timeout: 10_000 });
  // 键位图：3 行共 27 键（含分号）
  const keyboard = page.getByLabel("双拼键位图");
  await expect(keyboard).toBeVisible();
  const keyCount = await keyboard.locator("div.border").count();
  expect(keyCount).toBe(27);
  // 折叠面板：6 项
  const accordion = page.locator("[data-slot='accordion']");
  await expect(accordion).toBeVisible();
  const items = await accordion.locator("[data-slot='accordion-item']").count();
  expect(items).toBe(6);
});
