// (3) So danh sach su kien (CHoCH, BOS, OF sinh/ve/roi vung/khai thac/huy/xoa) trong mot
// khoang thoi gian CO DINH voi file golden da kiem bang mat.
//
// Tao / cap nhat golden:
//   npm run test:update-golden
// roi MO FILE golden/<ten>.json, doi chieu voi chart. Chi commit khi da chac dung —
// golden sai thi test chi con bao ve cai sai.
import { test, expect } from '../fixtures/tv.fixture';
import { scenariosFor } from '../config/scenarios';
import { parseEvents, parseStat, checkComplete } from '../utils/parseLogs';
import { diffGolden, formatDiff, readGolden, toGolden, writeGolden } from '../utils/compareGolden';

const UPDATE = process.env.UPDATE_GOLDEN === '1';
const DAY = 24 * 3600_000;

for (const s of scenariosFor('logic')) {
  test(`logic: ${s.name}`, async ({ loadScript, chart }) => {
    if (!s.window) throw new Error(`Scenario ${s.name} co check 'logic' nhung thieu window`);
    const from = Date.parse(s.window.from);
    const until = Date.parse(s.window.until);

    const { src, result } = await loadScript(s, { enableE2E: true });
    expect(result.ok, 'Compile loi — xem compile.spec.ts').toBe(true);
    await chart.waitForScriptIdle();
    const rtErr = await chart.runtimeError(src.shortTitle);
    expect(rtErr, `Indicator LOI RUNTIME tren chart: ${rtErr}`).toBeUndefined();

    await chart.openPineLogs();
    const lines = await chart.readPineLogs();
    const stat = parseStat(lines);
    expect(stat, 'Khong thay dong STAT — script chua chay xong hoac loi runtime').toBeDefined();

    // Golden tao tu log doc THIEU thi sai tu goc (da xay ra: BTCUSD/ETHUSD ra 0 su kien) — fail ngay.
    const missing = checkComplete(parseEvents(lines), stat!);
    expect(missing, missing).toBeUndefined();

    // Khoang so sanh phai nam trong du lieu VA da qua giai doan khoi dong cua engine.
    const safeFrom = stat!.first + (s.warmupDays ?? 5) * DAY;
    expect(
      from >= safeFrom,
      `window.from (${s.window.from}) qua sat/truoc nen dau tien chart tai ve ` +
        `(${new Date(stat!.first).toISOString()}). Chart chi giu ~5000 nen gan nhat => ` +
        `doi window sang doan gan hon roi chay "npm run test:update-golden".`,
    ).toBe(true);

    const actual = toGolden(parseEvents(lines), from, until);
    console.log(`[${s.name}] nen dau: ${new Date(stat!.first).toISOString()} | tong su kien: ${parseEvents(lines).length} | trong window: ${actual.length}`);
    expect(actual.length, 'Khong co su kien nao trong window — co the Pine Logs doc thieu').toBeGreaterThan(0);

    if (UPDATE) {
      const p = writeGolden({ scenario: s.name, window: s.window, createdAt: new Date().toISOString(), events: actual });
      test.info().annotations.push({ type: 'golden', description: `Da ghi ${actual.length} su kien vao ${p}` });
      return;
    }

    const golden = readGolden(s.name);
    expect(golden, `Chua co golden/${s.name}.json — chay "npm run test:update-golden"`).toBeDefined();
    expect(golden!.window, 'window trong scenarios.ts khac voi luc tao golden — tao lai golden').toEqual(s.window);

    const diff = diffGolden(golden!.events, actual);
    expect(diff.missing.length + diff.extra.length, `Lech golden:\n\n${formatDiff(diff)}`).toBe(0);
  });
}
