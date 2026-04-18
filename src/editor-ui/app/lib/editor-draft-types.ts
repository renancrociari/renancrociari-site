import type { CaseStudyMetadata } from 'app/lib/content-types';

export type DraftCollection = 'work';

export type DraftDocument = {
  collection: DraftCollection;
  id: string;
  slug: string;
  workFileId: string;
  metadata: Record<string, string>;
  content: string;
  updatedAt: number;
};

export type WorkDocumentSource = 'file' | 'draft';

export type EditorSelectionKind = 'shell' | 'section' | 'block';

export type EditorSelection = {
  kind: EditorSelectionKind;
  nodeId: string;
  blockName?: string;
  sectionIndex?: number;
};

export type WorkCaseRenderPayload = {
  slug: string;
  metadata: CaseStudyMetadata;
  content: string;
  workFileId?: string;
};

export const EDITOR_PREVIEW_MSG = {
  READY: 'editor-preview:ready',
  SELECT: 'editor-preview:select',
  HIGHLIGHT: 'editor-preview:highlight',
  HOVER: 'editor-preview:hover',
  REQUEST_REFRESH: 'editor-preview:request-refresh',
} as const;

export type EditorPreviewMessage =
  | { type: typeof EDITOR_PREVIEW_MSG.READY }
  | { type: typeof EDITOR_PREVIEW_MSG.SELECT; selection: EditorSelection }
  | { type: typeof EDITOR_PREVIEW_MSG.HIGHLIGHT; nodeId: string | null }
  | { type: typeof EDITOR_PREVIEW_MSG.HOVER; nodeId: string | null }
  | { type: typeof EDITOR_PREVIEW_MSG.REQUEST_REFRESH };
