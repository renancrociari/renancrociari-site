'use client';

import { useEffect } from 'react';
import {
  EDITOR_PREVIEW_MSG,
  type EditorPreviewMessage,
  type EditorSelection,
} from 'app/lib/editor-draft-types';

function parseSelectionFromElement(element: Element): EditorSelection | null {
  const kind = element.getAttribute('data-editor-kind');
  const nodeId = element.getAttribute('data-editor-node-id');
  if (!kind || !nodeId) return null;
  if (kind !== 'shell' && kind !== 'section' && kind !== 'block') return null;

  const blockName = element.getAttribute('data-editor-block') ?? undefined;
  const sectionAttr = element.getAttribute('data-editor-section-index');
  const sectionIndex =
    sectionAttr !== null && sectionAttr !== ''
      ? Number.parseInt(sectionAttr, 10)
      : undefined;

  return {
    kind,
    nodeId,
    blockName,
    sectionIndex: Number.isFinite(sectionIndex) ? sectionIndex : undefined,
  };
}

export function EditorPreviewIframeClient() {
  useEffect(() => {
    let lastHoveredNodeId: string | null = null;
    let lastRequestRefreshAt = 0;
    const REQUEST_REFRESH_MIN_INTERVAL_MS = 2000;

    function postRequestRefreshToParent() {
      const now = Date.now();
      if (now - lastRequestRefreshAt < REQUEST_REFRESH_MIN_INTERVAL_MS) return;
      lastRequestRefreshAt = now;
      window.parent?.postMessage(
        { type: EDITOR_PREVIEW_MSG.REQUEST_REFRESH } as EditorPreviewMessage,
        '*'
      );
    }

    function clearClass(className: string) {
      document.querySelectorAll(`.${className}`).forEach((node) => {
        node.classList.remove(className);
      });
    }

    function highlightNode(nodeId: string | null) {
      clearClass('editor-preview-highlight');
      if (!nodeId) return;
      const element = document.querySelector(
        `[data-editor-node-id="${CSS.escape(nodeId)}"]`
      );
      element?.classList.add('editor-preview-highlight');
      element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function hoverNode(nodeId: string | null) {
      clearClass('editor-preview-hover');
      if (!nodeId) return;
      const element = document.querySelector(
        `[data-editor-node-id="${CSS.escape(nodeId)}"]`
      );
      element?.classList.add('editor-preview-hover');
    }

    function postHover(nodeId: string | null) {
      if (lastHoveredNodeId === nodeId) return;
      lastHoveredNodeId = nodeId;
      const message: EditorPreviewMessage = {
        type: EDITOR_PREVIEW_MSG.HOVER,
        nodeId,
      };
      window.parent?.postMessage(message, '*');
    }

    function onPointerMoveCapture(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const element = target.closest('[data-editor-node-id][data-editor-kind]');
      postHover(element?.getAttribute('data-editor-node-id') ?? null);
    }

    function onPointerLeaveCapture() {
      postHover(null);
    }

    function onClickCapture(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const element = target.closest('[data-editor-node-id][data-editor-kind]');
      if (!element) return;
      event.preventDefault();
      event.stopPropagation();
      const selection = parseSelectionFromElement(element);
      if (!selection) return;
      const message: EditorPreviewMessage = {
        type: EDITOR_PREVIEW_MSG.SELECT,
        selection,
      };
      window.parent?.postMessage(message, '*');
    }

    function onMessage(event: MessageEvent) {
      const data = event.data as EditorPreviewMessage | undefined;
      if (!data || typeof data !== 'object') return;
      if (data.type === EDITOR_PREVIEW_MSG.HIGHLIGHT) {
        highlightNode(data.nodeId);
        return;
      }
      if (data.type === EDITOR_PREVIEW_MSG.HOVER) {
        hoverNode(data.nodeId);
      }
    }

    function onResourceErrorCapture(event: Event) {
      const target = event.target;
      if (!(target instanceof HTMLImageElement)) return;
      if (!target.closest('[data-editor-node-id]')) return;
      postRequestRefreshToParent();
    }

    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        postRequestRefreshToParent();
      }
    }

    document.addEventListener('pointermove', onPointerMoveCapture, true);
    document.documentElement.addEventListener('pointerleave', onPointerLeaveCapture, true);
    document.addEventListener('click', onClickCapture, true);
    document.addEventListener('error', onResourceErrorCapture, true);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('message', onMessage);
    window.parent?.postMessage(
      { type: EDITOR_PREVIEW_MSG.READY } as EditorPreviewMessage,
      '*'
    );

    return () => {
      document.removeEventListener('pointermove', onPointerMoveCapture, true);
      document.documentElement.removeEventListener(
        'pointerleave',
        onPointerLeaveCapture,
        true
      );
      document.removeEventListener('click', onClickCapture, true);
      document.removeEventListener('error', onResourceErrorCapture, true);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('message', onMessage);
    };
  }, []);

  return null;
}
