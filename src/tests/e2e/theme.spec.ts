import { expect, test } from "@playwright/test";

test("主题只保留四种明确的材料参照", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("界面主题").click();

  await expect(page.getByRole("option", { name: "天青" })).toBeVisible();
  await expect(page.getByRole("option", { name: "朱砂" })).toBeVisible();
  await expect(page.getByRole("option", { name: "玄青" })).toBeVisible();
  await expect(page.getByRole("option", { name: "素笺" })).toBeVisible();
});

test("素笺呈现独立的纸张刊物材质并保持练习焦点", async ({ page }) => {
  await page.goto("/");
  await page.locator("#practice-input").waitFor({ state: "attached" });

  const defaultBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.getByLabel("界面主题").click();
  await page.getByRole("option", { name: "素笺" }).click();

  await expect(page.locator("html")).toHaveClass(/paper/);
  await expect(page.locator("#practice-input")).toBeFocused();

  const paper = await page.evaluate(() => ({
    background: getComputedStyle(document.body).backgroundColor,
    image: getComputedStyle(document.body).backgroundImage,
  }));
  expect(paper.background).not.toBe(defaultBackground);
  expect(paper.image).toContain("repeating-linear-gradient");
});
