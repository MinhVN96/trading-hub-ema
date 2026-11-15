// Chay lai oracle tren log Pine da luu cua lan test logic gan nhat (.cache/pine-logs/*.log),
// khong can mo TradingView. Dung khi sua oracle hoac khi muon doc ky mot vi pham.
//
//   npm run oracle                          # moi file trong .cache/pine-logs
//   npm run oracle -- v1.11_IC-BNBUSD_15m   # mot cap
import * as fs from 'fs';
import * as path from 'path';
import { SCENARIOS } from '../config/scenarios';
import { parseEvents, parseStat, checkComplete, parseBars, checkBars } from '../utils/parseLogs';
import { chochLenFromSource, structureOracle, compareStructure, checkOFRules } from '../utils/oracle';
import { readPineFile } from '../utils/readPineFile';

const DIR = path.join(__dirname, '..', '.cache', 'pine-logs');
const DAY = 24 * 3600_000;
const want = process.argv.slice(2);
if (!fs.existsSync(DIR)) {
  console.error(`Chua co ${DIR} — chay "npm run test:logic" truoc.`);
  process.exit(2);
}
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.log') && (!want.length || want.some((w) => f.includes(w))));
let bad = 0;
for (const f of files) {
  const name = f.replace(/\.log$/, '');
  const s = SCENARIOS.find((x) => name === x.name || name.startsWith(x.name + '.'));
  if (!s) {
    console.log(`${f}: khong co scenario tuong ung, bo qua`);
    continue;
  }
  const lines = fs.readFileSync(path.join(DIR, f), 'utf8').split('\n');
  const stat = parseStat(lines);
  if (!stat) {
    console.log(`${f}: khong co STAT`);
    bad++;
    continue;
  }
  const events = parseEvents(lines);
  const pb = parseBars(lines);
  const err = checkComplete(events, stat) ?? checkBars(pb, stat);
  if (err) {
    console.log(`${f}: ${err}`);
    bad++;
    continue;
  }
  const len = chochLenFromSource(readPineFile(s.pineFile).code, s.interval);
  const sd = compareStructure(events, structureOracle(pb.bars, len), stat.first + (s.warmupDays ?? 5) * DAY, stat.last, stat.tick!);
  const of = checkOFRules(events, pb.bars, stat.tick!);
  const n = sd.missing.length + sd.extra.length + of.violations.length;
  if (n) bad++;
  console.log(
    `\n== ${name}: ${pb.bars.length} nen, ${events.length} su kien\n` +
      `   cau truc: so ${sd.compared} CHoCH/BOS, lech ${sd.missing.length + sd.extra.length}\n` +
      `   OF: soi ${of.zones} vung (bo qua ${of.skipped}), vi pham ${of.violations.length}`,
  );
  for (const x of sd.missing.slice(0, 15)) console.log(`   - oracle co, Pine khong: ${x}`);
  for (const x of sd.extra.slice(0, 15)) console.log(`   + Pine co, oracle khong: ${x}`);
  for (const x of of.violations.slice(0, 30)) console.log(`   ! ${x}`);
}
process.exit(bad ? 1 : 0);
