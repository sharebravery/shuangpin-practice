import { expect, test, type Page } from "@playwright/test";

import { getScheme } from "../../data/schemes";
import { encodeSyllable } from "../../lib/shuangpin/encode";

async function currentCharacterCode(page: Page): Promise<string> {
  const pinyin =
    (await page.locator("span.text-sm.text-muted-foreground").first().textContent()) ?? "";
  const res = encodeSyllable(pinyin, getScheme("xiaohe")!);
  expect(res.ok).toBe(true);
  return res.ok ? res.code : "";
}

test("谱面三行键位保持等宽", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached", timeout: 10_000 });

  const widths = await Promise.all(
    ["q", "a", "z"].map((key) =>
      page.locator(`button[data-keycap="${key}"]`).evaluate((el) =>
        (el as HTMLElement).getBoundingClientRect().width,
      ),
    ),
  );

  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
});

test("完成一组使用内联结算且 Enter 继续", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 768, "桌面端 Popover 专用");
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached", timeout: 10_000 });

  await page.locator("[data-slot='popover-trigger']").click();
  await page.getByLabel("每组题数").click();
  await page.getByRole("option", { name: "10 题" }).click();
  await page.keyboard.press("Escape");

  for (let completed = 0; completed < 10; completed += 1) {
    const answer = await currentCharacterCode(page);
    await page.keyboard.type(answer);
    if (completed < 9) {
      await expect(
        page.getByText(new RegExp(`进度\\s*${completed + 1}\\s*\\/\\s*10`)),
      ).toBeVisible({ timeout: 2_000 });
    }
  }

  const panel = page.locator("[data-result-panel]");
  await expect(panel).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /继续下一组/ })).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(panel).toBeHidden();
  await expect(page.getByText(/进度\s*0\s*\/\s*10/)).toBeVisible({ timeout: 2_000 });
  await expect(page.locator("#practice-input")).toBeFocused();
});
