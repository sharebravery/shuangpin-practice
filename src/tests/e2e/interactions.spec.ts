import { expect, test, type Page } from "@playwright/test";

import { encodeSyllable } from "../../lib/shuangpin/encode";
import { getScheme } from "../../data/schemes";

const PRACTICE_KEYS = [
  "q", "w", "e", "r", "t", "y", "u", "i", "o", "p",
  "a", "s", "d", "f", "g", "h", "j", "k", "l", ";",
  "z", "x", "c", "v", "b", "n", "m",
];

async function currentCode(page: Page): Promise<string> {
  const pinyin = (await page.locator("[data-practice-pinyin]").textContent()) ?? "";
  const encoded = encodeSyllable(pinyin, getScheme("xiaohe")!);
  expect(encoded.ok).toBe(true);
  return encoded.ok ? encoded.code : "";
}

function guaranteedWrongKey(answer: string): string {
  return PRACTICE_KEYS.find((key) => !answer.includes(key)) ?? "q";
}

async function openDesktopSettings(page: Page) {
  await page.locator("[data-slot='popover-trigger']").click();
}

test("默认主题为天青", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/clean/);
});

test("打开页面即可连续练习，答对后直接进入下一题", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached" });

  const answer = await currentCode(page);
  await page.keyboard.type(answer);

  await expect(page.getByText(/已练\s*1/)).toBeVisible({ timeout: 2_000 });
  await expect(page.locator("[data-result-panel]")).toHaveCount(0);
  await expect(page.locator("#practice-input")).toBeFocused();
});

test("答错时给出正确键位、呼吸灯和轻量拆解，然后自动继续", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached" });

  const answer = await currentCode(page);
  const wrongKey = guaranteedWrongKey(answer);
  await page.keyboard.type(wrongKey.repeat(2));

  const wrongFeedback = page.getByText(/^正确\s/);
  await expect(wrongFeedback).toBeVisible();
  await expect(wrongFeedback).toContainText("→");
  for (const key of new Set(answer.split(""))) {
    await expect(
      page.locator(`button[data-keycap="${key}"] [data-correct-guide]`),
    ).toBeVisible({ timeout: 500 });
  }

  await expect(page.getByText(/已练\s*1/)).toBeVisible();
  await expect(wrongFeedback).toBeHidden({ timeout: 2_000 });
});

test("实体键盘输入显示呼吸点和完整轨迹", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached" });

  const answer = await currentCode(page);
  await page.keyboard.press(answer[0]);
  await expect(page.locator("[data-input-trace] [data-trace-point]")).toHaveCount(1);

  await page.keyboard.press(answer[1]);
  await expect(page.locator("[data-input-trace] path")).toBeVisible();
});

test("失焦后仍可直接继续输入", async ({ page }) => {
  await page.goto("/");
  const input = page.locator("#practice-input");
  await input.waitFor({ state: "attached" });

  const answer = await currentCode(page);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.type(answer);

  await expect(page.getByText(/已练\s*1/)).toBeVisible({ timeout: 2_000 });
});

test("切换主题后自动回到练习焦点", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached" });

  await page.getByLabel("界面主题").click();
  await page.getByRole("option", { name: "朱砂" }).click();
  await expect(page.locator("html")).toHaveClass(/ink/);
  await expect(page.locator("#practice-input")).toBeFocused();
});

test("玄青保持明确的暗调主题", async ({ page }) => {
  await page.goto("/");
  const lightBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  await page.getByLabel("界面主题").click();
  await page.getByRole("option", { name: "玄青" }).click();
  await expect(page.locator("html")).toHaveClass(/graphite/);

  const darkBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(darkBackground).not.toBe(lightBackground);
  const channels = darkBackground.match(/\d+/g)?.slice(0, 3).map(Number) ?? [];
  expect(channels).toHaveLength(3);
  expect(channels.reduce((sum, channel) => sum + channel, 0) / 3).toBeLessThan(70);
});

test("Space 暂停，再按 Space 恢复", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached" });

  await page.keyboard.press("Space");
  await expect(page.getByText("已暂停")).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByText("已暂停")).toBeHidden();
});

test("设置只保留真正需要的少量选项", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 768, "桌面端 Popover 专用");
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached" });
  await openDesktopSettings(page);

  await expect(page.getByLabel("界面布局")).toHaveCount(0);
  await expect(page.getByLabel("显示键位图")).toBeVisible();
  await expect(page.getByLabel("输入轨迹")).toBeVisible();
  await expect(page.getByLabel("显示拼音")).toBeVisible();
  await expect(page.getByLabel("每组题数")).toHaveCount(0);
  await expect(page.getByLabel("答对自动下一题")).toHaveCount(0);
  await expect(page.getByLabel("错题优先")).toHaveCount(0);
});

test("可以隐藏键位图，练习本身不中断", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 768, "桌面端 Popover 专用");
  await page.goto("/");
  const input = page.locator("#practice-input");
  await input.waitFor({ state: "attached" });
  await expect(page.getByRole("group", { name: "双拼键位图" })).toBeVisible();

  await openDesktopSettings(page);
  await page.getByLabel("显示键位图").click();
  await expect(page.getByRole("group", { name: "双拼键位图" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(input).toBeFocused();

  const answer = await currentCode(page);
  await page.keyboard.type(answer);
  await expect(page.getByText(/已练\s*1/)).toBeVisible({ timeout: 2_000 });
});

test("谱面和键盘作为主练习视图直接切换", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached" });

  const layoutSwitch = page.getByRole("group", { name: "键位布局" });
  await expect(layoutSwitch).toBeVisible();
  await expect(layoutSwitch.getByRole("button", { name: "谱面" })).toHaveAttribute("aria-pressed", "true");
  await expect(layoutSwitch.getByRole("button", { name: "键盘" })).toBeVisible();
  await expect(layoutSwitch.getByRole("button", { name: "极简" })).toHaveCount(0);

  await layoutSwitch.getByRole("button", { name: "键盘" }).click();
  await expect(layoutSwitch.getByRole("button", { name: "键盘" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#practice-input")).toBeFocused();
});

test("谱面三行键位保持等宽且最后一行自身视觉居中", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached" });

  const q = await page.locator('button[data-keycap="q"]').boundingBox();
  const a = await page.locator('button[data-keycap="a"]').boundingBox();
  const zLocator = page.locator('button[data-keycap="z"]');
  const mLocator = page.locator('button[data-keycap="m"]');
  const z = await zLocator.boundingBox();
  const m = await mLocator.boundingBox();
  const bottomRow = await zLocator.locator("..").boundingBox();
  expect(q && a && z && m && bottomRow).toBeTruthy();
  expect(Math.abs(q!.width - a!.width)).toBeLessThan(1);
  expect(Math.abs(q!.width - z!.width)).toBeLessThan(1);

  const keysCenter = (z!.x + m!.x + m!.width) / 2;
  const rowCenter = bottomRow!.x + bottomRow!.width / 2;
  expect(Math.abs(keysCenter - rowCenter)).toBeLessThan(2);
});

test("谱面和键盘共用同一套键位尺寸", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached" });

  const scoreKey = await page.locator('button[data-keycap="q"]').boundingBox();
  expect(scoreKey).toBeTruthy();

  const layoutSwitch = page.getByRole("group", { name: "键位布局" });
  await layoutSwitch.getByRole("button", { name: "键盘" }).click();

  const keyboardKey = await page.locator('button[data-keycap="q"]').boundingBox();
  expect(keyboardKey).toBeTruthy();
  expect(Math.abs(scoreKey!.width - keyboardKey!.width)).toBeLessThan(1);
  expect(Math.abs(scoreKey!.height - keyboardKey!.height)).toBeLessThan(1);
});

test("响应式键位保持可用尺寸", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached" });

  const key = await page.locator('button[data-keycap="q"]').boundingBox();
  expect(key).toBeTruthy();
  expect(key!.width).toBeGreaterThanOrEqual(64);
  expect(key!.width).toBeLessThanOrEqual(90);
  expect(key!.height).toBeGreaterThanOrEqual(76);
  expect(key!.height).toBeLessThanOrEqual(98);
});

test("词组某字答错后继续同一词组的下一个字", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached" });

  await page.getByLabel("练习模式").click();
  await page.getByRole("option", { name: "词组" }).click();

  const phrase = page.locator("[data-practice-phrase]");
  await expect(phrase).toHaveAttribute("data-phrase-index", "0");
  const text = (await phrase.textContent()) ?? "";
  test.skip([...text].length < 2, "当前词组不足两个字");

  const answer = await currentCode(page);
  const wrongKey = guaranteedWrongKey(answer);
  await page.keyboard.type(wrongKey.repeat(2));

  await expect(phrase).toHaveAttribute("data-phrase-index", "0");
  await expect(phrase).toHaveAttribute("data-phrase-index", "1", { timeout: 2_000 });
  await expect(phrase).toHaveText(text);
});
