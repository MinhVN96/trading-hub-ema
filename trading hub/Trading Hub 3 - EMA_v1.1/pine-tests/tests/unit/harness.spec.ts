// Test cho phan doc log / so golden / mutant. Moi test o day tuong ung mot lan bo test
// tung (hoac co the) bao sai: doc thieu log ma van xanh, golden ghi tu log hong, mutant khong
// duoc ap ma tuong la da ap...
import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '@playwright/test';
import { parseEvents, parseStat, checkComplete, parseBars, checkBars } from '../../utils/parseLogs';
import { diffGolden, toGolden } from '../../utils/compareGolden';
import { MUTANTS, applyMutant } from '../../config/mutants';
import { PINE_ROOT } from '../../utils/readPineFile';

const STAT = 'STAT|lines=10|labels=20|boxes=3|bars=3|first=1000|evt=3|last=3000|bl=1|tick=0.01';
const LOG = [
  'EVT|CHOCH|bull|1000|100.5|0',
  'EVT|OF sinh|D|2000|99.25|4',
  'EVT|OF ve box|D|3000|99.25|4',
  'BARS|0|1000,100,101,99,100.6;2000,100.6,101.2,99.1,100;3000,100,100.5,99.2,99.9',
  STAT,
];

test.describe('parseLogs', () => {
  test('doc du => khong bao loi', () => {
    const stat = parseStat(LOG)!;
    expect(stat).toMatchObject({ evt: 3, last: 3000, bl: 1, tick: 0.01 });
    expect(checkComplete(parseEvents(LOG), stat)).toBeUndefined();
    expect(checkBars(parseBars(LOG), stat)).toBeUndefined();
  });

  test('thieu MOT dong EVT => checkComplete phai bat (loi da tung lot: chi doc 50 dong)', () => {
    const cut = LOG.filter((l) => !l.includes('OF sinh'));
    expect(checkComplete(parseEvents(cut), parseStat(cut)!)).toContain('thieu 1');
  });

  test('dong trung khi cuon bang log ao => chi dem mot lan', () => {
    const dup = [LOG[0], LOG[0], ...LOG.slice(1)];
    expect(parseEvents(dup)).toHaveLength(3);
    expect(checkComplete(parseEvents(dup), parseStat(dup)!)).toBeUndefined();
  });

  test('su kien o nen realtime (sau last) khong tinh vao so phai doc', () => {
    const rt = [...LOG, 'EVT|BOS|bear|4000|98|0'];
    expect(checkComplete(parseEvents(rt), parseStat(rt)!)).toBeUndefined();
  });

  test('BARS: thieu dong, cat cut, nen hong deu bi bat', () => {
    const stat = parseStat(LOG)!;
    expect(checkBars(parseBars(LOG.filter((l) => !l.startsWith('BARS'))), stat)).toContain('Thieu 1/1');
    const cut = LOG.map((l) => (l.startsWith('BARS') ? l.slice(0, l.lastIndexOf(';')) : l));
    expect(checkBars(parseBars(cut), stat)).toContain('Doc 2 nen');
    const bad = LOG.map((l) => (l.startsWith('BARS') ? l.replace('2000,100.6,101.2', '2000,100.6,99.5') : l));
    expect(checkBars(parseBars(bad), stat)).toContain('vo ly');
  });

  test('STAT ban cu (chua co bl/tick) van doc duoc, nhung checkBars bao ro', () => {
    const old = 'STAT|lines=1|labels=1|boxes=1|bars=3|first=1000|evt=0|last=3000';
    const s = parseStat([old])!;
    expect(s.bl).toBeUndefined();
    expect(checkBars({ bars: [], seqs: [] }, s)).toContain('chua ghi BARS');
  });
});

test.describe('compareGolden', () => {
  const ev = parseEvents(LOG);
  const g = toGolden(ev, 0, 9999);

  test('giong het => khong lech', () => {
    expect(diffGolden(g, toGolden(ev, 0, 9999))).toEqual({ missing: [], extra: [] });
  });

  test('doi gia 1 tick => vua MAT vua THUA', () => {
    const changed = g.map((e) => (e.kind === 'CHOCH' ? { ...e, price: '100.51' } : e));
    const d = diffGolden(g, changed);
    expect(d.missing).toHaveLength(1);
    expect(d.extra).toHaveLength(1);
  });

  test('dem theo so lan: 2 su kien giong het ma chi con 1 => bao MAT 1', () => {
    expect(diffGolden([...g, g[1]], g).missing).toHaveLength(1);
  });

  test('loc window gom ca hai dau', () => {
    expect(toGolden(ev, 1000, 2000).map((e) => e.kind)).toEqual(['CHOCH', 'OF sinh']);
  });
});

test.describe('mutants', () => {
  for (const m of MUTANTS) {
    test(`${m.id} ap duoc vao ${m.pineFile} va lam code THAY DOI`, () => {
      const code = fs.readFileSync(path.join(PINE_ROOT, m.pineFile), 'utf8');
      const mutated = applyMutant(code, m);
      expect(mutated).not.toBe(code);
      expect(mutated).toContain(m.replace);
      expect(m.layers.length).toBeGreaterThan(0);
    });
  }

  test('doan find khong ton tai => tu choi, khong am tham chay code goc', () => {
    expect(() => applyMutant('abc', { ...MUTANTS[0], find: 'xyz' })).toThrow(/0 lan/);
  });

  test('id mutant khong trung nhau', () => {
    expect(new Set(MUTANTS.map((m) => m.id)).size).toBe(MUTANTS.length);
  });
});
