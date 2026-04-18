'use client'

import React from 'react'
import {
  GenericJsxEditor,
  type JsxEditorProps,
  type JsxComponentDescriptor,
} from '@mdxeditor/editor'
import { getAllRuntimeBlocks } from '@/app/components/mdx/registry'
import { GalleryGridEditor } from './editors/gallery-grid-editor'
import { ProcessTimelineEditor } from './editors/process-timeline-editor'

const customEditors: Record<string, JsxComponentDescriptor['Editor']> = {
  ProcessTimeline: ProcessTimelineEditor,
  GalleryGrid: GalleryGridEditor,
  ImageGrid: GalleryGridEditor,
}

function withPortfolioBlockAnchor(EditorComponent: JsxComponentDescriptor['Editor']) {
  return function PortfolioAnchoredJsxEditor(props: JsxEditorProps) {
    const tagName = props.mdastNode.name ?? 'unknown'

    return (
      <div
        data-portfolio-block-editor="true"
        data-portfolio-block-name={tagName}
      >
        <EditorComponent {...props} />
      </div>
    )
  }
}

export function getPortfolioJsxDescriptors() {
  const descriptors: JsxComponentDescriptor[] = []

  for (const block of getAllRuntimeBlocks()) {
    const names = [
      block.componentName,
      ...(block.aliases ?? []),
      ...(block.deprecatedAliases ?? []),
    ]

    for (const name of names) {
      descriptors.push({
        name,
        kind: 'flow',
        props: block.fields.map((field) => ({
          name: field.name,
          type: field.type,
          required: field.required,
        })),
        hasChildren: ['Callout', 'CaseHero', 'Confidential'].includes(
          block.componentName
        ),
        Editor: withPortfolioBlockAnchor(customEditors[name] ?? GenericJsxEditor),
      })
    }
  }

  descriptors.push({
    name: '*',
    kind: 'flow',
    props: [],
    hasChildren: true,
    Editor: withPortfolioBlockAnchor(GenericJsxEditor),
  })

  return descriptors
}
