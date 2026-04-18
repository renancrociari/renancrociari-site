import assert from 'node:assert';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const rendererUrl = pathToFileURL(
  join(root, 'src/portfolio-os-integration/renderer/shared-renderer.mjs')
).href;
const workContentUrl = pathToFileURL(
  join(root, 'src/portfolio-os-integration/editor/work-content.mjs')
).href;

const MANAGED = ['farfetch-performance', 'dating-platform', 'journal-finder'];

/** @param {string} html */
function maxSectionIndexFromPreviewHtml(html) {
  const re = /data-editor-node-id="section-(\d+)"/g;
  let max = -1;
  let m;
  while ((m = re.exec(html)) !== null) {
    const n = Number.parseInt(m[1], 10);
    if (n > max) max = n;
  }
  return max;
}

test('B13: contagem de secções instrumentadas = modelo estruturado (preview editor)', async () => {
  const { renderEditorPreviewMainHtml, getStructuredWorkSectionCount } = await import(rendererUrl);
  const { readWorkDocumentForEditor, materializeWorkMetadataForRender } = await import(workContentUrl);

  for (const slug of MANAGED) {
    const doc = readWorkDocumentForEditor(`${slug}/index.mdx`);
    const metadata = materializeWorkMetadataForRender(doc.rawMetadata);
    const html = renderEditorPreviewMainHtml({
      collection: 'work',
      slug,
      metadata,
      markdownBody: doc.content,
      editorPreview: true,
    });

    const expected = getStructuredWorkSectionCount(doc.content, slug);
    const maxIdx = maxSectionIndexFromPreviewHtml(html);
    assert.strictEqual(
      maxIdx + 1,
      expected,
      `${slug}: preview deve ter section-0..section-${expected - 1}`
    );
  }
});
