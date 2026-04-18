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

test('B13: intervalos de bloco no corpo da secção = contagem de fragmentos instrumentados', async () => {
  const {
    getStructuredWorkBlockBodyRangesMap,
    getStructuredWorkEditorBlockOutlineItems,
    getStructuredWorkMdxSectionSplits,
  } = await import(rendererUrl);
  const { readWorkDocumentForEditor } = await import(workContentUrl);

  for (const slug of MANAGED) {
    const doc = readWorkDocumentForEditor(`${slug}/index.mdx`);
    const splits = getStructuredWorkMdxSectionSplits(doc.content, slug);
    const rangeMap = getStructuredWorkBlockBodyRangesMap(doc.content, slug);
    const blockItems = getStructuredWorkEditorBlockOutlineItems(doc.content, slug);
    const countBySection = new Map();
    for (const item of blockItems) {
      countBySection.set(item.sectionIndex, (countBySection.get(item.sectionIndex) ?? 0) + 1);
    }

    for (let si = 0; si < splits.length; si += 1) {
      const body = splits[si].body;
      const ranges = rangeMap.get(si) ?? [];
      const expectedBlocks = countBySection.get(si) ?? 0;
      assert.strictEqual(
        ranges.length,
        expectedBlocks,
        `${slug} section-${si}: nº de intervalos (${ranges.length}) = blocos outline (${expectedBlocks})`
      );
      for (const r of ranges) {
        assert.ok(r.start >= 0 && r.end <= body.length, `${slug} section-${si}: range fora do corpo`);
        assert.ok(r.start <= r.end, `${slug} section-${si}: start > end`);
      }
    }
  }
});
