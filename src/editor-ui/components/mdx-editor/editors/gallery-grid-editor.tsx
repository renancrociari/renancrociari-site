'use client'

import type { JsxEditorProps } from '@mdxeditor/editor'
import { useMdastNodeUpdater } from '@mdxeditor/editor'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { GalleryGridItem } from '@/app/components/mdx/image-grid'
import {
  getStringAttribute,
  getRawAttributeValue,
  parseExpressionAttribute,
  updateNodeAttributes,
} from '../jsx-attribute-utils'

const EMPTY_ITEM: GalleryGridItem = {
  src: '',
  alt: '',
  caption: '',
}

export function GalleryGridEditor({ mdastNode }: JsxEditorProps) {
  const updateMdastNode = useMdastNodeUpdater<typeof mdastNode>()
  const columns = getStringAttribute(mdastNode, 'columns') || '2'
  const collectionAttributeName = getRawAttributeValue(mdastNode, 'items')
    ? 'items'
    : getRawAttributeValue(mdastNode, 'images')
      ? 'images'
      : 'items'
  const items = parseExpressionAttribute<GalleryGridItem[]>(
    mdastNode,
    collectionAttributeName,
    parseExpressionAttribute<GalleryGridItem[]>(mdastNode, 'images', [
      EMPTY_ITEM,
    ])
  )

  function commit(nextColumns: string, nextItems: GalleryGridItem[]) {
    updateMdastNode({
      attributes: updateNodeAttributes(mdastNode, [
        { name: 'columns', type: 'string', value: nextColumns },
        {
          name: 'items',
          type: 'string',
          value:
            collectionAttributeName === 'items'
              ? JSON.stringify(nextItems)
              : '',
        },
        {
          name: 'images',
          type: 'string',
          value:
            collectionAttributeName === 'images'
              ? JSON.stringify(nextItems)
              : '',
        },
      ]),
    })
  }

  function updateItem(
    index: number,
    key: keyof GalleryGridItem,
    value: string
  ) {
    const nextItems = items.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [key]: value } : item
    )
    commit(columns, nextItems)
  }

  return (
    <div className="my-4 rounded-md border border-border bg-background p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-foreground">Columns</span>
          <select
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={columns === '3' ? '3' : '2'}
            onChange={(event) => commit(event.target.value, items)}
          >
            <option value="2">2 columns</option>
            <option value="3">3 columns</option>
          </select>
        </label>
      </div>

      <div className="mt-4 space-y-4">
        {items.map((item, index) => (
          <div
            key={`${item.src || 'gallery'}-${index}`}
            className="space-y-3 rounded-md border border-border bg-muted/20 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-foreground">
                Image {index + 1}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  commit(
                    columns,
                    items.length === 1
                      ? [EMPTY_ITEM]
                      : items.filter((_, itemIndex) => itemIndex !== index)
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm md:col-span-2">
                <span className="font-medium text-foreground">Source</span>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={item.src}
                  onChange={(event) =>
                    updateItem(index, 'src', event.target.value)
                  }
                />
              </label>

              <label className="space-y-1 text-sm md:col-span-2">
                <span className="font-medium text-foreground">Alt text</span>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={item.alt}
                  onChange={(event) =>
                    updateItem(index, 'alt', event.target.value)
                  }
                />
              </label>

              <label className="space-y-1 text-sm md:col-span-2">
                <span className="font-medium text-foreground">Caption</span>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={item.caption ?? ''}
                  onChange={(event) =>
                    updateItem(index, 'caption', event.target.value)
                  }
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4"
        onClick={() => commit(columns, [...items, { ...EMPTY_ITEM }])}
      >
        <Plus className="h-4 w-4" />
        Add image
      </Button>
    </div>
  )
}
