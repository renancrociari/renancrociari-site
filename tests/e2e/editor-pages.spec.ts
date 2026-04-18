import { test, expect } from '@playwright/test';

const ABOUT_PAGE_ID = 'about/index.mdx';

function pagesListGetPredicate(url: string) {
  const u = new URL(url);
  return u.pathname.endsWith('/api/editor/pages') && !u.searchParams.has('id');
}

test.describe('editor pages (Fase 2 / P4)', () => {
  test.describe.configure({ mode: 'serial' });

  test('expõe coleção pages e lista entradas (GET /api/editor/pages)', async ({ page }) => {
    const listPromise = page.waitForResponse(
      (res) => pagesListGetPredicate(res.url()) && res.request().method() === 'GET' && res.ok()
    );

    await page.goto('/editor/pages');
    await listPromise;

    const root = page.locator('html');
    await expect(root).toHaveAttribute('data-editor-page-ready', '1');
    await expect(root).toHaveAttribute('data-editor-deployment', 'pages-editor');
    await expect(root).toHaveAttribute('data-editor-collection', 'pages');
    await expect(root).toHaveAttribute('data-editor-preview-channel', /iframe-postmessage/);

    await expect(page.locator('.pointer-editor-shell')).toBeVisible();
    await expect(page.getByRole('button', { name: /\/about/ })).toBeVisible();
  });

  test('abre about: iframe /editor/preview/pages/ e POST drafts com collection pages', async ({
    page,
  }) => {
    const listPromise = page.waitForResponse(
      (res) => pagesListGetPredicate(res.url()) && res.request().method() === 'GET' && res.ok()
    );
    await page.goto('/editor/pages');
    await listPromise;

    const draftBootstrapPromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/editor/drafts') &&
        res.request().method() === 'POST' &&
        res.ok()
    );

    await page.getByPlaceholder('Buscar...').fill('');
    await page.locator('button').filter({ hasText: '/about' }).click({ force: true });

    const draftBootstrapRes = await draftBootstrapPromise;
    const postData = draftBootstrapRes.request().postDataJSON() as {
      collection?: string;
      workFileId?: string;
      slug?: string;
    };
    expect(postData.collection, 'draft de páginas deve declarar collection: pages').toBe('pages');
    expect(postData.workFileId).toBe(ABOUT_PAGE_ID);
    expect(postData.slug).toBe('about');

    const draftJson = (await draftBootstrapRes.json()) as { id?: string };
    expect(draftJson.id, 'POST /api/editor/drafts na abertura deve devolver id').toMatch(
      /^[\w-]+$/
    );

    const iframe = page.locator('iframe[title="Preview draft"]');
    await expect(iframe).toBeVisible();
    const src = await iframe.getAttribute('src');
    expect(src ?? '', 'preview de páginas').toMatch(/\/editor\/preview\/pages\//);
    expect(src ?? '').toContain('about');
    expect(src ?? '').toContain(`draftId=${draftJson.id}`);
  });

  test('editar metadata e corpo de about, salvar, validar draft e restaurar via API', async ({
    page,
  }) => {
    const listPromise = page.waitForResponse(
      (res) => pagesListGetPredicate(res.url()) && res.request().method() === 'GET' && res.ok()
    );
    await page.goto('/editor/pages');
    await listPromise;

    const snapshotRes = await page.request.get(
      `/api/editor/pages?id=${encodeURIComponent(ABOUT_PAGE_ID)}`
    );
    expect(snapshotRes.ok()).toBeTruthy();
    const snapshot = (await snapshotRes.json()) as {
      metadata: Record<string, string>;
      content: string;
    };

    const restoreSnapshot = () =>
      page.request.post('/api/editor/pages', {
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({
          id: ABOUT_PAGE_ID,
          metadata: snapshot.metadata,
          content: snapshot.content,
        }),
      });

    try {
      const draftBootstrapPromise = page.waitForResponse(
        (res) =>
          res.url().includes('/api/editor/drafts') &&
          res.request().method() === 'POST' &&
          res.ok()
      );

      await page.getByPlaceholder('Buscar...').fill('');
      await page.locator('button').filter({ hasText: '/about' }).click({ force: true });

      await draftBootstrapPromise;

      await page.locator('button[data-sidebar-node-id="shell-hero"]').click();

      const titleInput = page.locator('#meta-title');
      await expect(titleInput).toBeVisible();
      const originalTitle = (await titleInput.inputValue()) || snapshot.metadata.title || '';
      const editedTitle = `${originalTitle} [e2e-pages]`;
      await titleInput.fill(editedTitle);

      const bodyRoot = page.locator('.pointer-editor-mdx--sidebar .mdxeditor-root-contenteditable');
      const editable = bodyRoot.locator('[contenteditable="true"]').first();
      await editable.click();
      await editable.press('End');
      await editable.pressSequentially('\n\n<!-- e2e-pages -->\n');

      const savePagesPromise = page.waitForResponse(
        (res) =>
          res.url().includes('/api/editor/pages') &&
          res.request().method() === 'POST' &&
          res.ok()
      );
      const saveDraftPromise = page.waitForResponse(
        (res) =>
          res.url().includes('/api/editor/drafts') &&
          res.request().method() === 'POST' &&
          res.ok()
      );

      await page.getByRole('button', { name: 'Salvar' }).click();
      await savePagesPromise;
      const saveDraftRes = await saveDraftPromise;
      const saveDraftJson = (await saveDraftRes.json()) as { id?: string };
      expect(saveDraftJson.id, 'POST /api/editor/drafts após salvar deve devolver id').toMatch(
        /^[\w-]+$/
      );

      await expect(page.getByText(/Salvo com sucesso/i)).toBeVisible();

      const restoreRes = await restoreSnapshot();
      expect(restoreRes.ok(), await restoreRes.text()).toBeTruthy();
    } finally {
      try {
        await restoreSnapshot();
      } catch {
        /* não mascarar falhas do corpo do teste */
      }
    }
  });
});
