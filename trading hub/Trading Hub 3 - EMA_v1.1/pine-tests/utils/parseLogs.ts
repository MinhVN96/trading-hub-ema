// Parse cac dong log.info do cong tac `e2eLog` trong file Pine ghi ra.
// Dinh dang duoc dinh nghia ngay tren dong `e2eLog =` trong file Pine — sua mot ben thi sua ca hai.
//   EVT|<loai>|<chieu>|<time ms>|<gia>|<id>
//   BARS|<so thu tu>|<time ms>,<o>,<h>,<l>,<c>;...
//   STAT|lines=<n>|labels=<n>|boxes=<n>|bars=<n>|first=<time ms>|evt=<n>|last=<time ms>|bl=<n>|tick=<mintick>

export interface PineEvent {
  kind: string; // CHOCH, BOS, "OF sinh", "OF ve box", "OF roi vung", "OF khai thac", "OF huy P", "OF xoa Q"...
  side: string; // bull/bear (cau truc) hoac D/S (OF)
  time: number; // time cua nen, ms UTC
  price: string; // giu dang chuoi da lam tron theo mintick de so sanh chinh xac
  id: number; // so hieu OF; 0 voi su kien cau truc
}

export interface PineStat {
  lines: number;
  labels: number;
  boxes: number;
  bars: number;
  first: number;
  /** So dong EVT script da ghi tinh toi nen lich su cuoi cung */
  evt: number;
  /** time cua nen lich su cuoi cung */
  last: number;
  /** So dong BARS script da ghi (undefined voi ban Pine cu chua ghi BARS) */
  bl?: number;
  /** syminfo.mintick */
  tick?: number;
}

export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

const EVT_RE = /EVT\|([^|]+)\|([^|]+)\|(\d+)\|([^|]+)\|(\d+)/g;
const STAT_RE =
  /STAT\|lines=(\d+)\|labels=(\d+)\|boxes=(\d+)\|bars=(\d+)\|first=(\d+)\|evt=(\d+)\|last=(\d+)(?:\|bl=(\d+)\|tick=([\d.eE+-]+))?/;
const BARS_RE = /BARS\|(\d+)\|([-\d.eE+,;]+)/;

export function parseEvents(lines: string[]): PineEvent[] {
  const seen = new Set<string>();
  const out: PineEvent[] = [];
  for (const line of lines) {
    for (const m of line.matchAll(EVT_RE)) {
      // Bang log ao (virtual list) — khi cuon co the doc trung mot dong nhieu lan.
      if (seen.has(m[0])) continue;
      seen.add(m[0]);
      out.push({ kind: m[1], side: m[2], time: Number(m[3]), price: m[4].trim(), id: Number(m[5]) });
    }
  }
  return out.sort((a, b) => a.time - b.time || a.kind.localeCompare(b.kind) || a.id - b.id);
}

export function parseStat(lines: string[]): PineStat | undefined {
  for (const line of lines) {
    const m = line.match(STAT_RE);
    if (m) {
      return {
        lines: +m[1], labels: +m[2], boxes: +m[3], bars: +m[4], first: +m[5], evt: +m[6], last: +m[7],
        bl: m[8] === undefined ? undefined : +m[8],
        tick: m[9] === undefined ? undefined : +m[9],
      };
    }
  }
  return undefined;
}

/**
 * Doc DU log chua: so EVT doc duoc (tinh toi nen lich su cuoi) phai bang so script bao da ghi.
 * Bang Pine Logs la danh sach ao — da tung doc thieu am tham (chi 50 dong) ma test van qua.
 * Tra ve chuoi mo ta loi, hoac undefined neu du.
 */
export function checkComplete(events: PineEvent[], stat: PineStat): string | undefined {
  const read = events.filter((e) => e.time <= stat.last).length;
  if (read === stat.evt) return undefined;
  return `Doc ${read}/${stat.evt} dong EVT tu Pine Logs (thieu ${stat.evt - read}) — bang log chua nap het hoac cuon bo sot.`;
}

/**
 * Nen OHLC tu cac dong BARS. Tra ve ca so thu tu cac dong doc duoc de kiem tra doc du.
 * Moi dong BARS chua 30 nen; mot dong bi doc cat cut se lam lech so nen => bi bat o checkBars.
 */
export function parseBars(lines: string[]): { bars: Bar[]; seqs: number[] } {
  const bySeq = new Map<number, Bar[]>();
  for (const line of lines) {
    const m = line.match(BARS_RE);
    if (!m || bySeq.has(+m[1])) continue;
    const bars = m[2]
      .split(';')
      .filter(Boolean)
      .map((tok) => {
        const [t, o, h, l, c] = tok.split(',').map(Number);
        return { time: t, open: o, high: h, low: l, close: c };
      });
    bySeq.set(+m[1], bars);
  }
  const seqs = [...bySeq.keys()].sort((a, b) => a - b);
  return { bars: seqs.flatMap((k) => bySeq.get(k)!), seqs };
}

/** Du lieu nen doc du va hop le chua. Tra ve chuoi loi hoac undefined. */
export function checkBars(parsed: { bars: Bar[]; seqs: number[] }, stat: PineStat): string | undefined {
  if (stat.bl === undefined) return 'Dong STAT khong co bl= — ban Pine nay chua ghi BARS (can ban co khoi BARS o cuoi file).';
  const { bars, seqs } = parsed;
  const gaps = [];
  for (let i = 0; i < stat.bl; i++) if (!seqs.includes(i)) gaps.push(i);
  if (gaps.length) return `Thieu ${gaps.length}/${stat.bl} dong BARS (vd so ${gaps.slice(0, 5).join(', ')}).`;
  if (bars.length !== stat.bars) return `Doc ${bars.length} nen tu BARS nhung STAT bao bars=${stat.bars}.`;
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    if (![b.time, b.open, b.high, b.low, b.close].every(Number.isFinite)) return `Nen thu ${i} hong: ${JSON.stringify(b)}`;
    if (b.high < Math.max(b.open, b.close) || b.low > Math.min(b.open, b.close)) return `Nen ${new Date(b.time).toISOString()} co high/low vo ly: ${JSON.stringify(b)}`;
    if (i > 0 && b.time <= bars[i - 1].time) return `Nen khong tang dan theo thoi gian o vi tri ${i}`;
  }
  if (bars[0].time !== stat.first) return `Nen dau BARS (${bars[0].time}) khac first= cua STAT (${stat.first}).`;
  if (bars[bars.length - 1].time !== stat.last) return `Nen cuoi BARS khac last= cua STAT.`;
  return undefined;
}
