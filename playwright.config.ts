import { defineConfig, devices } from '@playwright/test';

/** Porta dedicada ao Playwright (evita colisão com `npm start` em :3001 e garante NODE_ENV=development no sidecar). */
const editorPort = process.env.PLAYWRIGHT_EDITOR_PORT ?? '3010';
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${editorPort}`;

/** Site estático (build Parcel + python http.server) para E2E da gate pública (journal); :1235 evita colisão com `npm start` em :1234. */
const sitePort = process.env.PLAYWRIGHT_SITE_PORT ?? '1235';
const siteURL =
  process.env.PLAYWRIGHT_SITE_URL ?? `http://127.0.0.1:${sitePort}`;

const nextDevCmd =
  process.env.CI === '1'
    ? `rm -rf .next && npx next dev -p ${editorPort} --hostname 127.0.0.1`
    : `npx next dev -p ${editorPort} --hostname 127.0.0.1`;

/** Build estático + http-server: `parcel serve` reescreve redirects para /# (multi-entry), quebrando a gate. */
const siteDistDir = 'dist-e2e-site';
const siteStaticCmd = `sh -c 'npm run build:content && node scripts/parcel-site.cjs build site --dist-dir ./${siteDistDir} --public-url ./ && (cp -r public/downloads ${siteDistDir}/downloads 2>/dev/null || true) && (cp -r public/images ${siteDistDir}/images 2>/dev/null || true) && cp "./${siteDistDir}/pages-generated/index.html" "./${siteDistDir}/index.html" && cp "./${siteDistDir}/pages/authbridge.html" "./${siteDistDir}/authbridge.html" && cp "./${siteDistDir}/pages-generated/connecting-every-discovery-with-a-worthy-home.html" "./${siteDistDir}/connecting-every-discovery-with-a-worthy-home.html" && python3 -m http.server ${sitePort} --bind 127.0.0.1 --directory ./${siteDistDir}'`;

/** Em CI, nunca reutilizar servidores antigos na mesma porta (artefactos desatualizados). */
const reuseServer =
  process.env.CI === '1'
    ? false
    : process.env.PLAYWRIGHT_FORCE_NEW_SERVER !== 'true';

export default defineConfig({
  globalSetup: './tests/e2e/global-setup.mjs',
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
  webServer: [
    {
      name: 'site-static-e2e',
      command: siteStaticCmd,
      cwd: '.',
      url: `${siteURL}/index.html`,
      reuseExistingServer: reuseServer,
      timeout: 240_000,
    },
    {
      name: 'next-editor',
      command: nextDevCmd,
      cwd: './editor-sidecar',
      url: `${baseURL}/api/health`,
      reuseExistingServer: reuseServer,
      timeout: 180_000,
      env: {
        ...process.env,
        NODE_ENV: 'development',
        PORTFOLIO_API_ORIGIN: baseURL,
        PORTFOLIO_SITE_ORIGIN: siteURL,
      },
    },
  ],
});
