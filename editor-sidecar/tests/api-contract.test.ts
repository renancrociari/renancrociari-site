import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DELETE as deleteDraftRoute,
  GET as getDraft,
  POST as postDraft,
} from '../app/api/editor/drafts/route';
import { GET as getPages } from '../app/api/editor/pages/route';
import { GET as getWork, POST as postWork } from '../app/api/editor/work/route';

const FARFETCH_ID = 'farfetch-performance/index.mdx';
const ABOUT_PAGE_ID = 'about/index.mdx';

function req(url: string, init?: RequestInit) {
  return new Request(url, init);
}

test('GET /api/editor/work — listagem (wire format)', async () => {
  const res = await getWork(req('http://127.0.0.1:3001/api/editor/work'));
  assert.equal(res.status, 200);
  const body = (await res.json()) as {
    entries: { id: string; slug: string; title: string; published: boolean }[];
  };
  assert.ok(Array.isArray(body.entries));
  assert.ok(body.entries.length >= 3);
  for (const e of body.entries) {
    assert.equal(typeof e.id, 'string');
    assert.match(e.id, /\/index\.mdx$/);
    assert.equal(typeof e.slug, 'string');
    assert.equal(typeof e.title, 'string');
    assert.equal(typeof e.published, 'boolean');
  }
  const farfetch = body.entries.find((e) => e.slug === 'farfetch-performance');
  assert.ok(farfetch);
  assert.equal(farfetch!.id, FARFETCH_ID);
});

test('GET /api/editor/work?id= — documento', async () => {
  const res = await getWork(
    req(`http://127.0.0.1:3001/api/editor/work?id=${encodeURIComponent(FARFETCH_ID)}`)
  );
  assert.equal(res.status, 200);
  const body = (await res.json()) as { id?: string; metadata: Record<string, unknown>; content: string };
  assert.equal(typeof body.content, 'string');
  assert.ok(body.content.includes('Executive summary'));
  assert.equal(typeof body.metadata, 'object');
  assert.ok(body.metadata.title);
});

test('GET /api/editor/work?id= — id inválido → 400', async () => {
  const res = await getWork(
    req('http://127.0.0.1:3001/api/editor/work?id=missing-slug%2Findex.mdx')
  );
  assert.equal(res.status, 400);
});

test('POST /api/editor/work — JSON inválido → 400', async () => {
  const res = await postWork(
    req('http://127.0.0.1:3001/api/editor/work', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    })
  );
  assert.equal(res.status, 400);
});

test('POST /api/editor/work — sem id (não create) → 400', async () => {
  const res = await postWork(
    req('http://127.0.0.1:3001/api/editor/work', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metadata: {}, content: '' }),
    })
  );
  assert.equal(res.status, 400);
});

test('GET /api/editor/pages — listagem (wire format)', async () => {
  const res = await getPages(req('http://127.0.0.1:3001/api/editor/pages'));
  assert.equal(res.status, 200);
  const body = (await res.json()) as {
    entries: { id: string; slug: string; title: string; published: boolean }[];
  };
  assert.ok(Array.isArray(body.entries));
  assert.ok(body.entries.length >= 3);
  for (const e of body.entries) {
    assert.equal(typeof e.id, 'string');
    assert.match(e.id, /\/index\.mdx$/);
    assert.equal(typeof e.slug, 'string');
    assert.equal(typeof e.title, 'string');
    assert.equal(typeof e.published, 'boolean');
  }
  const about = body.entries.find((e) => e.slug === 'about');
  assert.ok(about);
  assert.equal(about!.id, ABOUT_PAGE_ID);
});

test('GET /api/editor/pages?id= — documento', async () => {
  const res = await getPages(
    req(`http://127.0.0.1:3001/api/editor/pages?id=${encodeURIComponent(ABOUT_PAGE_ID)}`)
  );
  assert.equal(res.status, 200);
  const body = (await res.json()) as { metadata: Record<string, unknown>; content: string };
  assert.equal(typeof body.content, 'string');
  assert.ok(body.content.includes('Who am I'));
  assert.equal(typeof body.metadata, 'object');
  assert.ok(body.metadata.title);
});

test('POST /api/editor/drafts — draft de página (collection pages)', async () => {
  const created = await postDraft(
    req('http://127.0.0.1:3001/api/editor/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collection: 'pages',
        workFileId: ABOUT_PAGE_ID,
        slug: 'about',
        metadata: { title: 'About draft test' },
        content: '# Draft about\n',
      }),
    })
  );
  assert.equal(created.status, 200);
  const doc = (await created.json()) as {
    id: string;
    collection: string;
    slug: string;
    workFileId: string;
    metadata: Record<string, string>;
    content: string;
  };
  assert.equal(doc.collection, 'pages');
  assert.equal(doc.slug, 'about');
  assert.equal(doc.workFileId, ABOUT_PAGE_ID);
  assert.equal(doc.content, '# Draft about\n');

  const del = await deleteDraftRoute(
    req(`http://127.0.0.1:3001/api/editor/drafts?id=${encodeURIComponent(doc.id)}`)
  );
  assert.equal(del.status, 200);
});

test('rotas do editor — bloqueadas fora de development', async () => {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const resWork = await getWork(req('http://127.0.0.1:3001/api/editor/work'));
    assert.equal(resWork.status, 403);
    const resPages = await getPages(req('http://127.0.0.1:3001/api/editor/pages'));
    assert.equal(resPages.status, 403);
    const t = await resWork.text();
    assert.match(t, /development/i);
  } finally {
    process.env.NODE_ENV = prev;
  }
});

test('GET /api/editor/drafts — sem id → 400', async () => {
  const res = await getDraft(req('http://127.0.0.1:3001/api/editor/drafts'));
  assert.equal(res.status, 400);
});

test('GET /api/editor/drafts — id inexistente → 404', async () => {
  const res = await getDraft(
    req('http://127.0.0.1:3001/api/editor/drafts?id=00000000-0000-4000-8000-000000000000')
  );
  assert.equal(res.status, 404);
});

test('POST /api/editor/drafts — criar, ler, atualizar, apagar', async () => {
  const created = await postDraft(
    req('http://127.0.0.1:3001/api/editor/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workFileId: FARFETCH_ID,
        slug: 'farfetch-performance',
        metadata: { title: 'Contract test' },
        content: '# Hello\n',
      }),
    })
  );
  assert.equal(created.status, 200);
  const doc = (await created.json()) as {
    id: string;
    collection: string;
    slug: string;
    workFileId: string;
    metadata: Record<string, string>;
    content: string;
    updatedAt: number;
  };
  assert.equal(doc.collection, 'work');
  assert.equal(doc.slug, 'farfetch-performance');
  assert.equal(doc.workFileId, FARFETCH_ID);
  assert.equal(doc.content, '# Hello\n');
  assert.equal(doc.metadata.title, 'Contract test');
  assert.ok(doc.id.length > 10);

  const loaded = await getDraft(
    req(`http://127.0.0.1:3001/api/editor/drafts?id=${encodeURIComponent(doc.id)}`)
  );
  assert.equal(loaded.status, 200);
  const loadedBody = (await loaded.json()) as typeof doc;
  assert.equal(loadedBody.id, doc.id);

  const updated = await postDraft(
    req('http://127.0.0.1:3001/api/editor/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        draftId: doc.id,
        workFileId: FARFETCH_ID,
        slug: 'farfetch-performance',
        metadata: { title: 'Updated' },
        content: '# World\n',
      }),
    })
  );
  assert.equal(updated.status, 200);
  const updatedBody = (await updated.json()) as typeof doc;
  assert.equal(updatedBody.content, '# World\n');
  assert.equal(updatedBody.metadata.title, 'Updated');

  const del = await deleteDraftRoute(
    req(`http://127.0.0.1:3001/api/editor/drafts?id=${encodeURIComponent(doc.id)}`)
  );
  assert.equal(del.status, 200);

  const gone = await getDraft(
    req(`http://127.0.0.1:3001/api/editor/drafts?id=${encodeURIComponent(doc.id)}`)
  );
  assert.equal(gone.status, 404);
});

test('POST /api/editor/drafts — sem workFileId → 400', async () => {
  const res = await postDraft(
    req('http://127.0.0.1:3001/api/editor/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'x', content: '' }),
    })
  );
  assert.equal(res.status, 400);
});
