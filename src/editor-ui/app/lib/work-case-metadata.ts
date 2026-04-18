import type { CaseStudyMetadata } from 'app/lib/content-types';
import { parsePublished } from 'app/lib/content-types';

function extractTitleFromContent(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Case study';
}

export function metadataRecordToCaseStudy(
  metadata: Record<string, string | undefined>,
  content: string
): CaseStudyMetadata {
  const meta = { ...metadata } as unknown as CaseStudyMetadata;
  if (!meta.title?.trim()) meta.title = extractTitleFromContent(content);
  if (!meta.summary?.trim()) meta.summary = meta.title;
  if (!meta.publishedAt?.trim()) {
    meta.publishedAt = new Date().toISOString().slice(0, 10);
  }
  meta.published = parsePublished(
    (meta as Record<string, unknown>).published as
      | string
      | boolean
      | undefined
  );
  return meta;
}
