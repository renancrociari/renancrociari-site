import { test, expect } from '@playwright/test';

test.describe('editor work (B19)', () => {
  test('abre /editor, lista work, abre primeiro case e mostra preview instrumentado no iframe', async ({
    page,
  }) => {
    const listPromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/editor/work') &&
        res.request().method() === 'GET' &&
        res.ok()
    );

    await page.goto('/editor');
    await listPromise;

    await expect(page.locator('.pointer-editor-shell')).toBeVisible();
    await expect(page.getByPlaceholder('Buscar...')).toBeVisible();

    const firstEntry = page.locator('.min-h-0.flex-1.overflow-y-auto button').first();
    await expect(firstEntry).toBeVisible();

    const loadPromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/editor/work?id=') &&
        res.request().method() === 'GET' &&
        res.ok()
    );

    await firstEntry.click();
    await loadPromise;

    const iframe = page.locator('iframe[title="Preview draft"]');
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute('src', /\/editor\/preview\/work\//);

    const preview = page.frameLocator('iframe[title="Preview draft"]');
    await expect(preview.locator('[data-editor-node-id="shell-hero"]')).toBeVisible();
    await expect(preview.locator('[data-editor-node-id^="section-"]').first()).toBeVisible();
  });
});
