import { expect, test, type Page } from "@playwright/test";

import { encodeSyllable } from "../../lib/shuangpin/encode";
import { getScheme } from "../../data/schemes";

async function readPinyin(page: Page): Promise<string> {
  const el = page.locator("[data-practice-pinyin]");
  await expect(el).toBeVisible();
  return (await el.textContent()) ?? "";
}

async function typeAnswer(
  page: Page,
  schemeId: "xiaohe" | "microsoft" | "ziranma" | "sogou",
) {
  const pinyin = await readPinyin(page);
  const result = encodeSyllable(pinyin, getScheme(schemeId)!);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  await page.keyboard.type(result.code);
}

test("切换方案后直接使用新方案继续练习", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached" });

  await page.getByLabel("双拼方案").click();
  await page.getByRole("option", { name: "微软双拼" }).click();
  await expect(page.getByLabel("双拼方案")).toContainText("微软双拼");

  await typeAnswer(page, "microsoft");
  await expect(page.getByText(/已练\s*1/)).toBeVisible({ timeout: 2_000 });
});

test("显示设置和方案持久化，当前输入不恢复", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 768, "桌面端 Popover 专用");
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached" });

  await page.locator("[data-slot='popover-trigger']").click();
  await page.getByLabel("显示拼音").click();
  await page.keyboard.press("Escape");

  await page.getByLabel("双拼方案").click();
  await page.getByRole("option", { name: "自然码双拼" }).click();
  await page.keyboard.press("q");

  await page.reload();
  await page.locator("#practice-input").waitFor({ state: "attached" });

  await expect(page.getByLabel("双拼方案")).toContainText("自然码双拼");
  await expect(page.locator("[data-practice-pinyin]")).toBeHidden();
  await expect(page.locator("#practice-input")).toHaveValue("");
});

test.describe("移动端设置", () => {
  test.use({ viewport: { width: 412, height: 915 } });

  test("Drawer 只提供少量显示设置且关闭后可继续练习", async ({ page }) => {
    await page.goto("/");
    await page.locator("#practice-input").waitFor({ state: "attached" });

    await page.locator("[data-slot='drawer-trigger']").click();
    await expect(page.getByRole("dialog", { name: "更多设置" })).toBeVisible();
    await expect(page.getByLabel("显示键位图")).toBeVisible();
    await expect(page.getByLabel("输入轨迹")).toBeVisible();
    await expect(page.getByLabel("显示拼音")).toBeVisible();
    await expect(page.getByLabel("每组题数")).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "更多设置" })).toBeHidden();

    await typeAnswer(page, "xiaohe");
    await expect(page.getByText(/已练\s*1/)).toBeVisible({ timeout: 2_000 });
  });
});
