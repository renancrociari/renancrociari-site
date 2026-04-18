import {
  createWorkDocument,
  listWorkEntriesForEditor,
  readWorkDocumentForEditor,
  saveWorkDocumentFromEditor,
} from '../../../../src/portfolio-os-integration/editor/work-content.mjs';
import {
  createPageDocument,
  listPagesEntriesForEditor,
  readPageDocumentForEditor,
  savePageDocumentFromEditor,
} from '../../../../src/portfolio-os-integration/editor/pages-content.mjs';
import {
  devOnlyGuard,
  jsonWithCors,
  optionsWithCors,
  textWithCors,
} from '../../../lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS(request: Request) {
  return optionsWithCors(request);
}

export function GET(request: Request) {
  const blocked = devOnlyGuard(request);
  if (blocked) return blocked;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'list';
  const collection = searchParams.get('collection') || 'pages';
  const id = searchParams.get('id');

  try {
    if (action === 'list') {
      return jsonWithCors(request, {
        entries:
          collection === 'work'
            ? listWorkEntriesForEditor().map((entry) => ({
                id: entry.documentId,
                slug: entry.slug,
                title: entry.title,
                published: entry.published,
              }))
            : listPagesEntriesForEditor().map((entry) => ({
                id: entry.documentId,
                slug: entry.slug,
                title: entry.title,
                published: entry.published,
              })),
      });
    }

    if (action === 'load') {
      if (!id) {
        return textWithCors(request, 'Missing id parameter', { status: 400 });
      }

      return jsonWithCors(
        request,
        collection === 'work'
          ? readWorkDocumentForEditor(id)
          : readPageDocumentForEditor(id)
      );
    }
  } catch (error) {
    return textWithCors(
      request,
      error instanceof Error ? error.message : 'Failed to load content.',
      { status: 400 }
    );
  }

  return textWithCors(request, 'Unsupported action', { status: 400 });
}

export async function POST(request: Request) {
  const blocked = devOnlyGuard(request);
  if (blocked) return blocked;

  let body: {
    action?: 'create' | 'save';
    collection?: 'work' | 'pages';
    id?: string;
    title?: string;
    slug?: string;
    metadata?: Record<string, string>;
    content?: string;
  };

  try {
    body = await request.json();
  } catch {
    return textWithCors(request, 'Invalid JSON', { status: 400 });
  }

  const collection = body.collection || 'pages';

  try {
    if (body.action === 'create') {
      const created =
        collection === 'work'
          ? createWorkDocument(body.title ?? '', body.slug)
          : createPageDocument(body.title ?? '', body.slug);
      return jsonWithCors(request, created, { status: 201 });
    }

    if (!body.id) {
      return textWithCors(request, 'Missing content id', { status: 400 });
    }

    if (collection === 'work') {
      saveWorkDocumentFromEditor(body.id, body.metadata ?? {}, body.content ?? '');
    } else {
      savePageDocumentFromEditor(body.id, body.metadata ?? {}, body.content ?? '');
    }

    return jsonWithCors(request, { ok: true });
  } catch (error) {
    return textWithCors(
      request,
      error instanceof Error ? error.message : 'Failed to save content.',
      { status: 500 }
    );
  }
}
