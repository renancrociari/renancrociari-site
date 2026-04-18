import { test, expect, type Page } from '@playwright/test';

/**
 * Rota pública do case journal (build estático + http.server nos E2E; ver playwright.config),
 * alinhado ao plano v2:
 * preview no editor sem gate vs site que exige senha.
 */
const siteOrigin =
  process.env.PLAYWRIGHT_SITE_URL ??
  `http://127.0.0.1:${process.env.PLAYWRIGHT_SITE_PORT ?? '1235'}`;
const JOURNAL_ENTRY = '/connecting-every-discovery-with-a-worthy-home.html';

async function clearSiteAuth(page: Page) {
  // Parcel dev com várias entradas: `/` não é a home; usar `index.html` explícito.
  await page.goto(`${siteOrigin}/index.html`);
  await page.evaluate(() => {
    try {
      sessionStorage.removeItem('rc_auth_tokens');
    } catch {
      /* ignore */
    }
  });
}

test.describe('journal-finder — gate na rota pública (site estático E2E)', () => {
  test.describe.configure({ mode: 'serial' });

  test('sem sessão: redireciona para home com hash e abre diálogo de senha', async ({ page }) => {
    await clearSiteAuth(page);
    await page.goto(`${siteOrigin}${JOURNAL_ENTRY}`);

    await expect(page).toHaveURL(/#password-protected/, { timeout: 60_000 });
    await expect(page).toHaveURL(/case-journal-finder/);

    // `index.html` esconde `<html>` até `DOMContentLoaded`+100ms quando o hash é password-protected;
    // sem isto o Playwright trata o `dialog` como inexistente/invisível.
    await page.waitForFunction(
      () => getComputedStyle(document.documentElement).visibility === 'visible',
      null,
      { timeout: 15_000 }
    );

    await expect(page.getByText('This content is protected')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByPlaceholder('Enter password')).toBeVisible();
  });

  test('senha errada mantém o diálogo e mostra erro', async ({ page }) => {
    await clearSiteAuth(page);
    await page.goto(`${siteOrigin}${JOURNAL_ENTRY}`);
    await expect(page).toHaveURL(/#password-protected/, { timeout: 60_000 });
    await page.waitForFunction(
      () => getComputedStyle(document.documentElement).visibility === 'visible',
      null,
      { timeout: 15_000 }
    );

    const dlg = page.locator('dialog').filter({ has: page.getByPlaceholder('Enter password') });
    await expect(dlg).toBeVisible({ timeout: 20_000 });
    await dlg.getByPlaceholder('Enter password').fill('definitely-not-demo123');
    await dlg.getByRole('button', { name: /submit password/i }).click();

    await expect(dlg.getByText(/password incorrect/i)).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/#password-protected/);
  });

  test('senha demo123 (hash canónico) abre o case', async ({ page }) => {
    await clearSiteAuth(page);
    await page.goto(`${siteOrigin}${JOURNAL_ENTRY}`);
    await expect(page).toHaveURL(/#password-protected/, { timeout: 60_000 });
    await page.waitForFunction(
      () => getComputedStyle(document.documentElement).visibility === 'visible',
      null,
      { timeout: 15_000 }
    );

    const dlg = page.locator('dialog').filter({ has: page.getByPlaceholder('Enter password') });
    await expect(dlg).toBeVisible({ timeout: 20_000 });
    await dlg.getByPlaceholder('Enter password').fill('demo123');
    await dlg.getByRole('button', { name: /submit password/i }).click();

    await expect(page).toHaveURL(/connecting-every-discovery-with-a-worthy-home/, {
      timeout: 45_000,
    });
    await expect(
      page.locator('.article-content, .featured-image-img, .hero-case-study').first()
    ).toBeVisible({ timeout: 30_000 });
  });
});
