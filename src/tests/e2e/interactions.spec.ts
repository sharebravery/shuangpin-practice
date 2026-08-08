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

/** 新访客默认使用天青主题。 */
test("默认主题为天青", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/clean/);
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

/** 谱面模式保留键位错误反馈，同时显示最高层轨迹点。 */
test("答错时谱面保留按钮反馈和轨迹点", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached", timeout: 10_000 });

  const answer = await currentCharacterCode(page);
  const wrongKey = guaranteedWrongKey(answer);

  await page.keyboard.type(wrongKey.repeat(2));

  const trace = page.locator("[data-input-trace]");
  await expect(trace).toBeVisible({ timeout: 700 });
  await expect(trace.locator("[data-trace-point][data-trace-error='true']")).toHaveCount(2);
  const traceClass = (await trace.getAttribute("class")) ?? "";
  expect(traceClass).toContain("z-[70]");

  const wrongKeyCap = page.locator(`button[data-keycap="${wrongKey}"]`);
  await expect(wrongKeyCap).toHaveAttribute("data-feedback", "error");
  const wrongClass = (await wrongKeyCap.getAttribute("class")) ?? "";
  expect(wrongClass).toContain("bg-[var(--error-soft)]");
  expect(wrongClass).toContain("border-[var(--error)]");
});

/** 实体键盘第一键显示呼吸点，第二键显示完整轨迹且按压反馈仍存在。 */
test("实体键盘输入显示呼吸点和轨迹", async ({ page }) => {
  await page.goto("/");
  const input = page.locator("#practice-input");
  await input.waitFor({ state: "attached", timeout: 10_000 });

  const answer = await currentCharacterCode(page);

  await page.keyboard.press(answer[0]);
  const firstPoint = page.locator("[data-input-trace] [data-trace-point]");
  await expect(firstPoint).toHaveCount(1);
  await expect(firstPoint.locator("circle")).toHaveCount(2);

  const secondKey = page.locator(`button[data-keycap="${answer[1]}"]`);
  await page.keyboard.down(answer[1]);
  await expect(secondKey).toHaveAttribute("data-active", "true");
  await expect(page.locator("[data-input-trace] path")).toBeVisible();
  await page.keyboard.up(answer[1]);
});

/** 极简布局可通过设置选择，并保留完整键位交互。 */
test("可切换到极简布局", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 768, "桌面端 Popover 专用");
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached", timeout: 10_000 });

  await page.locator("[data-slot='popover-trigger']").click();
  await page.getByLabel("界面布局").click();
  await page.getByRole("option", { name: "极简" }).click();
  await page.keyboard.press("Escape");

  const keyboard = page.getByRole("group", { name: "双拼键位图" });
  const keys = keyboard.locator("button[data-keycap]");
  await expect(keys).toHaveCount(27);
  const firstKeyClass = (await keys.first().getAttribute("class")) ?? "";
  expect(firstKeyClass).toContain("h-[76px]");
  expect(firstKeyClass).toContain("border-transparent");
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

/** autoNext=false 时答对后短暂反馈，再自动进入下一题 */
test("autoNext=false -> 答对 -> 自动进入下一题", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 768, "桌面端 Popover 专用");
  await page.goto("/");
  const input = page.locator("#practice-input");
  await input.waitFor({ state: "attached", timeout: 10_000 });

  await page.locator("[data-slot='popover-trigger']").click();
  const autoNextSwitch = page.getByLabel("答对自动下一题");
  await autoNextSwitch.click();
  await expect(autoNextSwitch).not.toBeChecked();
  await page.keyboard.press("Escape");
  await expect(input).toBeFocused();

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
