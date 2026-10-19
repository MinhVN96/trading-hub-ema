// Mo trinh duyet de ban tu dang nhap TradingView, roi luu session lai cho test dung.
// Chay lai khi test bao session het han.
//
//   npm run login
//
// CACH DUNG: dang nhap xong, cho trang chu hien avatar cua ban, roi TU DONG CUA SO trinh duyet.
// Script chi luu session khi ban dong cua so — khong tu doan "da dang nhap" nua, vi TradingView
// dat cookie `sessionid` ca cho khach chua dang nhap (lan truoc script dong cua so qua som vi vay).
//
// Nen dang nhap bang EMAIL + MAT KHAU. Dang nhap Google thuong bi chan trong trinh duyet
// tu dong ("This browser or app may not be secure").
import { chromium, type BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { BROWSER_OPTS } from '../browser';

const STORAGE_STATE = path.join(__dirname, '..', 'auth', 'storageState.json');
const MAX_WAIT_MS = 15 * 60_000;

async function snapshot(context: BrowserContext): Promise<boolean> {
  try {
    await context.storageState({ path: STORAGE_STATE });
    return true;
  } catch {
    return false; // context da dong
  }
}

/** Mo lai session vua luu (an) va xem TradingView co coi la da dang nhap khong. */
async function verify(): Promise<boolean> {
  const browser = await chromium.launch(BROWSER_OPTS);
  const context = await browser.newContext({ storageState: STORAGE_STATE, locale: 'en-US' });
  const page = await context.newPage();
  await page.goto('https://www.tradingview.com/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  // Trang cua khach co nut "Sign in"; da dang nhap thi khong.
  const guest = await page.getByRole('button', { name: /^sign in$/i }).first().isVisible().catch(() => false);
  await browser.close();
  return !guest;
}

async function main() {
  fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });
  // Xoa session cu (co the la session khach) de khong bi dung nham.
  fs.rmSync(STORAGE_STATE, { force: true });

  const browser = await chromium.launch({ headless: false, ...BROWSER_OPTS });
  const context = await browser.newContext({ locale: 'en-US', viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  await page.goto('https://www.tradingview.com/#signin');

  console.log('1. Dang nhap TradingView trong cua so vua mo.');
  console.log('2. Dang nhap xong thi TU DONG CUA SO trinh duyet — script se luu session.');

  const closed = new Promise<void>((resolve) => page.on('close', () => resolve()));
  const start = Date.now();
  let saved = false;
  // Luu lien tuc moi 3 giay: dong cua so la context mat ngay, khong kip luu luc do nua.
  while (Date.now() - start < MAX_WAIT_MS) {
    if (await snapshot(context)) saved = true;
    const done = await Promise.race([closed.then(() => true), page.waitForTimeout(3000).then(() => false).catch(() => true)]);
    if (done) break;
  }
  await browser.close().catch(() => {});

  if (!saved) throw new Error('Khong luu duoc session.');
  console.log(`Da luu session vao ${STORAGE_STATE}. Dang kiem tra...`);
  if (await verify()) {
    console.log('OK — TradingView nhan session nay la DA DANG NHAP.');
  } else {
    fs.rmSync(STORAGE_STATE, { force: true });
    throw new Error('Session luu duoc nhung TradingView van coi la KHACH. Chay lai "npm run login" va dang nhap het truoc khi dong cua so.');
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
