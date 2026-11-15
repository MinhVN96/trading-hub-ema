import * as fs from 'fs';
import * as path from 'path';
import type { PineEvent } from './parseLogs';

export const GOLDEN_DIR = path.join(__dirname, '..', 'golden');

// Su kien dua vao golden: KHONG gom `id` — so hieu OF phu thuoc nen dau tien chart tai ve,
// chay hom khac la lech, trong khi vung OF van y het.
export interface GoldenEvent {
  kind: string;
  side: string;
  time: string; // ISO UTC cho de doc khi xem file
  price: string;
}

export interface GoldenFile {
  scenario: string;
  window: { from: string; until: string };
  createdAt: string;
  events: GoldenEvent[];
}

export function toGolden(events: PineEvent[], from: number, until: number): GoldenEvent[] {
  return events
    .filter((e) => e.time >= from && e.time <= until)
    .map((e) => ({ kind: e.kind, side: e.side, time: new Date(e.time).toISOString(), price: e.price }));
}

const key = (e: GoldenEvent) => `${e.time} ${e.kind} ${e.side} @${e.price}`;

export interface GoldenDiff {
  missing: string[]; // co trong golden, lan chay nay KHONG thay
  extra: string[]; // lan chay nay co, golden KHONG co
}

export function diffGolden(expected: GoldenEvent[], actual: GoldenEvent[]): GoldenDiff {
  // Dem theo so lan xuat hien: cung mot nen co the sinh 2 OF giong het nhau.
  const count = new Map<string, number>();
  for (const e of expected) count.set(key(e), (count.get(key(e)) ?? 0) + 1);
  const extra: string[] = [];
  for (const e of actual) {
    const k = key(e);
    const n = count.get(k) ?? 0;
    if (n > 0) count.set(k, n - 1);
    else extra.push(k);
  }
  const missing: string[] = [];
  for (const [k, n] of count) for (let i = 0; i < n; i++) missing.push(k);
  return { missing: missing.sort(), extra: extra.sort() };
}

export function formatDiff(d: GoldenDiff): string {
  const parts: string[] = [];
  if (d.missing.length) parts.push(`MAT (${d.missing.length}) — golden co, lan nay khong:\n  - ${d.missing.join('\n  - ')}`);
  if (d.extra.length) parts.push(`THUA (${d.extra.length}) — lan nay co, golden khong:\n  + ${d.extra.join('\n  + ')}`);
  return parts.join('\n\n');
}

export function goldenPath(name: string): string {
  return path.join(GOLDEN_DIR, `${name}.json`);
}

export function readGolden(name: string): GoldenFile | undefined {
  const p = goldenPath(name);
  return fs.existsSync(p) ? (JSON.parse(fs.readFileSync(p, 'utf8')) as GoldenFile) : undefined;
}

export function writeGolden(g: GoldenFile): string {
  fs.mkdirSync(GOLDEN_DIR, { recursive: true });
  const p = goldenPath(g.scenario);
  fs.writeFileSync(p, JSON.stringify(g, null, 2) + '\n', 'utf8');
  return p;
}
