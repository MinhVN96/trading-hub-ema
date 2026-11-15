// (3) Logic — HAI lop kiem tra doc lap tren CUNG mot lan chay:
//
//   [GOLDEN]   So danh sach su kien (CHoCH, BOS, OF sinh/ve/roi vung/khai thac/huy/xoa) trong
//              mot khoang thoi gian CO DINH voi golden/*.json. Bat "hom nay khac hom truoc".
//   [ORACLE-*] Kiem CHEO: tinh lai tu du lieu nen tho (utils/oracle.ts), khong dung code Pine.
//              Bat "sai luat" — ke ca khi golden cung sai theo. Chay tren TOAN BO lich su.
//
// Oracle dung expect.soft: mot lan chay bao du ca ba lop, de biet lop nao bat duoc gi.
// Rieng khi tao golden (UPDATE_GOLDEN=1) thi oracle la dieu kien BAT BUOC: Pine sai luat thi
// khong duoc ghi golden — golden sai thi test chi con bao ve cai sai.
//
// Tao / cap nhat golden:
//   npm run test:update-golden
// roi MO FILE golden/<ten>.json, doi chieu voi chart.
import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '../fixtures/tv.fixture';
import { scenariosFor } from '../config/scenarios';
import { checkRun } from '../utils/readPineFile';
import { parseEvents, parseStat, checkComplete, parseBars, checkBars } from '../utils/parseLogs';
import { diffGolden, formatDiff, readGolden, toGolden, writeGolden } from '../utils/compareGolden';
import { chochLenFromSource, structureOracle, compareStructure, checkOFRules } from '../utils/oracle';

const UPDATE = process.env.UPDATE_GOLDEN === '1';
const DAY = 24 * 3600_000;
/** Log tho cua lan chay gan nhat — de chay lai oracle offline: npm run oracle -- <file> */
const LOG_DIR = path.join(__dirname, '..', '.cache', 'pine-logs');
const MAX_SHOW = 25;

const list = (xs: string[]) => xs.slice(0, MAX_SHOW).join('\n  ') + (xs.length > MAX_SHOW ? `\n  ... va ${xs.length - MAX_SHOW} dong nua` : '');

for (const s of scenariosFor('logic')) {
  test(`logic: ${s.name}`, async ({ loadScript, chart }) => {
    if (!s.window) throw new Error(`Scenario ${s.name} co check 'logic' nhung thieu window`);
    const from = Date.parse(s.window.from);
    const until = Date.parse(s.window.until);

    const { src, result } = await loadScript(s, { enableE2E: true });
    if (src.mutant) test.info().annotations.push({ type: 'mutant', description: src.mutant });
    expect(result.ok, 'Compile loi — xem compile.spec.ts').toBe(true);
    await chart.waitForScriptIdle();
    const rtErr = await chart.runtimeError(src.shortTitle);
    expect(rtErr, `Indicator LOI RUNTIME tren chart: ${rtErr}`).toBeUndefined();

    await chart.openPineLogs();
    const lines = await chart.readPineLogs();
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.writeFileSync(path.join(LOG_DIR, `${s.name}${src.mutant ? '.' + src.mutant : ''}.log`), lines.join('\n'), 'utf8');

    const stat = parseStat(lines);
    expect(stat, 'Khong thay dong STAT — script chua chay xong hoac loi runtime').toBeDefined();
    const runErr = checkRun(lines, src);
    expect(runErr, runErr).toBeUndefined();

    // Golden / oracle tao tu log doc THIEU thi sai tu goc (da xay ra: BTCUSD/ETHUSD ra 0 su kien) — fail ngay.
    const events = parseEvents(lines);
    const missing = checkComplete(events, stat!);
    expect(missing, missing).toBeUndefined();
    const parsedBars = parseBars(lines);
    const barErr = checkBars(parsedBars, stat!);
    expect(barErr, `Du lieu nen (BARS) cho oracle khong dung: ${barErr}`).toBeUndefined();
    const bars = parsedBars.bars;
    const tick = stat!.tick!;

    // Khoang so sanh phai nam trong du lieu VA da qua giai doan khoi dong cua engine.
    const safeFrom = stat!.first + (s.warmupDays ?? 5) * DAY;
    expect(
      from >= safeFrom,
      `window.from (${s.window.from}) qua sat/truoc nen dau tien chart tai ve ` +
        `(${new Date(stat!.first).toISOString()}). Chart chi giu ~6000 nen gan nhat => ` +
        `doi window sang doan gan hon roi chay "npm run test:update-golden".`,
    ).toBe(true);

    const check = UPDATE ? expect : expect.soft;

    // ---- [ORACLE-CAU-TRUC] tinh lai CHoCH/BOS tu nen tho, so tren toan bo lich su sau warmup ----
    const len = chochLenFromSource(src.code, s.interval);
    const sd = compareStructure(events, structureOracle(bars, len), safeFrom, stat!.last, tick);
    console.log(`[${s.name}] oracle cau truc: so ${sd.compared} CHoCH/BOS (chochLen=${len}) — lech ${sd.missing.length + sd.extra.length}`);
    check(
      sd.missing.length + sd.extra.length,
      `[ORACLE-CAU-TRUC] CHoCH/BOS cua Pine khac ban tinh lai doc lap (chochLen=${len}):\n` +
        (sd.missing.length ? `\nOracle co, Pine KHONG (${sd.missing.length}):\n  ${list(sd.missing)}` : '') +
        (sd.extra.length ? `\nPine co, oracle KHONG (${sd.extra.length}):\n  ${list(sd.extra)}` : ''),
    ).toBe(0);
    check(sd.compared, '[ORACLE-CAU-TRUC] khong co CHoCH/BOS nao de so — oracle khong kiem duoc gi').toBeGreaterThan(0);

    // ---- [ORACLE-OF] luat roi vung / khai thac tren tung nen ----
    const of = checkOFRules(events, bars, tick);
    console.log(`[${s.name}] oracle OF: soi ${of.zones} vung, bo qua ${of.skipped} (gia sat muc vung) — vi pham ${of.violations.length}`);
    check(of.violations, `[ORACLE-OF] ${of.violations.length} vi pham luat OF:\n  ${list(of.violations)}`).toEqual([]);
    check(of.zones, '[ORACLE-OF] khong co vung OF nao de soi').toBeGreaterThan(0);

    // ---- [GOLDEN] ----
    const actual = toGolden(events, from, until);
    console.log(`[${s.name}] nen dau: ${new Date(stat!.first).toISOString()} | tong su kien: ${events.length} | trong window: ${actual.length}`);
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
    expect(diff.missing.length + diff.extra.length, `[GOLDEN] Lech golden:\n\n${formatDiff(diff)}`).toBe(0);
  });
}
