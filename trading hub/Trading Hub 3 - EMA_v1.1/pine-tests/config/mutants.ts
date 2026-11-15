// "TEST CUA TEST" — mutation testing.
//
// Moi mutant la mot LOI CO Y cay vao ban sao code Pine truoc khi dan len chart (file .pine tren
// dia khong bi dong toi). Bo test tot thi phai FAIL voi moi mutant. Mutant nao chay qua ma test
// van xanh = bo test co lo hong: loi that giong vay cung se lot qua.
//
//   npm run test:mutation              # chay het, ~3 phut / mutant
//   npm run test:mutation -- M4        # chi chay M4
//
// `layers` = nhung lop test DU KIEN phai bat duoc mutant nay. Runner bao ca lop bat duoc
// ngoai du kien, va bao DO neu mot lop du kien ma khong bat.
//   golden  : so voi golden/*.json trong window
//   cautruc : oracle tinh lai CHoCH/BOS bang TypeScript tu du lieu nen
//   of      : oracle soi luat roi vung / khai thac OF tren tung nen

export type Layer = 'golden' | 'cautruc' | 'of';

export interface Mutant {
  id: string;
  /** Mo ta loi bang loi thuong — loai loi that co the xay ra khi sua code */
  what: string;
  pineFile: string;
  /** Doan code goc — phai xuat hien DUNG 1 lan trong file, neu khong mutant bi tu choi */
  find: string;
  replace: string;
  layers: Layer[];
}

const PINE = 'Trading_Hub_3_v1.11_LuxAlgo.pine';

export const MUTANTS: Mutant[] = [
  {
    id: 'M1',
    what: 'Dao ten CHoCH/BOS khi pha len (doc nham bias)',
    pineFile: PINE,
    find: 'txt = os == 0 ? CHOCH_TEXT : BOS_TEXT',
    replace: 'txt = os == 1 ? CHOCH_TEXT : BOS_TEXT',
    layers: ['golden', 'cautruc'],
  },
  {
    id: 'M2',
    what: 'Do dai leg swing lech 1 nen (chochLen + 1)',
    pineFile: PINE,
    find: '[swTop, swTopBar, swBtm, swBtmBar] = swings(chochLen)',
    replace: '[swTop, swTopBar, swBtm, swBtmBar] = swings(chochLen + 1)',
    layers: ['golden', 'cautruc'],
  },
  {
    id: 'M3',
    what: 'Pha dinh bang RAU thay vi gia DONG CUA',
    pineFile: PINE,
    find: 'if not na(chTop) and close > chTop and not topCrossed',
    replace: 'if not na(chTop) and high > chTop and not topCrossed',
    layers: ['golden', 'cautruc'],
  },
  {
    id: 'M4',
    what: 'Roi vung chi can THAN nen ngoai vung (vi pham luat "nen nam TRON ngoai")',
    pineFile: PINE,
    find: 'bool away = bl ? low > t : high < b',
    replace: 'bool away = bl ? close > t : close < b',
    layers: ['golden', 'of'],
  },
  {
    id: 'M5',
    what: 'Khai thac khong can roi vung truoc (cham la tinh)',
    pineFile: PINE,
    find: 'else if leftYet and high >= b and low <= t',
    replace: 'else if high >= b and low <= t',
    layers: ['golden', 'of'],
  },
];

/** Ap mutant vao code. Nem loi neu doan `find` khong xuat hien dung 1 lan. */
export function applyMutant(code: string, m: Mutant): string {
  const n = code.split(m.find).length - 1;
  if (n !== 1) {
    throw new Error(
      `Mutant ${m.id}: doan "${m.find}" xuat hien ${n} lan trong ${m.pineFile} (phai dung 1). ` +
        'Code Pine da doi — sua `find` trong config/mutants.ts.',
    );
  }
  return code.replace(m.find, m.replace);
}
