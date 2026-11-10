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
    // CHI bam nut "Got it" cua cac bong goi y. TUYET DOI khong bam moi nut "Close" tren trang:
    // nut dong Pine Editor cung ten "Close" — da tung dong mat editor giua test.
    const gotIt = sel.popupGotIt(this.page);
    const n = await gotIt.count();
    for (let i = 0; i < n; i++) {
      await gotIt.nth(i).click({ timeout: 2000 }).catch(() => {});
    }
  }

  legendItem(title: string): Locator {
    return sel.legendItem(this.page, title);
  }

  async waitForStudy(title: string, timeout = 120_000) {
    await expect(this.legendItem(title)).toBeVisible({ timeout });
  }

  /**
   * Noi dung loi runtime (vd vuot gioi han thoi gian tinh cua goi), hoac undefined neu khong loi.
   * Bam vao dau "!" tren legend roi doc chu trong popup hien ra.
   */
  async runtimeError(title: string): Promise<string | undefined> {
    const btn = sel.legendError(this.legendItem(title));
    if (!(await btn.isVisible().catch(() => false))) return undefined;
    await btn.click({ force: true });
    await this.page.waitForTimeout(1500);
    // Popup loi nam trong overlap-manager-root (lop noi cua TradingView).
    const text = await this.page
      .locator('#overlap-manager-root')
      .innerText()
      .catch(() => '');
    await this.page.keyboard.press('Escape');
    return text.replace(/\s+/g, ' ').trim() || '(co dau "!" nhung khong doc duoc noi dung loi)';
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

  /**
   * Bam nut "···" cua PINE EDITOR. Trang co nhieu nut "More" (moi dong legend mot nut, khung
   * Pine logs o che do split-view cung co mot nut) — nut cua editor la nut cung hang, ben phai
   * nut "Publish script". Chon theo toa do vi khong co thuoc tinh nao phan biet duoc.
   */
  private async clickEditorMore() {
    const pub = await sel.publishButton(this.page).boundingBox();
    if (!pub) throw new Error('Khong thay nut "Publish script" — Pine Editor co dang mo khong?');
    const buttons = sel.moreButtons(this.page);
    const n = await buttons.count();
    for (let i = 0; i < n; i++) {
      const b = await buttons.nth(i).boundingBox();
      if (b && b.x > pub.x && Math.abs(b.y + b.height / 2 - (pub.y + pub.height / 2)) < 15) {
        // force: tooltip cua legend hay noi len che mat nut.
        await buttons.nth(i).click({ force: true });
        return;
      }
    }
    throw new Error('Khong thay nut "···" cua Pine Editor canh nut "Publish script"');
  }

  /** Mo bang Pine Logs qua menu "···" cua Pine Editor (editor phai dang mo). */
  async openPineLogs() {
    await this.waitForScriptIdle();
    // Popup "Indicator templates moved here" / quang cao hay de len menu.
    await this.dismissPopups();
    // Che do split-view nho trang thai: bang log co the DA MO san tu lan truoc. Bam menu lan
    // nua co the lai dong no — nen thay bang log roi thi dung luon.
    if (await sel.pineLogsScroller(this.page).isVisible({ timeout: 5000 }).catch(() => false)) return;
    // force: tooltip cua legend hay noi len che mat nut.
    await this.clickEditorMore();
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
        await this.clickEditorMore();
        await sel.pineLogsMenuItem(this.page).click();
      }
    }
    // Bang log cua script nang co the quay loading kha lau truoc khi hien danh sach
    // (da gap tren BNBUSD: >60s).
    await expect(sel.pineLogsScroller(this.page)).toBeVisible({ timeout: 180_000 });
  }

  /**
   * Doc het noi dung bang Pine Logs. Bang la danh sach AO: chi nhung dong dang hien moi co
   * trong DOM, nen phai cuon tu dau den cuoi va gom lai tung doan.
   */
  async readPineLogs(): Promise<string[]> {
    const scroller = sel.pineLogsScroller(this.page);

    // (0) Cho dong STAT xuat hien o CUOI bang. STAT duoc ghi o nen lich su cuoi cung — sau no
    //     chi con su kien cua nen realtime. Chua thay STAT = log van dang do vao (da gap tren
    //     AVXUSD: doc luc bang dang chay, khong co STAT).
    const deadline = Date.now() + 180_000;
    for (;;) {
      const hasStat = await scroller.evaluate(async (el) => {
        el.scrollTop = el.scrollHeight;
        await new Promise((r) => setTimeout(r, 400));
        return (el as HTMLElement).innerText.includes('STAT|');
      });
      if (hasStat) break;
      if (Date.now() > deadline) break; // de buoc sau bao "khong thay STAT" cho ro
      await this.page.waitForTimeout(2000);
    }

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

    // (2) Cuon tu dau toi DAY, chay TRON VEN trong trinh duyet (mot lan evaluate). Ban cu moi
    //     buoc cuon ton 3 luot goi qua lai Playwright <-> trinh duyet; voi bang ~250.000 px
    //     thi vuot gioi han 5 phut cua test (da gap that tren ETHUSD).
    //     Chi dung khi da cham day that su (scrollTop + clientHeight >= scrollHeight).
    return scroller.evaluate(async (el) => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const seen = new Set<string>();
      const out: string[] = [];
      const grab = () => {
        for (const line of (el as HTMLElement).innerText.split('\n')) {
          if (!seen.has(line)) {
            seen.add(line);
            out.push(line);
          }
        }
      };
      el.scrollTop = 0;
      await sleep(300);
      for (let guard = 0; guard < 100_000; guard++) {
        grab();
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
          await sleep(500); // doc lai mot lan sau khi doan cuoi ve xong
          grab();
          break;
        }
        // Buoc 60% chieu cao khung: cac doan doc lien tiep chong len nhau, khong ho dong nao.
        el.scrollTop += el.clientHeight * 0.6;
        await sleep(60);
      }
      return out;
    });
  }
}
