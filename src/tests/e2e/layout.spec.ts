import { test, expect } from "@playwright/test";

/** 键位图与折叠面板渲染 */
test("键位图与折叠面板渲染", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ timeout: 10_000 });
  const keyboard = page.getByRole("group", { name: "双拼键位图" });
  await expect(keyboard).toBeVisible();
  const keyCount = await keyboard.locator("button[data-keycap]").count();
  expect(keyCount).toBe(27);
  const accordion = page.locator("[data-slot='accordion']");
  await expect(accordion).toBeVisible();
  const items = await accordion.locator("[data-slot='accordion-item']").count();
  expect(items).toBe(6);
});
