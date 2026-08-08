import { test, expect } from "@playwright/test";

/**
 * Phase 1 冒烟测试：验证 Playwright 能打开静态导出首页。
 * Phase 6 会补充完整的关键用户流程。
 */
test("首页可打开并渲染产品名称", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/双拼练习/);
  await expect(page.getByText("双拼练习").first()).toBeVisible();
});

test("首页无控制台错误", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached", timeout: 10_000 });
  await page.waitForTimeout(500);

  expect(errors, errors.join("\n")).toEqual([]);
});
