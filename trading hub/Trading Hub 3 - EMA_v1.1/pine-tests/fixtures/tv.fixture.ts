import { test as base, expect } from '@playwright/test';
import { ChartPage } from '../pages/ChartPage';
import { PineEditorPage } from '../pages/PineEditorPage';
import { readPineFile, type PineSource } from '../utils/readPineFile';
import type { Scenario } from '../config/scenarios';

interface TvFixtures {
  chart: ChartPage;
  pine: PineEditorPage;
  /**
   * Mo chart, dan code, Add to chart. Tra ve nguon da dan va ket qua compile.
   * Tu dong go indicator khoi chart khi test xong (ke ca khi test fail).
   */
  loadScript: (
    s: Scenario,
    opts?: { enableE2E?: boolean },
  ) => Promise<{ src: PineSource; result: Awaited<ReturnType<PineEditorPage['addToChart']>> }>;
}

export const test = base.extend<TvFixtures>({
  chart: async ({ page }, use) => {
    await use(new ChartPage(page));
  },

  pine: async ({ page, chart }, use) => {
    await use(new PineEditorPage(page, chart));
  },

  loadScript: async ({ chart, pine }, use) => {
    const loaded: string[] = [];
    await use(async (s, opts = {}) => {
      const src = readPineFile(s.pineFile, opts);
      await chart.goto(s.symbol, s.interval);
      // Chart layout test phai sach: lan chay truoc fail giua chung co the de sot indicator.
      await chart.removeStudy(src.shortTitle);
      await pine.open();
      await pine.setCode(src.code);
      const result = await pine.addToChart(src.shortTitle);
      loaded.push(src.shortTitle);
      return { src, result };
    });
    for (const title of loaded) await chart.removeStudy(title).catch(() => {});
  },
});

export { expect };
