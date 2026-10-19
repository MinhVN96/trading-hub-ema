import type { LaunchOptions } from '@playwright/test';

// Dung CHUNG cho ca luc dang nhap (scripts/save-login.ts) va luc chay test (playwright.config.ts):
// session dang nhap tao ra tren trinh duyet nao thi nen dung lai dung trinh duyet do.
//
// - channel 'chrome': Google Chrome that da cai tren may, thay vi Chromium cua Playwright.
// - Tat cac dau hieu "trinh duyet tu dong" (navigator.webdriver, thanh "Chrome is being
//   controlled by automated software"). Khong tat thi TradingView/reCAPTCHA de chan dang nhap.
export const BROWSER_OPTS: LaunchOptions = {
  channel: 'chrome',
  args: ['--disable-blink-features=AutomationControlled'],
  ignoreDefaultArgs: ['--enable-automation'],
};
