import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseContentFrontmatter } = require('../../../scripts/lib/parse-frontmatter.cjs');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(path.join(__dirname, '..', '..', '..'));
export const CONTENT_DIR = path.join(ROOT_DIR, 'content');
export const WORK_CONTENT_DIR = path.join(CONTENT_DIR, 'work');

const CONTENT_EXTENSIONS = ['.mdx', '.md'];

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

function splitCommaList(value) {
  return trimToString(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
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

function ensureWorkDir() {
  if (!fileExists(WORK_CONTENT_DIR)) {
    fs.mkdirSync(WORK_CONTENT_DIR, { recursive: true });
  }
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

function formatFrontmatterScalar(value) {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  const normalized = String(value ?? '').trim();
  if (!normalized) return '""';
  const needsQuotes =
    /[:#\n[\]{}]|^\s|\s$/.test(normalized) ||
    normalized === 'true' ||
    normalized === 'false' ||
    normalized === 'null';
  if (!needsQuotes) {
    return normalized;
  }
  return `"${normalized.replace(/"/g, '\\"')}"`;
}

export function serializeFrontmatter(metadata, content) {
  const lines = ['---'];

  for (const [key, value] of Object.entries(metadata || {})) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      if (!value.length) continue;
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${formatFrontmatterScalar(item)}`);
      }
      continue;
    }

    lines.push(`${key}: ${formatFrontmatterScalar(value)}`);
  }

  const body = String(content ?? '').trim();
  if (!body) {
    return `${lines.join('\n')}\n---\n`;
  }

  return `${lines.join('\n')}\n---\n\n${body}\n`;
}

export function toCanonicalWorkDocumentId(slug) {
  return `${String(slug || '').trim()}/index.mdx`;
}

function escapeForRegex(str) {
  return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Inverte o prefixo do editor `](/work/<slug>/…` para paths relativos ao ficheiro em `content/work/<slug>/`.
 * @param {string} content
 * @param {string} storageSlug — pasta sob `content/work/` (igual ao segmento do `documentId`).
 * @returns {string}
 */
export function rewriteWorkMarkdownImagePathsForStorage(content, storageSlug) {
  const slug = String(storageSlug || '').trim();
  if (!slug) return String(content ?? '');
  const re = new RegExp(`\\]\\(/work/${escapeForRegex(slug)}/`, 'g');
  return String(content ?? '').replace(re, '](');
}

/**
 * Normaliza `src="/work/<slug>/…` em HTML embutido no MDX.
 * @param {string} content
 * @param {string} storageSlug
 * @returns {string}
 */
export function rewriteWorkHtmlSrcPathsForStorage(content, storageSlug) {
  const slug = String(storageSlug || '').trim();
  if (!slug) return String(content ?? '');
  const re = new RegExp(`(src\\s*=\\s*)(["'])/work/${escapeForRegex(slug)}/`, 'gi');
  return String(content ?? '').replace(re, '$1$2');
}

/**
 * @param {string} value
 * @param {string} storageSlug
 * @returns {string}
 */
export function rewriteWorkScalarAssetPathForStorage(value, storageSlug) {
  const slug = String(storageSlug || '').trim();
  if (!slug) return String(value ?? '').trim();
  const s = String(value ?? '').trim();
  if (!s || /^https?:\/\//i.test(s)) return s;
  const prefix = `/work/${slug}/`;
  if (s.startsWith(prefix)) {
    return s.slice(prefix.length);
  }
  return s;
}

/**
 * @param {Record<string, unknown>} metadata
 * @param {string} storageSlug
 * @returns {Record<string, unknown>}
 */
export function rewriteWorkMetadataImagePathsForStorage(metadata, storageSlug) {
  if (!metadata || !storageSlug) return metadata || {};
  const out = { ...metadata };
  for (const key of ['coverImage', 'featured_image', 'og_image']) {
    if (typeof out[key] === 'string') {
      out[key] = rewriteWorkScalarAssetPathForStorage(out[key], storageSlug);
    }
  }
  return out;
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

function resolveExistingWorkFile(slug) {
  if (!slug) return null;

  const canonicalMdx = path.join(WORK_CONTENT_DIR, slug, 'index.mdx');
  if (fileExists(canonicalMdx)) {
    return canonicalMdx;
  }

  const canonicalMd = path.join(WORK_CONTENT_DIR, slug, 'index.md');
  if (fileExists(canonicalMd)) {
    return canonicalMd;
  }

  for (const ext of CONTENT_EXTENSIONS) {
    const legacy = path.join(WORK_CONTENT_DIR, `${slug}${ext}`);
    if (fileExists(legacy)) {
      return legacy;
    }
  }

  return null;
}

export function resolveWorkFilePathFromDocumentId(documentId) {
  const slug = slugFromDocumentId(documentId);
  return resolveExistingWorkFile(slug);
}

function listWorkFileEntries() {
  ensureWorkDir();

  const results = new Map();
  const dirents = fs.readdirSync(WORK_CONTENT_DIR, { withFileTypes: true });

  for (const dirent of dirents) {
    if (!dirent.isDirectory()) continue;
    if (dirent.name.startsWith('.')) continue;

    const filePath = resolveExistingWorkFile(dirent.name);
    if (!filePath) continue;

    results.set(dirent.name, {
      slug: dirent.name,
      documentId: toCanonicalWorkDocumentId(dirent.name),
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
      documentId: toCanonicalWorkDocumentId(slug),
      filePath: path.join(WORK_CONTENT_DIR, dirent.name),
      source: 'legacy-flat',
    });
  }

  return [...results.values()];
}

export function normalizeWorkMetadataForEditor(rawMetadata, slug) {
  const published =
    parseBooleanString(rawMetadata?.published) ??
    (trimToString(rawMetadata?.status) === 'protected' ||
    trimToString(rawMetadata?.status) === 'published'
      ? true
      : false);
  const summary = trimToString(rawMetadata?.summary || rawMetadata?.description);
  const coverImage = trimToString(rawMetadata?.coverImage || rawMetadata?.featured_image);

  return {
    title: trimToString(rawMetadata?.title) || slug,
    slug: trimToString(rawMetadata?.slug) || slug,
    summary,
    publishedAt: trimToString(rawMetadata?.publishedAt || rawMetadata?.created_at),
    published: published ? 'true' : 'false',
    order: trimToString(rawMetadata?.order),
    company: trimToString(rawMetadata?.company),
    role: trimToString(rawMetadata?.role),
    team: trimToString(rawMetadata?.team),
    duration: trimToString(rawMetadata?.duration),
    domain: trimToString(rawMetadata?.domain),
    platforms: trimToString(rawMetadata?.platforms),
    tools: trimToString(rawMetadata?.tools),
    goals: trimToString(rawMetadata?.goals),
    outcomes: trimToString(rawMetadata?.outcomes),
    impactMetrics: trimToString(rawMetadata?.impactMetrics),
    tags: trimToString(rawMetadata?.tags),
    status:
      trimToString(rawMetadata?.status) || (published ? 'published' : 'draft'),
    coverImage,
    gallery: trimToString(rawMetadata?.gallery),
    video: trimToString(rawMetadata?.video),
    og_image: trimToString(rawMetadata?.og_image),
    protected_password: trimToString(rawMetadata?.protected_password),
  };
}

export function materializeWorkMetadataForRender(rawMetadata) {
  const normalized = normalizeWorkMetadataForEditor(rawMetadata, trimToString(rawMetadata?.slug));
  return {
    ...rawMetadata,
    title: normalized.title,
    slug: normalized.slug,
    summary: normalized.summary,
    description: trimToString(rawMetadata?.description) || normalized.summary,
    publishedAt: normalized.publishedAt,
    published: normalized.published === 'true',
    order: parseNumberLike(normalized.order),
    company: normalized.company,
    role: normalized.role,
    team: normalized.team,
    duration: normalized.duration,
    domain: normalized.domain,
    platforms: normalized.platforms,
    tools: normalized.tools,
    goals: normalized.goals,
    outcomes: normalized.outcomes,
    impactMetrics: normalized.impactMetrics,
    tags: splitCommaList(normalized.tags),
    status: normalized.status,
    coverImage: normalized.coverImage,
    featured_image:
      trimToString(rawMetadata?.featured_image) || normalized.coverImage,
    gallery: normalized.gallery,
    video: normalized.video,
    og_image: normalized.og_image,
    protected_password:
      trimToString(rawMetadata?.protected_password) || undefined,
  };
}

export function listWorkEntriesForEditor() {
  return listWorkFileEntries()
    .map((entry) => {
      const parsed = parseFrontmatterFile(entry.filePath);
      const metadata = normalizeWorkMetadataForEditor(parsed.metadata, entry.slug);
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

export function readWorkDocumentForEditor(documentId) {
  const slug = slugFromDocumentId(documentId);
  const filePath = resolveExistingWorkFile(slug);

  if (!slug || !filePath) {
    throw new Error(`Conteúdo work não encontrado para "${documentId}".`);
  }

  const parsed = parseFrontmatterFile(filePath);

  return {
    id: toCanonicalWorkDocumentId(slug),
    documentId: toCanonicalWorkDocumentId(slug),
    slug,
    filePath,
    metadata: normalizeWorkMetadataForEditor(parsed.metadata, slug),
    rawMetadata: parsed.metadata,
    content: parsed.content,
  };
}

function cleanMetadataValue(value) {
  const normalized = trimToString(value);
  return normalized || undefined;
}

export function normalizeWorkMetadataForStorage(metadata, previousRawMetadata = {}) {
  const now = new Date().toISOString().slice(0, 10);
  const slug =
    cleanMetadataValue(metadata.slug) ||
    cleanMetadataValue(previousRawMetadata.slug) ||
    cleanMetadataValue(metadata.title) ||
    'untitled';
  const publishedAt =
    cleanMetadataValue(metadata.publishedAt) ||
    cleanMetadataValue(previousRawMetadata.publishedAt) ||
    cleanMetadataValue(previousRawMetadata.created_at) ||
    now;
  const summary = cleanMetadataValue(metadata.summary);
  const coverImage = cleanMetadataValue(metadata.coverImage);
  const order = parseNumberLike(metadata.order);
  const published = metadata.published !== 'false';
  const status =
    cleanMetadataValue(metadata.status) ||
    cleanMetadataValue(previousRawMetadata.status) ||
    (published ? 'published' : 'draft');
  const tags = splitCommaList(metadata.tags);

  return {
    ...previousRawMetadata,
    title:
      cleanMetadataValue(metadata.title) ||
      cleanMetadataValue(previousRawMetadata.title) ||
      slug,
    slug,
    type: 'work',
    status,
    published,
    description: summary,
    summary,
    publishedAt,
    created_at:
      cleanMetadataValue(previousRawMetadata.created_at) || publishedAt,
    updated_at: now,
    order,
    company: cleanMetadataValue(metadata.company),
    role: cleanMetadataValue(metadata.role),
    team: cleanMetadataValue(metadata.team),
    duration: cleanMetadataValue(metadata.duration),
    domain: cleanMetadataValue(metadata.domain),
    platforms: cleanMetadataValue(metadata.platforms),
    tools: cleanMetadataValue(metadata.tools),
    goals: cleanMetadataValue(metadata.goals),
    outcomes: cleanMetadataValue(metadata.outcomes),
    impactMetrics: cleanMetadataValue(metadata.impactMetrics),
    tags,
    coverImage,
    featured_image: coverImage,
    gallery: cleanMetadataValue(metadata.gallery),
    video: cleanMetadataValue(metadata.video),
    og_image:
      cleanMetadataValue(metadata.og_image) ||
      cleanMetadataValue(previousRawMetadata.og_image),
    protected_password:
      status === 'protected'
        ? cleanMetadataValue(metadata.protected_password) ||
          cleanMetadataValue(previousRawMetadata.protected_password)
        : undefined,
  };
}

export function saveWorkDocumentFromEditor(documentId, metadata, content) {
  const slug = slugFromDocumentId(documentId);
  if (!slug) {
    throw new Error('ID de documento inválido.');
  }

  ensureWorkDir();
  const existing = resolveExistingWorkFile(slug);
  const previousRawMetadata = existing
    ? parseFrontmatterFile(existing).metadata
    : {};
  const nextMetadata = normalizeWorkMetadataForStorage(metadata, previousRawMetadata);
  const diskMetadata = rewriteWorkMetadataImagePathsForStorage(nextMetadata, slug);
  let diskContent = rewriteWorkMarkdownImagePathsForStorage(content ?? '', slug);
  diskContent = rewriteWorkHtmlSrcPathsForStorage(diskContent, slug);

  const targetDir = path.join(WORK_CONTENT_DIR, slug);
  const targetFile = path.join(targetDir, 'index.mdx');
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(targetFile, serializeFrontmatter(diskMetadata, diskContent), 'utf8');

  return {
    id: toCanonicalWorkDocumentId(slug),
    filePath: targetFile,
  };
}

function createDefaultWorkBody(title) {
  return `# Executive summary

## Context

Describe the project context and the problem space.

## Outcome

Document the main results, learnings, and next steps.`;
}

export function createWorkDocument(title, requestedSlug) {
  const titleValue = trimToString(title);
  if (!titleValue) {
    throw new Error('Informe um título para criar o conteúdo.');
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

  let slug = baseSlug;
  let suffix = 2;
  while (resolveExistingWorkFile(slug) || fileExists(path.join(WORK_CONTENT_DIR, slug))) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const metadata = normalizeWorkMetadataForStorage(
    {
      title: titleValue,
      slug,
      published: 'false',
      publishedAt: new Date().toISOString().slice(0, 10),
      summary: '',
      status: 'draft',
    },
    {}
  );
  const content = createDefaultWorkBody(titleValue);
  const saved = saveWorkDocumentFromEditor(toCanonicalWorkDocumentId(slug), metadata, content);

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
      metadata: normalizeWorkMetadataForEditor(metadata, slug),
      content,
    },
  };
}
