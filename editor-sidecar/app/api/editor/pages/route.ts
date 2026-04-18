import {
  createPageDocument,
  listPagesEntriesForEditor,
  readPageDocumentForEditor,
  savePageDocumentFromEditor,
} from '../../../../lib/pages-content';
import {
  devOnlyGuard,
  jsonWithCors,
  optionsWithCors,
  textWithCors,
} from '../../../../lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS(request: Request) {
  return optionsWithCors(request);
}

export function GET(request: Request) {
  const blocked = devOnlyGuard(request);
  if (blocked) return blocked;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return jsonWithCors(request, { entries: listPagesEntriesForEditor() });
  }

  try {
    return jsonWithCors(request, readPageDocumentForEditor(id));
  } catch (error) {
    return textWithCors(
      request,
      error instanceof Error ? error.message : 'Failed to load page.',
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const blocked = devOnlyGuard(request);
  if (blocked) return blocked;

  let body: {
    action?: 'create';
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

  if (body.action === 'create') {
    try {
      return jsonWithCors(request, createPageDocument(body.title ?? '', body.slug), {
        status: 201,
      });
    } catch (error) {
      return textWithCors(
        request,
        error instanceof Error ? error.message : 'Falha ao criar a página.',
        { status: 400 }
      );
    }
  }

  if (!body.id) {
    return textWithCors(request, 'Missing page id', { status: 400 });
  }

  try {
    savePageDocumentFromEditor(body.id, body.metadata ?? {}, body.content ?? '');
    return jsonWithCors(request, { ok: true });
  } catch (error) {
    return textWithCors(
      request,
      error instanceof Error ? error.message : 'Failed to save page.',
      { status: 500 }
    );
  }
}
