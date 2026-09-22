import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 180_000,
  use: {
    baseURL: process.env.TEAMFIT_UI_URL ?? "http://localhost:3000",
    ...devices["Desktop Chrome"],
    channel: "chrome",
    actionTimeout: 20_000,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  expect: { timeout: 20_000 },
  workers: 1,
  retries: 0,
});
