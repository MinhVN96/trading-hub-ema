import { expect, type Page } from '@playwright/test';
import { sel } from './selectors';
import { ChartPage } from './ChartPage';

export type CompileResult =
  | { ok: true }
  | { ok: false; errors: number; console: string };

export class PineEditorPage {
  constructor(readonly page: Page, readonly chart: ChartPage) {}

  async open() {
    const editor = sel.monaco(this.page);
    if (!(await editor.isVisible().catch(() => false))) {
      await sel.pineEditorButton(this.page).click();
    }
    await expect(editor).toBeVisible();
  }

  /**
   * Thay toan bo code trong editor. Dung clipboard + Ctrl+V vi go tung ky tu
   * 140KB qua cham, va Monaco tu dong dong ngoac / thut le khi go se lam hong code.
   */
  async setCode(code: string) {
    const firstLine = code.split(/\r?\n/)[0].trim();
    for (let attempt = 1; attempt <= 3; attempt++) {
      await this.page.evaluate((text) => navigator.clipboard.writeText(text), code);
      const editor = sel.monaco(this.page);
      await editor.click();
      await this.page.keyboard.press('Control+A');
      await this.page.keyboard.press('Delete');
      await this.page.keyboard.press('Control+V');
      // Cho Monaco xu ly xong lan dan lon, VA cho qua thoi diem TradingView tu nap script mau
      // "My script" vao editor ngay sau khi tai trang — no co the ghi de len code vua dan
      // (da gap that: test add nham "My script" len chart).
      await this.page.waitForTimeout(3000);
      if ((await this.firstVisibleLine()) === firstLine) return;
    }
    throw new Error(`Dan code that bai 3 lan: dong dau editor khong phai "${firstLine}"`);
  }

  /** Dong DAU TIEN cua editor (Monaco chi render dong dang hien nen phai cuon len dau truoc). */
  private async firstVisibleLine(): Promise<string> {
    await this.page.keyboard.press('Control+Home');
    await this.page.waitForTimeout(300);
    const lines = this.page.locator('.monaco-editor .view-lines .view-line');
    // Cac .view-line khong xep theo thu tu DOM ma theo `top` — lay dong co top nho nhat.
    const texts = await lines.evaluateAll((els) =>
      els
        .map((e) => ({ top: parseFloat((e as HTMLElement).style.top || '0'), text: (e.textContent || '').replace(/ /g, ' ') }))
        .sort((a, b) => a.top - b.top)
        .map((x) => x.text.trim()),
    );
    return texts[0] ?? '';
  }

  /**
   * Bam "Add to chart" va cho den khi: indicator hien tren legend (compile OK),
   * hoac Monaco gach do (compile loi) — cai nao den truoc.
   */
  async addToChart(shortTitle: string, timeout = 120_000): Promise<CompileResult> {
    const btn = sel.addToChartButton(this.page);
    if (await btn.isVisible().catch(() => false)) await btn.click();
    else await this.page.keyboard.press('Control+Enter');

    const legend = this.chart.legendItem(shortTitle);
    const errors = sel.monacoErrors(this.page);
    // .first(): neu ca hai cung xuat hien thi .or() khop 2 phan tu => loi strict mode.
    await expect(legend.or(errors.first()).first()).toBeVisible({ timeout });

    const n = await errors.count();
    if (n === 0) return { ok: true };
    // Gach do hien TRUOC khi console in xong dong bao loi — doi them de doc duoc ca dong do.
    await this.page.waitForTimeout(3000);
    const consoleText = await sel.pineConsole(this.page).innerText().catch(() => '(khong doc duoc console)');
    return { ok: false, errors: n, console: consoleText };
  }
}
