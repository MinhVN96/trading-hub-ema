import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { MUTANTS, applyMutant } from '../config/mutants';

// Thu muc chua file .pine. Mac dinh la thu muc cha cua pine-tests.
export const PINE_ROOT = path.resolve(__dirname, '..', process.env.PINE_ROOT ?? '..');

export interface PineSource {
  file: string;
  code: string;
  /** shorttitle trong indicator(...) — chinh la chu hien tren legend cua chart. */
  shortTitle: string;
  /** Mutant da cay vao code (chi khi chay npm run test:mutation) */
  mutant?: string;
  /**
   * Dau van tay cua code da dan (chi khi enableE2E). Script ghi dong `RUN|<runId>` vao Pine Logs;
   * test doi chieu de chung minh log den tu DUNG ban code nay. Da tung xay ra: TradingView nap
   * lai ban nhap cu de len code vua dan, chart chay code KHAC ma test van xanh (mutant "song sot" gia).
   */
  runId?: string;
}

const STAT_CALL = '    log.info("STAT|lines="';
function stamp(code: string, fileName: string): { code: string; runId: string } {
  const runId = crypto.createHash('sha1').update(code).digest('hex').slice(0, 12);
  const n = code.split(STAT_CALL).length - 1;
  if (n !== 1) throw new Error(`${fileName}: can dung 1 dong 'log.info("STAT|lines=' de gan dau van tay, thay ${n}`);
  return { code: code.replace(STAT_CALL, `    log.info("RUN|${runId}")\n${STAT_CALL}`), runId };
}

/** Log co dung la cua ban code da dan khong. Tra ve chuoi loi hoac undefined. */
export function checkRun(lines: string[], src: PineSource): string | undefined {
  if (!src.runId) return undefined;
  const got = lines.map((l) => l.match(/RUN\|([0-9a-f]{12})/)?.[1]).find(Boolean);
  if (got === src.runId) return undefined;
  return got
    ? `Pine Logs den tu ban code KHAC (RUN|${got}, can RUN|${src.runId}) — editor bi ghi de sau khi dan?`
    : `Khong thay dong RUN|${src.runId} trong Pine Logs — khong chung minh duoc chart chay dung code da dan.`;
}

// Phai khop dung dong khai bao trong file Pine — xem ghi chu ngay tren dong `e2eLog =`.
const E2E_SWITCH = /^(e2eLog\s*=\s*input\.bool\()false\b/m;

export function readPineFile(fileName: string, opts: { enableE2E?: boolean } = {}): PineSource {
  const file = path.join(PINE_ROOT, fileName);
  let code = fs.readFileSync(file, 'utf8');

  const decl = code.match(/^(?:indicator|strategy|library)\(\s*"([^"]*)"(?:\s*,\s*"([^"]*)")?/m);
  if (!decl) throw new Error(`Khong tim thay indicator(...)/strategy(...) trong ${fileName}`);
  const shortTitle = decl[2] || decl[1];

  if (opts.enableE2E) {
    if (!E2E_SWITCH.test(code)) {
      throw new Error(
        `${fileName} khong co dong "e2eLog = input.bool(false, ...)". ` +
          'Can them cong tac e2eLog vao file Pine truoc khi chay test runtime/logic.',
      );
    }
    code = code.replace(E2E_SWITCH, '$1true');
  }

  // Mutation testing (scripts/mutation.ts dat PINE_MUTANT). Chi sua chuoi trong bo nho.
  let mutant: string | undefined;
  const mid = process.env.PINE_MUTANT;
  if (mid) {
    if (process.env.UPDATE_GOLDEN === '1') {
      throw new Error('PINE_MUTANT va UPDATE_GOLDEN cung bat: tuyet doi khong ghi golden tu code co loi cay vao.');
    }
    const m = MUTANTS.find((x) => x.id === mid);
    if (!m) throw new Error(`Khong co mutant ${mid} trong config/mutants.ts`);
    if (m.pineFile === fileName) {
      code = applyMutant(code, m);
      mutant = m.id;
    }
  }

  if (opts.enableE2E) {
    const st = stamp(code, fileName);
    return { file, code: st.code, shortTitle, mutant, runId: st.runId };
  }
  return { file, code, shortTitle, mutant };
}
