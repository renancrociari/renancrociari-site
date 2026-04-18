import type { MdxSectionSplit, OutlineItem } from '@portfolio-os/editor'
import {
  buildSectionBlockRangesMap,
  buildWorkMdxOutline,
  findSectionStartCharOffsetInMdx,
  splitMdxSections,
} from '@portfolio-os/editor'
import {
  getStructuredWorkBlockBodyRangesMap,
  getStructuredWorkEditorBlockOutlineItems,
  getStructuredWorkMdxSectionSplits,
} from '../../../portfolio-os-integration/renderer/shared-renderer.mjs'

/** Cases com `renderStructuredWorkBody` + `mergeStructuredSubsections` (mesma ordem que `data-editor-section-index`). */
export const STRUCTURED_WORK_SLUGS = new Set([
  'farfetch-performance',
  'dating-platform',
  'journal-finder',
])

export function isStructuredWorkSlug(slug: string | undefined): boolean {
  return Boolean(slug && STRUCTURED_WORK_SLUGS.has(slug))
}

/** `documentId` canónico tipo `farfetch-performance/index.mdx` → slug editorial. */
export function editorialSlugFromDocumentId(documentId: string): string | undefined {
  const m = documentId.trim().match(/^([^/]+)\/index\.mdx$/i)
  return m?.[1]
}

export function splitMdxSectionsForWork(
  content: string,
  slug: string | undefined
): MdxSectionSplit[] {
  if (!isStructuredWorkSlug(slug)) {
    return splitMdxSections(content)
  }
  return getStructuredWorkMdxSectionSplits(content, slug as string)
}

export function buildWorkMdxOutlineAligned(
  content: string,
  metadata: Parameters<typeof buildWorkMdxOutline>[1],
  slug: string | undefined
): OutlineItem[] {
  if (!isStructuredWorkSlug(slug)) {
    return buildWorkMdxOutline(content, metadata)
  }
  const base = buildWorkMdxOutline(content, metadata)
  const shell = base.filter((i) => i.kind === 'shell')
  const splits = getStructuredWorkMdxSectionSplits(content, slug as string)
  const sections: OutlineItem[] = splits.map((sec, sectionIndex) => ({
    kind: 'section',
    nodeId: `section-${sectionIndex}`,
    sectionIndex,
    label: sec.title?.trim() || `Secção ${sectionIndex + 1}`,
  }))
  const blocks = getStructuredWorkEditorBlockOutlineItems(content, slug as string)
  const items: OutlineItem[] = [...shell]
  for (let si = 0; si < sections.length; si += 1) {
    items.push(sections[si])
    for (const b of blocks) {
      if (b.sectionIndex === si) {
        items.push(b)
      }
    }
  }
  return items
}

export function buildSectionBlockRangesMapForWork(
  content: string,
  slug: string | undefined
) {
  if (!isStructuredWorkSlug(slug)) {
    return buildSectionBlockRangesMap(content)
  }
  return getStructuredWorkBlockBodyRangesMap(content, slug as string)
}

export function findSectionStartCharOffsetInMdxForWork(
  content: string,
  sectionIndex: number,
  slug: string | undefined
): number {
  if (!isStructuredWorkSlug(slug)) {
    return findSectionStartCharOffsetInMdx(content, sectionIndex)
  }
  const splits = getStructuredWorkMdxSectionSplits(content, slug as string)
  if (sectionIndex < 0 || sectionIndex >= splits.length) {
    return findSectionStartCharOffsetInMdx(content, sectionIndex)
  }
  const title = splits[sectionIndex]?.title?.trim()
  if (!title) {
    return findSectionStartCharOffsetInMdx(content, sectionIndex)
  }
  const needle = `# ${title}`
  const idx = content.indexOf(needle)
  return idx >= 0 ? idx : findSectionStartCharOffsetInMdx(content, sectionIndex)
}
