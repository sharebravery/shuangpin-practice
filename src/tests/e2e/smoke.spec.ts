import { test, expect } from "@playwright/test";

/** 基础冒烟测试：验证静态首页、SEO 主标题与运行时无错误。 */
test("首页可打开并渲染产品名称与 SEO 主标题", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/珠落/);
  await expect(page.getByText("珠落").first()).toBeVisible();
  await expect(page.locator("h1")).toHaveText("在线双拼练习与键位图");
  await expect(page.locator('meta[name="keywords"]')).toHaveCount(0);
});

test("首页无控制台错误", async ({ page }) => {
  await page.route("**/_vercel/insights/script.js*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "",
    });
  });

  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached", timeout: 10_000 });
  await expect(page.locator('script[src*="/_vercel/insights/script.js"]')).toHaveCount(1);
  await page.waitForTimeout(500);

  expect(errors, errors.join("\n")).toEqual([]);
});
