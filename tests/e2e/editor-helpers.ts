import type { APIRequestContext, Page } from '@playwright/test';

export function workListResponsePredicate(url: string) {
  const u = new URL(url);
  return u.pathname.endsWith('/api/editor/work') && !u.searchParams.has('id');
}

export async function gotoEditorWhenListReady(page: Page) {
  const listPromise = page.waitForResponse(
    (res) =>
      workListResponsePredicate(res.url()) &&
      res.request().method() === 'GET' &&
      res.ok()
  );
  await page.goto('/editor');
  await listPromise;
}

/** Após `reload()` em `/editor`, volta a lista de documentos. */
export async function reloadEditorWhenListReady(page: Page) {
  const listPromise = page.waitForResponse(
    (res) =>
      workListResponsePredicate(res.url()) &&
      res.request().method() === 'GET' &&
      res.ok()
  );
  await page.reload();
  await listPromise;
}

export async function openWorkEntryBySlug(page: Page, slug: string) {
  await page.getByPlaceholder('Buscar...').fill('');
  await page.locator('button').filter({ hasText: `/${slug}` }).click({ force: true });
  await page.locator('iframe[title="Preview draft"]').waitFor({ state: 'visible' });
}

export async function openDocumentLibrary(page: Page) {
  await page.getByRole('button', { name: 'Abrir biblioteca de documentos' }).click();
  await page.getByPlaceholder('Buscar...').waitFor({ state: 'visible' });
  await page.waitForTimeout(400);
}

export type WorkSnapshot = { metadata: Record<string, string>; content: string };

export async function getWorkSnapshot(
  request: APIRequestContext,
  documentId: string
): Promise<WorkSnapshot> {
  const r = await request.get(`/api/editor/work?id=${encodeURIComponent(documentId)}`);
  if (!r.ok()) {
    throw new Error(`GET /api/editor/work ${r.status}: ${await r.text()}`);
  }
  return r.json() as Promise<WorkSnapshot>;
}

export async function restoreWorkSnapshot(
  request: APIRequestContext,
  documentId: string,
  snap: WorkSnapshot
) {
  try {
    const res = await request.post('/api/editor/work', {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ id: documentId, metadata: snap.metadata, content: snap.content }),
    });
    if (!res.ok()) {
      throw new Error(`POST restore ${res.status}: ${await res.text()}`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('has been closed')) return;
    throw e;
  }
}

export function metadataMapsEqual(
  a: Record<string, string>,
  b: Record<string, string>
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if ((a[k] ?? '') !== (b[k] ?? '')) return false;
  }
  return true;
}

/**
 * Comparação do corpo MDX após round-trip pelo editor: listas `-`/`*`, `---`/`***`, etc.
 */
export function normalizeMdxLoose(s: string) {
  return s
    .replace(/\r\n/g, '\n')
    .replace(/^---\s*$/gm, '<<<HR>>>')
    .replace(/^\*\*\*\s*$/gm, '<<<HR>>>')
    .replace(/^(\s*)[-*+]\s+/gm, '$1• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
