'use client'

import type { JsxEditorProps } from '@mdxeditor/editor'
import { useMdastNodeUpdater } from '@mdxeditor/editor'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ProcessTimelineItem } from '@/app/components/mdx/process-timeline'
import {
  getStringAttribute,
  parseExpressionAttribute,
  updateNodeAttributes,
} from '../jsx-attribute-utils'

const EMPTY_ITEM: ProcessTimelineItem = {
  title: '',
  period: '',
  subtitle: '',
  description: '',
}

export function ProcessTimelineEditor({ mdastNode }: JsxEditorProps) {
  const updateMdastNode = useMdastNodeUpdater<typeof mdastNode>()
  const title = getStringAttribute(mdastNode, 'title')
  const items = parseExpressionAttribute<ProcessTimelineItem[]>(
    mdastNode,
    'items',
    [EMPTY_ITEM]
  )

  function commit(nextTitle: string, nextItems: ProcessTimelineItem[]) {
    updateMdastNode({
      attributes: updateNodeAttributes(mdastNode, [
        { name: 'title', type: 'string', value: nextTitle },
        {
          name: 'items',
          type: 'string',
          value: JSON.stringify(nextItems),
        },
      ]),
    })
  }

  function updateItem(
    index: number,
    key: keyof ProcessTimelineItem,
    value: string
  ) {
    const nextItems = items.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [key]: value } : item
    )
    commit(title, nextItems)
  }

  return (
    <div className="my-4 rounded-md border border-border bg-background p-4">
      <div className="space-y-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-foreground">Title</span>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={title}
            onChange={(event) => commit(event.target.value, items)}
          />
        </label>
      </div>

      <div className="mt-4 space-y-4">
        {items.map((item, index) => (
          <div
            key={`${item.title || 'timeline'}-${index}`}
            className="space-y-3 rounded-md border border-border bg-muted/20 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-foreground">
                Step {index + 1}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  commit(
                    title,
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
              <label className="space-y-1 text-sm">
                <span className="font-medium text-foreground">Title</span>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={item.title}
                  onChange={(event) =>
                    updateItem(index, 'title', event.target.value)
                  }
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-foreground">Period</span>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={item.period ?? ''}
                  onChange={(event) =>
                    updateItem(index, 'period', event.target.value)
                  }
                />
              </label>

              <label className="space-y-1 text-sm md:col-span-2">
                <span className="font-medium text-foreground">Subtitle</span>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={item.subtitle ?? ''}
                  onChange={(event) =>
                    updateItem(index, 'subtitle', event.target.value)
                  }
                />
              </label>

              <label className="space-y-1 text-sm md:col-span-2">
                <span className="font-medium text-foreground">Description</span>
                <textarea
                  className="h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-y"
                  value={item.description}
                  onChange={(event) =>
                    updateItem(index, 'description', event.target.value)
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
        onClick={() => commit(title, [...items, { ...EMPTY_ITEM }])}
      >
        <Plus className="h-4 w-4" />
        Add step
      </Button>
    </div>
  )
}
