'use client'

import type { ReactNode } from 'react'
import { ButtonOrDropdownButton } from '@mdxeditor/editor'
import {
  Clapperboard,
  FileText,
  GalleryVerticalEnd,
  GitBranch,
} from 'lucide-react'
import type { BlockSurface, BlockCategory } from '@/app/components/mdx/registry.types'
import {
  getBlockPaletteGroups,
  getBlockSnippet,
} from './block-snippets'

const CATEGORY_ICONS: Record<BlockCategory, ReactNode> = {
  narrative: <FileText className="h-4 w-4" />,
  process: <GitBranch className="h-4 w-4" />,
  evidence: <Clapperboard className="h-4 w-4" />,
  media: <GalleryVerticalEnd className="h-4 w-4" />,
}

type BlockPaletteProps = {
  surface: BlockSurface
  onInsert: (snippet: string) => void
}

export function BlockPalette({ surface, onInsert }: BlockPaletteProps) {
  const groups = getBlockPaletteGroups(surface)

  return (
    <>
      {groups.map((group) => (
        <ButtonOrDropdownButton
          key={group.category}
          title={`Insert ${group.label} block`}
          items={group.items.map((item) => ({
            label: item.label,
            value: item.componentName,
          }))}
          onChoose={(componentName) => {
            const resolvedName =
              componentName || group.items[0]?.componentName || ''
            const snippet = getBlockSnippet(resolvedName)
            if (!snippet) return
            onInsert(`\n\n${snippet}\n\n`)
          }}
        >
          {CATEGORY_ICONS[group.category]}
        </ButtonOrDropdownButton>
      ))}
    </>
  )
}
