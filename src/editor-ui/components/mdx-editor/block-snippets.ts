import {
  getAuthorableBlocks,
  getBlockDefinition,
} from '@/app/components/mdx/registry'
import type { BlockSurface, BlockCategory } from '@/app/components/mdx/registry.types'

export type BlockPaletteGroup = {
  category: BlockCategory
  label: string
  items: Array<{ componentName: string; label: string; description: string }>
}

const CATEGORY_LABELS: Record<BlockCategory, string> = {
  narrative: 'Narrative',
  process: 'Process',
  evidence: 'Evidence',
  media: 'Media',
}

export function getBlockSnippet(componentName: string) {
  return getBlockDefinition(componentName)?.snippet ?? ''
}

export function getBlockPaletteGroups(surface: BlockSurface): BlockPaletteGroup[] {
  const groups = new Map<BlockCategory, BlockPaletteGroup>()

  for (const definition of getAuthorableBlocks(surface)) {
    const existing = groups.get(definition.category)
    const item = {
      componentName: definition.componentName,
      label: definition.componentName,
      description: definition.description,
    }

    if (existing) {
      existing.items.push(item)
      continue
    }

    groups.set(definition.category, {
      category: definition.category,
      label: CATEGORY_LABELS[definition.category],
      items: [item],
    })
  }

  return Array.from(groups.values())
}
