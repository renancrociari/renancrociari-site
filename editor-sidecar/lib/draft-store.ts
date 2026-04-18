import { randomUUID } from 'node:crypto';
import type { DraftDocument } from 'app/lib/editor-draft-types';

declare global {
  // eslint-disable-next-line no-var
  var __renanPortfolioEditorDrafts__: Map<string, DraftDocument> | undefined;
}

const drafts =
  globalThis.__renanPortfolioEditorDrafts__ ??
  (globalThis.__renanPortfolioEditorDrafts__ = new Map<string, DraftDocument>());

export const draftStore = {
  get(id: string) {
    return drafts.get(id);
  },
  set(doc: DraftDocument) {
    drafts.set(doc.id, doc);
  },
  delete(id: string) {
    drafts.delete(id);
  },
};

export function createWorkDraft(input: {
  workFileId: string;
  slug: string;
  metadata: Record<string, string>;
  content: string;
}) {
  const doc: DraftDocument = {
    collection: 'work',
    id: randomUUID(),
    slug: input.slug,
    workFileId: input.workFileId,
    metadata: { ...input.metadata },
    content: input.content,
    updatedAt: Date.now(),
  };
  draftStore.set(doc);
  return doc;
}

export function upsertWorkDraft(
  draftId: string,
  patch: Partial<
    Pick<DraftDocument, 'metadata' | 'content' | 'slug' | 'workFileId'>
  >
) {
  const previous = draftStore.get(draftId);
  if (!previous) return null;

  const next: DraftDocument = {
    ...previous,
    ...patch,
    metadata: patch.metadata
      ? { ...previous.metadata, ...patch.metadata }
      : previous.metadata,
    content: patch.content !== undefined ? patch.content : previous.content,
    updatedAt: Date.now(),
  };

  draftStore.set(next);
  return next;
}
