import { test, expect } from "@playwright/test";

/** 键位图与首屏后的内容层级渲染 */
test("键位图与说明内容渲染", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached", timeout: 10_000 });

  const keyboard = page.getByRole("group", { name: "双拼键位图" });
  await expect(keyboard).toBeVisible();
  const keyCount = await keyboard.locator("button[data-keycap]").count();
  expect(keyCount).toBe(27);

  await expect(page.locator("h1")).toHaveText("在线双拼练习与键位图");
  await expect(page.getByRole("heading", { name: "什么是双拼" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "支持的双拼方案" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "怎么练双拼" })).toBeVisible();

  const accordion = page.locator("[data-slot='accordion']");
  await expect(accordion).toBeVisible();
  const items = await accordion.locator("[data-slot='accordion-item']").count();
  expect(items).toBe(4);
});
