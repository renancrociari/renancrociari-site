'use client'

import type { JsxEditorProps, JsxPropertyDescriptor } from '@mdxeditor/editor'

type MdastJsxNode = JsxEditorProps['mdastNode']
type MdastAttribute = MdastJsxNode['attributes'][number]

type AttributeUpdate = {
  name: string
  type: JsxPropertyDescriptor['type']
  value: unknown
}

function isMdxJsxAttribute(attribute: MdastAttribute): attribute is Extract<
  MdastAttribute,
  { type: 'mdxJsxAttribute' }
> {
  return attribute.type === 'mdxJsxAttribute' && typeof attribute.name === 'string'
}

export function getRawAttributeValue(node: MdastJsxNode, name: string) {
  const attribute = node.attributes.find(
    (item) => isMdxJsxAttribute(item) && item.name === name
  )

  if (!attribute) return undefined

  if (typeof attribute.value === 'string') return attribute.value

  if (
    attribute.value &&
    typeof attribute.value === 'object' &&
    'value' in attribute.value &&
    typeof attribute.value.value === 'string'
  ) {
    return attribute.value.value
  }

  return undefined
}

export function getStringAttribute(node: MdastJsxNode, name: string) {
  const value = getRawAttributeValue(node, name)
  return typeof value === 'string' ? value : ''
}

export function parseExpressionAttribute<T>(
  node: MdastJsxNode,
  name: string,
  fallback: T
) {
  const value = getRawAttributeValue(node, name)

  if (!value) return fallback

  try {
    return JSON.parse(value) as T
  } catch {
    try {
      return Function(`"use strict"; return (${value})`)() as T
    } catch {
      return fallback
    }
  }
}

export function updateNodeAttributes(
  node: MdastJsxNode,
  updates: AttributeUpdate[]
) {
  const names = new Set(updates.map((update) => update.name))
  const nextAttributes = node.attributes.filter(
    (attribute) => !isMdxJsxAttribute(attribute) || !names.has(attribute.name)
  )

  for (const update of updates) {
    if (
      update.value === undefined ||
      update.value === null ||
      (typeof update.value === 'string' && update.value.trim() === '')
    ) {
      continue
    }

    if (update.type === 'expression') {
      const serialized =
        typeof update.value === 'string'
          ? update.value
          : JSON.stringify(update.value, null, 2)

      nextAttributes.push({
        type: 'mdxJsxAttribute',
        name: update.name,
        value: {
          type: 'mdxJsxAttributeValueExpression',
          value: serialized,
        },
      })
      continue
    }

    nextAttributes.push({
      type: 'mdxJsxAttribute',
      name: update.name,
      value: String(update.value),
    })
  }

  return nextAttributes
}
