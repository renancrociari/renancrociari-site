import { defineConfig, devices } from '@playwright/test';

/** Porta dedicada ao Playwright (evita colisão com `npm start` em :3001 e garante NODE_ENV=development no sidecar). */
const editorPort = process.env.PLAYWRIGHT_EDITOR_PORT ?? '3010';
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${editorPort}`;

const nextDevCmd =
  process.env.CI === '1'
    ? `rm -rf .next && npx next dev -p ${editorPort} --hostname 127.0.0.1`
    : `npx next dev -p ${editorPort} --hostname 127.0.0.1`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 90_000,
  expect: { timeout: 45_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: nextDevCmd,
    cwd: './editor-sidecar',
    url: `${baseURL}/api/health`,
    reuseExistingServer: !!process.env.PLAYWRIGHT_REUSE_EDITOR,
    timeout: 180_000,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORTFOLIO_API_ORIGIN: baseURL,
      PORTFOLIO_SITE_ORIGIN: 'http://127.0.0.1:1234',
    },
  },
});
