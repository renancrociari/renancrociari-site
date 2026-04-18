import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

import {
  CONTENT_DIR,
  ROOT_DIR,
  serializeFrontmatter,
} from './work-content.mjs';

const require = createRequire(import.meta.url);
const { parseContentFrontmatter } = require('../../../scripts/lib/parse-frontmatter.cjs');

export { ROOT_DIR, CONTENT_DIR, serializeFrontmatter };

export const PAGES_CONTENT_DIR = path.join(CONTENT_DIR, 'pages');

const CONTENT_EXTENSIONS = ['.mdx', '.md'];

/** Slugs reservados às páginas fixas do manifesto (não criar duplicados via editor). */
export const RESERVED_PAGE_CREATION_SLUGS = new Set(['home', 'about']);

const MAX_PAGE_DOCUMENTS = 120;

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function trimToString(value) {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).join(', ');
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value).trim();
}

function parseBooleanString(value) {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return undefined;
}

function parseNumberLike(value) {
  const raw = trimToString(value);
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function parseFrontmatterFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = parseContentFrontmatter(raw);
  return {
    filePath,
    raw,
    metadata: data ?? {},
    content: content ?? '',
  };
}

export function toCanonicalPageDocumentId(slug) {
  return `${String(slug || '').trim()}/index.mdx`;
}

function slugFromDocumentId(documentId) {
  const raw = String(documentId || '').replace(/\\/g, '/').trim();
  if (!raw) return '';
  if (raw.includes('..') || raw.startsWith('/')) return '';

  const canonicalMatch = raw.match(/^([^/]+)\/index\.(mdx|md)$/i);
  if (canonicalMatch) {
    return canonicalMatch[1] || '';
  }

  const flatMatch = raw.match(/^([^/]+)\.(mdx|md)$/i);
  if (flatMatch) {
    return flatMatch[1] || '';
  }

  if (!raw.includes('/')) {
    return raw;
  }

  return '';
}

function resolveExistingPageFile(slug) {
  if (!slug) return null;

  const canonicalMdx = path.join(PAGES_CONTENT_DIR, slug, 'index.mdx');
  if (fileExists(canonicalMdx)) {
    return canonicalMdx;
  }

  const canonicalMd = path.join(PAGES_CONTENT_DIR, slug, 'index.md');
  if (fileExists(canonicalMd)) {
    return canonicalMd;
  }

  for (const ext of CONTENT_EXTENSIONS) {
    const legacy = path.join(PAGES_CONTENT_DIR, `${slug}${ext}`);
    if (fileExists(legacy)) {
      return legacy;
    }
  }

  return null;
}

export function resolvePageFilePathFromDocumentId(documentId) {
  const slug = slugFromDocumentId(documentId);
  return resolveExistingPageFile(slug);
}

function listPageFileEntries() {
  if (!fileExists(PAGES_CONTENT_DIR)) {
    return [];
  }

  const results = new Map();
  const dirents = fs.readdirSync(PAGES_CONTENT_DIR, { withFileTypes: true });

  for (const dirent of dirents) {
    if (!dirent.isDirectory()) continue;
    if (dirent.name.startsWith('.')) continue;

    const filePath = resolveExistingPageFile(dirent.name);
    if (!filePath) continue;

    results.set(dirent.name, {
      slug: dirent.name,
      documentId: toCanonicalPageDocumentId(dirent.name),
      filePath,
      source: 'canonical',
    });
  }

  for (const dirent of dirents) {
    if (!dirent.isFile()) continue;
    const ext = path.extname(dirent.name).toLowerCase();
    if (!CONTENT_EXTENSIONS.includes(ext)) continue;

    const slug = dirent.name.slice(0, -ext.length);
    if (results.has(slug)) continue;

    results.set(slug, {
      slug,
      documentId: toCanonicalPageDocumentId(slug),
      filePath: path.join(PAGES_CONTENT_DIR, dirent.name),
      source: 'legacy-flat',
    });
  }

  return [...results.values()];
}

export function normalizePageMetadataForEditor(rawMetadata, slug) {
  const published =
    parseBooleanString(rawMetadata?.published) ??
    (trimToString(rawMetadata?.status) === 'published' ? true : false);

  return {
    title: trimToString(rawMetadata?.title) || slug,
    slug: trimToString(rawMetadata?.slug) || slug,
    type: trimToString(rawMetadata?.type) || 'page',
    status: trimToString(rawMetadata?.status) || (published ? 'published' : 'draft'),
    published: published ? 'true' : 'false',
    description: trimToString(rawMetadata?.description),
    summary: trimToString(rawMetadata?.summary),
    order: trimToString(rawMetadata?.order),
    featured_image: trimToString(rawMetadata?.featured_image),
    og_image: trimToString(rawMetadata?.og_image),
    created_at: trimToString(rawMetadata?.created_at),
    updated_at: trimToString(rawMetadata?.updated_at),
    publishedAt: trimToString(rawMetadata?.publishedAt || rawMetadata?.published_at),
  };
}

export function materializePageMetadataForRender(rawMetadata) {
  const slug = trimToString(rawMetadata?.slug);
  const normalized = normalizePageMetadataForEditor(rawMetadata, slug);
  const published = normalized.published === 'true';

  return {
    ...rawMetadata,
    title: normalized.title,
    slug: normalized.slug,
    type: 'page',
    description: normalized.description,
    summary: normalized.summary || normalized.description,
    status: normalized.status,
    published,
    order: parseNumberLike(normalized.order),
    featured_image: normalized.featured_image,
    og_image: normalized.og_image,
    created_at: normalized.created_at,
    updated_at: normalized.updated_at,
    publishedAt: normalized.publishedAt,
  };
}

export function listPagesEntriesForEditor() {
  return listPageFileEntries()
    .map((entry) => {
      const parsed = parseFrontmatterFile(entry.filePath);
      const metadata = normalizePageMetadataForEditor(parsed.metadata, entry.slug);
      return {
        documentId: entry.documentId,
        id: entry.documentId,
        slug: metadata.slug || entry.slug,
        title: metadata.title || entry.slug,
        published: metadata.published === 'true',
        order: parseNumberLike(metadata.order) ?? 0,
        filePath: entry.filePath,
      };
    })
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.title.localeCompare(b.title);
    });
}

export function readPageDocumentForEditor(documentId) {
  const slug = slugFromDocumentId(documentId);
  const filePath = resolveExistingPageFile(slug);

  if (!slug || !filePath) {
    throw new Error(`Conteúdo de página não encontrado para "${documentId}".`);
  }

  const parsed = parseFrontmatterFile(filePath);

  return {
    id: toCanonicalPageDocumentId(slug),
    documentId: toCanonicalPageDocumentId(slug),
    slug,
    filePath,
    metadata: normalizePageMetadataForEditor(parsed.metadata, slug),
    rawMetadata: parsed.metadata,
    content: parsed.content,
  };
}

function cleanMetadataValue(value) {
  const normalized = trimToString(value);
  return normalized || undefined;
}

function ensurePagesDir() {
  if (!fileExists(PAGES_CONTENT_DIR)) {
    fs.mkdirSync(PAGES_CONTENT_DIR, { recursive: true });
  }
}

export function normalizePageMetadataForStorage(metadata, previousRawMetadata = {}) {
  const now = new Date().toISOString().slice(0, 10);
  const slug =
    cleanMetadataValue(metadata.slug) ||
    cleanMetadataValue(previousRawMetadata.slug) ||
    cleanMetadataValue(metadata.title) ||
    'untitled';
  const published =
    metadata.published !== 'false' && metadata.published !== false;
  const status =
    cleanMetadataValue(metadata.status) ||
    cleanMetadataValue(previousRawMetadata.status) ||
    (published ? 'published' : 'draft');

  return {
    ...previousRawMetadata,
    title:
      cleanMetadataValue(metadata.title) ||
      cleanMetadataValue(previousRawMetadata.title) ||
      slug,
    slug,
    type: 'page',
    status,
    published: published ? true : false,
    description:
      cleanMetadataValue(metadata.description) ||
      cleanMetadataValue(previousRawMetadata.description) ||
      '',
    summary:
      cleanMetadataValue(metadata.summary) ||
      cleanMetadataValue(previousRawMetadata.summary) ||
      '',
    order: parseNumberLike(metadata.order) ?? parseNumberLike(previousRawMetadata.order),
    featured_image:
      cleanMetadataValue(metadata.featured_image) ||
      cleanMetadataValue(previousRawMetadata.featured_image),
    og_image:
      cleanMetadataValue(metadata.og_image) ||
      cleanMetadataValue(previousRawMetadata.og_image),
    created_at:
      cleanMetadataValue(previousRawMetadata.created_at) || now,
    updated_at: now,
    publishedAt:
      cleanMetadataValue(metadata.publishedAt) ||
      cleanMetadataValue(previousRawMetadata.publishedAt) ||
      '',
  };
}

export function savePageDocumentFromEditor(documentId, metadata, content) {
  const slug = slugFromDocumentId(documentId);
  if (!slug) {
    throw new Error('ID de documento inválido.');
  }

  ensurePagesDir();
  const existing = resolveExistingPageFile(slug);
  const previousRawMetadata = existing ? parseFrontmatterFile(existing).metadata : {};
  const nextMetadata = normalizePageMetadataForStorage(metadata, previousRawMetadata);

  const targetDir = path.join(PAGES_CONTENT_DIR, slug);
  const targetFile = path.join(targetDir, 'index.mdx');
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(targetFile, serializeFrontmatter(nextMetadata, content), 'utf8');

  return {
    id: toCanonicalPageDocumentId(slug),
    filePath: targetFile,
  };
}

function createDefaultPageBody(title) {
  return `# ${title}

Em breve...`;
}

export function createPageDocument(title, requestedSlug) {
  const titleValue = trimToString(title);
  if (!titleValue) {
    throw new Error('Informe um título para criar a página.');
  }

  const entries = listPageFileEntries();
  if (entries.length >= MAX_PAGE_DOCUMENTS) {
    throw new Error(
      `Limite de ${MAX_PAGE_DOCUMENTS} páginas atingido. Apague ou arquive conteúdo antes de criar novos documentos.`
    );
  }

  const baseSlug =
    trimToString(requestedSlug) ||
    titleValue
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  if (!baseSlug) {
    throw new Error('Informe um slug válido.');
  }

  if (RESERVED_PAGE_CREATION_SLUGS.has(baseSlug)) {
    throw new Error(
      `O slug "${baseSlug}" é reservado às páginas fixas do site. Escolha outro identificador.`
    );
  }

  let slug = baseSlug;
  let suffix = 2;
  while (resolveExistingPageFile(slug) || fileExists(path.join(PAGES_CONTENT_DIR, slug))) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const metadata = normalizePageMetadataForStorage(
    {
      title: titleValue,
      slug,
      published: 'false',
      description: 'Rascunho',
      status: 'draft',
    },
    {}
  );
  const content = createDefaultPageBody(titleValue);
  const saved = savePageDocumentFromEditor(toCanonicalPageDocumentId(slug), metadata, content);

  return {
    entry: {
      id: saved.id,
      documentId: saved.id,
      slug,
      title: titleValue,
      published: false,
    },
    document: {
      id: saved.id,
      metadata: normalizePageMetadataForEditor(metadata, slug),
      content,
    },
  };
}
