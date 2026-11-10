// (2) Script chay het lich su ma khong loi runtime, va khong cham quota 500 line/label/box.
//
// Bang chung "chay het" la dong STAT trong Pine Logs: no chi duoc ghi o nen lich su CUOI
// CUNG, nen loi runtime o bat ky nen nao truoc do deu lam no bien mat.
//
// Quota: Pine KHONG bao loi khi vuot 500 — no lang le xoa doi tuong cu nhat (duong cau truc
// bien mat ma nhan chu van con). Nen o day canh bao khi so doi tuong dang song cham tran.
import { test, expect } from '../fixtures/tv.fixture';
import { scenariosFor } from '../config/scenarios';
import { parseEvents, parseStat, checkComplete } from '../utils/parseLogs';

const QUOTA = 500;

for (const s of scenariosFor('runtime')) {
  test(`runtime: ${s.name}`, async ({ loadScript, chart }) => {
    const { src, result } = await loadScript(s, { enableE2E: true });
    expect(result.ok, 'Compile loi — xem compile.spec.ts').toBe(true);

    // Cho script chay xong toan bo lich su (30-60s voi script nay).
    await chart.waitForScriptIdle();
    const rtErr = await chart.runtimeError(src.shortTitle);
    expect(rtErr, `Indicator LOI RUNTIME tren chart: ${rtErr}`).toBeUndefined();

    await chart.openPineLogs();
    const lines = await chart.readPineLogs();
    const stat = parseStat(lines);
    expect(stat, 'Khong thay dong STAT trong Pine Logs => script khong chay toi nen cuoi (loi runtime?)').toBeDefined();

    console.log(`[${s.name}] STAT lines=${stat!.lines} labels=${stat!.labels} boxes=${stat!.boxes} bars=${stat!.bars} first=${new Date(stat!.first).toISOString()} evt=${stat!.evt} | log doc duoc: ${lines.length} dong`);
    // Doc thieu log thi khong ket luan duoc gi — fail ngay.
    const missing = checkComplete(parseEvents(lines), stat!);
    expect(missing, missing).toBeUndefined();
    test.info().annotations.push({
      type: 'stat',
      description: `lines=${stat!.lines} labels=${stat!.labels} boxes=${stat!.boxes} bars=${stat!.bars}`,
    });

    // Cham tran = da bi xoa ngam. expect.soft de bao du ca 3 loai trong mot lan chay.
    expect.soft(stat!.lines, 'Het quota LINE — duong cau truc cu da bi xoa ngam').toBeLessThan(QUOTA);
    expect.soft(stat!.labels, 'Het quota LABEL').toBeLessThan(QUOTA);
    expect.soft(stat!.boxes, 'Het quota BOX').toBeLessThan(QUOTA);
  });
}
