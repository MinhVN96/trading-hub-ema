import { defineConfig, devices } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';
import { BROWSER_OPTS } from './browser';

export const STORAGE_STATE = path.join(__dirname, 'auth', 'storageState.json');

if (!fs.existsSync(STORAGE_STATE)) {
  throw new Error(`Chua co ${STORAGE_STATE}. Chay "npm run login" truoc.`);
}

export default defineConfig({
  testDir: './tests',
  // Moi test them/xoa indicator tren CUNG mot chart layout => bat buoc chay tuan tu.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // TradingView tai cham, script 2000+ dong compile + chay 5000 nen mat kha lau.
  timeout: 5 * 60_000,
  expect: { timeout: 60_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    channel: BROWSER_OPTS.channel,
    launchOptions: { args: BROWSER_OPTS.args, ignoreDefaultArgs: BROWSER_OPTS.ignoreDefaultArgs },
    viewport: { width: 1600, height: 900 },
    storageState: STORAGE_STATE,
    // Can quyen clipboard de DAN code vao Pine Editor (go tung ky tu 140KB thi qua cham).
    permissions: ['clipboard-read', 'clipboard-write'],
    locale: 'en-US',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30_000,
    navigationTimeout: 90_000,
  },
});
