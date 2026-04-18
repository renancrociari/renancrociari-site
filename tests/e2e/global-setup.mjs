/**
 * Pré-aquece rotas do sidecar antes dos specs: o `webServer` só espera `/api/health`,
 * mas o primeiro `goto` a `/editor/pages` pode demorar (compilação Next a frio).
 * Sem isto, `editor-pages.spec.ts` (alfabeticamente primeiro) estoura o timeout.
 *
 * @param {import('@playwright/test').FullConfig} config
 */
export default async function globalSetup(config) {
  const baseURL =
    config.projects[0]?.use?.baseURL ??
    process.env.PLAYWRIGHT_BASE_URL ??
    `http://127.0.0.1:${process.env.PLAYWRIGHT_EDITOR_PORT ?? '3010'}`;
  const origin = String(baseURL).replace(/\/$/, '');

  for (const path of ['/editor/pages', '/editor']) {
    const res = await fetch(`${origin}${path}`, {
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      throw new Error(`E2E global-setup: ${path} → HTTP ${res.status}`);
    }
  }

  const sitePort = process.env.PLAYWRIGHT_SITE_PORT ?? '1235';
  const siteOrigin = (
    process.env.PLAYWRIGHT_SITE_URL ?? `http://127.0.0.1:${sitePort}`
  ).replace(/\/$/, '');
  const journalPath = '/connecting-every-discovery-with-a-worthy-home.html';
  const siteRes = await fetch(`${siteOrigin}${journalPath}`, {
    signal: AbortSignal.timeout(120_000),
  });
  if (!siteRes.ok) {
    throw new Error(`E2E global-setup: Parcel journal → HTTP ${siteRes.status}`);
  }
}
