import { expect, test, type Page } from "@playwright/test";

import { getScheme } from "../../data/schemes";
import { encodeSyllable } from "../../lib/shuangpin/encode";

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

async function pressPhysicalWhileComposing(page: Page, key: string) {
  await page.locator("#practice-input").evaluate((input, value) => {
    const key = value as string;
    const code = key === ";" ? "Semicolon" : `Key${key.toUpperCase()}`;
    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Process",
        code,
        bubbles: true,
        cancelable: true,
        isComposing: true,
      }),
    );
  }, key);
}

test("答错后输入立即归零，可直接重输当前字", async ({ page }) => {
  await page.goto("/");
  const input = page.locator("#practice-input");
  await input.waitFor({ state: "attached" });

  const answer = await currentCode(page);
  const wrongKey = guaranteedWrongKey(answer);
  await page.keyboard.type(wrongKey.repeat(2));

  await expect(page.getByText(/^正确\s/)).toBeVisible();
  await expect(input).toHaveValue("");

  await page.keyboard.press(answer[0]);
  await expect(input).toHaveValue(answer[0]);
  await page.keyboard.press(answer[1]);

  await expect(page.getByText(/已练\s*1/)).toBeVisible({ timeout: 2_000 });
  await expect(input).toHaveValue("");
});

test("输入法 composing 状态不会阻断错误后的实体按键重输", async ({ page }) => {
  await page.goto("/");
  const input = page.locator("#practice-input");
  await input.waitFor({ state: "attached" });

  const answer = await currentCode(page);
  const wrongKey = guaranteedWrongKey(answer);
  await page.keyboard.type(wrongKey.repeat(2));
  await expect(input).toHaveValue("");

  await pressPhysicalWhileComposing(page, answer[0]);
  await pressPhysicalWhileComposing(page, answer[1]);

  await expect(page.getByText(/已练\s*1/)).toBeVisible({ timeout: 2_000 });
  await expect(input).toHaveValue("");
});
