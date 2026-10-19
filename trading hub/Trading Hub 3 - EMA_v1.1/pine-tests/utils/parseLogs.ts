// Parse cac dong log.info do cong tac `e2eLog` trong file Pine ghi ra.
// Dinh dang duoc dinh nghia ngay tren dong `e2eLog =` trong file Pine — sua mot ben thi sua ca hai.
//   EVT|<loai>|<chieu>|<time ms>|<gia>|<id>
//   STAT|lines=<n>|labels=<n>|boxes=<n>|bars=<n>|first=<time ms>

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
}

const EVT_RE = /EVT\|([^|]+)\|([^|]+)\|(\d+)\|([^|]+)\|(\d+)/g;
const STAT_RE = /STAT\|lines=(\d+)\|labels=(\d+)\|boxes=(\d+)\|bars=(\d+)\|first=(\d+)\|evt=(\d+)\|last=(\d+)/;

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
      return { lines: +m[1], labels: +m[2], boxes: +m[3], bars: +m[4], first: +m[5], evt: +m[6], last: +m[7] };
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
