import { test, expect } from '@playwright/test';

/** Três cases da Fase 1 (`routing-manifest` / plano v2). */
const WORK_CASE_SLUGS = ['dating-platform', 'farfetch-performance', 'journal-finder'] as const;

function workListGetPredicate(url: string) {
  const u = new URL(url);
  return u.pathname.endsWith('/api/editor/work') && !u.searchParams.has('id');
}

function workDocumentIdForSlug(slug: string) {
  return `${slug}/index.mdx`;
}

function matchesWorkLoadResponse(url: string, slug: string) {
  const u = new URL(url);
  const id = u.searchParams.get('id');
  return (
    u.pathname.endsWith('/api/editor/work') &&
    id === workDocumentIdForSlug(slug)
  );
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
        await expect(page.getByPlaceholder('Buscar...')).toBeVisible();
        await page.waitForTimeout(400);
      }

      const slug = WORK_CASE_SLUGS[i]!;
      await page.getByPlaceholder('Buscar...').fill('');

      await page.locator('button').filter({ hasText: `/${slug}` }).click({ force: true });

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
      `/api/editor/work?id=${encodeURIComponent(documentId)}`
    );
    if (!snapshotRes.ok()) {
      throw new Error(`snapshot GET ${snapshotRes.status()}: ${await snapshotRes.text()}`);
    }
    const snapshot = (await snapshotRes.json()) as {
      metadata: Record<string, string>;
      content: string;
    };

    const restoreSnapshot = () =>
      request.post('/api/editor/work', {
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({
          id: documentId,
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
      await Promise.all([
        page.waitForResponse(
          (res) =>
            matchesWorkLoadResponse(res.url(), slug) &&
            res.request().method() === 'GET' &&
            res.ok()
        ),
        page.locator('button').filter({ hasText: `/${slug}` }).click({ force: true }),
      ]);

      const iframe = page.locator('iframe[title="Preview draft"]');
      await expect(iframe).toBeVisible();

      const draftBootstrapRes = await draftBootstrapPromise;
      const draftBootstrapJson = (await draftBootstrapRes.json()) as { id?: string };
      expect(draftBootstrapJson.id, 'POST /api/editor/drafts na abertura deve devolver id').toMatch(
        /^[\w-]+$/
      );

      const src = await iframe.getAttribute('src');
      expect(src ?? '', 'iframe do preview deve incluir draftId').toContain(`draftId=${draftBootstrapJson.id}`);

      await page.locator('button[data-sidebar-node-id="shell-hero"]').click();

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

      const restoreRes = await restoreSnapshot();
      const restoreBody = await restoreRes.text();
      expect(restoreRes.ok(), `restore HTTP ${restoreRes.status()}: ${restoreBody}`).toBeTruthy();
    } finally {
      try {
        await restoreSnapshot();
      } catch {
        /* evita mascarar falhas do teste principal */
      }
    }
  });

  test('farfetch-performance e journal-finder: metadata + draft + salvar + restaurar', async ({
    page,
    request,
  }) => {
    for (const slug of ['farfetch-performance', 'journal-finder'] as const) {
      const documentId = workDocumentIdForSlug(slug);

      const listPromise = page.waitForResponse(
        (res) => workListGetPredicate(res.url()) && res.request().method() === 'GET' && res.ok()
      );
      await page.goto('/editor');
      await listPromise;

      const snapshotRes = await request.get(
        `/api/editor/work?id=${encodeURIComponent(documentId)}`
      );
      if (!snapshotRes.ok()) {
        throw new Error(`snapshot GET ${snapshotRes.status()}: ${await snapshotRes.text()}`);
      }
      const snapshot = (await snapshotRes.json()) as {
        metadata: Record<string, string>;
        content: string;
      };

      const restoreSnapshot = () =>
        request.post('/api/editor/work', {
          headers: { 'Content-Type': 'application/json' },
          data: JSON.stringify({
            id: documentId,
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
        await Promise.all([
          page.waitForResponse(
            (res) =>
              matchesWorkLoadResponse(res.url(), slug) &&
              res.request().method() === 'GET' &&
              res.ok()
          ),
          page.locator('button').filter({ hasText: `/${slug}` }).click({ force: true }),
        ]);

        await expect(page.locator('iframe[title="Preview draft"]')).toBeVisible();
        const draftBootstrapRes = await draftBootstrapPromise;
        const draftJson = (await draftBootstrapRes.json()) as { id?: string };
        expect(draftJson.id).toMatch(/^[\w-]+$/);

        await page.locator('button[data-sidebar-node-id="shell-hero"]').click();

        const titleInput = page.locator('#meta-title');
        await expect(titleInput).toBeVisible();
        const originalTitle = (await titleInput.inputValue()) || snapshot.metadata.title || '';
        await titleInput.fill(`${originalTitle} [e2e-b19-${slug}]`);

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
        await saveDraftPromise;

        await expect(page.getByText(/Salvo com sucesso/i)).toBeVisible();

        const restoreRes = await restoreSnapshot();
        expect(restoreRes.ok(), await restoreRes.text()).toBeTruthy();
      } finally {
        try {
          await restoreSnapshot();
        } catch {
          /* idem dating */
        }
      }
    }
  });
});
