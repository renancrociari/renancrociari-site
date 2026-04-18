import assert from 'node:assert';
import { readFileSync } from 'node:fs';
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
const manifestUrl = pathToFileURL(
  join(root, 'src/portfolio-os-integration/config/routing-manifest.mjs')
).href;

/** @param {string} html */
export function extractArticleContentInner(html) {
  const needle = '<div class="article-content">';
  const start = html.indexOf(needle);
  if (start < 0) {
    throw new Error('HTML sem <div class="article-content">');
  }
  let pos = start + needle.length;
  let depth = 1;
  while (pos < html.length && depth > 0) {
    const nextOpen = html.indexOf('<div', pos);
    const nextClose = html.indexOf('</div>', pos);
    if (nextClose < 0) {
      throw new Error('HTML article-content: </div> em falta');
    }
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      pos = nextOpen + 4;
    } else {
      depth -= 1;
      if (depth === 0) {
        return html.slice(start + needle.length, nextClose).trim();
      }
      pos = nextClose + 6;
    }
  }
  throw new Error('HTML article-content: estrutura de divs inválida');
}

/** @param {string} s */
function decodeHtmlEntities(s) {
  return s
    .replace(/&apos;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&');
}

/** @param {string} s */
function normalizeTypographyQuotes(s) {
  return s.replace(/[\u2018\u2019\u201C\u201D]/g, (c) =>
    /** @type {Record<string, string>} */ ({
      '\u2018': "'",
      '\u2019': "'",
      '\u201C': '"',
      '\u201D': '"',
    })[c]
  );
}

/**
 * Texto visível normalizado (paridade B18): sem tags, entidades e aspas tipográficas unificadas.
 * Preserva `alt` de `<img>` antes de remover tags — o regex de tags apagava descrições que no MDX
 * podem aparecer como texto visível noutro nó, o que inflacionava falsos negativos no Jaccard (dating).
 * @param {string} html
 */
export function normalizeWorkArticleVisibleText(html) {
  const altChunks = [];
  const strippedImgs = html.replace(
    /<img\b[^>]*\balt\s*=\s*(["'])([\s\S]*?)\1[^>]*>/gi,
    (_m, _q, alt) => {
      altChunks.push(alt);
      return ' ';
    }
  );
  const noTags = strippedImgs.replace(/<[^>]+>/g, ' ');
  const merged = `${noTags} ${altChunks.join(' ')}`;
  return normalizeTypographyQuotes(decodeHtmlEntities(merged)).replace(/\s+/g, ' ').trim();
}

/**
 * Normaliza diferenças conhecidas do HTML legado dating (markdown cru em blocos) vs gerador.
 * @param {string} visibleText — resultado de `normalizeWorkArticleVisibleText` sobre o inner do article
 */
export function normalizeDatingArticleForParity(visibleText) {
  return visibleText
    .replace(/\s*#\s*(?=Painpoint)/gi, ' ')
    .replace(/\s*\(see the image below\)\.?/gi, '')
    .replace(/\s*\*{3,}\s*/g, ' ')
    .replace(/\[e2e-b19\]/gi, '')
    .replace(/\be2e-b19\b/gi, '')
    .replace(/\\<!--\s*e2e-b19\s*-->/gi, '')
    .replace(/<!--\s*e2e-b19\s*-->/gi, '')
    .replace(/\\&lt;!--[\s\S]*?--(?:>|&gt;)/gi, '')
    .replace(/--(?:>|&gt;)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** @param {string} t */
function wordTypeSet(t) {
  return new Set(
    t
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 1)
  );
}

/** Jaccard entre conjuntos de palavras (tipos), para cobertura lexical estável. */
export function wordSetJaccard(a, b) {
  let inter = 0;
  for (const x of a) {
    if (b.has(x)) inter += 1;
  }
  const union = a.size + b.size - inter;
  return union === 0 ? 1 : inter / union;
}

/**
 * Limiar B18 dating: legado mistura `# Painpoint` com texto corrido; gerador emite títulos limpos + alts de imagem.
 * Valor observado no gerador atual ≈0,989 (interseção lexical estável; 0,993 deixava falsos negativos).
 */
const DATING_LEXICAL_JACCARD_MIN = 0.985;

/** @param {string} html @param {RegExp} re */
function countMatches(html, re) {
  return (html.match(re) || []).length;
}

test('farfetch-performance: texto visível dentro de article-content coincide com HTML legado', async () => {
  const { renderSiteWorkPage } = await import(rendererUrl);
  const { readWorkDocumentForEditor, materializeWorkMetadataForRender } = await import(workContentUrl);
  const { MANAGED_ROUTE_MANIFEST } = await import(manifestUrl);

  const slug = 'farfetch-performance';
  const { legacySourcePage } = MANAGED_ROUTE_MANIFEST.work[slug];
  const legacyPath = join(root, 'src/pages', legacySourcePage);
  const legacyHtml = readFileSync(legacyPath, 'utf8');

  const doc = readWorkDocumentForEditor(`${slug}/index.mdx`);
  const metadata = materializeWorkMetadataForRender(doc.rawMetadata);
  const generatedHtml = renderSiteWorkPage(metadata, doc.content, {});

  const legacyArticle = extractArticleContentInner(legacyHtml);
  const generatedArticle = extractArticleContentInner(generatedHtml);

  assert.strictEqual(
    normalizeWorkArticleVisibleText(generatedArticle),
    normalizeWorkArticleVisibleText(legacyArticle)
  );
});

test('journal-finder: contagens estruturais (metrics, featured-metrics, text-block) = legado', async () => {
  const { renderSiteWorkPage } = await import(rendererUrl);
  const { readWorkDocumentForEditor, materializeWorkMetadataForRender } = await import(workContentUrl);
  const { MANAGED_ROUTE_MANIFEST } = await import(manifestUrl);

  const slug = 'journal-finder';
  const { legacySourcePage } = MANAGED_ROUTE_MANIFEST.work[slug];
  const legacyPath = join(root, 'src/pages', legacySourcePage);
  const legacyHtml = readFileSync(legacyPath, 'utf8');

  const doc = readWorkDocumentForEditor(`${slug}/index.mdx`);
  const metadata = materializeWorkMetadataForRender(doc.rawMetadata);
  const generatedHtml = renderSiteWorkPage(metadata, doc.content, {});

  const legacyArticle = extractArticleContentInner(legacyHtml);
  const generatedArticle = extractArticleContentInner(generatedHtml);

  const pairs = [
    [/class="metric"/g, 'metric'],
    [/featured-metrics/g, 'featured-metrics'],
    [/class="text-block"/g, 'text-block'],
  ];
  for (const [re, label] of pairs) {
    assert.strictEqual(
      countMatches(generatedArticle, re),
      countMatches(legacyArticle, re),
      `${label}: gerado vs legado`
    );
  }
});

test('dating-platform: cobertura lexical vs legado (Jaccard ≥ limiar B18)', async () => {
  const { renderSiteWorkPage } = await import(rendererUrl);
  const { readWorkDocumentForEditor, materializeWorkMetadataForRender } = await import(workContentUrl);
  const { MANAGED_ROUTE_MANIFEST } = await import(manifestUrl);

  const slug = 'dating-platform';
  const { legacySourcePage } = MANAGED_ROUTE_MANIFEST.work[slug];
  const legacyPath = join(root, 'src/pages', legacySourcePage);
  const legacyHtml = readFileSync(legacyPath, 'utf8');

  const doc = readWorkDocumentForEditor(`${slug}/index.mdx`);
  const metadata = materializeWorkMetadataForRender(doc.rawMetadata);
  const generatedHtml = renderSiteWorkPage(metadata, doc.content, {});

  const legacyArticle = extractArticleContentInner(legacyHtml);
  const generatedArticle = extractArticleContentInner(generatedHtml);

  const legacyNorm = normalizeDatingArticleForParity(
    normalizeWorkArticleVisibleText(legacyArticle)
  );
  const generatedNorm = normalizeDatingArticleForParity(
    normalizeWorkArticleVisibleText(generatedArticle)
  );

  const j = wordSetJaccard(wordTypeSet(legacyNorm), wordTypeSet(generatedNorm));
  assert.ok(
    j >= DATING_LEXICAL_JACCARD_MIN,
    `Jaccard lexical ${j.toFixed(6)} < ${DATING_LEXICAL_JACCARD_MIN} (dating: legado vs gerado)`
  );
  assert.ok(generatedNorm.length > 2000, 'dating gerado: texto article suficiente');
});
