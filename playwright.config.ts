import { defineConfig } from '@playwright/test';

const landscape = { width: 1180, height: 820 };
const portrait = { width: 820, height: 1180 };
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const chromiumUse = chromiumExecutable ? { browserName: 'chromium' as const, launchOptions: { executablePath: chromiumExecutable } } : { browserName: 'chromium' as const };

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173/business-idea-manager/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    hasTouch: true,
  },
  projects: [
    { name: 'chromium-ipad-landscape', use: { ...chromiumUse, viewport: landscape } },
    { name: 'webkit-ipad-landscape', use: { browserName: 'webkit', viewport: landscape } },
    { name: 'chromium-ipad-portrait', use: { ...chromiumUse, viewport: portrait } },
    { name: 'webkit-ipad-portrait', use: { browserName: 'webkit', viewport: portrait } },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/business-idea-manager/',
    reuseExistingServer: !process.env.CI,
  },
});
