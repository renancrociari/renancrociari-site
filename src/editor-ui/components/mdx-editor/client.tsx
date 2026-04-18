'use client'

import type { ForwardedRef } from 'react'
import {
  MDXEditor as RealMDXEditor,
  type MDXEditorMethods,
  type MDXEditorProps,
} from '@mdxeditor/editor'

type MdxEditorClientProps = MDXEditorProps & {
  editorRef?: ForwardedRef<MDXEditorMethods>
}

export function MdxEditorClient({
  editorRef,
  ...props
}: MdxEditorClientProps) {
  return <RealMDXEditor ref={editorRef} {...props} />
}
