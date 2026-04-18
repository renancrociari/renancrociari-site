import {
  createWorkDraft,
  draftStore,
  upsertWorkDraft,
} from '../../../../lib/draft-store';
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
    return textWithCors(request, 'Missing id', { status: 400 });
  }

  const document = draftStore.get(id);
  if (!document) {
    return textWithCors(request, 'Draft not found', { status: 404 });
  }

  return jsonWithCors(request, document);
}

export async function POST(request: Request) {
  const blocked = devOnlyGuard(request);
  if (blocked) return blocked;

  let body: {
    draftId?: string;
    workFileId?: string;
    slug?: string;
    metadata?: Record<string, string>;
    content?: string;
  };

  try {
    body = await request.json();
  } catch {
    return textWithCors(request, 'Invalid JSON', { status: 400 });
  }

  if (!body.workFileId || !body.slug) {
    return textWithCors(request, 'workFileId and slug are required', {
      status: 400,
    });
  }

  if (body.draftId) {
    const updated = upsertWorkDraft(body.draftId, {
      workFileId: body.workFileId,
      slug: body.slug,
      metadata: body.metadata,
      content: body.content,
    });
    if (!updated) {
      return textWithCors(request, 'Draft not found', { status: 404 });
    }
    return jsonWithCors(request, updated);
  }

  return jsonWithCors(
    request,
    createWorkDraft({
      workFileId: body.workFileId,
      slug: body.slug,
      metadata: body.metadata ?? {},
      content: body.content ?? '',
    })
  );
}

export function DELETE(request: Request) {
  const blocked = devOnlyGuard(request);
  if (blocked) return blocked;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return textWithCors(request, 'Missing id', { status: 400 });
  }

  draftStore.delete(id);
  return jsonWithCors(request, { ok: true });
}
