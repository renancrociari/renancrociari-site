import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseContentFrontmatter } = require('../../scripts/lib/parse-frontmatter.cjs');

const ROOT_DIR = path.resolve(path.join(process.cwd(), '..'));
const PAGES_CONTENT_DIR = path.join(ROOT_DIR, 'content', 'pages');

function ensurePagesDir() {
  if (!fs.existsSync(PAGES_CONTENT_DIR)) {
    fs.mkdirSync(PAGES_CONTENT_DIR, { recursive: true });
  }
}

function parseFrontmatterFile(filePath: string) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = parseContentFrontmatter(raw);
  return {
    metadata: data ?? {},
    content: content ?? '',
  };
}

function toScalar(value: unknown) {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).join(', ');
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value).trim();
}

function formatScalar(value: unknown) {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  const normalized = String(value ?? '').trim();
  if (!normalized) return '""';
  if (/[:#\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '\\"')}"`;
  }
  return normalized;
}

function serializeFrontmatter(metadata: Record<string, unknown>, content: string) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined || value === null) continue;
    lines.push(`${key}: ${formatScalar(value)}`);
  }
  return `${lines.join('\n')}\n---\n\n${String(content ?? '').trim()}\n`;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function pageFilePath(slug: string) {
  return path.join(PAGES_CONTENT_DIR, `${slug}.mdx`);
}

export function listPagesEntriesForEditor() {
  ensurePagesDir();
  return fs
    .readdirSync(PAGES_CONTENT_DIR)
    .filter((file) => file.endsWith('.mdx') || file.endsWith('.md'))
    .map((file) => {
      const slug = file.replace(/\.(mdx|md)$/i, '');
      const parsed = parseFrontmatterFile(path.join(PAGES_CONTENT_DIR, file));
      const metadata = parsed.metadata as Record<string, unknown>;
      return {
        id: slug,
        slug,
        title: toScalar(metadata.title) || slug,
        published: metadata.published !== false && metadata.published !== 'false',
        order: Number(toScalar(metadata.order) || '0'),
      };
    })
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function readPageDocumentForEditor(id: string) {
  const target = pageFilePath(id);
  if (!fs.existsSync(target)) {
    throw new Error(`Page not found: ${id}`);
  }
  const parsed = parseFrontmatterFile(target);
  const metadata = parsed.metadata as Record<string, unknown>;
  return {
    id,
    metadata: Object.fromEntries(
      Object.entries(metadata).map(([key, value]) => [key, toScalar(value)])
    ),
    content: parsed.content,
  };
}

export function savePageDocumentFromEditor(
  id: string,
  metadata: Record<string, string>,
  content: string
) {
  ensurePagesDir();
  const previous = fs.existsSync(pageFilePath(id))
    ? (parseFrontmatterFile(pageFilePath(id)).metadata as Record<string, unknown>)
    : {};
  const nextMetadata: Record<string, unknown> = {
    ...previous,
    ...metadata,
    title: toScalar(metadata.title) || toScalar(previous.title) || id,
    slug: toScalar(metadata.slug) || toScalar(previous.slug) || id,
  };
  fs.writeFileSync(pageFilePath(id), serializeFrontmatter(nextMetadata, content), 'utf8');
}

export function createPageDocument(title: string, requestedSlug?: string) {
  const titleValue = toScalar(title);
  if (!titleValue) {
    throw new Error('Informe um título para criar a página.');
  }

  let slug = toScalar(requestedSlug) || slugify(titleValue);
  if (!slug) {
    throw new Error('Informe um slug válido.');
  }

  let suffix = 2;
  while (fs.existsSync(pageFilePath(slug))) {
    slug = `${slugify(toScalar(requestedSlug) || titleValue)}-${suffix}`;
    suffix += 1;
  }

  const metadata = {
    title: titleValue,
    slug,
    type: 'page',
    published: false,
    description: 'Rascunho',
  };
  const content = `# ${titleValue}\n\nEm breve...`;
  savePageDocumentFromEditor(slug, Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, toScalar(value)])
  ), content);

  return {
    entry: {
      id: slug,
      slug,
      title: titleValue,
      published: false,
    },
    document: {
      id: slug,
      metadata: Object.fromEntries(
        Object.entries(metadata).map(([key, value]) => [key, toScalar(value)])
      ),
      content,
    },
  };
}
