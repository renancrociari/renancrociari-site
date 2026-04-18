import { test, expect } from '@playwright/test';

const BASE =
  process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3010';

function pagesListGetPredicate(url: string) {
  const u = new URL(url);
  return u.pathname.endsWith('/api/editor/pages') && u.search === '';
}

function documentIdForSlug(slug: string) {
  return `${slug}/index.mdx`;
}

function matchesPagesLoadResponse(url: string, slug: string) {
  const u = new URL(url);
  const id = u.searchParams.get('id');
  return (
    u.pathname.endsWith('/api/editor/pages') && id === documentIdForSlug(slug)
  );
}

test.describe('editor pages (P4)', () => {
  test.describe.configure({ mode: 'serial' });

  test('/editor/pages: coleção pages, lista MDX e iframe em /editor/preview/pages/', async ({
    page,
  }) => {
    const listPromise = page.waitForResponse(
      (res) =>
        pagesListGetPredicate(res.url()) &&
        res.request().method() === 'GET' &&
        res.ok()
    );

    await page.goto('/editor/pages');
    await listPromise;

    const root = page.locator('html');
    await expect(root).toHaveAttribute('data-editor-page-ready', '1');
    await expect(root).toHaveAttribute('data-editor-collection', 'pages');
    await expect(root).toHaveAttribute('data-editor-preview-channel', /iframe-postmessage/);

    await expect(page.locator('.pointer-editor-shell')).toBeVisible();

    await expect(page.getByRole('button', { name: /\/aaaa/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /\/about/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /\/home/ })).toBeVisible();

    const slug = 'aaaa';
    const draftBootstrapPromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/editor/drafts') &&
        res.request().method() === 'POST' &&
        res.ok()
    );

    const firstDraftReq = page.waitForRequest((req) => {
      if (!req.url().includes('/api/editor/drafts') || req.method() !== 'POST') {
        return false;
      }
      try {
        const body = JSON.parse(req.postData() || '{}') as { collection?: string };
        return body.collection === 'pages';
      } catch {
        return false;
      }
    });

    await Promise.all([
      page.waitForResponse(
        (res) =>
          matchesPagesLoadResponse(res.url(), slug) &&
          res.request().method() === 'GET' &&
          res.ok()
      ),
      page.getByRole('button', { name: new RegExp(`/${slug}`) }).click(),
    ]);
    await draftBootstrapPromise;
    await firstDraftReq;

    const iframe = page.locator('iframe[title="Preview draft"]');
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute(
      'src',
      new RegExp(`/editor/preview/pages/${slug}`)
    );

    const preview = page.frameLocator('iframe[title="Preview draft"]');
    await expect(preview.getByRole('heading', { name: 'aaaa', level: 1 })).toBeVisible();
    await expect(preview.getByText('Em breve')).toBeVisible();
  });

  test('editar título e corpo, salvar páginas + draft; repor estado via API', async ({
    page,
    request,
  }) => {
    const slug = 'aaaa';
    const documentId = documentIdForSlug(slug);

    const listPromise = page.waitForResponse(
      (res) =>
        pagesListGetPredicate(res.url()) &&
        res.request().method() === 'GET' &&
        res.ok()
    );
    await page.goto('/editor/pages');
    await listPromise;

    const snapshotRes = await request.get(
      `${BASE}/api/editor/pages?id=${encodeURIComponent(documentId)}`
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

    await Promise.all([
      page.waitForResponse(
        (res) =>
          matchesPagesLoadResponse(res.url(), slug) &&
          res.request().method() === 'GET' &&
          res.ok()
      ),
      page.getByRole('button', { name: new RegExp(`/${slug}`) }).click(),
    ]);
    await draftBootstrapPromise;

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
    await saveDraftPromise;

    await expect(page.getByText(/Salvo com sucesso/i)).toBeVisible();

    const restoreRes = await request.post(`${BASE}/api/editor/pages`, {
      json: {
        id: documentId,
        metadata: snapshot.metadata,
        content: snapshot.content,
      },
    });
    expect(restoreRes.ok()).toBeTruthy();
  });
});
