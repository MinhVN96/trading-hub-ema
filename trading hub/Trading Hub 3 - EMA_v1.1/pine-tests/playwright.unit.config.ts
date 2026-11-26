import { defineConfig } from '@playwright/test';

// Unit test cho CHINH bo test (parser, so golden, oracle, mutant). Offline, vai giay,
// khong can dang nhap TradingView:  npm run test:unit
export default defineConfig({
  testDir: './tests/unit',
  reporter: 'list',
});
