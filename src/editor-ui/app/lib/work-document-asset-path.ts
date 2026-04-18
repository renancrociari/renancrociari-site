/** Diretório sob `content/work/` derivado do id canónico (`<slug>/index.mdx` → `<slug>`). */
export function workDocumentAssetDirFromId(documentId: string): string {
  return documentId.split('/')[0] ?? ''
}
