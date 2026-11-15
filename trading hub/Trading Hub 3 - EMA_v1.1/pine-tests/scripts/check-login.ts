// Kiem tra session da luu con dung khong: mo chart bang session, tim ten tai khoan, chup man hinh.
//
//   npm run check-login [-- <duong dan anh>]
import { chromium } from '@playwright/test';
import * as path from 'path';
import { BROWSER_OPTS } from '../browser';

const STORAGE_STATE = path.join(__dirname, '..', 'auth', 'storageState.json');
const shot = process.argv[2] ?? path.join(__dirname, '..', 'test-results', 'check-login.png');

async function main() {
  const browser = await chromium.launch(BROWSER_OPTS);
  const context = await browser.newContext({ storageState: STORAGE_STATE, locale: 'en-US', viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();
  await page.goto('https://www.tradingview.com/chart/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(12_000);

  // TradingView nhung thong tin user vao trang: khach thi `window.user` khong co username.
  const username = await page
    .evaluate(() => (window as unknown as { user?: { username?: string } }).user?.username ?? null)
    .catch(() => null);
  await page.screenshot({ path: shot });
  await browser.close();

  console.log(`username: ${username ?? '(khong thay — co the la KHACH)'}`);
  console.log(`anh chup: ${shot}`);
  if (!username) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
