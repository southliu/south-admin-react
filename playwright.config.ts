import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60000,
  outputDir: '.codex-temp/evidence/browser',
  reporter: [['list'], ['json', { outputFile: '.codex-temp/evidence/browser-results.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:5189',
    channel: process.env.PLAYWRIGHT_CHANNEL,
    locale: 'zh-CN',
    screenshot: 'on',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/test-server.mjs',
    url: 'http://127.0.0.1:5189',
    reuseExistingServer: false,
    timeout: 60000,
  },
});
