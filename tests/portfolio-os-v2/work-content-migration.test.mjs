import assert from 'node:assert';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const workContentUrl = pathToFileURL(
  join(root, 'src/portfolio-os-integration/editor/work-content.mjs')
).href;

const MANAGED_SLUGS = ['farfetch-performance', 'dating-platform', 'journal-finder'];

test('toCanonicalWorkDocumentId e resolveWorkFilePathFromDocumentId para slugs geridos', async () => {
  const { toCanonicalWorkDocumentId, resolveWorkFilePathFromDocumentId } = await import(
    workContentUrl
  );

  for (const slug of MANAGED_SLUGS) {
    const id = toCanonicalWorkDocumentId(slug);
    assert.strictEqual(id, `${slug}/index.mdx`);
    const filePath = resolveWorkFilePathFromDocumentId(id);
    assert.ok(filePath, `path para ${id}`);
    assert.match(filePath, new RegExp(`${slug}[/\\\\]index\\.mdx$`));
  }
});

test('listWorkEntriesForEditor inclui os três cases com id canónico', async () => {
  const { listWorkEntriesForEditor } = await import(workContentUrl);

  const entries = listWorkEntriesForEditor();
  const bySlug = new Map(entries.map((e) => [e.slug, e]));

  for (const slug of MANAGED_SLUGS) {
    const e = bySlug.get(slug);
    assert.ok(e, `entrada ${slug}`);
    assert.strictEqual(e.documentId, `${slug}/index.mdx`);
    assert.strictEqual(e.id, `${slug}/index.mdx`);
    assert.strictEqual(typeof e.title, 'string');
    assert.strictEqual(typeof e.published, 'boolean');
  }
});

test('readWorkDocumentForEditor: conteúdo MDX canónico legível para cada case', async () => {
  const { readWorkDocumentForEditor } = await import(workContentUrl);

  const expectations = [
    {
      slug: 'farfetch-performance',
      needle: 'Executive summary',
    },
    {
      slug: 'dating-platform',
      needle: '# Summary',
    },
    {
      slug: 'journal-finder',
      needle: 'Executive summary',
    },
  ];

  for (const { slug, needle } of expectations) {
    const doc = readWorkDocumentForEditor(`${slug}/index.mdx`);
    assert.ok(doc.content.length > 200, `${slug}: corpo suficiente`);
    assert.ok(
      doc.content.includes(needle),
      `${slug}: deve conter “${needle}”`
    );
    assert.strictEqual(doc.slug, slug);
    assert.strictEqual(doc.documentId, `${slug}/index.mdx`);
    assert.ok(doc.metadata && typeof doc.metadata === 'object');
  }
});
