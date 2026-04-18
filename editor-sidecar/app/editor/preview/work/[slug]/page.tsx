import { notFound } from 'next/navigation';
import { splitMdxSections } from 'app/lib/split-mdx-sections';
import { EditorPreviewIframeClient } from '../../../../../components/editor-preview-iframe-client';
import { draftStore } from '../../../../../lib/draft-store';
import {
  materializeWorkMetadataForRender,
} from '../../../../../../src/portfolio-os-integration/editor/work-content.mjs';
import { renderSiteMarkdownBody } from '../../../../../../src/portfolio-os-integration/renderer/shared-renderer.mjs';
import {
  absolutizeMarkdownAssetPaths,
  absolutizeSiteAssetPath,
} from '../../../../../lib/site-origin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function SectionTitle({ label }: { label: string }) {
  return (
    <div className="relative flex items-center gap-2 pl-3 py-[6px]">
      <span className="absolute left-0 top-[14px] size-[4px] bg-[#737373] opacity-50" aria-hidden />
      <span className="text-[12px] leading-[16px] uppercase tracking-[0.12px] text-[#737373]">
        {label}
      </span>
    </div>
  );
}

function renderPreviewSectionHtml(source: string) {
  return renderSiteMarkdownBody(absolutizeMarkdownAssetPaths(source || ''));
}

export default async function EditorWorkPreviewPage({
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
  if (!draft) {
    notFound();
  }

  const metadata = materializeWorkMetadataForRender({
    ...draft.metadata,
    slug: draft.slug,
  });

  if (params.slug !== draft.slug) {
    notFound();
  }

  const sections = splitMdxSections(absolutizeMarkdownAssetPaths(draft.content || ''));
  const tags = (metadata.tags || []).filter(Boolean);
  const metaItems = [
    { label: 'Company', value: metadata.company },
    { label: 'Role', value: metadata.role },
    {
      label: 'Year',
      value: metadata.publishedAt
        ? new Date(metadata.publishedAt).getFullYear().toString()
        : undefined,
    },
    { label: 'Platform', value: metadata.platforms },
    { label: 'Focus', value: metadata.domain },
  ].filter((item) => item.value);
  const coverImage = absolutizeSiteAssetPath(
    metadata.coverImage || metadata.featured_image
  );

  return (
    <main className="case-page w-full min-w-0 bg-[#f5f5f5]">
      <EditorPreviewIframeClient />

      <div
        className="border-b border-[rgba(0,0,0,0.06)] bg-[#111111]"
        data-editor-kind="shell"
        data-editor-node-id="shell-hero"
      >
        <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 md:px-8">
          <div className="flex flex-col gap-6">
            <div className="space-y-3">
              <p className="text-[12px] uppercase tracking-[0.24em] text-[rgba(255,255,255,0.45)]">
                Portfolio OS Preview
              </p>
              <h1 className="max-w-[960px] text-[40px] leading-[1.05] font-semibold tracking-[-1.5px] text-white md:text-[56px]">
                {metadata.title}
              </h1>
            </div>

            {coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImage}
                alt={metadata.title}
                className="w-full rounded-[12px] border border-[rgba(255,255,255,0.08)] object-cover"
              />
            ) : null}
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-[1180px] min-w-0 border-l border-r border-[rgba(0,0,0,0.06)] bg-white px-px pb-[121px] pt-8">
        <div className="flex flex-col gap-6 px-4 sm:px-6 md:px-8">
          {metaItems.length > 0 ? (
            <div data-editor-kind="shell" data-editor-node-id="shell-meta">
              <div className="grid gap-3 rounded-[12px] border border-[rgba(0,0,0,0.08)] bg-[#fafafa] p-4 sm:grid-cols-2">
                {metaItems.map((item) => (
                  <div key={item.label} className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#737373]">
                      {item.label}
                    </p>
                    <p className="text-[15px] leading-[22px] font-medium text-[#111111]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {tags.length > 0 ? (
            <div
              className="flex flex-wrap gap-x-2 gap-y-1"
              data-editor-kind="shell"
              data-editor-node-id="shell-tags"
            >
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-none bg-[#f5f5f5] px-[11px] py-[3px] text-[12px] leading-[16px] font-medium text-[#171717]"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {metadata.summary ? (
          <div
            className="mt-8 flex flex-col gap-6 border-t border-[rgba(0,0,0,0.06)] px-4 pb-16 pt-16 lg:flex-row sm:px-6 md:px-8"
            data-editor-kind="shell"
            data-editor-node-id="shell-summary"
          >
            <div className="w-full lg:w-[386px]">
              <SectionTitle label="Overview" />
            </div>
            <div className="w-full min-w-0 flex-1 lg:max-w-[706px]">
              <div className="flex flex-col gap-10 shadow-none">
                <p className="text-[20px] leading-[32px] font-medium text-[#737373]">
                  {metadata.summary}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-10 border-t border-[rgba(0,0,0,0.06)]">
          {sections.map((section, index) => (
            <section
              key={`${section.title ?? 'section'}-${index}`}
              className={`px-4 sm:px-6 md:px-8 ${index === 0 ? 'pt-16' : 'border-t border-[rgba(0,0,0,0.06)] pt-16'}`}
              data-editor-kind="section"
              data-editor-node-id={`section-${index}`}
              data-editor-section-index={String(index)}
            >
              <div className="flex flex-col gap-6 lg:flex-row">
                <div className="w-full lg:w-[386px]">
                  <SectionTitle label={section.title ?? 'Overview'} />
                </div>
                <div className="w-full min-w-0 flex-1 lg:max-w-[706px]">
                  <div
                    className="case-prose min-w-0"
                    dangerouslySetInnerHTML={{
                      __html: renderPreviewSectionHtml(section.body),
                    }}
                  />
                </div>
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
