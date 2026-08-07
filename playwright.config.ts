import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright 配置。
 * E2E 测试针对 `next build` 产出的静态 `out/` 目录，
 * 使用 `serve` 提供本地静态服务，验证真实静态导出行为。
 */
export default defineConfig({
  testDir: "./src/tests/e2e",
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: "pnpm exec serve out -l 4321 --no-request-logging",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
