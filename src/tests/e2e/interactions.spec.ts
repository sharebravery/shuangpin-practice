import { test, expect, type Page } from "@playwright/test";

import { encodeSyllable } from "../../lib/shuangpin/encode";
import { getScheme } from "../../data/schemes";

const PRACTICE_KEYS = [
  "q", "w", "e", "r", "t", "y", "u", "i", "o", "p",
  "a", "s", "d", "f", "g", "h", "j", "k", "l", ";",
  "z", "x", "c", "v", "b", "n", "m",
];

async function currentCharacterCode(page: Page): Promise<string> {
  const pinyin =
    (await page.locator("span.text-sm.text-muted-foreground").first().textContent()) ?? "";
  const res = encodeSyllable(pinyin, getScheme("xiaohe")!);
  expect(res.ok).toBe(true);
  return res.ok ? res.code : "";
}

function guaranteedWrongKey(answer: string): string {
  return PRACTICE_KEYS.find((key) => !answer.includes(key)) ?? "q";
}

/** 新访客默认使用纸墨主题。 */
test("默认主题为纸墨", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/ink/);
});

/** 答错后自动进入下一题 */
test("答错 -> 自动进入下一题", async ({ page }) => {
  await page.goto("/");
  const input = page.locator("#practice-input");
  await input.waitFor({ state: "attached", timeout: 10_000 });

  const answer = await currentCharacterCode(page);
  const wrongKey = guaranteedWrongKey(answer);

  await page.keyboard.type(wrongKey.repeat(2));

  await expect(page.getByText(/进度\s*1\s*\/\s*20/)).toBeVisible({ timeout: 5_000 });
});

/** 谱面模式答错时用轨迹点反馈，不让整个键位变红。 */
test("答错时谱面显示错误轨迹点", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached", timeout: 10_000 });

  const answer = await currentCharacterCode(page);
  const wrongKey = guaranteedWrongKey(answer);

  await page.keyboard.type(wrongKey.repeat(2));

  const trace = page.locator("[data-input-trace]");
  await expect(trace).toBeVisible({ timeout: 700 });
  await expect(trace.locator("[data-trace-point][data-trace-error='true']")).toHaveCount(2);

  const wrongKeyCap = page.locator(`button[data-keycap="${wrongKey}"]`);
  await expect(wrongKeyCap).toHaveAttribute("data-feedback", "error");
  const wrongClass = (await wrongKeyCap.getAttribute("class")) ?? "";
  expect(wrongClass).not.toContain("bg-[var(--error-soft)]");
  expect(wrongClass).not.toContain("border-[var(--error)]");
});

/** 实体键盘第一键显示点，第二键显示完整轨迹且按压反馈仍存在。 */
test("实体键盘输入显示点和轨迹", async ({ page }) => {
  await page.goto("/");
  const input = page.locator("#practice-input");
  await input.waitFor({ state: "attached", timeout: 10_000 });

  const answer = await currentCharacterCode(page);

  await page.keyboard.press(answer[0]);
  await expect(page.locator("[data-input-trace] [data-trace-point]")).toHaveCount(1);

  const secondKey = page.locator(`button[data-keycap="${answer[1]}"]`);
  await page.keyboard.down(answer[1]);
  await expect(secondKey).toHaveAttribute("data-active", "true");
  await expect(page.locator("[data-input-trace] path")).toBeVisible();
  await page.keyboard.up(answer[1]);
});

/** 即使隐藏输入框失焦，实体键盘仍直接进入练习并自动下一题。 */
test("失焦后实体键盘仍可继续练习", async ({ page }) => {
  await page.goto("/");
  const input = page.locator("#practice-input");
  await input.waitFor({ state: "attached", timeout: 10_000 });

  const answer = await currentCharacterCode(page);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await expect(input).not.toBeFocused();

  await page.keyboard.type(answer);
  await expect(page.getByText(/进度\s*1\s*\/\s*20/)).toBeVisible({ timeout: 5_000 });
});

/** 切换主题后应自动回到练习输入，不需要用户再点页面。 */
test("切换主题后可直接继续输入", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached", timeout: 10_000 });

  const answer = await currentCharacterCode(page);

  await page.getByLabel("界面主题").click();
  await page.getByRole("option", { name: "石墨" }).click();
  await expect(page.locator("html")).toHaveClass(/graphite/);
  await expect(page.locator("#practice-input")).toBeFocused();

  await page.keyboard.type(answer);
  await expect(page.getByText(/进度\s*1\s*\/\s*20/)).toBeVisible({ timeout: 5_000 });
});

/** Space 暂停，Space 恢复 */
test("Space -> 暂停 -> Space -> 恢复", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached", timeout: 10_000 });

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

  const answer = await currentCharacterCode(page);

  await page.keyboard.type(answer);

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

  const answer = await currentCharacterCode(page);

  await page.keyboard.type(answer);
  await expect(page.getByText(/进度\s*1\s*\/\s*20/)).toBeVisible({ timeout: 5_000 });
});

/** 点击键盘完成 mapping 练习 */
test("点击键盘完成 mapping", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached", timeout: 10_000 });

  await page.getByLabel("练习模式").click();
  await page.getByRole("option", { name: "键位" }).click();

  await page.locator("#practice-input").waitFor({ state: "attached", timeout: 10_000 });

  const display =
    (await page.locator("span.font-mono.text-4xl, span.font-mono.text-5xl").first().textContent()) ?? "";
  const scheme = getScheme("xiaohe")!;
  let answerKey = "";
  for (const [init, key] of Object.entries(scheme.initials)) {
    if (init === display) {
      answerKey = key;
      break;
    }
  }
  if (!answerKey) {
    for (const [fin, key] of Object.entries(scheme.finals)) {
      if (fin === display) {
        answerKey = key;
        break;
      }
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

  const answer = await currentCharacterCode(page);

  for (const key of answer) {
    await page.locator(`button[data-keycap="${key}"]`).click();
  }

  await expect(page.getByText(/进度\s*1\s*\/\s*20/)).toBeVisible({ timeout: 5_000 });
});
