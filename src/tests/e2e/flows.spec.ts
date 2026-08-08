import { test, expect } from "@playwright/test";

import { encodeSyllable } from "../../lib/shuangpin/encode";
import { getScheme } from "../../data/schemes";

/** 读取当前题目拼音。 */
async function readPinyin(page: import("@playwright/test").Page): Promise<string> {
  const el = page.locator("span.text-base.text-muted-foreground").first();
  await expect(el).toBeVisible();
  return (await el.textContent()) ?? "";
}

/** 用指定方案输入当前题目的标准答案。 */
async function typeAnswer(page: import("@playwright/test").Page, schemeId: "xiaohe" | "microsoft" | "ziranma" | "sogou") {
  const pinyin = await readPinyin(page);
  const res = encodeSyllable(pinyin, getScheme(schemeId)!);
  expect(res.ok).toBe(true);
  if (!res.ok) return;
  await page.locator("#practice-input").click();
  await page.keyboard.type(res.code);
}

test("用例2：切换方案后使用新编码并重置本组", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ timeout: 10_000 });

  // 切换到微软双拼
  await page.getByLabel("双拼方案").click();
  await page.getByRole("option", { name: "微软双拼" }).click();

  // 本组重置
  await expect(page.getByText(/进度\s*0\s*\/\s*20/)).toBeVisible();

  // 用微软编码完成一题
  await typeAnswer(page, "microsoft");
  await expect(page.getByText(/进度\s*1\s*\/\s*20/)).toBeVisible({ timeout: 5_000 });
});

test("用例3：设置持久化，当前题目与输入不恢复", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 768, "桌面端 Popover 专用");
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ timeout: 10_000 });

  // 打开更多设置（桌面 Popover），关闭显示拼音
  await page.locator("[data-slot='popover-trigger']").click();
  await page.getByLabel("显示拼音").click();
  // 关闭 Popover
  await page.keyboard.press("Escape");

  // 切换为自然码
  await page.getByLabel("双拼方案").click();
  await page.getByRole("option", { name: "自然码双拼" }).click();

  // 刷新
  await page.reload();
  await page.locator("#practice-input").waitFor({ timeout: 10_000 });

  // 方案仍为自然码
  await expect(page.getByLabel("双拼方案")).toContainText("自然码双拼");
  // 拼音仍隐藏
  await expect(page.locator("span.text-base.text-muted-foreground")).toHaveCount(0);
  // 当前输入未恢复
  await expect(page.locator("#practice-input")).toHaveValue("");
});

test.describe("用例4：移动端设置 Drawer", () => {
  test.use({ viewport: { width: 412, height: 915 } });

  test("打开 Drawer 修改题数并完成一题", async ({ page }) => {
    await page.goto("/");
    await page.locator("#practice-input").waitFor({ timeout: 10_000 });

    // 点击更多设置（移动端 Drawer 触发器）-> Drawer 打开
    await page.locator("[data-slot='drawer-trigger']").click();
    await expect(page.getByRole("dialog", { name: "更多设置" })).toBeVisible();

    // 修改每组题数为 10
    await page.getByLabel("每组题数").click();
    await page.getByRole("option", { name: "10 题" }).click();

    // 关闭 Drawer
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "更多设置" })).toBeHidden();

    // 进度变为 /10
    await expect(page.getByText(/进度\s*0\s*\/\s*10/)).toBeVisible();

    // 输入框可聚焦并完成一题
    await typeAnswer(page, "xiaohe");
    await expect(page.getByText(/进度\s*1\s*\/\s*10/)).toBeVisible({ timeout: 5_000 });
  });
});
