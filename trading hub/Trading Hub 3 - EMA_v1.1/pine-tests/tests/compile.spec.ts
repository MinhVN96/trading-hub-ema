// (1) Script compile khong loi tren TradingView that.
// Day la test re va ben nhat — chay truoc moi lan commit file .pine.
import { test, expect } from '../fixtures/tv.fixture';
import { scenariosFor } from '../config/scenarios';

// Moi file .pine chi can compile mot lan, khong phu thuoc symbol/khung.
const seen = new Set<string>();
const cases = scenariosFor('compile').filter((s) => !seen.has(s.pineFile) && seen.add(s.pineFile));

for (const s of cases) {
  test(`compile: ${s.pineFile}`, async ({ loadScript }) => {
    const { result } = await loadScript(s);
    expect(result.ok, result.ok ? '' : `${result.errors} loi compile.\nConsole:\n${result.console}`).toBe(true);
  });
}
