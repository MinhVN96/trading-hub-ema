// BO KIEM CHEO (oracle) — doc lap voi code Pine.
//
// Golden chi chung minh "hom nay giong hom truoc". Neu luc tao golden Pine da sai thi golden
// sai theo, va test van xanh. Oracle tra loi cau hoi khac: "ket qua co DUNG LUAT khong", bang
// cach tu tinh lai tu du lieu nen THO (dong BARS) ma khong dung mot dong Pine nao:
//
//   (1) CHoCH/BOS: viet lai engine cau truc bang TypeScript (N-version) roi so tung su kien
//       voi Pine tren TOAN BO lich su — khong chi trong window cua golden.
//   (2) OF: engine sinh vung qua phuc tap de viet lai, nen soi cac LUAT ma moi vung phai tuan
//       theo tren tung nen: vong doi dung thu tu, roi vung = nen dau tien nam TRON ngoai vung,
//       khai thac = lan cham dau tien sau khi da roi, gia vung khong doi giua cac su kien.
//
// Hai ban cai dat cung sai mot cach giong het nhau la kho xay ra hon nhieu so voi mot ban sai.
// Khi oracle va Pine lech nhau, MOT trong hai dang sai — doc thong bao, doi chieu chart.
import type { Bar, PineEvent } from './parseLogs';

// ---------------------------------------------------------------------------------------------
// (1) CAU TRUC — ban sao TypeScript cua `swings()` + khoi "CHoCH / BOS" trong file Pine.
// ---------------------------------------------------------------------------------------------

export interface StructEvent {
  kind: 'CHOCH' | 'BOS';
  side: 'bull' | 'bear';
  time: number;
  price: number;
}

/**
 * Doc chochLen tu chinh code Pine da dan len chart (gia tri mac dinh cua input), de oracle va
 * Pine luon dung cung tham so. Pine: chochLen = timeframe.period == "240" ? chochLen4h : chochLen15
 */
export function chochLenFromSource(code: string, interval: string): number {
  const name = interval === '240' ? 'chochLen4h' : 'chochLen15';
  const m = code.match(new RegExp(`^${name}\\s*=\\s*input\\.int\\(\\s*(\\d+)`, 'm'));
  if (!m) throw new Error(`Khong tim thay "${name} = input.int(...)" trong file Pine`);
  return Number(m[1]);
}

/**
 * LuxAlgo swings(length) + moc chTop/chBtm + pha moc.  `null` dong vai `na` cua Pine:
 * so sanh voi na luon false, nen o `length` nen dau tien khong co swing nao.
 */
export function structureOracle(bars: Bar[], length: number): StructEvent[] {
  const out: StructEvent[] = [];
  let os: number | null = null; // trang thai trong swings(); os[1] o nen dau la na
  let chTop: number | null = null;
  let chBtm: number | null = null;
  let topCrossed = false;
  let btmCrossed = false;
  let bias = 0; // `var int os = 0` toan cuc: 1 = bull, 0 = bear

  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    // ta.highest(length) / ta.lowest(length): gom ca nen hien tai, na khi chua du `length` nen.
    let upper: number | null = null;
    let lower: number | null = null;
    if (i >= length - 1) {
      upper = -Infinity;
      lower = Infinity;
      for (let k = i - length + 1; k <= i; k++) {
        upper = Math.max(upper, bars[k].high);
        lower = Math.min(lower, bars[k].low);
      }
    }
    const old = i >= length ? bars[i - length] : null; // high[length] / low[length]
    const prevOs = os;
    if (old && upper !== null && old.high > upper) os = 0;
    else if (old && lower !== null && old.low < lower) os = 1;
    // else: giu os[1]

    const top = os === 0 && prevOs !== 0 ? old!.high : null;
    const btm = os === 1 && prevOs !== 1 ? old!.low : null;

    // "Cap nhat moc CHoCH khi co swing moi" — chay TRUOC khoi pha moc trong cung nen.
    if (top !== null) {
      chTop = top;
      topCrossed = false;
    }
    if (btm !== null) {
      chBtm = btm;
      btmCrossed = false;
    }
    // Pha len xet truoc pha xuong, va bias doi ngay => anh huong ten su kien pha xuong cung nen.
    if (chTop !== null && b.close > chTop && !topCrossed) {
      out.push({ kind: bias === 0 ? 'CHOCH' : 'BOS', side: 'bull', time: b.time, price: chTop });
      topCrossed = true;
      bias = 1;
    }
    if (chBtm !== null && b.close < chBtm && !btmCrossed) {
      out.push({ kind: bias === 1 ? 'CHOCH' : 'BOS', side: 'bear', time: b.time, price: chBtm });
      btmCrossed = true;
      bias = 0;
    }
  }
  return out;
}

export interface OracleDiff {
  /** Oracle co, Pine khong */
  missing: string[];
  /** Pine co, oracle khong */
  extra: string[];
  compared: number;
}

const iso = (t: number) => new Date(t).toISOString();

/** So CHoCH/BOS cua Pine voi oracle trong [from, until]. Gia khop neu lech < nua tick. */
export function compareStructure(
  pine: PineEvent[],
  oracle: StructEvent[],
  from: number,
  until: number,
  tick: number,
): OracleDiff {
  const inRange = (t: number) => t >= from && t <= until;
  const p = pine.filter((e) => (e.kind === 'CHOCH' || e.kind === 'BOS') && inRange(e.time));
  const o = oracle.filter((e) => inRange(e.time));
  const k = (kind: string, side: string, time: number) => `${iso(time)} ${kind} ${side}`;
  const pool = new Map<string, number[]>();
  for (const e of o) {
    const key = k(e.kind, e.side, e.time);
    pool.set(key, [...(pool.get(key) ?? []), e.price]);
  }
  const extra: string[] = [];
  for (const e of p) {
    const key = k(e.kind, e.side, e.time);
    const prices = pool.get(key) ?? [];
    const j = prices.findIndex((x) => Math.abs(x - Number(e.price)) < tick / 2);
    if (j >= 0) prices.splice(j, 1);
    else extra.push(`${key} @${e.price}` + (prices.length ? ` (oracle: @${prices.join(', @')})` : ''));
  }
  const missing: string[] = [];
  for (const [key, prices] of pool) for (const x of prices) missing.push(`${key} @${x}`);
  return { missing: missing.sort(), extra: extra.sort(), compared: p.length };
}

// ---------------------------------------------------------------------------------------------
// (2) OF — luat tren tung nen cho moi vung (theo so hieu id).
// ---------------------------------------------------------------------------------------------

/**
 * Luat duoc kiem (moi vi pham la mot dong trong ket qua):
 *  L1 vong doi: dung 1 "sinh"; toi da 1 ve box / huy / xoa / roi vung / khai thac; ve box va huy
 *     loai tru nhau; xoa/roi vung/khai thac chi co sau ve box; khong co su kien nao SAU huy/xoa.
 *  L2 cung chieu D/S va cung muc gia vung (bien XA: dinh OF-D, day OF-S) o sinh/ve/roi/khai thac.
 *  L3 roi vung = nen DAU TIEN sau ve box nam TRON ngoai vung (OF-D: low > dinh; OF-S: high < day).
 *     Nen ve box da nam tron ngoai thi vung tinh la da roi ngay, KHONG duoc bao "roi vung".
 *  L4 khai thac = nen DAU TIEN sau khi da roi ma khong con nam tron ngoai (khong thi vung phai
 *     bi xoa dung nen do — bi quet). Khai thac khong bao gio xay ra truoc khi roi.
 * Nen co gia sat muc vung (< nua tick) thi khong ket luan duoc => bo qua vung do (dem vao skipped).
 */
export function checkOFRules(events: PineEvent[], bars: Bar[], tick: number): { violations: string[]; zones: number; skipped: number } {
  const idx = new Map<number, number>();
  bars.forEach((b, i) => idx.set(b.time, i));
  const eps = tick / 2;
  const byId = new Map<number, PineEvent[]>();
  for (const e of events) {
    if (!e.kind.startsWith('OF ') || e.id <= 0) continue;
    byId.set(e.id, [...(byId.get(e.id) ?? []), e]);
  }

  const v: string[] = [];
  let zones = 0;
  let skipped = 0;
  for (const [id, evs] of byId) {
    const tag = `OF #${id}`;
    const of = (prefix: string) => evs.filter((e) => e.kind === `OF ${prefix}` || e.kind.startsWith(`OF ${prefix} `));
    const sinh = of('sinh');
    const ve = of('ve box');
    const huy = of('huy');
    const xoa = of('xoa');
    const roi = of('roi vung');
    const khai = of('khai thac');

    // ---- L1 + L2 ----
    if (sinh.length !== 1) v.push(`${tag}: co ${sinh.length} su kien "sinh" (phai dung 1)`);
    for (const [name, list] of [['ve box', ve], ['huy', huy], ['xoa', xoa], ['roi vung', roi], ['khai thac', khai]] as const) {
      if (list.length > 1) v.push(`${tag}: ${list.length} lan "${name}" (toi da 1) luc ${list.map((e) => iso(e.time)).join(', ')}`);
    }
    if (ve.length && huy.length) v.push(`${tag}: vua "ve box" vua "huy" — ung vien chi co mot ket cuc`);
    if (!ve.length) {
      for (const e of [...xoa, ...roi, ...khai]) v.push(`${tag}: "${e.kind.slice(3)}" luc ${iso(e.time)} nhung vung chua tung "ve box"`);
    }
    const sides = new Set(evs.map((e) => e.side));
    if (sides.size > 1) v.push(`${tag}: lan chieu ${[...sides].join('/')}`);
    const end = [...huy, ...xoa].map((e) => e.time).sort((a, b) => a - b)[0];
    if (end !== undefined) {
      for (const e of evs) if (e.time > end) v.push(`${tag}: "${e.kind.slice(3)}" luc ${iso(e.time)} SAU khi vung da het (${iso(end)})`);
    }
    if (sinh[0] && ve[0] && ve[0].time < sinh[0].time) v.push(`${tag}: ve box (${iso(ve[0].time)}) truoc khi sinh (${iso(sinh[0].time)})`);
    if (!ve[0]) continue;
    const veE = ve[0];
    const p = Number(veE.price);
    for (const e of [...sinh, ...roi, ...khai]) {
      if (Math.abs(Number(e.price) - p) >= eps) v.push(`${tag}: muc vung o "${e.kind.slice(3)}" = ${e.price} khac luc ve box = ${veE.price}`);
    }

    // ---- L3 + L4 (can nen) ----
    const vi = idx.get(veE.time);
    if (vi === undefined) continue;
    zones++;
    const isD = veE.side === 'D';
    // true = nam TRON ngoai, false = khong, undefined = gia sat muc vung, khong ket luan duoc
    const away = (b: Bar): boolean | undefined => {
      const x = isD ? b.low - p : p - b.high;
      if (Math.abs(x) < eps) return undefined;
      return x > 0;
    };
    const endI = end === undefined ? bars.length - 1 : idx.get(end) ?? bars.length - 1;
    const roiI = roi[0] ? idx.get(roi[0].time) : undefined;
    const khaiI = khai[0] ? idx.get(khai[0].time) : undefined;

    const a0 = away(bars[vi]);
    if (a0 === undefined) {
      skipped++;
      continue;
    }
    // Tim nen DAU TIEN sau `start` thoa `want`; gap nen mo ho truoc khi tim thay => undefined.
    const first = (start: number, want: (a: boolean) => boolean): number | 'ambiguous' | undefined => {
      for (let j = start + 1; j <= endI; j++) {
        const a = away(bars[j]);
        if (a === undefined) return 'ambiguous';
        if (want(a)) return j;
      }
      return undefined;
    };

    let leftI: number | undefined;
    if (a0) {
      if (roi[0]) v.push(`${tag}: nen ve box ${iso(veE.time)} da nam tron ngoai vung nhung van bao "roi vung" luc ${iso(roi[0].time)}`);
      leftI = vi;
    } else {
      const j = first(vi, (a) => a);
      if (j === 'ambiguous') {
        skipped++;
        continue;
      }
      if (roi[0]) {
        if (roiI === undefined) continue;
        const ar = away(bars[roiI]);
        if (ar === false) v.push(`${tag}: "roi vung" luc ${iso(roi[0].time)} nhung nen do KHONG nam tron ngoai vung (${isD ? 'low' : 'high'}=${isD ? bars[roiI].low : bars[roiI].high}, muc ${veE.price})`);
        if (j !== undefined && j < roiI) v.push(`${tag}: nen ${iso(bars[j].time)} da nam tron ngoai vung nhung "roi vung" mai den ${iso(roi[0].time)} moi bao`);
        leftI = roiI;
      } else if (j !== undefined && j < endI) {
        v.push(`${tag}: nen ${iso(bars[j].time)} nam tron ngoai vung nhung khong co "roi vung"`);
      }
    }

    if (khai[0] && khaiI !== undefined) {
      if (leftI === undefined || khaiI <= leftI) v.push(`${tag}: "khai thac" luc ${iso(khai[0].time)} khi vung CHUA roi`);
      else if (away(bars[khaiI]) === true) v.push(`${tag}: "khai thac" luc ${iso(khai[0].time)} nhung nen do nam tron ngoai vung, khong cham`);
    }
    if (leftI !== undefined) {
      const k = first(leftI, (a) => !a);
      if (k === 'ambiguous') {
        skipped++;
        continue;
      }
      // Nen dau tien quay lai cham phai la khai thac — tru khi chinh nen do vung bi xoa (bi quet).
      if (k !== undefined && k < endI && khaiI !== k) {
        v.push(`${tag}: nen ${iso(bars[k].time)} la lan dau quay lai cham vung sau khi roi, nhung "khai thac" ` +
          (khai[0] ? `lai bao luc ${iso(khai[0].time)}` : 'khong duoc bao'));
      }
    }
  }
  return { violations: v, zones, skipped };
}
