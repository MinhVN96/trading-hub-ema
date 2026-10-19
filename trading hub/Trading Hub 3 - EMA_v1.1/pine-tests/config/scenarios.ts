// Danh sach case can test. Them mot dong la them mot case — khong can sua file test.

export type Check = 'compile' | 'runtime' | 'logic';

export interface Scenario {
  /** Ten duy nhat — cung la ten file golden/<name>.json */
  name: string;
  /** Ten file .pine, tinh tu PINE_ROOT (mac dinh thu muc cha cua pine-tests) */
  pineFile: string;
  symbol: string;
  /** Interval theo URL TradingView: "15", "60", "240", "D"... */
  interval: string;
  checks: Check[];
  /**
   * Chi cho 'logic': khoang thoi gian (UTC) dem so voi golden.
   * Phai nam TRONG du lieu chart tai ve VA cach nen dau tien it nhat `warmupDays`, vi
   * engine cau truc/OF can mot doan lich su de on dinh. Chart chi tai ~5000 nen gan nhat,
   * nen theo thoi gian khoang nay se troi ra ngoai — luc do test bao ro, va ban tao
   * golden moi cho khoang gan hon.
   */
  window?: { from: string; until: string };
  warmupDays?: number;
}

// Cac cap trong watchlist "Red List" cua tai khoan test — san IC Markets (tien to `IC:`).
// Them / bot cap thi sua o day, khong can dong vao file test.
export const RED_LIST = ['BTCUSD', 'ETHUSD', 'SOLUSD', 'LNKUSD', 'XRPUSD', 'BNBUSD', 'AVXUSD'];

// Khoang so sanh golden, dung chung cho moi cap. Chart 15m tai ~6500 nen (~68 ngay) => khoang
// nay se troi ra ngoai du lieu sau vai tuan; test logic bao ro luc do.
// SUA thanh mot doan ban da tu kiem bang mat.
const WINDOW_15M = { from: '2026-09-20T00:00:00Z', until: '2026-10-01T00:00:00Z' };

export const SCENARIOS: Scenario[] = [
  // Ban cu: chua co cong tac e2eLog nen chi kiem tra compile.
  {
    name: 'v1.1_IC-BTCUSD_15m',
    pineFile: 'Trading_Hub_3_v1.1.pine',
    symbol: 'IC:BTCUSD',
    interval: '15',
    checks: ['compile'],
  },
  ...RED_LIST.map(
    (sym, i): Scenario => ({
      name: `v1.11_IC-${sym}_15m`,
      pineFile: 'Trading_Hub_3_v1.11_LuxAlgo.pine',
      symbol: `IC:${sym}`,
      interval: '15',
      // compile chi can mot lan cho moi file .pine — gan vao cap dau tien.
      checks: i === 0 ? ['compile', 'runtime', 'logic'] : ['runtime', 'logic'],
      window: WINDOW_15M,
      warmupDays: 5,
    }),
  ),
];

export const scenariosFor = (check: Check) => SCENARIOS.filter((s) => s.checks.includes(check));
