import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3001';

/** Três cases da Fase 1 (`routing-manifest` / plano v2). */
const WORK_CASE_SLUGS = ['dating-platform', 'farfetch-performance', 'journal-finder'] as const;

function workListGetPredicate(url: string) {
  const u = new URL(url);
  return u.pathname.endsWith('/api/editor/work') && !u.searchParams.has('id');
}

function workDocumentIdForSlug(slug: string) {
  return `${slug}/index.mdx`;
}

test.describe('editor work (B19)', () => {
  test.describe.configure({ mode: 'serial' });

  test('expõe data-editor-* na raiz e lista os três documentos principais', async ({ page }) => {
    const listPromise = page.waitForResponse(
      (res) => workListGetPredicate(res.url()) && res.request().method() === 'GET' && res.ok()
    );

    await page.goto('/editor');
    await listPromise;

    const root = page.locator('html');
    await expect(root).toHaveAttribute('data-editor-page-ready', '1');
    await expect(root).toHaveAttribute('data-editor-deployment', /private-work-editor/);
    await expect(root).toHaveAttribute('data-editor-preview-channel', /iframe-postmessage/);

    await expect(page.locator('.pointer-editor-shell')).toBeVisible();

    for (const slug of WORK_CASE_SLUGS) {
      await expect(page.getByRole('button', { name: new RegExp(`/${slug}`) })).toBeVisible();
    }
  });

  test('abre cada case principal: iframe de preview e instrumentação data-editor-*', async ({
    page,
  }) => {
    const listPromise = page.waitForResponse(
      (res) => workListGetPredicate(res.url()) && res.request().method() === 'GET' && res.ok()
    );
    await page.goto('/editor');
    await listPromise;

    for (let i = 0; i < WORK_CASE_SLUGS.length; i++) {
      if (i > 0) {
        await page.getByRole('button', { name: 'Abrir biblioteca de documentos' }).click();
      }

      const slug = WORK_CASE_SLUGS[i]!;
      await page.getByPlaceholder('Buscar...').fill('');

      await page.locator('button').filter({ hasText: `/${slug}` }).click();

      const iframe = page.locator('iframe[title="Preview draft"]');
      await expect(iframe).toBeVisible();
      await expect(iframe).toHaveAttribute('src', /\/editor\/preview\/work\//);

      const preview = page.frameLocator('iframe[title="Preview draft"]');
      await expect(preview.locator('[data-editor-node-id="shell-hero"]')).toBeVisible();
      await expect(
        preview.locator('[data-editor-kind="section"][data-editor-node-id^="section-"]').first()
      ).toBeVisible();
    }
  });

  test('editar metadata e corpo, salvar, validar draft e APIs; clique preview↔sidebar', async ({
    page,
    request,
  }) => {
    const slug = 'dating-platform';
    const documentId = workDocumentIdForSlug(slug);

    const listPromise = page.waitForResponse(
      (res) => workListGetPredicate(res.url()) && res.request().method() === 'GET' && res.ok()
    );
    await page.goto('/editor');
    await listPromise;

    const snapshotRes = await request.get(
      `${BASE}/api/editor/work?id=${encodeURIComponent(documentId)}`
    );
    expect(snapshotRes.ok()).toBeTruthy();
    const snapshot = (await snapshotRes.json()) as {
      metadata: Record<string, string>;
      content: string;
    };

    const draftBootstrapPromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/editor/drafts') &&
        res.request().method() === 'POST' &&
        res.ok()
    );

    await page.getByPlaceholder('Buscar...').fill('');
    await page.locator('button').filter({ hasText: `/${slug}` }).click();

    const iframe = page.locator('iframe[title="Preview draft"]');
    await expect(iframe).toBeVisible();

    const draftBootstrapRes = await draftBootstrapPromise;
    const draftBootstrapJson = (await draftBootstrapRes.json()) as { id?: string };
    expect(draftBootstrapJson.id, 'POST /api/editor/drafts na abertura deve devolver id').toMatch(
      /^[\w-]+$/
    );

    const src = await iframe.getAttribute('src');
    expect(src ?? '', 'iframe do preview deve incluir draftId').toContain(`draftId=${draftBootstrapJson.id}`);

    const titleInput = page.locator('#meta-title');
    await expect(titleInput).toBeVisible();
    const originalTitle = (await titleInput.inputValue()) || snapshot.metadata.title || '';
    const editedTitle = `${originalTitle} [e2e-b19]`;
    await titleInput.fill(editedTitle);

    const bodyRoot = page.locator('.pointer-editor-mdx--sidebar .mdxeditor-root-contenteditable');
    const editable = bodyRoot.locator('[contenteditable="true"]').first();
    await editable.click();
    await editable.press('End');
    await editable.pressSequentially('\n\n<!-- e2e-b19 -->\n');

    const saveWorkPromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/editor/work') &&
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
    await saveWorkPromise;
    const saveDraftRes = await saveDraftPromise;
    const saveDraftJson = (await saveDraftRes.json()) as { id?: string };
    expect(saveDraftJson.id, 'POST /api/editor/drafts após salvar deve devolver id').toMatch(/^[\w-]+$/);

    await expect(page.getByText(/Salvo com sucesso/i)).toBeVisible();

    const preview = page.frameLocator('iframe[title="Preview draft"]');

    await preview.locator('[data-editor-node-id="section-0"]').click({ position: { x: 8, y: 8 } });
    await expect(
      page.locator('.pointer-editor-mdx--sidebar [data-editor-sync-node-id="section-0"]').first()
    ).toBeVisible();

    await page.locator('button[data-sidebar-node-id="shell-meta"]').click();
    await expect(
      preview.locator('.editor-preview-highlight[data-editor-node-id="shell-meta"]')
    ).toBeVisible();

    const restoreRes = await request.post(`${BASE}/api/editor/work`, {
      json: {
        id: documentId,
        metadata: snapshot.metadata,
        content: snapshot.content,
      },
    });
    expect(restoreRes.ok()).toBeTruthy();
  });
});
