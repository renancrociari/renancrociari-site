import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const rendererUrl = pathToFileURL(
  join(root, 'src/portfolio-os-integration/renderer/shared-renderer.mjs')
).href;

test('build público e preview partilham renderSiteWorkPage; só editorPreview instrumenta', async () => {
  const {
    renderEditorPreviewMainHtml,
    renderSiteWorkPage,
  } = await import(rendererUrl);

  const metadata = {
    slug: 'farfetch-performance',
    title: 'Test Case',
    tags: ['Alpha', 'Beta'],
    featured_image: '../images/case-farfetch/ff-case-featured.webp',
    summary: 'Short summary for preview shell only.',
    company: 'Co',
    role: 'Designer',
    publishedAt: '2024-01-15',
    platforms: 'Web',
    domain: 'Retail',
  };

  const markdownBody =
    '# Executive summary\n\n## The company\n\nHello world.\n\n---\n\n# Other\n\nMore body.\n';

  const publicMain = renderEditorPreviewMainHtml({
    collection: 'work',
    slug: 'farfetch-performance',
    metadata,
    markdownBody,
  });

  const direct = renderSiteWorkPage(metadata, markdownBody, {});

  assert.strictEqual(
    publicMain,
    direct,
    'build-content deve usar renderEditorPreviewMainHtml sem flags === renderSiteWorkPage'
  );

  assert.match(publicMain, /content-header/);
  assert.doesNotMatch(publicMain, /data-editor-node-id/);

  const previewMain = renderEditorPreviewMainHtml({
    collection: 'work',
    slug: 'farfetch-performance',
    metadata,
    markdownBody,
    editorPreview: true,
  });

  assert.match(previewMain, /data-editor-node-id="shell-hero"/);
  assert.match(previewMain, /data-editor-node-id="shell-tags"/);
  assert.match(previewMain, /data-editor-node-id="section-0"/);
  assert.match(previewMain, /data-editor-node-id="shell-meta"/);
  assert.match(previewMain, /data-editor-node-id="shell-summary"/);
  assert.match(
    previewMain,
    /data-editor-node-id="sec0-blk0-ExecutiveSummary"/,
    'preview deve instrumentar blocos sec{n}-blk{m}-Component (B9)'
  );
});

test('dating-platform: preview com TextBlock, VideoFigure e FigureLarge; outline alinha (B10)', async () => {
  const {
    renderEditorPreviewMainHtml,
    renderSiteWorkPage,
    getStructuredWorkEditorBlockOutlineItems,
  } = await import(rendererUrl);

  const raw = readFileSync(join(root, 'content/work/dating-platform/index.mdx'), 'utf8');
  const markdownBody = raw.replace(/^---\n[\s\S]*?\n---\n\n/, '');

  const metadata = {
    slug: 'dating-platform',
    title: 'Redesigning the mobile experience of a dating platform',
    tags: ['User Research'],
    featured_image: '../images/case-sl-mobile/sl-case-featured.webp',
    summary: 'Summary line for shell-summary.',
    company: 'SL',
    role: 'Lead',
    publishedAt: '2024-01-10',
    platforms: 'Web',
    domain: 'Social',
  };

  const publicMain = renderEditorPreviewMainHtml({
    collection: 'work',
    slug: 'dating-platform',
    metadata,
    markdownBody,
  });
  assert.doesNotMatch(publicMain, /data-editor-node-id="sec\d+-blk/);

  const direct = renderSiteWorkPage(metadata, markdownBody, {});
  assert.strictEqual(publicMain, direct);

  const previewMain = renderEditorPreviewMainHtml({
    collection: 'work',
    slug: 'dating-platform',
    metadata,
    markdownBody,
    editorPreview: true,
  });

  assert.match(previewMain, /data-editor-node-id="sec[0-9]+-blk[0-9]+-TextBlock"/);
  assert.match(previewMain, /data-editor-node-id="sec[0-9]+-blk[0-9]+-VideoFigure"/);
  assert.match(previewMain, /data-editor-node-id="sec[0-9]+-blk[0-9]+-FigureLarge"/);

  const blocks = getStructuredWorkEditorBlockOutlineItems(markdownBody, 'dating-platform');
  const previewBlockIds = [...previewMain.matchAll(/data-editor-node-id="(sec\d+-blk\d+-[^"]+)"/g)]
    .map((m) => m[1])
    .filter((id) => /^sec\d+-blk\d+-/.test(id));

  assert.strictEqual(
    previewBlockIds.length,
    blocks.length,
    'contagem de nós sec{n}-blk{m} no HTML = itens de outline'
  );
  for (let i = 0; i < blocks.length; i++) {
    assert.strictEqual(blocks[i].nodeId, previewBlockIds[i], `paridade nodeId bloco ${i}`);
  }
});
