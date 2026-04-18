import {
  createEditorAdapterBundle as createBundleFromPkg,
  type EditorPageVariant,
  type EditorAdapterBundle,
  type EditorDataAdapter,
  type EditorEditorialAdapterComposition,
  type EditorEmbeddedPreviewProps,
  type EditorPreviewAdapter,
  type EditorCollectionId,
} from '@portfolio-os/editor';
import type { ComponentType } from 'react';
import { resolveDevApiRoot } from '../../../../portfolio-os-integration/lib/dev-api-root.js';

function getDevApiRootSync() {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  return (
    (window as typeof window & { __RC_DEV_API_ROOT__?: string }).__RC_DEV_API_ROOT__ ||
    'http://localhost:3001'
  );
}

async function getDevApiRootAsync() {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  const fromWindow = (window as typeof window & { __RC_DEV_API_ROOT__?: string }).__RC_DEV_API_ROOT__;
  if (fromWindow) return fromWindow;
  const resolved = await resolveDevApiRoot();
  (window as typeof window & { __RC_DEV_API_ROOT__?: string }).__RC_DEV_API_ROOT__ = resolved;
  return resolved;
}

function mapEntry(
  collection: EditorCollectionId,
  e: { id: string; slug: string; title: string; published?: boolean }
) {
  return {
    documentId: e.id,
    collection,
    slug: e.slug,
    title: e.title,
    published: e.published,
  };
}

function createRemoteCollectionAdapter(
  collection: EditorCollectionId,
  pathSegment: 'work' | 'pages'
): EditorDataAdapter {
  return {
    async listDocuments() {
      const root = await getDevApiRootAsync();
      const res = await fetch(`${root}/api/editor/${pathSegment}`);
      if (!res.ok) return null;
      const data = (await res.json()) as {
        entries: { id: string; slug: string; title: string; published?: boolean }[];
      };
      return (data.entries ?? []).map((e) => mapEntry(collection, e));
    },

    async loadDocument(documentId) {
      const root = await getDevApiRootAsync();
      const res = await fetch(
        `${root}/api/editor/${pathSegment}?id=${encodeURIComponent(documentId)}`
      );
      if (!res.ok) throw new Error(await res.text());
      return (await res.json()) as any;
    },

    async saveDocument(documentId, metadata, content) {
      const root = await getDevApiRootAsync();
      const res = await fetch(`${root}/api/editor/${pathSegment}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: documentId, metadata, content }),
      });
      if (!res.ok) throw new Error(await res.text());
    },

    async createDocument(title, slug) {
      const root = await getDevApiRootAsync();
      const res = await fetch(`${root}/api/editor/${pathSegment}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          title,
          slug: slug?.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as {
        entry: { id: string; slug: string; title: string; published?: boolean };
        document: any;
      };
      return {
        entry: mapEntry(collection, data.entry),
        document: data.document,
      };
    },
  };
}

export function createPrivateWorkEditorDataAdapter(): EditorDataAdapter {
  return createRemoteCollectionAdapter('work', 'work');
}

export function createPagesEditorDataAdapter(): EditorDataAdapter {
  return createRemoteCollectionAdapter('pages', 'pages');
}

export function createEditorAdapterBundle(
  variant: EditorPageVariant,
  collection: EditorCollectionId = 'work'
): EditorAdapterBundle {
  return createBundleFromPkg(variant, collection);
}

export function createPreviewAdapterFromBundle(
  bundle: EditorAdapterBundle,
  options?: { embeddedPreview?: ComponentType<EditorEmbeddedPreviewProps> }
): EditorPreviewAdapter {
  if (bundle.previewChannel === 'iframe-postmessage') {
    return {
      channel: 'iframe-postmessage',
      iframeSrcBuilder: ({ draftId, slug, cacheKey }) => {
        const root = getDevApiRootSync();
        const base = `${root}/editor/preview/work/${encodeURIComponent(slug)}`;
        return `${base}?draftId=${encodeURIComponent(draftId)}&v=${cacheKey}`;
      },
    };
  }
  if (!options?.embeddedPreview) {
    throw new Error(
      'createPreviewAdapterFromBundle: embeddedPreview component is required for embedded-callbacks channel'
    );
  }
  return {
    channel: 'embedded-callbacks',
    EmbeddedPreview: options.embeddedPreview,
  };
}

export function composeEditorialAdapters(
  bundle: EditorAdapterBundle,
  data: EditorDataAdapter,
  previewOptions?: { embeddedPreview?: ComponentType<EditorEmbeddedPreviewProps> }
): EditorEditorialAdapterComposition {
  return {
    bundle,
    data,
    preview: createPreviewAdapterFromBundle(bundle, previewOptions),
  };
}

export type {
  EditorPageVariant,
  EditorAdapterBundle,
  EditorDataAdapter,
  EditorDocumentListItem,
} from '@portfolio-os/editor';
