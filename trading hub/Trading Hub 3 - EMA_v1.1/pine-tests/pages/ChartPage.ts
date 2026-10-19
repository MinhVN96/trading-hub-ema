import { expect, type Page, type Locator } from '@playwright/test';
import { sel } from './selectors';

export class ChartPage {
  constructor(readonly page: Page) {}

  /** Mo chart layout test voi symbol + khung cho truoc. */
  async goto(symbol: string, interval: string) {
    const base = process.env.TV_CHART_URL;
    if (!base) throw new Error('Chua dat TV_CHART_URL trong .env (xem .env.example).');
    const url = new URL(base);
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('interval', interval);
    await this.page.goto(url.toString(), { waitUntil: 'domcontentloaded' });
    await expect(sel.chartCanvas(this.page)).toBeVisible({ timeout: 90_000 });
    await this.dismissPopups();
  }

  /** Dong cac popup quang cao / "what's new" de chung khong che nut. */
  async dismissPopups() {
    for (let i = 0; i < 3; i++) await this.page.keyboard.press('Escape');
    const closers = sel.dialogClose(this.page);
    const n = await closers.count();
    for (let i = 0; i < n; i++) {
      await closers.nth(i).click({ timeout: 2000 }).catch(() => {});
    }
  }

  legendItem(title: string): Locator {
    return sel.legendItem(this.page, title);
  }

  async waitForStudy(title: string, timeout = 120_000) {
    await expect(this.legendItem(title)).toBeVisible({ timeout });
  }

  async hasRuntimeError(title: string): Promise<boolean> {
    return sel.legendError(this.legendItem(title)).isVisible().catch(() => false);
  }

  /** Go MOI ban sao cua indicator khoi chart — de lan test sau bat dau tu chart sach. */
  async removeStudy(title: string) {
    for (let guard = 0; guard < 10; guard++) {
      const item = this.legendItem(title);
      if (!(await item.isVisible().catch(() => false))) return;
      await item.hover();
      await sel.legendDelete(item).click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Cho script tinh XONG: khong con vong xoay loading nao dang hien (legend "···", nut compile).
   * Thay cho cho co dinh 10s — cap nang (ETHUSD) can lau hon, va trong luc loading thi vong
   * xoay chan click vao menu (da gap that).
   */
  async waitForScriptIdle(timeout = 180_000) {
    const loaders = sel.loaders(this.page);
    const deadline = Date.now() + timeout;
    let idle = 0;
    // Phai rảnh 3 lan do lien tiep: giua hai buoc tinh co the co mot nhip khong co loader.
    while (idle < 3) {
      if (Date.now() > deadline) throw new Error('Script tinh qua lau — van con loading sau ' + timeout / 1000 + 's');
      idle = (await loaders.count()) === 0 ? idle + 1 : 0;
      await this.page.waitForTimeout(1000);
    }
  }

  /** Mo bang Pine Logs qua menu "···" cua Pine Editor (editor phai dang mo). */
  async openPineLogs() {
    await this.waitForScriptIdle();
    // force: tooltip cua legend hay noi len che mat nut.
    await sel.pineEditorMore(this.page).click({ force: true });
    await sel.pineLogsMenuItem(this.page).click();
    // Khi editor dang o dang OVERLAY, TradingView hoi "Split the view? To access the Pine logs
    // panel, move the editor overlay first" va KHONG mo bang log. Bo qua hop thoai nay thi test
    // doc nham mot bang log cu dang an — da gap that: doc 919/6250 dong tren BNBUSD.
    const split = sel.splitViewButton(this.page);
    if (await split.isVisible({ timeout: 3000 }).catch(() => false)) {
      await split.click();
      await this.page.waitForTimeout(2000);
      // Chuyen xong co the phai chon lai muc Pine logs.
      if (!(await sel.pineLogsScroller(this.page).isVisible().catch(() => false))) {
        await sel.pineEditorMore(this.page).click({ force: true });
        await sel.pineLogsMenuItem(this.page).click();
      }
    }
    await expect(sel.pineLogsScroller(this.page)).toBeVisible();
  }

  /**
   * Doc het noi dung bang Pine Logs. Bang la danh sach AO: chi nhung dong dang hien moi co
   * trong DOM, nen phai cuon tu dau den cuoi va gom lai tung doan.
   */
  async readPineLogs(): Promise<string[]> {
    const scroller = sel.pineLogsScroller(this.page);

    // (1) Cho bang nap XONG: chieu cao danh sach khong doi trong 3 lan do lien tiep.
    //     Truoc day doc ngay sau 3s co dinh => co lan chi doc duoc 50 dong.
    let prevH = -1;
    let stable = 0;
    for (let i = 0; i < 90 && stable < 3; i++) {
      const h = await scroller.evaluate((el) => el.scrollHeight);
      stable = h === prevH ? stable + 1 : 0;
      prevH = h;
      await this.page.waitForTimeout(1000);
    }

    // (2) Cuon tu dau toi DAY. Chi dung khi da cham day that su (scrollTop + clientHeight
    //     >= scrollHeight), khong dung chi vi scrollTop dung yen mot nhip — luc danh sach dang
    //     ve lai thi scrollTop co the dung yen ma chua het.
    await scroller.evaluate((el) => (el.scrollTop = 0));
    await this.page.waitForTimeout(500);
    const chunks: string[] = [];
    for (let guard = 0; guard < 20_000; guard++) {
      chunks.push(await scroller.innerText());
      const atBottom = await scroller.evaluate((el) => el.scrollTop + el.clientHeight >= el.scrollHeight - 2);
      if (atBottom) {
        // Doc them mot lan sau khi danh sach ve xong doan cuoi.
        await this.page.waitForTimeout(500);
        chunks.push(await scroller.innerText());
        break;
      }
      // Buoc 60% chieu cao khung: cac doan doc lien tiep chong len nhau, khong ho dong nao.
      await scroller.evaluate((el) => (el.scrollTop += el.clientHeight * 0.6));
      await this.page.waitForTimeout(120);
    }
    return chunks.join('\n').split('\n');
  }
}
