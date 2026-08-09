import { expect, test } from "@playwright/test";

test("主题只保留三种明确的材料参照", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("界面主题").click();

  await expect(page.getByRole("option", { name: "天青" })).toBeVisible();
  await expect(page.getByRole("option", { name: "朱砂" })).toBeVisible();
  await expect(page.getByRole("option", { name: "玄青" })).toBeVisible();
  await expect(page.getByRole("option", { name: "素笺" })).toHaveCount(0);
});

test("材质暗纹属于页面背景并随页面滚动", async ({ page }) => {
  await page.goto("/");

  const background = await page.evaluate(() => {
    const style = getComputedStyle(document.body);
    return {
      image: style.backgroundImage,
      attachment: style.backgroundAttachment,
    };
  });

  expect(background.image).not.toBe("none");
  expect(
    background.attachment
      .split(",")
      .map((value) => value.trim())
      .every((value) => value === "scroll"),
  ).toBe(true);
});
