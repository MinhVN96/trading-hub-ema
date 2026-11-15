// Chay test logic voi tung mutant (config/mutants.ts) va bao lop nao bat duoc.
//
//   npm run test:mutation              # moi mutant, cap MUTATION_PAIR (mac dinh BNBUSD)
//   npm run test:mutation -- M1 M4     # chi mot so mutant
//
// Ket qua moi mutant:
//   BI BAT   — test fail o it nhat mot lop du kien  => bo test lam dung viec
//   SONG SOT — test van xanh                         => LO HONG: loi that kieu nay se lot qua
//   ?        — fail vi loi ha tang (mang, TradingView) chu khong phai do assert => chay lai
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { MUTANTS, type Layer } from '../config/mutants';

const PAIR = process.env.MUTATION_PAIR ?? 'BNBUSD';
const want = process.argv.slice(2);
const list = MUTANTS.filter((m) => !want.length || want.includes(m.id));
const OUT = path.join(__dirname, '..', '.cache', 'mutation');
fs.mkdirSync(OUT, { recursive: true });

const TAGS: Record<Layer, string> = { golden: '[GOLDEN]', cautruc: '[ORACLE-CAU-TRUC]', of: '[ORACLE-OF]' };

function run(id: string): { caught: Layer[]; infra?: string } {
  const json = path.join(OUT, `${id}.json`);
  spawnSync('npx', ['playwright', 'test', 'tests/logic.spec.ts', '-g', `IC-${PAIR}_`, '--retries=0', '--reporter=json'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PINE_MUTANT: id, PLAYWRIGHT_JSON_OUTPUT_NAME: json },
    stdio: 'inherit',
    shell: true,
  });
  if (!fs.existsSync(json)) return { caught: [], infra: 'khong co ket qua JSON' };
  const report = JSON.parse(fs.readFileSync(json, 'utf8'));
  const results: any[] = [];
  const walk = (suite: any) => {
    for (const sp of suite.specs ?? []) for (const t of sp.tests ?? []) results.push(...(t.results ?? []));
    for (const s of suite.suites ?? []) walk(s);
  };
  for (const s of report.suites ?? []) walk(s);
  if (!results.length) return { caught: [], infra: 'khong co test nao chay (sai ten cap?)' };
  const msgs = results.flatMap((r) => (r.errors ?? []).map((e: any) => String(e.message ?? '')));
  // Chi xet DONG DAU cua thong bao: phan sau kem doan code nguon cua logic.spec.ts, trong do co
  // san chu "[ORACLE-OF]" / "[GOLDEN]" cua assert ke ben => tung bao nham lop khong he bat.
  const heads = msgs.map((m) => m.replace(/\u001b\[[0-9;]*m/g, '').split('\n')[0]);
  const caught = (Object.keys(TAGS) as Layer[]).filter((l) => heads.some((h) => h.includes(TAGS[l])));
  const failed = results.some((r) => r.status !== 'passed');
  if (failed && !caught.length) return { caught, infra: msgs[0]?.split('\n')[0].slice(0, 160) ?? 'fail khong ro ly do' };
  return { caught };
}

const rows: string[] = [];
let holes = 0;
for (const m of list) {
  console.log(`\n=== ${m.id}: ${m.what} ===`);
  let r = run(m.id);
  for (let again = 1; r.infra && again <= 2; again++) {
    console.log(`${m.id}: loi ha tang (${r.infra}) — chay lai lan ${again}`);
    r = run(m.id);
  }
  const missed = m.layers.filter((l) => !r.caught.includes(l));
  const verdict = r.infra ? `? (${r.infra})` : r.caught.length ? 'BI BAT' : 'SONG SOT';
  if (!r.infra && !r.caught.length) holes++;
  rows.push(
    `${m.id.padEnd(4)} ${verdict.padEnd(9)} bat boi: ${r.caught.join(', ') || '-'}` +
      (missed.length && r.caught.length ? `   (du kien ma KHONG bat: ${missed.join(', ')})` : '') +
      `\n     ${m.what}`,
  );
}
console.log(`\n===== KET QUA MUTATION (${PAIR}) =====\n` + rows.join('\n'));
if (holes) console.log(`\n${holes} mutant SONG SOT => bo test co lo hong, xem config/mutants.ts`);
process.exit(holes ? 1 : 0);
