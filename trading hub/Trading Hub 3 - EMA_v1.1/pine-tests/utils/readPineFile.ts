import * as fs from 'fs';
import * as path from 'path';

// Thu muc chua file .pine. Mac dinh la thu muc cha cua pine-tests.
export const PINE_ROOT = path.resolve(__dirname, '..', process.env.PINE_ROOT ?? '..');

export interface PineSource {
  file: string;
  code: string;
  /** shorttitle trong indicator(...) — chinh la chu hien tren legend cua chart. */
  shortTitle: string;
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

  return { file, code, shortTitle };
}
