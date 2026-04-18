import assert from 'node:assert';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { parseContentFrontmatter } = require('../../scripts/lib/parse-frontmatter.cjs');

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const workContentUrl = pathToFileURL(
  join(root, 'src/portfolio-os-integration/editor/work-content.mjs')
).href;

test('serializeFrontmatter + parseContentFrontmatter: round-trip do corpo e campos escalar', async () => {
  const { serializeFrontmatter } = await import(workContentUrl);

  const body = '# Section\n\nHello **world**.\n';
  const metadata = {
    title: 'Título de teste',
    slug: 'test-serialization',
    type: 'work',
    published: true,
    order: 1,
    description: 'Uma descrição com : dois pontos',
  };

  const raw = serializeFrontmatter(metadata, body);
  const { data, content } = parseContentFrontmatter(raw);

  assert.strictEqual(content.trim(), body.trim());
  assert.strictEqual(data.title, metadata.title);
  assert.strictEqual(data.slug, metadata.slug);
  assert.strictEqual(data.type, metadata.type);
  assert.strictEqual(data.published, metadata.published);
  assert.strictEqual(data.order, metadata.order);
  assert.strictEqual(data.description, metadata.description);
});

test('serializeFrontmatter: lista tags preservada no parse', async () => {
  const { serializeFrontmatter } = await import(workContentUrl);

  const metadata = {
    title: 'X',
    slug: 'x',
    type: 'work',
    tags: ['Alpha', 'Beta'],
  };
  const raw = serializeFrontmatter(metadata, 'Body.');
  const { data } = parseContentFrontmatter(raw);

  assert.ok(Array.isArray(data.tags));
  assert.deepStrictEqual(data.tags, ['Alpha', 'Beta']);
});

test('rewriteWorkMarkdownImagePathsForStorage: remove prefixo /work/<slug>/ dos links Markdown', async () => {
  const { rewriteWorkMarkdownImagePathsForStorage } = await import(workContentUrl);

  const body =
    '![x](/work/my-case/../images/a.webp)\n[doc](/work/my-case/../images/b.pdf)';
  const out = rewriteWorkMarkdownImagePathsForStorage(body, 'my-case');
  assert.strictEqual(
    out,
    '![x](../images/a.webp)\n[doc](../images/b.pdf)'
  );
});

test('rewriteWorkScalarAssetPathForStorage: campos de imagem no frontmatter', async () => {
  const { rewriteWorkScalarAssetPathForStorage } = await import(workContentUrl);

  assert.strictEqual(
    rewriteWorkScalarAssetPathForStorage('/work/foo/../images/x.webp', 'foo'),
    '../images/x.webp'
  );
  assert.strictEqual(
    rewriteWorkScalarAssetPathForStorage('../images/y.webp', 'foo'),
    '../images/y.webp'
  );
  assert.strictEqual(
    rewriteWorkScalarAssetPathForStorage('https://cdn.example/x.png', 'foo'),
    'https://cdn.example/x.png'
  );
});

test('rewriteWorkHtmlSrcPathsForStorage: src com prefixo /work/<slug>/', async () => {
  const { rewriteWorkHtmlSrcPathsForStorage } = await import(workContentUrl);

  const html = '<img src="/work/case-slug/../images/p.png" alt="p" />';
  const out = rewriteWorkHtmlSrcPathsForStorage(html, 'case-slug');
  assert.strictEqual(out, '<img src="../images/p.png" alt="p" />');
});
