// Test CHO BO KIEM TRA: oracle phai dung tren du lieu ma ket qua da tinh TAY truoc.
// Neu oracle sai thi no se bao sai ca Pine — nen no phai duoc kiem truoc khi duoc tin.
// Chay offline, vai giay, khong mo trinh duyet:  npm run test:unit
import { test, expect } from '@playwright/test';
import { structureOracle, compareStructure, checkOFRules, chochLenFromSource } from '../../utils/oracle';
import type { Bar, PineEvent } from '../../utils/parseLogs';

const T0 = Date.parse('2026-09-01T00:00:00Z');
const STEP = 15 * 60_000;
const t = (i: number) => T0 + i * STEP;
const mk = (rows: [number, number, number][]): Bar[] =>
  rows.map(([h, l, c], i) => ({ time: t(i), open: l, high: h, low: l, close: c }));

test.describe('oracle cau truc (CHoCH/BOS)', () => {
  // Chuoi 15 nen, length = 2. Ket qua tinh tay tung nen (xem ghi chu ben phai):
  const bars = mk([
    [10, 9, 9.5], //  0
    [12, 11, 11.5], //  1
    [14, 13, 13.5], //  2  swing day 9 (nen 0)
    [12, 11, 11.5], //  3
    [10, 9, 9.5], //  4  swing dinh 14 (nen 2)
    [11, 10, 10.5], //  5
    [13, 12, 12.5], //  6  swing day 9 (nen 4)
    [15, 14, 14.8], //  7  dong 14.8 > 14  => CHoCH tang (bias dang giam)
    [14.9, 8, 8.5], //  8  dong 8.5 < 9    => CHoCH giam
    [8.8, 7, 7.2], //  9  swing dinh 15 (nen 7); day 9 da pha roi => khong bao lai
    [9, 7.5, 8.8], // 10
    [16, 8.5, 15.8], // 11  swing day 7; dong 15.8 > 15 => CHoCH tang
    [15, 14, 14.2], // 12
    [14.5, 13, 13.2], // 13  swing dinh 16 (nen 11)
    [17, 13, 16.5], // 14  dong 16.5 > 16, bias dang tang => BOS tang
  ]);

  test('khop ket qua tinh tay', () => {
    expect(structureOracle(bars, 2)).toEqual([
      { kind: 'CHOCH', side: 'bull', time: t(7), price: 14 },
      { kind: 'CHOCH', side: 'bear', time: t(8), price: 9 },
      { kind: 'CHOCH', side: 'bull', time: t(11), price: 15 },
      { kind: 'BOS', side: 'bull', time: t(14), price: 16 },
    ]);
  });

  test('moi moc swing chi bao MOT lan du gia dong vuot nhieu nen', () => {
    // Nen 9, 10 van dong duoi day 9 da pha o nen 8 — khong duoc co su kien giam thu hai.
    expect(structureOracle(bars, 2).filter((e) => e.side === 'bear')).toHaveLength(1);
  });

  const pine = (kind: string, side: string, i: number, price: string): PineEvent => ({ kind, side, time: t(i), price, id: 0 });

  test('compareStructure: Pine khop oracle => khong lech', () => {
    const ok = [pine('CHOCH', 'bull', 7, '14'), pine('CHOCH', 'bear', 8, '9'), pine('CHOCH', 'bull', 11, '15'), pine('BOS', 'bull', 14, '16')];
    const d = compareStructure(ok, structureOracle(bars, 2), t(0), t(14), 0.01);
    expect(d).toEqual({ missing: [], extra: [], compared: 4 });
  });

  test('compareStructure: bat duoc ten sai, gia sai, su kien thua va thieu', () => {
    const bad = [
      pine('BOS', 'bull', 7, '14'), // ten sai (phai la CHoCH)
      pine('CHOCH', 'bear', 8, '9.05'), // gia lech 5 tick
      pine('BOS', 'bull', 14, '16'),
      pine('BOS', 'bear', 12, '7'), // khong co that
      // thieu CHoCH tang o nen 11
    ];
    const d = compareStructure(bad, structureOracle(bars, 2), t(0), t(14), 0.01);
    expect(d.extra).toHaveLength(3);
    expect(d.missing).toHaveLength(3);
    expect(d.extra.join('\n')).toContain('(oracle: @9)');
  });

  test('chochLenFromSource doc dung tham so theo khung', () => {
    const code = 'chochLen15 = input.int(50, "x")\nchochLen4h = input.int(15, "y")\n';
    expect(chochLenFromSource(code, '15')).toBe(50);
    expect(chochLenFromSource(code, '240')).toBe(15);
    expect(() => chochLenFromSource('khong co gi', '15')).toThrow();
  });
});

test.describe('oracle luat OF', () => {
  // Vung OF-D, dinh (bien XA) = 100. Nen 1 ve box, nen 2 lan dau nam tron ngoai (low > 100),
  // nen 4 lan dau quay lai cham (low <= 100).
  const bars = mk([
    [101, 98, 100.5], // 0 sinh
    [101, 99, 100.8], // 1 ve box — con cham vung
    [104, 101, 103], // 2 ROI VUNG
    [105, 102, 104], // 3 van ngoai
    [103, 99.5, 102], // 4 KHAI THAC
    [104, 100.5, 103], // 5
  ]);
  const ev = (kind: string, i: number, price = '100', id = 7): PineEvent => ({ kind: `OF ${kind}`, side: 'D', time: t(i), price, id });
  const good = [ev('sinh', 0), ev('ve box', 1), ev('roi vung', 2), ev('khai thac', 4)];
  const run = (evs: PineEvent[], b = bars) => checkOFRules(evs, b, 0.01).violations;

  test('vong doi dung luat => khong vi pham', () => {
    expect(run(good)).toEqual([]);
  });

  test('bao roi vung TRE (bo qua nen nam tron ngoai dau tien)', () => {
    const v = run([ev('sinh', 0), ev('ve box', 1), ev('roi vung', 3), ev('khai thac', 4)]);
    expect(v.join('\n')).toContain('mai den');
  });

  test('roi vung o nen chi DONG CUA ngoai vung (rau van cham) => vi pham luat nam TRON ngoai', () => {
    const b2 = bars.map((x, i) => (i === 2 ? { ...x, low: 99.8, close: 103 } : x));
    const v = run(good, b2);
    expect(v.join('\n')).toContain('KHONG nam tron ngoai vung');
  });

  test('khai thac TRUOC khi roi vung', () => {
    const v = run([ev('sinh', 0), ev('ve box', 1), ev('khai thac', 2), ev('roi vung', 3)]);
    expect(v.join('\n')).toContain('CHUA roi');
  });

  test('bo sot khai thac o lan cham dau tien', () => {
    const v = run([ev('sinh', 0), ev('ve box', 1), ev('roi vung', 2), ev('khai thac', 5)]);
    expect(v.join('\n')).toContain('lan dau quay lai cham');
  });

  test('nen ve box da nam tron ngoai => khong duoc bao roi vung', () => {
    const b2 = bars.map((x, i) => (i === 1 ? { ...x, low: 100.5 } : x));
    const v = run([ev('sinh', 0), ev('ve box', 1), ev('roi vung', 2), ev('khai thac', 4)], b2);
    expect(v.join('\n')).toContain('da nam tron ngoai vung nhung van bao');
  });

  test('vung bi xoa dung nen cham dau tien (bi quet) thi khong can khai thac', () => {
    expect(run([ev('sinh', 0), ev('ve box', 1), ev('roi vung', 2), ev('xoa Q', 4, '97')])).toEqual([]);
  });

  test('su kien SAU khi vung da bi xoa, lan chieu, lech muc gia, sinh 2 lan', () => {
    const v = run([
      ev('sinh', 0),
      ev('sinh', 0, '100', 7),
      ev('ve box', 1),
      ev('roi vung', 2, '100.5'),
      ev('xoa Q', 3, '97'),
      { ...ev('khai thac', 4), side: 'S' },
    ]).join('\n');
    expect(v).toContain('2 su kien "sinh"');
    expect(v).toContain('khac luc ve box');
    expect(v).toContain('SAU khi vung da het');
    expect(v).toContain('lan chieu');
  });

  test('ve box va huy cung mot ung vien', () => {
    expect(run([ev('sinh', 0), ev('huy P', 1), ev('ve box', 1)]).join('\n')).toContain('vua "ve box" vua "huy"');
  });

  test('gia sat muc vung (< nua tick) => bo qua, khong ket luan bua', () => {
    const b2 = bars.map((x, i) => (i === 2 ? { ...x, low: 100.004 } : x));
    const r = checkOFRules([ev('sinh', 0), ev('ve box', 1), ev('roi vung', 3)], b2, 0.01);
    expect(r.violations).toEqual([]);
    expect(r.skipped).toBe(1);
  });
});
