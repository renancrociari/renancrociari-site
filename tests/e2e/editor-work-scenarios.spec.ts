import { test, expect, type Dialog } from '@playwright/test';
import {
  getWorkSnapshot,
  gotoEditorWhenListReady,
  metadataMapsEqual,
  normalizeMdxLoose,
  openDocumentLibrary,
  openWorkEntryBySlug,
  reloadEditorWhenListReady,
  restoreWorkSnapshot,
} from './editor-helpers';

/**
 * Cenários obrigatórios do plano v2 (secção «Testes e Cenários Obrigatórios»).
 * Complementa `editor-work.spec.ts` (B19).
 */
test.describe('Cenários obrigatórios — editor work', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test('salvar só metadata sem alterar o corpo', async ({ page, request }) => {
    const slug = 'farfetch-performance';
    const documentId = `${slug}/index.mdx`;
    const before = await getWorkSnapshot(request, documentId);

    await gotoEditorWhenListReady(page);
    try {
      await openWorkEntryBySlug(page, slug);
      await page.locator('button[data-sidebar-node-id="shell-hero"]').click();
      const title = page.locator('#meta-title');
      await expect(title).toBeVisible();
      await title.fill(`${(before.metadata.title || '').trim()} [e2e-meta-only]`);

      const saveWork = page.waitForResponse(
        (res) =>
          res.url().includes('/api/editor/work') &&
          res.request().method() === 'POST' &&
          res.ok()
      );
      await page.getByRole('button', { name: 'Salvar' }).click();
      await saveWork;

      await expect(page.getByText(/Salvo com sucesso/i)).toBeVisible();

      const after = await getWorkSnapshot(request, documentId);
      expect(normalizeMdxLoose(after.content)).toBe(normalizeMdxLoose(before.content));
      expect(after.metadata.title).toContain('[e2e-meta-only]');
    } finally {
      await restoreWorkSnapshot(request, documentId, before);
    }
  });

  test('salvar só corpo sem alterar metadata', async ({ page, request }) => {
    const slug = 'dating-platform';
    const documentId = `${slug}/index.mdx`;
    const before = await getWorkSnapshot(request, documentId);

    await gotoEditorWhenListReady(page);
    try {
      await openWorkEntryBySlug(page, slug);

      const bodyRoot = page.locator('.pointer-editor-mdx--sidebar .mdxeditor-root-contenteditable');
      const editable = bodyRoot.locator('[contenteditable="true"]').first();
      await editable.click();
      await editable.press('End');
      await editable.pressSequentially('\n\n<!-- e2e-body-only -->\n');

      const saveWork = page.waitForResponse(
        (res) =>
          res.url().includes('/api/editor/work') &&
          res.request().method() === 'POST' &&
          res.ok()
      );
      await page.getByRole('button', { name: 'Salvar' }).click();
      await saveWork;
      await expect(page.getByText(/Salvo com sucesso/i)).toBeVisible();

      const after = await getWorkSnapshot(request, documentId);
      expect(metadataMapsEqual(after.metadata, before.metadata)).toBe(true);
      expect(after.content).toContain('e2e-body-only');
    } finally {
      await restoreWorkSnapshot(request, documentId, before);
    }
  });

  test('trocar de documento com alterações não guardadas (draft/dirty)', async ({
    page,
    request,
  }) => {
    const datingId = 'dating-platform/index.mdx';
    const snap = await getWorkSnapshot(request, datingId);

    await gotoEditorWhenListReady(page);
    const acceptDialog = (d: Dialog) => {
      void d.accept();
    };
    try {
      await openWorkEntryBySlug(page, 'dating-platform');
      await page.locator('button[data-sidebar-node-id="shell-hero"]').click();
      await page.locator('#meta-title').fill('E2E dirty title switch');

      // Dois confirms: abrir biblioteca com dirty + trocar de ficheiro (descartar alterações).
      page.on('dialog', acceptDialog);
      await openDocumentLibrary(page);
      await page.getByPlaceholder('Buscar...').fill('');

      const farfetchId = 'farfetch-performance/index.mdx';
      const loadFarfetch = page.waitForResponse(
        (res) => {
          const u = new URL(res.url());
          return (
            u.pathname.endsWith('/api/editor/work') &&
            u.searchParams.get('id') === farfetchId &&
            res.request().method() === 'GET' &&
            res.ok()
          );
        },
        { timeout: 60_000 }
      );
      const draftAfterSwitch = page.waitForResponse(
        (res) =>
          res.url().includes('/api/editor/drafts') &&
          res.request().method() === 'POST' &&
          res.ok(),
        { timeout: 60_000 }
      );

      await Promise.all([
        loadFarfetch,
        draftAfterSwitch,
        page.locator('button').filter({ hasText: '/farfetch-performance' }).click({ force: true }),
      ]);

      const iframe = page.locator('iframe[title="Preview draft"]');
      await expect(iframe).toBeVisible({ timeout: 60_000 });
      await expect(iframe).toHaveAttribute('src', /farfetch-performance/);
    } finally {
      page.off('dialog', acceptDialog);
      await restoreWorkSnapshot(request, datingId, snap);
    }
  });

  test('recriar preview após reload da página /editor', async ({ page, request }) => {
    const slug = 'journal-finder';
    const documentId = `${slug}/index.mdx`;
    const snap = await getWorkSnapshot(request, documentId);

    await gotoEditorWhenListReady(page);
    try {
      await openWorkEntryBySlug(page, slug);
      const iframe = page.locator('iframe[title="Preview draft"]');
      const srcBefore = await iframe.getAttribute('src');
      expect(srcBefore).toContain('/editor/preview/work/');

      await reloadEditorWhenListReady(page);

      await openWorkEntryBySlug(page, slug);
      await expect(iframe).toBeVisible();
      const srcAfter = await iframe.getAttribute('src');
      expect(srcAfter).toContain('/editor/preview/work/');
      expect(srcAfter).toContain('journal-finder');
    } finally {
      await restoreWorkSnapshot(request, documentId, snap);
    }
  });

  test('preview do journal-finder no editor sem gate de senha (iframe)', async ({ page, request }) => {
    const documentId = 'journal-finder/index.mdx';
    const snap = await getWorkSnapshot(request, documentId);

    await gotoEditorWhenListReady(page);
    try {
      await openWorkEntryBySlug(page, 'journal-finder');
      const preview = page.frameLocator('iframe[title="Preview draft"]');
      await expect(preview.locator('#password-gate')).toHaveCount(0);
      await expect(preview.getByText('Protected Content')).toHaveCount(0);
      await expect(preview.locator('[data-editor-node-id="shell-hero"]')).toBeVisible();
    } finally {
      await restoreWorkSnapshot(request, documentId, snap);
    }
  });
});
