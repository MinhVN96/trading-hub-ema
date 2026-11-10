import type { Page, Locator } from '@playwright/test';

// TOAN BO selector cua TradingView nam o day. TradingView doi giao dien kha thuong xuyen —
// test hong vi "khong tim thay phan tu" thi SUA O FILE NAY, khong sua trong test.
//
// Cach tim lai selector dung:
//   npm run codegen      -> mo chart da dang nhap, click vao phan tu, codegen in ra locator.
//
// Moi muc co nhieu phuong an noi bang .or(): uu tien role/text (it doi), roi data-name.
// Cac selector nay CHUA duoc kiem tren TradingView that — lan chay dau tien hay dung
// `npm run test:headed` va sua nhung muc bi sai.

export const sel = {
  // ---- Chart ----
  chartCanvas: (p: Page) => p.locator('.chart-gui-wrapper canvas, .chart-container canvas').first(),

  /**
   * Dong legend cua mot indicator, nhan dien bang shorttitle.
   * Da kiem 2026-10: moi dong legend la mot `toolbar` nam trong `region "Chart #1"`,
   * gom cac nut Hide / Settings / Remove / More.
   */
  legendItem: (p: Page, title: string) =>
    p
      .getByRole('region', { name: /^Chart #/ })
      .getByRole('toolbar')
      .filter({ hasText: title })
      .filter({ has: p.getByRole('button', { name: 'Remove', exact: true }) })
      .first(),

  legendDelete: (item: Locator) => item.getByRole('button', { name: 'Remove', exact: true }),
  legendMore: (item: Locator) => item.getByRole('button', { name: 'More', exact: true }),

  /** Dau "!" do tren legend khi script loi runtime. Da kiem 2026-11: button "Runtime error". */
  legendError: (item: Locator) => item.getByRole('button', { name: 'Runtime error', exact: true }),

  // ---- Pine Editor ----
  // Da kiem 2026-10: nut "Pine" o thanh ben phai.
  pineEditorButton: (p: Page) =>
    p
      .getByRole('button', { name: /^Pine( Editor)?$/i })
      .or(p.locator('[data-name="pine-dialog-button"]'))
      .or(p.locator('[aria-label="Pine"], [aria-label="Pine Editor"]'))
      .first(),

  monaco: (p: Page) => p.locator('.monaco-editor').first(),
  /** Gach chan do cua Monaco = loi compile */
  monacoErrors: (p: Page) => p.locator('.monaco-editor .squiggly-error'),

  addToChartButton: (p: Page) =>
    p
      .getByRole('button', { name: /add to chart|update on chart/i })
      .or(p.locator('[title="Add to chart"], [title="Update on chart"]'))
      .first(),

  /** Vung console ben duoi Pine Editor */
  pineConsole: (p: Page) => p.locator('[class*="console"]').filter({ hasText: /compil|error|added/i }).last(),

  // ---- Pine Logs ----
  // Da kiem 2026-10: Pine Logs mo tu nut "More" (···) cua PINE EDITOR, khong phai cua legend
  // (nut More cua legend bi tooltip gia tri input che, va menu cua no khong co muc nay).
  // Nut "···" cua editor = nut NGAY SAU nut "Publish script". Khong dung "nut More cuoi trang":
  // o che do split-view, khung Pine logs co nut "···" rieng nam sau editor (da gap 2026-11).
  // Nut More cua editor = nut "More" nam CUNG HANG, ben phai nut "Publish script".
  // Viec chon theo toa do lam o ChartPage.clickEditorMore().
  moreButtons: (p: Page) => p.getByRole('button', { name: 'More', exact: true }),
  publishButton: (p: Page) => p.getByRole('button', { name: /publish script/i }).first(),

  pineLogsMenuItem: (p: Page) =>
    p
      .getByRole('menuitem', { name: /pine logs/i })
      .or(p.getByText(/^Pine logs$/i))
      .first(),

  /**
   * Khung cuon cua bang Pine Logs (danh sach ao — phai cuon moi doc het).
   * Da kiem 2026-10: div.logsList-xxx > div.container-xxx (phan duoi -xxx la hash, doi theo ban build).
   */
  // `:visible` bat buoc: DOM co the con giu bang log CU dang an (cua lan mo truoc) — doc nham
  // bang do thi ra thieu log ma khong bao loi gi.
  pineLogsScroller: (p: Page) => p.locator('[class*="logsList-"] > [class*="container-"]:visible').first(),

  /**
   * Loading THAT cua script: dau "···" tren legend khi dang tinh, va nut compile o trang thai
   * `pending-` (nut xam co "•••"). Da kiem 2026-11: script nay mat 30-60s moi tinh xong.
   * KHONG dung `[class*="loader-"]` chung chung: goc duoi trai Pine Editor co mot icon loader
   * TINH (`static-`) luon hien => cho mai khong het.
   */
  loaders: (p: Page) =>
    p.locator('[class*="legend-"] [class*="loader-"]:visible, [class*="pending-"]:visible'),

  /** Hop thoai "Split the view?" hien khi mo Pine logs luc editor dang o dang overlay (2026-10). */
  splitViewButton: (p: Page) => p.getByRole('button', { name: /move editor to split-view/i }),

  // ---- Popup gay nhieu ----
  /** Nut "Got it" cua bong goi y (vd "Indicator templates moved here"). */
  popupGotIt: (p: Page) => p.getByRole('button', { name: /^got it$/i }).filter({ visible: true }),
};
