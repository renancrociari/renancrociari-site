import { notFound } from 'next/navigation';
import { EditorPreviewIframeClient } from '../../../../../components/editor-preview-iframe-client';
import { WorkPreviewBodyClass } from '../../../../../components/work-preview-body-class';
import { draftStore } from '../../../../../lib/draft-store';
import { materializePageMetadataForRender } from '../../../../../../src/portfolio-os-integration/editor/pages-content.mjs';
import { renderEditorPreviewMainHtml } from '../../../../../../src/portfolio-os-integration/renderer/shared-renderer.mjs';
import { resolveSiteRoute } from '../../../../../../src/portfolio-os-integration/config/routing-manifest.mjs';
import {
  absolutizeMarkdownAssetPaths,
  absolutizeSiteAssetPath,
} from '../../../../../lib/site-origin';

import '../../../../../../src/styles/global.css';
import '../../../../../../src/styles/reset.css';
import '../../../../../../src/styles/main.css';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function absolutizePageMetadataAssets(
  meta: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...meta,
    featured_image: absolutizeSiteAssetPath(
      String(meta.featured_image || '')
    ),
    og_image: meta.og_image
      ? absolutizeSiteAssetPath(String(meta.og_image))
      : meta.og_image,
  };
}

export default async function EditorPagesPreviewPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { draftId?: string | string[] };
}) {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  const draftIdRaw = searchParams.draftId;
  const draftId = Array.isArray(draftIdRaw) ? draftIdRaw[0] : draftIdRaw;
  if (!draftId) {
    notFound();
  }

  const draft = draftStore.get(draftId);
  if (!draft || draft.collection !== 'pages') {
    notFound();
  }

  if (params.slug !== draft.slug) {
    notFound();
  }

  const metadata = materializePageMetadataForRender({
    ...draft.metadata,
    slug: draft.slug,
  });

  const route = resolveSiteRoute({
    collection: 'pages',
    documentSlug: draft.slug,
    metadata,
  });

  const metaForRender = absolutizePageMetadataAssets(
    metadata as Record<string, unknown>
  );

  const mainHtml = renderEditorPreviewMainHtml({
    collection: 'pages',
    slug: draft.slug,
    metadata: metaForRender,
    markdownBody: absolutizeMarkdownAssetPaths(draft.content || ''),
    editorPreview: true,
  });

  return (
    <WorkPreviewBodyClass bodyClass={route.bodyClass}>
      <EditorPreviewIframeClient />
      <div dangerouslySetInnerHTML={{ __html: mainHtml }} />
    </WorkPreviewBodyClass>
  );
}
