'use client'

import React, { useEffect, useRef } from 'react'
import '@mdxeditor/editor/dist/style.css'
import {
  AdmonitionDirectiveDescriptor,
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  type MDXEditorMethods,
  Separator,
  directivesPlugin,
  headingsPlugin,
  imagePlugin,
  jsxPlugin,
  linkPlugin,
  linkDialogPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from '@mdxeditor/editor'
import type { BlockSurface } from '@/app/components/mdx/registry.types'
import { BlockPalette } from './mdx-editor/block-palette'
import { getPortfolioJsxDescriptors } from './mdx-editor/jsx-descriptors'
import { cn } from '@/lib/utils'
import { MdxEditorClient as MDXEditor } from './mdx-editor/client'

type Props = {
  value: string
  onChange: (value: string) => void
  imageBasePath?: string
  imageUploadHandler?: (file: File) => Promise<string>
  editorKey?: string
  surface?: BlockSurface
  wrapperClassName?: string
  syncTarget?: MdxEditorSyncTarget | null
  hoverNodeId?: string | null
  onHoverNodeChange?: (nodeId: string | null) => void
  /** Enquanto o cursor estiver no corpo MDX, reporta o bloco/secção sob o caret (para sincronizar o preview). */
  onEditingContextChange?: (nodeId: string | null) => void
}

export type MdxEditorSyncTarget =
  | {
      key: string
      kind: 'section'
      sectionIndex: number
    }
  | {
      key: string
      kind: 'block'
      sectionIndex: number
      blockIndex: number
      blockName?: string
    }

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function normalizeRelativeImageSrc(src: string) {
  if (!src) return src

  const [pathPart, hash] = src.split('#')
  const [pathOnly, query] = pathPart.split('?')
  const cleaned = pathOnly.replace(/^\.\//, '')
  const encodedPath = cleaned
    .split('/')
    .map((segment) => {
      if (!segment) return ''
      const decoded = safeDecode(segment)
      return encodeURIComponent(decoded)
    })
    .join('/')

  let result = encodedPath
  if (query) result += `?${query}`
  if (hash) result += `#${hash}`
  return result
}

type ToolbarGroup = { key: string; node: React.ReactNode }

const PRIMARY_EDITABLE_SELECTOR = [
  'textarea:not([disabled])',
  'input:not([type="hidden"]):not([disabled])',
  'select:not([disabled])',
  '[contenteditable="true"]',
  '[role="textbox"]',
].join(', ')

const FALLBACK_FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

const SYNC_NODE_ATTR = 'data-editor-sync-node-id'

function getContentEditableRoot(container: HTMLElement | null) {
  return container?.querySelector<HTMLElement>(
    '.mdxeditor-root-contenteditable [contenteditable="true"]'
  ) ?? null
}

function getPrimaryEditableDescendant(target: HTMLElement) {
  if (target.matches(PRIMARY_EDITABLE_SELECTOR)) {
    return target
  }

  return target.querySelector<HTMLElement>(PRIMARY_EDITABLE_SELECTOR)
}

function getFallbackFocusableDescendant(target: HTMLElement) {
  if (target.matches(FALLBACK_FOCUSABLE_SELECTOR)) {
    return target
  }

  return target.querySelector<HTMLElement>(FALLBACK_FOCUSABLE_SELECTOR)
}

function getFirstTextNode(target: Node) {
  const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return node.textContent?.trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP
    },
  })

  return walker.nextNode()
}

function placeCaretAtNodeStart(contentRoot: HTMLElement, target: HTMLElement) {
  const selection = window.getSelection()
  if (!selection) return false

  contentRoot.focus({ preventScroll: true })

  const textNode = getFirstTextNode(target)
  const range = document.createRange()

  if (textNode) {
    range.setStart(textNode, 0)
    range.collapse(true)
  } else {
    // Secção com título vazio / só espaços: o Lexical pode não expor texto ainda;
    // colapsar no início do H1 para o sync com o preview não falhar.
    range.setStart(target, 0)
    range.collapse(true)
  }

  selection.removeAllRanges()
  selection.addRange(range)
  return true
}

function focusEditorAtNodeStart(
  contentRoot: HTMLElement,
  target: HTMLElement,
  editorRef: React.RefObject<MDXEditorMethods>
) {
  editorRef.current?.focus(undefined, { preventScroll: true })

  window.requestAnimationFrame(() => {
    placeCaretAtNodeStart(contentRoot, target)
  })

  return true
}

function isNodeAfter(reference: HTMLElement, target: HTMLElement) {
  return (
    reference === target ||
    Boolean(reference.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING)
  )
}

function isNodeBefore(reference: HTMLElement, target: HTMLElement) {
  return Boolean(target.compareDocumentPosition(reference) & Node.DOCUMENT_POSITION_FOLLOWING)
}

function getSectionHeadings(contentRoot: HTMLElement) {
  const direct = Array.from(contentRoot.querySelectorAll<HTMLElement>(':scope > h1'))
  if (direct.length > 0) {
    return direct
  }
  // Layout do Lexical/MDXEditor pode envolver blocos; alinhar às secções `#` do work.
  return Array.from(contentRoot.querySelectorAll<HTMLElement>('h1')).filter(
    (el) => !el.closest('[data-portfolio-block-editor="true"]')
  )
}

function getSectionHeadingByIndex(contentRoot: HTMLElement, sectionIndex: number) {
  return getSectionHeadings(contentRoot)[sectionIndex] ?? null
}

function parseSectionNodeId(nodeId: string) {
  const match = nodeId.match(/^section-(\d+)$/)
  if (!match) return null
  return Number.parseInt(match[1], 10)
}

function parseBlockNodeId(nodeId: string) {
  const match = nodeId.match(/^sec(\d+)-blk(\d+)-(.+)$/)
  if (!match) return null

  return {
    sectionIndex: Number.parseInt(match[1], 10),
    blockIndex: Number.parseInt(match[2], 10),
    blockName: match[3],
  }
}

function getSectionIndexForNode(sectionHeadings: HTMLElement[], node: HTMLElement) {
  let sectionIndex = 0

  sectionHeadings.forEach((heading, index) => {
    if (isNodeAfter(heading, node)) {
      sectionIndex = index
    }
  })

  return sectionIndex
}

function annotateContentTargets(contentRoot: HTMLElement) {
  contentRoot.querySelectorAll<HTMLElement>(`[${SYNC_NODE_ATTR}]`).forEach((node) => {
    node.removeAttribute(SYNC_NODE_ATTR)
  })

  const sectionHeadings = getSectionHeadings(contentRoot)
  sectionHeadings.forEach((heading, sectionIndex) => {
    heading.setAttribute(SYNC_NODE_ATTR, `section-${sectionIndex}`)
  })

  const blockCounts = new Map<number, number>()
  const blockEditors = Array.from(
    contentRoot.querySelectorAll<HTMLElement>('[data-portfolio-block-editor="true"]')
  )

  blockEditors.forEach((node) => {
    const sectionIndex = getSectionIndexForNode(sectionHeadings, node)
    const blockIndex = blockCounts.get(sectionIndex) ?? 0
    const blockName = node.dataset.portfolioBlockName ?? 'block'
    node.setAttribute(
      SYNC_NODE_ATTR,
      `sec${sectionIndex}-blk${blockIndex}-${blockName}`
    )
    blockCounts.set(sectionIndex, blockIndex + 1)
  })
}

function findContentTargetByNodeId(contentRoot: HTMLElement, nodeId: string) {
  const sectionIndex = parseSectionNodeId(nodeId)
  if (sectionIndex !== null) {
    return getSectionHeadingByIndex(contentRoot, sectionIndex)
  }

  const parsedBlock = parseBlockNodeId(nodeId)
  if (parsedBlock) {
    return (
      contentRoot.querySelector<HTMLElement>(
        `[${SYNC_NODE_ATTR}="${CSS.escape(nodeId)}"]`
      ) ??
      getBlockTargetInSection(contentRoot, {
        key: nodeId,
        kind: 'block',
        sectionIndex: parsedBlock.sectionIndex,
        blockIndex: parsedBlock.blockIndex,
        blockName: parsedBlock.blockName,
      })
    )
  }

  return null
}

function resolveEditingSyncNodeIdFromDom(
  contentRoot: HTMLElement,
  domSelection: Selection
): string | null {
  const anchor = domSelection.anchorNode
  if (!anchor || !contentRoot.contains(anchor)) return null

  let el: HTMLElement | null =
    anchor.nodeType === Node.TEXT_NODE
      ? (anchor.parentElement as HTMLElement | null)
      : (anchor as HTMLElement)

  while (el && el !== contentRoot) {
    const id = el.getAttribute(SYNC_NODE_ATTR)
    if (id) return id
    el = el.parentElement
  }

  const sectionHeadings = getSectionHeadings(contentRoot)
  if (sectionHeadings.length === 0) return null

  const caretHost =
    anchor.nodeType === Node.TEXT_NODE ? anchor.parentElement : (anchor as Element)
  if (!caretHost || !(caretHost instanceof HTMLElement)) return null

  const sectionIndex = getSectionIndexForNode(sectionHeadings, caretHost)
  return `section-${sectionIndex}`
}

function getBlockTargetInSection(
  contentRoot: HTMLElement,
  syncTarget: Extract<MdxEditorSyncTarget, { kind: 'block' }>
) {
  const allBlockEditors = Array.from(
    contentRoot.querySelectorAll<HTMLElement>('[data-portfolio-block-editor="true"]')
  )
  if (!allBlockEditors.length) return null

  const sectionHeadings = getSectionHeadings(contentRoot)
  const sectionStart = sectionHeadings[syncTarget.sectionIndex] ?? null
  const nextSectionStart = sectionHeadings[syncTarget.sectionIndex + 1] ?? null

  const sectionScopedBlocks = allBlockEditors.filter((node) => {
    const isInsideSectionStart = sectionStart ? isNodeAfter(sectionStart, node) : true
    const isInsideSectionEnd = nextSectionStart
      ? isNodeBefore(nextSectionStart, node)
      : true
    return isInsideSectionStart && isInsideSectionEnd
  })

  return (
    sectionScopedBlocks[syncTarget.blockIndex] ??
    sectionScopedBlocks.find(
      (node) => node.dataset.portfolioBlockName === syncTarget.blockName
    ) ??
    null
  )
}

function syncEditorFocus(
  contentRoot: HTMLElement,
  syncTarget: MdxEditorSyncTarget,
  editorRef: React.RefObject<MDXEditorMethods>
) {
  const sectionHeading = getSectionHeadingByIndex(contentRoot, syncTarget.sectionIndex)
  const target =
    syncTarget.kind === 'block'
      ? getBlockTargetInSection(contentRoot, syncTarget) ?? sectionHeading
      : sectionHeading

  if (!target) return false

  target.scrollIntoView({
    block: 'center',
    inline: 'nearest',
    behavior: 'smooth',
  })

  if (syncTarget.kind === 'section') {
    return focusEditorAtNodeStart(contentRoot, target, editorRef)
  }

  const editable = getPrimaryEditableDescendant(target)
  if (editable) {
    editable.focus({ preventScroll: true })
    return true
  }

  const focusable = getFallbackFocusableDescendant(target)
  if (focusable) {
    focusable.focus({ preventScroll: true })
    return true
  }

  return focusEditorAtNodeStart(contentRoot, target, editorRef)
}

function CuratedToolbar({
  surface,
  onInsert,
}: {
  surface: BlockSurface
  onInsert: (snippet: string) => void
}) {
  const groups: ToolbarGroup[] = [
    {
      key: 'marks',
      node: (
        <>
          <BoldItalicUnderlineToggles options={['Bold', 'Italic']} />
          <Separator />
        </>
      ),
    },
    {
      key: 'blockType',
      node: (
        <>
          <BlockTypeSelect />
          <Separator />
        </>
      ),
    },
    {
      key: 'lists',
      node: (
        <>
          <ListsToggle options={['bullet', 'number']} />
          <Separator />
        </>
      ),
    },
    {
      key: 'linkImage',
      node: (
        <>
          <CreateLink />
          <InsertImage />
          <Separator />
        </>
      ),
    },
    {
      key: 'blocks',
      node: (
        <>
          <BlockPalette surface={surface} onInsert={onInsert} />
          <Separator />
        </>
      ),
    },
    {
      key: 'tableHr',
      node: (
        <>
          <InsertTable />
          <InsertThematicBreak />
        </>
      ),
    },
  ]

  return (
    <div className="pointer-editor-mdx-toolbar-responsive w-full min-w-0">
      <div className="pointer-editor-mdx-toolbar-scroll flex min-h-9 w-full min-w-0 flex-nowrap items-center gap-1">
        {groups.map((g) => (
          <span
            key={g.key}
            className="inline-flex shrink-0 items-center gap-1"
          >
            {g.node}
          </span>
        ))}
      </div>
    </div>
  )
}

export function MdxEditor({
  value,
  onChange,
  imageBasePath,
  imageUploadHandler,
  editorKey,
  surface = 'work-body',
  wrapperClassName,
  syncTarget,
  hoverNodeId,
  onHoverNodeChange,
  onEditingContextChange,
}: Props) {
  const editorRef = React.useRef<MDXEditorMethods>(null)
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const lastHoveredNodeIdRef = useRef<string | null>(null)

  const plugins = React.useMemo(
    () => [
      toolbarPlugin({
        toolbarContents: () =>
          React.createElement(CuratedToolbar, {
            surface,
            onInsert: (snippet: string) => {
              const editor = editorRef.current
              if (!editor) return

              editor.focus(
                () => {
                  editor.insertMarkdown(snippet)
                },
                { preventScroll: true }
              )
            },
          }),
      }),
      headingsPlugin(),
      listsPlugin(),
      quotePlugin(),
      thematicBreakPlugin(),
      linkPlugin(),
      linkDialogPlugin(),
      imagePlugin({
        imageUploadHandler: async (file: File): Promise<string> => {
          if (imageUploadHandler) {
            return imageUploadHandler(file)
          }

          try {
            const formData = new FormData()
            formData.append('file', file)
            const res = await fetch('/api/editor/upload', {
              method: 'POST',
              body: formData,
            })
            if (res.ok) {
              const data = (await res.json()) as { url?: string }
              if (data.url) return data.url
            }
          } catch {
            // fall through to blob fallback
          }
          return URL.createObjectURL(file)
        },
        imagePreviewHandler: async (src: string) => {
          if (!src) return src
          if (src.startsWith('data:') || src.startsWith('blob:')) return src
          const normalized = normalizeRelativeImageSrc(src)
          if (
            normalized.startsWith('http://') ||
            normalized.startsWith('https://') ||
            normalized.startsWith('/')
          ) {
            return normalized
          }
          if (!imageBasePath) return normalized
          return `${imageBasePath.replace(/\/$/, '')}/${normalized}`
        },
      }),
      tablePlugin(),
      directivesPlugin({
        directiveDescriptors: [AdmonitionDirectiveDescriptor],
      }),
      markdownShortcutPlugin(),
      jsxPlugin({
        jsxComponentDescriptors: getPortfolioJsxDescriptors(),
      }),
    ],
    [imageBasePath, imageUploadHandler, surface]
  )

  useEffect(() => {
    if (!syncTarget) return

    let cancelled = false
    let timeoutId: number | null = null
    let attempts = 0

    const trySync = () => {
      if (cancelled) return

      const contentRoot = getContentEditableRoot(wrapperRef.current)
      if (contentRoot && syncEditorFocus(contentRoot, syncTarget, editorRef)) {
        return
      }

      attempts += 1
      if (attempts >= 30) return
      timeoutId = window.setTimeout(trySync, 100)
    }

    timeoutId = window.setTimeout(trySync, 0)

    return () => {
      cancelled = true
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [syncTarget, editorKey])

  useEffect(() => {
    let cancelled = false
    let timeoutId: number | null = null
    let attempts = 0

    const tryAnnotate = () => {
      if (cancelled) return

      const contentRoot = getContentEditableRoot(wrapperRef.current)
      if (contentRoot) {
        annotateContentTargets(contentRoot)
        return
      }

      attempts += 1
      if (attempts >= 8) return
      timeoutId = window.setTimeout(tryAnnotate, 90)
    }

    timeoutId = window.setTimeout(tryAnnotate, 0)

    return () => {
      cancelled = true
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [editorKey, surface, value])

  useEffect(() => {
    let cancelled = false
    let timeoutId: number | null = null
    let attempts = 0

    const applyHoverState = () => {
      if (cancelled) return

      const contentRoot = getContentEditableRoot(wrapperRef.current)
      if (!contentRoot) {
        attempts += 1
        if (attempts >= 8) return
        timeoutId = window.setTimeout(applyHoverState, 90)
        return
      }

      annotateContentTargets(contentRoot)
      contentRoot
        .querySelectorAll<HTMLElement>('.pointer-editor-hover-target')
        .forEach((node) => {
          node.classList.remove('pointer-editor-hover-target')
        })

      if (!hoverNodeId) return

      const target = findContentTargetByNodeId(contentRoot, hoverNodeId)
      target?.classList.add('pointer-editor-hover-target')
    }

    timeoutId = window.setTimeout(applyHoverState, 0)

    return () => {
      cancelled = true
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [hoverNodeId, value])

  useEffect(() => {
    if (!onEditingContextChange) return

    const root = wrapperRef.current
    if (!root) return

    let cancelled = false
    let debounceTimer: number | null = null

    const flush = () => {
      if (cancelled) return
      const contentRoot = getContentEditableRoot(wrapperRef.current)
      if (!contentRoot) return

      annotateContentTargets(contentRoot)

      const domSelection = window.getSelection()
      if (
        !domSelection?.anchorNode ||
        !contentRoot.contains(domSelection.anchorNode)
      ) {
        return
      }

      onEditingContextChange(
        resolveEditingSyncNodeIdFromDom(contentRoot, domSelection)
      )
    }

    const scheduleFlush = () => {
      if (debounceTimer) window.clearTimeout(debounceTimer)
      debounceTimer = window.setTimeout(flush, 72)
    }

    const onFocusOut = (ev: FocusEvent) => {
      const next = ev.relatedTarget as Node | null
      if (next && root.contains(next)) return
      if (debounceTimer) window.clearTimeout(debounceTimer)
      debounceTimer = null
      onEditingContextChange(null)
    }

    root.addEventListener('focusout', onFocusOut)
    document.addEventListener('selectionchange', scheduleFlush)

    return () => {
      cancelled = true
      if (debounceTimer) window.clearTimeout(debounceTimer)
      root.removeEventListener('focusout', onFocusOut)
      document.removeEventListener('selectionchange', scheduleFlush)
    }
  }, [editorKey, onEditingContextChange])

  useEffect(() => {
    if (!onHoverNodeChange) return

    let cancelled = false
    let timeoutId: number | null = null
    let attempts = 0
    let cleanup: (() => void) | null = null

    const emitHover = (nodeId: string | null) => {
      if (lastHoveredNodeIdRef.current === nodeId) return
      lastHoveredNodeIdRef.current = nodeId
      onHoverNodeChange(nodeId)
    }

    const bindHoverEvents = () => {
      if (cancelled) return

      const contentRoot = getContentEditableRoot(wrapperRef.current)
      if (!contentRoot) {
        attempts += 1
        if (attempts >= 8) return
        timeoutId = window.setTimeout(bindHoverEvents, 90)
        return
      }

      annotateContentTargets(contentRoot)

      const handlePointerMove = (event: PointerEvent) => {
        const target = event.target
        if (!(target instanceof Element)) return
        const hoveredTarget = target.closest<HTMLElement>(`[${SYNC_NODE_ATTR}]`)
        emitHover(hoveredTarget?.getAttribute(SYNC_NODE_ATTR) ?? null)
      }

      const handlePointerLeave = () => {
        emitHover(null)
      }

      contentRoot.addEventListener('pointermove', handlePointerMove)
      contentRoot.addEventListener('pointerleave', handlePointerLeave)
      cleanup = () => {
        contentRoot.removeEventListener('pointermove', handlePointerMove)
        contentRoot.removeEventListener('pointerleave', handlePointerLeave)
      }
    }

    timeoutId = window.setTimeout(bindHoverEvents, 0)

    return () => {
      cancelled = true
      if (timeoutId) window.clearTimeout(timeoutId)
      cleanup?.()
      if (lastHoveredNodeIdRef.current !== null) {
        lastHoveredNodeIdRef.current = null
        onHoverNodeChange(null)
      }
    }
  }, [editorKey, onHoverNodeChange])

  return React.createElement(
    'div',
    {
      ref: wrapperRef,
      className: cn(
        /* overflow visível para o sticky da toolbar relativamente ao scroll do painel (ancestor com overflow-y-auto) */
        'pointer-editor-mdx flex min-h-[240px] w-full flex-col rounded-[16px] border border-[#e5e5e5] bg-white',
        wrapperClassName
      ),
    },
    React.createElement(
      MDXEditor,
      {
        editorRef,
        key: editorKey || imageBasePath || 'mdx-editor',
        markdown: value,
        onChange,
        className: 'pointer-editor-mdx__root flex min-h-0 flex-col',
        contentEditableClassName:
          'pointer-editor-mdx__content prose max-w-none px-4 pb-2 pt-2 text-foreground',
        plugins,
      }
    )
  )
}
