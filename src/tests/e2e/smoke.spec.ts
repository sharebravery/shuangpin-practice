import { test, expect } from "@playwright/test";

/** 基础冒烟测试：验证静态首页、SEO 主标题与运行时无错误。 */
test("首页可打开并渲染产品名称与 SEO 主标题", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/双拼练习/);
  await expect(page.getByText("双拼练习").first()).toBeVisible();
  await expect(page.locator("h1")).toHaveText("在线双拼练习与键位图");
  await expect(page.locator('meta[name="keywords"]')).toHaveCount(0);
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
