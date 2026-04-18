'use client'

import { useEffect } from 'react'
import {
  EDITOR_PREVIEW_MSG,
  type EditorPreviewMessage,
  type EditorSelection,
} from 'app/lib/editor-draft-types'

export function EditorPreviewBridge({
  iframeRef,
  onSelectFromPreview,
  onHoverFromPreview,
  onPreviewReady,
  onPreviewRequestRefresh,
}: {
  iframeRef: React.RefObject<HTMLIFrameElement | null>
  onSelectFromPreview: (s: EditorSelection) => void
  onHoverFromPreview?: (nodeId: string | null) => void
  onPreviewReady?: () => void
  onPreviewRequestRefresh?: () => void
}) {
  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      const data = ev.data as EditorPreviewMessage | undefined
      if (!data || typeof data !== 'object') return
      const win = iframeRef.current?.contentWindow
      if (win && ev.source !== win) return
      if (data.type === EDITOR_PREVIEW_MSG.READY) {
        onPreviewReady?.()
        return
      }
      if (data.type === EDITOR_PREVIEW_MSG.REQUEST_REFRESH) {
        onPreviewRequestRefresh?.()
        return
      }
      if (data.type === EDITOR_PREVIEW_MSG.HOVER) {
        onHoverFromPreview?.(data.nodeId)
        return
      }
      if (data.type !== EDITOR_PREVIEW_MSG.SELECT) return
      onSelectFromPreview(data.selection)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [
    iframeRef,
    onHoverFromPreview,
    onPreviewReady,
    onPreviewRequestRefresh,
    onSelectFromPreview,
  ])

  return null
}

export function postHighlightToPreviewIframe(
  iframe: HTMLIFrameElement | null,
  nodeId: string | null
) {
  if (!iframe?.contentWindow) return
  const msg: EditorPreviewMessage = {
    type: EDITOR_PREVIEW_MSG.HIGHLIGHT,
    nodeId,
  }
  iframe.contentWindow.postMessage(msg, '*')
}

export function postHoverToPreviewIframe(
  iframe: HTMLIFrameElement | null,
  nodeId: string | null
) {
  if (!iframe?.contentWindow) return
  const msg: EditorPreviewMessage = {
    type: EDITOR_PREVIEW_MSG.HOVER,
    nodeId,
  }
  iframe.contentWindow.postMessage(msg, '*')
}
