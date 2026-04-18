'use client'

import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  MdxEditor,
  type MdxEditorSyncTarget,
} from '@/components/mdx-editor'
import {
  EditorPreviewBridge,
  postHighlightToPreviewIframe,
  postHoverToPreviewIframe,
} from '@/components/editor-preview-bridge'
import { Switch } from '@/components/ui/switch'
import type { EditorSelection } from 'app/lib/editor-draft-types'
import {
  parseBlockNodeId,
  updateSectionMarkdown,
} from 'app/lib/document-mutations'
import { buildSectionBlockRangesMap, buildWorkMdxOutline } from 'app/lib/mdx-outline'
import { parsePublished } from 'app/lib/content-types'
import { slugify } from 'app/lib/slugify'
import {
  findSectionStartCharOffsetInMdx,
  joinMdxSections,
  splitMdxSections,
} from 'app/lib/split-mdx-sections'
import { metadataRecordToCaseStudy } from 'app/lib/work-case-metadata'
import { rewriteRelativeImagePaths } from 'app/lib/work-image-paths'
import {
  Search,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileText,
  Info,
  Plus,
  Image as ImageIcon,
  MousePointer2,
  Redo2,
  Undo2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  buildSandboxWorkEntries,
  createSandboxEditorDataAdapter,
  getEditorSandboxInitialDocuments,
  getSandboxInitialEditorState,
  mergePersistedSandboxDocuments,
  SANDBOX_LOCAL_STORAGE_KEY,
  SANDBOX_SAMPLE_FOR_ENTRY_ID,
  sandboxEditorAssetBasePath,
  sandboxEditorFixtureForSample,
  type EditorSandboxDocument,
} from '@portfolio-os/editor'
import type { EditorPageVariant } from 'app/lib/editor-page-variant'
import {
  createEditorAdapterBundle,
  createPreviewAdapterFromBundle,
  createPrivateWorkEditorDataAdapter,
  createPagesEditorDataAdapter,
  type EditorAdapterBundle,
  type EditorDataAdapter,
  type EditorDocumentListItem,
} from 'app/lib/editor-adapters'
import { SandboxCasePreview } from '../sandbox/sandbox-case-preview'

export type { EditorPageVariant } from 'app/lib/editor-page-variant'

type FieldDef = {
  key: string
  label: string
  required?: boolean
  multiline?: boolean
  type?: 'switch'
  placeholder?: string
}

type FieldGroupDef = {
  id: string
  label: string
  defaultOpen: boolean
  fields: FieldDef[]
}

type EditorUiPack = {
  heroFields: FieldDef[]
  tagFields: FieldDef[]
  overviewFields: FieldDef[]
  metadataGroups: FieldGroupDef[]
  coverImageLabel: string
  coverImagePublicHintIntro: string
  coverImagePublicHintCodeExample: string
  coverImagePublicHintOutro: string
  sectionFallbackLabel: (sectionIndex1Based: number) => string
  newSectionTitle: string
  newSectionBodyLine: string
  shellHeroHeading: string
  shellHeroDescription: string
  shellTagsHeading: string
  shellTagsDescription: string
  shellSummaryHeading: string
  shellSummaryDescription: string
  shellMetaHeading: string
  shellMetaDescription: string
  rawMdxHeading: string
  rawMdxDescription: string
  searchPlaceholder: string
  newPage: string
  createFormTitle: string
  createFormSlug: string
  createFormSlugPlaceholderFromTitle: string
  cancel: string
  create: string
  creating: string
  noFilesFound: string
  openLibraryAriaLabel: string
  unsavedOpenLibraryConfirm: string
  unsavedDiscardConfirm: string
  noDocumentLoaded: string
  undoUnavailableAria: string
  redoUnavailableAria: string
  save: string
  saving: string
  loadingEditor: string
  selectDocumentInLibrary: string
  adjustPanelAriaLabel: string
  adjustPanelTitle: string
  previewPickFileLine1: string
  previewPickFileLine2: string
  sandboxBanner: string
  documentNotFound: string
  couldNotSave: string
  savedInBrowserDemo: string
  editorDevOnly: string
  failedLoadFileList: string
  failedLoadFile: string
  savedSuccess: string
  failedSave: string
  createTitleRequired: string
  unsavedDiscardNewContent: string
  failedCreate: string
  newContentSuccess: string
  resetSample: string
}

function createEditorUiPack(locale: 'pt' | 'en'): EditorUiPack {
  if (locale === 'en') {
    return {
      heroFields: [
        { key: 'title', label: 'Title', required: true },
        { key: 'coverImage', label: 'Cover image' },
      ],
      tagFields: [
        {
          key: 'tags',
          label: 'Tags',
          multiline: true,
          placeholder: 'Comma-separated',
        },
      ],
      overviewFields: [{ key: 'summary', label: 'Overview', multiline: true }],
      metadataGroups: [
        {
          id: 'publishing',
          label: 'Publishing',
          defaultOpen: true,
          fields: [
            {
              key: 'slug',
              label: 'URL slug',
              placeholder: 'If empty, uses the title',
            },
            { key: 'published', label: 'Listed on Work', type: 'switch' },
            { key: 'publishedAt', label: 'Year', placeholder: '2024-01-01' },
            {
              key: 'order',
              label: 'Listing order',
              placeholder: '1 = first',
            },
            { key: 'status', label: 'Status' },
          ],
        },
        {
          id: 'project',
          label: 'Project',
          defaultOpen: true,
          fields: [
            { key: 'company', label: 'Company' },
            { key: 'role', label: 'Role' },
            { key: 'team', label: 'Team' },
            { key: 'duration', label: 'Duration' },
            { key: 'domain', label: 'Domain' },
            { key: 'platforms', label: 'Platforms' },
            { key: 'tools', label: 'Tools' },
          ],
        },
        {
          id: 'results',
          label: 'Outcomes',
          defaultOpen: false,
          fields: [
            { key: 'goals', label: 'Goals', multiline: true },
            { key: 'outcomes', label: 'Results', multiline: true },
            { key: 'impactMetrics', label: 'Impact metrics', multiline: true },
          ],
        },
        {
          id: 'media',
          label: 'Media',
          defaultOpen: false,
          fields: [
            { key: 'gallery', label: 'Gallery' },
            { key: 'video', label: 'Video URL' },
          ],
        },
      ],
      coverImageLabel: 'Cover image',
      coverImagePublicHintIntro:
        'In this online demo use a public URL or path (e.g.',
      coverImagePublicHintCodeExample: '/editor-sandbox/name.svg',
      coverImagePublicHintOutro: ').',
      sectionFallbackLabel: (n) => `Section ${n}`,
      newSectionTitle: 'New section',
      newSectionBodyLine: 'Write here.',
      shellHeroHeading: 'Main case content',
      shellHeroDescription:
        'Edit the title and main media with the synced preview beside it.',
      shellTagsHeading: 'Case taxonomy',
      shellTagsDescription:
        'The list accepts commas and updates the preview chips in real time.',
      shellSummaryHeading: 'Featured summary',
      shellSummaryDescription:
        'This text feeds the overview block above the editorial body.',
      shellMetaHeading: 'Structured project information',
      shellMetaDescription:
        'Publishing, project details, outcomes, and media are grouped here.',
      rawMdxHeading: 'Full editorial body',
      rawMdxDescription:
        'Raw MDX body editing. Frontmatter stays in the contextual panels.',
      searchPlaceholder: 'Search…',
      newPage: 'New page',
      createFormTitle: 'Title',
      createFormSlug: 'Initial slug',
      createFormSlugPlaceholderFromTitle: 'generated from title',
      cancel: 'Cancel',
      create: 'Create',
      creating: 'Creating…',
      noFilesFound: 'No files found.',
      openLibraryAriaLabel: 'Open document library',
      unsavedOpenLibraryConfirm:
        'You have unsaved changes. Opening the library without saving may lose context when switching files. Continue?',
      unsavedDiscardConfirm: 'You have unsaved changes. Discard them?',
      noDocumentLoaded: 'No document loaded',
      undoUnavailableAria: 'Undo unavailable',
      redoUnavailableAria: 'Redo unavailable',
      save: 'Save',
      saving: 'Saving…',
      loadingEditor: 'Loading editor…',
      selectDocumentInLibrary: 'Select a document in the editor library.',
      adjustPanelAriaLabel: 'Adjust editor panel width',
      adjustPanelTitle: 'Drag to resize the panel',
      previewPickFileLine1: 'Pick a file from the list beside',
      previewPickFileLine2: 'to see the preview here.',
      sandboxBanner:
        'Editor Sandbox: public demo — preview runs in your browser. Use public URLs or paths for images. File upload is not available in production.',
      documentNotFound: 'Document not found.',
      couldNotSave: 'Could not save.',
      savedInBrowserDemo: 'Saved in this browser (demo).',
      editorDevOnly: 'Editor is only available in development.',
      failedLoadFileList: 'Failed to load the file list.',
      failedLoadFile: 'Failed to load the file.',
      savedSuccess: 'Saved successfully.',
      failedSave: 'Failed to save.',
      createTitleRequired: 'Enter a title to create the content.',
      unsavedDiscardNewContent:
        'You have unsaved changes. Discard them to create new content?',
      failedCreate: 'Failed to create content.',
      newContentSuccess: 'New content created successfully.',
      resetSample: 'Reset sample',
    }
  }

  return {
    heroFields: [
      { key: 'title', label: 'Título', required: true },
      { key: 'coverImage', label: 'Imagem de capa' },
    ],
    tagFields: [
      {
        key: 'tags',
        label: 'Tags',
        multiline: true,
        placeholder: 'Separadas por vírgula',
      },
    ],
    overviewFields: [{ key: 'summary', label: 'Overview', multiline: true }],
    metadataGroups: [
      {
        id: 'publishing',
        label: 'Publishing',
        defaultOpen: true,
        fields: [
          {
            key: 'slug',
            label: 'URL slug',
            placeholder: 'Se vazio, usa o título',
          },
          { key: 'published', label: 'Listado em Work', type: 'switch' },
          { key: 'publishedAt', label: 'Ano', placeholder: '2024-01-01' },
          {
            key: 'order',
            label: 'Ordem na listagem',
            placeholder: '1 = primeiro',
          },
          { key: 'status', label: 'Status' },
        ],
      },
      {
        id: 'project',
        label: 'Projeto',
        defaultOpen: true,
        fields: [
          { key: 'company', label: 'Empresa' },
          { key: 'role', label: 'Cargo' },
          { key: 'team', label: 'Equipe' },
          { key: 'duration', label: 'Duração' },
          { key: 'domain', label: 'Domínio' },
          { key: 'platforms', label: 'Plataformas' },
          { key: 'tools', label: 'Ferramentas' },
        ],
      },
      {
        id: 'results',
        label: 'Resultados',
        defaultOpen: false,
        fields: [
          { key: 'goals', label: 'Objetivos', multiline: true },
          { key: 'outcomes', label: 'Resultados', multiline: true },
          { key: 'impactMetrics', label: 'Métricas de impacto', multiline: true },
        ],
      },
      {
        id: 'media',
        label: 'Mídia',
        defaultOpen: false,
        fields: [
          { key: 'gallery', label: 'Galeria' },
          { key: 'video', label: 'URL do vídeo' },
        ],
      },
    ],
    coverImageLabel: 'Imagem de capa',
    coverImagePublicHintIntro:
      'Nesta demo online use um URL ou caminho público (ex.:',
    coverImagePublicHintCodeExample: '/editor-sandbox/nome.svg',
    coverImagePublicHintOutro: ').',
    sectionFallbackLabel: (n) => `Seção ${n}`,
    newSectionTitle: 'Nova seção',
    newSectionBodyLine: 'Escreva aqui.',
    shellHeroHeading: 'Conteúdo principal do case',
    shellHeroDescription:
      'Edite título e mídia principal com preview sincronizado ao lado.',
    shellTagsHeading: 'Taxonomia do case',
    shellTagsDescription:
      'A lista aceita vírgulas e atualiza os chips do preview em tempo real.',
    shellSummaryHeading: 'Resumo destacado',
    shellSummaryDescription:
      'Este texto alimenta o bloco de overview acima do corpo editorial.',
    shellMetaHeading: 'Informações estruturadas do projeto',
    shellMetaDescription:
      'Publishing, detalhes do projeto, resultados e mídia ficam reunidos aqui.',
    rawMdxHeading: 'Corpo editorial completo',
    rawMdxDescription:
      'Edição bruta do corpo MDX. O frontmatter continua nos painéis contextuais.',
    searchPlaceholder: 'Buscar...',
    newPage: 'Nova página',
    createFormTitle: 'Título',
    createFormSlug: 'Slug inicial',
    createFormSlugPlaceholderFromTitle: 'gerado a partir do título',
    cancel: 'Cancelar',
    create: 'Criar',
    creating: 'Criando...',
    noFilesFound: 'Nenhum arquivo encontrado.',
    openLibraryAriaLabel: 'Abrir biblioteca de documentos',
    unsavedOpenLibraryConfirm:
      'Há alterações não salvas. Se abrir a biblioteca sem salvar, pode perder o contexto ao trocar de arquivo. Deseja continuar?',
    unsavedDiscardConfirm: 'Há alterações não salvas. Deseja descartar?',
    noDocumentLoaded: 'Nenhum documento carregado',
    undoUnavailableAria: 'Desfazer indisponível',
    redoUnavailableAria: 'Refazer indisponível',
    save: 'Salvar',
    saving: 'Salvando...',
    loadingEditor: 'Carregando editor...',
    selectDocumentInLibrary: 'Selecione um documento na biblioteca do editor.',
    adjustPanelAriaLabel: 'Ajustar largura do painel do editor',
    adjustPanelTitle: 'Arraste para ajustar a largura do painel',
    previewPickFileLine1: 'Selecione um arquivo da lista ao lado',
    previewPickFileLine2: 'para ver o preview aqui.',
    sandboxBanner:
      'Editor Sandbox: demo pública — o preview corre no teu browser. Usa URLs ou caminhos públicos para imagens. O upload não está disponível em produção.',
    documentNotFound: 'Documento não encontrado.',
    couldNotSave: 'Não foi possível guardar.',
    savedInBrowserDemo: 'Guardado neste browser (demo).',
    editorDevOnly: 'Editor disponível apenas em desenvolvimento.',
    failedLoadFileList: 'Falha ao carregar a lista de arquivos.',
    failedLoadFile: 'Falha ao carregar o arquivo.',
    savedSuccess: 'Salvo com sucesso.',
    failedSave: 'Falha ao salvar.',
    createTitleRequired: 'Informe um título para criar o conteúdo.',
    unsavedDiscardNewContent:
      'Há alterações não salvas. Deseja descartá-las para criar um novo conteúdo?',
    failedCreate: 'Falha ao criar o conteúdo.',
    newContentSuccess: 'Novo conteúdo criado com sucesso.',
    resetSample: 'Repor sample',
  }
}

const FIXED_CONTENT_ITEMS = [
  { kind: 'shell' as const, nodeId: 'shell-hero', label: 'Title and Cover' },
  { kind: 'shell' as const, nodeId: 'shell-meta', label: 'Metadata' },
  { kind: 'shell' as const, nodeId: 'shell-tags', label: 'Tags' },
  { kind: 'shell' as const, nodeId: 'shell-summary', label: 'Overview' },
]

const POINTER_EDITOR_PANEL_WIDTH_STORAGE_KEY = 'pointer-editor-panel-width-v3'
const DEFAULT_EDITOR_PANEL_WIDTH = 420
const MIN_EDITOR_PANEL_WIDTH = 320
/** Largura mínima desejada do painel de preview; em viewports estreitos o painel esquerdo pode encolher. */
const MIN_PREVIEW_PANEL_WIDTH = 280
/** Piso absoluto do painel esquerdo quando o viewport é muito pequeno (evita largura negativa no cálculo). */
const ABSOLUTE_MIN_EDITOR_PANEL_WIDTH = 260
const POINTER_EDITOR_SHELL_HORIZONTAL_PADDING = 20
const POINTER_EDITOR_SHELL_GAP = 16

function getEditorPanelMaxWidth() {
  if (typeof window === 'undefined') return DEFAULT_EDITOR_PANEL_WIDTH

  const maxFromViewport =
    window.innerWidth -
    POINTER_EDITOR_SHELL_HORIZONTAL_PADDING -
    POINTER_EDITOR_SHELL_GAP -
    MIN_PREVIEW_PANEL_WIDTH

  return Math.max(ABSOLUTE_MIN_EDITOR_PANEL_WIDTH, maxFromViewport)
}

function clampEditorPanelWidth(nextWidth: number) {
  const maxW = getEditorPanelMaxWidth()
  const safeWidth = Number.isFinite(nextWidth) ? nextWidth : DEFAULT_EDITOR_PANEL_WIDTH
  const minW = Math.min(MIN_EDITOR_PANEL_WIDTH, maxW)
  return Math.round(Math.min(maxW, Math.max(minW, safeWidth)))
}

/** CRLF e newlines finais — o MDXEditor costuma reemitir o corpo com diferenças só disso. */
function normalizeMdxSourceForDirtyCheck(source: string) {
  return source.replace(/\r\n/g, '\n').replace(/\n+$/, '')
}

/** Chaves em falta vs string vazia contam como iguais; evita ruído na comparação. */
function metadataRecordsEqualForDirtyCheck(
  a: Record<string, string>,
  b: Record<string, string>
) {
  const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]))
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]!
    if ((a[key] ?? '') !== (b[key] ?? '')) return false
  }
  return true
}

const EDITOR_FIELD_SELECTOR = [
  'textarea:not([disabled])',
  'input:not([type="hidden"]):not([disabled])',
  'select:not([disabled])',
  '[contenteditable="true"]',
  '[role="textbox"]',
].join(', ')

function getFirstEditableField(root: HTMLElement | null) {
  if (!root) return null

  if (root.matches(EDITOR_FIELD_SELECTOR)) {
    return root
  }

  return root.querySelector<HTMLElement>(EDITOR_FIELD_SELECTOR)
}

type ContentTreeItem =
  | {
      kind: 'shell'
      nodeId: string
      label: string
    }
  | {
      kind: 'section'
      nodeId: string
      label: string
      sectionIndex: number
    }
  | {
      kind: 'block'
      nodeId: string
      label: string
      sectionIndex: number
      blockName: string
    }

type EditorialSectionItem = Extract<ContentTreeItem, { kind: 'section' }>

type LoadedEditorDocumentPayload = {
  metadata: Record<string, string>
  content: string
}

function sortEntriesByTitle(entries: EditorDocumentListItem[]) {
  return [...entries].sort((a, b) => a.title.localeCompare(b.title))
}

function resolveEffectiveSlug(
  metadata: Record<string, string>,
  fallbackTitle?: string,
  fallbackSlug?: string
) {
  return (
    metadata.slug?.trim() ||
    slugify(metadata.title?.trim() || fallbackTitle || '') ||
    fallbackSlug ||
    ''
  )
}

function isSectionSelection(
  selection: EditorSelection | null
): selection is EditorSelection & {
  kind: 'section' | 'block'
  sectionIndex: number
} {
  return Boolean(
    selection &&
      (selection.kind === 'section' || selection.kind === 'block') &&
      selection.sectionIndex !== undefined
  )
}

function getActiveContentNodeId(selection: EditorSelection | null) {
  if (!selection) return null
  return selection.nodeId
}

function FieldGroup({
  label,
  defaultOpen,
  filledCount,
  totalCount,
  children,
}: {
  label: string
  defaultOpen: boolean
  filledCount: number
  totalCount: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="overflow-hidden rounded-[8px] border border-[#e5e5e5] bg-white">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-[13px] font-medium text-[rgba(10,10,10,0.8)] transition-colors hover:bg-[#fafafa]"
      >
        <span className="flex min-w-0 items-center gap-2">
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-[#737373]" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-[#737373]" />
          )}
          <span className="truncate">{label}</span>
        </span>
        <span className="shrink-0 text-[11px] text-[#737373]">
          {filledCount}/{totalCount}
        </span>
      </button>
      {open ? <div className="space-y-3 px-4 pb-4 pt-1">{children}</div> : null}
    </div>
  )
}

/** Header "Main" da biblioteca: marca Pointer Editor. */
function PointerLibraryHeader() {
  return (
    <div className="flex items-center border-b border-[#e5e5e5] px-2 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-[#e5e5e5] bg-white"
          aria-hidden
        >
          <MousePointer2 className="h-4 w-4 text-[#0a0a0a]" strokeWidth={2} />
        </div>
        <p className="truncate text-sm font-medium leading-6 text-[rgba(10,10,10,0.8)]">
          Pointer Editor
        </p>
      </div>
    </div>
  )
}

function SidebarItemGlyph() {
  return (
    <span className="relative block size-4">
      <span className="absolute inset-y-[2px] left-[2px] w-[3px] rounded-full bg-[#bdbdbd]" />
      <span className="absolute left-[7px] right-[2px] top-[3px] h-[2px] rounded-full bg-[#bdbdbd]" />
      <span className="absolute left-[7px] right-[2px] top-[7px] h-[2px] rounded-full bg-[#bdbdbd]" />
      <span className="absolute left-[7px] right-[4px] top-[11px] h-[2px] rounded-full bg-[#bdbdbd]" />
    </span>
  )
}

function SidebarHeaderActionButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-[6px] text-[#737373] opacity-50 transition-colors hover:bg-[rgba(0,0,0,0.04)] hover:text-[#0a0a0a] disabled:pointer-events-none',
        className
      )}
      {...props}
    />
  )
}

function SidebarGroupHeader({
  label,
  children,
}: {
  label: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 px-2 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center text-[#737373]">
          <SidebarItemGlyph />
        </span>
        <p className="truncate text-sm font-medium leading-6 text-[rgba(10,10,10,0.8)]">
          {label}
        </p>
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </div>
  )
}

function SidebarFixedRow({
  label,
  expanded,
  hovered = false,
  onClick,
  onHoverChange,
  className,
  'data-sidebar-node-id': dataSidebarNodeId,
}: {
  label: string
  expanded: boolean
  hovered?: boolean
  onClick: () => void
  onHoverChange?: (hovered: boolean) => void
  className?: string
  'data-sidebar-node-id'?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      aria-expanded={expanded}
      data-sidebar-node-id={dataSidebarNodeId}
      className={cn(
        'flex h-10 w-full min-w-0 items-center gap-2 px-2 text-left transition-colors hover:bg-[rgba(250,250,250,1)]',
        hovered && 'bg-[rgba(253,85,104,0.05)]',
        className
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center text-[#737373]">
        {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </span>
      <span className="truncate text-sm font-medium leading-6 text-[rgba(10,10,10,0.8)]">
        {label}
      </span>
    </button>
  )
}

function SidebarEditorialToggle({
  label,
  expanded,
  onClick,
}: {
  label: string
  expanded: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className="flex min-h-[68px] w-full items-center gap-2 px-2 py-4 text-left transition-colors hover:bg-[#fafafa]"
    >
      <span className="flex size-6 shrink-0 items-center justify-center self-start pt-[4px] text-[#737373]">
        {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </span>
      <span className="truncate text-[30px] font-semibold leading-[36px] tracking-[-0.75px] text-[#0a0a0a]">
        {label}
      </span>
    </button>
  )
}

function CoverImageField({
  value,
  onChange,
  allowUpload = true,
  coverLabel,
  publicHintIntro,
  publicHintCodeExample,
  publicHintOutro,
}: {
  value: string
  onChange: (v: string) => void
  /** Em produção o sandbox não tem `/api/editor/upload`; ocultar o botão evita falha silenciosa. */
  allowUpload?: boolean
  coverLabel: string
  publicHintIntro: string
  publicHintCodeExample: string
  publicHintOutro: string
}) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/editor/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) return
      const data = (await res.json()) as { url?: string }
      if (data.url) onChange(data.url)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-[13px] font-medium text-[rgba(10,10,10,0.82)]">
        {coverLabel}
      </label>
      {value ? (
        <div className="relative h-36 overflow-hidden rounded-[8px] border border-[#e5e5e5] bg-[#f5f5f5]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Cover preview"
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}
      <div className={cn('flex gap-2', !allowUpload && 'flex-col')}>
        <input
          className="min-w-0 flex-1 rounded-[8px] border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-[#0a0a0a]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/work/01/images/cover.png"
        />
        {allowUpload ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex shrink-0 items-center gap-1.5 rounded-[8px] border border-[#e5e5e5] bg-white px-3 py-2 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-[#fafafa] disabled:opacity-50"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            {uploading ? '...' : 'Upload'}
          </button>
        ) : null}
      </div>
      {!allowUpload ? (
        <p className="text-[11px] leading-snug text-[#737373]">
          {publicHintIntro}{' '}
          <code className="rounded bg-[#f5f5f5] px-1">{publicHintCodeExample}</code>
          {publicHintOutro}
        </p>
      ) : null}
      {allowUpload ? (
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleUpload(file)
            e.target.value = ''
          }}
        />
      ) : null}
    </div>
  )
}

export default function EditorPage({
  variant = 'development',
  adapterBundle: adapterBundleProp,
  dataAdapter: dataAdapterProp,
}: {
  variant?: EditorPageVariant
  /** Injeta modo editorial (testes / futuras coleções); por defeito deriva de `variant`. */
  adapterBundle?: EditorAdapterBundle
  /** Injeta persistência/listagem (testes); sandbox usa estado + fixtures por defeito. */
  dataAdapter?: EditorDataAdapter
} = {}) {
  const bundle = useMemo(
    () => adapterBundleProp ?? createEditorAdapterBundle(variant),
    [adapterBundleProp, variant]
  )
  const isPublicSandbox = bundle.deployment === 'public-sandbox'
  const previewAdapter = useMemo(
    () =>
      createPreviewAdapterFromBundle(bundle, {
        embeddedPreview: SandboxCasePreview,
      }),
    [bundle]
  )
  const useIframePreview =
    previewAdapter.channel === 'iframe-postmessage'
  const persistRemoteDrafts = bundle.capabilities.canPersistRemotely
  const draftsApiPath =
    persistRemoteDrafts && bundle.remoteDraftsApiPath != null
      ? bundle.remoteDraftsApiPath
      : null

  const ui = useMemo(() => createEditorUiPack(bundle.uiLocale), [bundle.uiLocale])
  const coverUploadAllowed = bundle.capabilities.canUpload
  const showSandboxBanner = bundle.showSandboxBanner
  const mdxImageUploadHandler = useMemo(
    () =>
      bundle.capabilities.canUpload
        ? undefined
        : async (file: File) => URL.createObjectURL(file),
    [bundle.capabilities.canUpload]
  )

  const [entries, setEntries] = useState<EditorDocumentListItem[]>(() =>
    isPublicSandbox ? sortEntriesByTitle(buildSandboxWorkEntries()) : []
  )
  const sandboxInitial = isPublicSandbox ? getSandboxInitialEditorState() : null
  const [selectedDocumentId, setSelectedDocumentId] = useState(
    () => sandboxInitial?.selectedDocumentId ?? ''
  )
  const [metadata, setMetadata] = useState<Record<string, string>>(
    () => sandboxInitial?.metadata ?? {}
  )
  const [content, setContent] = useState(
    () => sandboxInitial?.content ?? ''
  )
  const [sandboxDocuments, setSandboxDocuments] = useState<
    Record<string, EditorSandboxDocument>
  >(() => (isPublicSandbox ? getEditorSandboxInitialDocuments() : {}))
  const sandboxDocumentsRef = useRef(sandboxDocuments)
  sandboxDocumentsRef.current = sandboxDocuments

  const dataAdapter = useMemo<EditorDataAdapter>(() => {
    if (dataAdapterProp) return dataAdapterProp
    if (bundle.deployment === 'public-sandbox') {
      return createSandboxEditorDataAdapter({
        getDocuments: () => sandboxDocumentsRef.current,
        setDocuments: setSandboxDocuments,
      })
    }
    if (bundle.deployment === 'pages-editor') {
      return createPagesEditorDataAdapter()
    }
    return createPrivateWorkEditorDataAdapter()
  }, [dataAdapterProp, bundle.deployment])

  const [isSandboxHydrated, setIsSandboxHydrated] = useState(() => !isPublicSandbox)
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newEntryTitle, setNewEntryTitle] = useState('')
  const [newEntrySlug, setNewEntrySlug] = useState('')
  const [createStatus, setCreateStatus] = useState('')
  const [draftId, setDraftId] = useState<string | null>(null)
  const [previewKey, setPreviewKey] = useState(0)
  const [selection, setSelection] = useState<EditorSelection | null>(() =>
    isPublicSandbox
      ? null
      : {
          kind: 'shell',
          nodeId: 'shell-hero',
        }
  )
  const [activeEditorialSectionIndex, setActiveEditorialSectionIndex] = useState<number | null>(
    () => (isPublicSandbox ? null : 0)
  )
  const [isDocumentBrowserOpen, setIsDocumentBrowserOpen] = useState(true)
  const [isContentCollapsed, setIsContentCollapsed] = useState(false)
  const [isMdxMode, setIsMdxMode] = useState(false)
  const [editorPanelWidth, setEditorPanelWidth] = useState(DEFAULT_EDITOR_PANEL_WIDTH)
  const [isPanelResizing, setIsPanelResizing] = useState(false)
  const [isEditorPanelWidthHydrated, setIsEditorPanelWidthHydrated] = useState(false)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [mdxEditingContextNodeId, setMdxEditingContextNodeId] = useState<
    string | null
  >(null)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const codeTextareaRef = useRef<HTMLTextAreaElement>(null)
  const shellEditorRef = useRef<HTMLDivElement>(null)
  const initialMetadataRef = useRef<Record<string, string>>({})
  const initialContentRef = useRef('')
  const draftIdRef = useRef<string | null>(null)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const codeFocusKeyRef = useRef<string | null>(null)
  const editorPanelResizeRef = useRef<{
    pointerId: number
    startX: number
    startWidth: number
  } | null>(null)
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-editor-page-ready', '1')
    root.setAttribute('data-editor-deployment', bundle.deployment)
    root.setAttribute('data-editor-collection', bundle.collection)
    root.setAttribute('data-editor-preview-channel', bundle.previewChannel)
    return () => {
      root.removeAttribute('data-editor-page-ready')
      root.removeAttribute('data-editor-deployment')
      root.removeAttribute('data-editor-collection')
      root.removeAttribute('data-editor-preview-channel')
    }
  }, [bundle.collection, bundle.deployment, bundle.previewChannel])

  useEffect(() => {
    if (!isPublicSandbox) return
    try {
      const raw = window.localStorage.getItem(SANDBOX_LOCAL_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, EditorSandboxDocument>
        setSandboxDocuments(mergePersistedSandboxDocuments(parsed))
      }
    } catch {
      /* ignore */
    } finally {
      setIsSandboxHydrated(true)
    }
  }, [isPublicSandbox])

  const isDirty = useMemo(() => {
    if (!selectedDocumentId) return false
    const metaChanged = !metadataRecordsEqualForDirtyCheck(
      metadata,
      initialMetadataRef.current
    )
    const contentChanged =
      normalizeMdxSourceForDirtyCheck(content) !==
      normalizeMdxSourceForDirtyCheck(initialContentRef.current)
    return metaChanged || contentChanged
  }, [selectedDocumentId, metadata, content])

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.documentId === selectedDocumentId),
    [entries, selectedDocumentId]
  )

  const selectedDocumentTitle = useMemo(
    () => metadata.title?.trim() || selectedEntry?.title || 'Untitled case study',
    [metadata.title, selectedEntry?.title]
  )

  const effectiveDraftSlug = useMemo(
    () => resolveEffectiveSlug(metadata, selectedEntry?.title, selectedEntry?.slug),
    [metadata, selectedEntry?.title, selectedEntry?.slug]
  )

  const renderMetadata = useMemo(
    () => metadataRecordToCaseStudy(metadata, content),
    [metadata, content]
  )

  const outlineItems = useMemo(
    () => buildWorkMdxOutline(content, renderMetadata),
    [content, renderMetadata]
  )

  const sectionsParsed = useMemo(() => splitMdxSections(content), [content])

  const fixedInputItems = useMemo<ContentTreeItem[]>(
    () => [...FIXED_CONTENT_ITEMS],
    []
  )

  const leadingFixedSidebarItem = fixedInputItems[0]
  const trailingFixedSidebarItems = fixedInputItems.slice(1)

  const editorialItems = useMemo<EditorialSectionItem[]>(
    () => {
      const items: EditorialSectionItem[] = []

      sectionsParsed.forEach((section, sectionIndex) => {
        items.push({
          kind: 'section',
          nodeId: `section-${sectionIndex}`,
          sectionIndex,
          label:
            section.title?.trim() ||
            ui.sectionFallbackLabel(sectionIndex + 1),
        })
      })

      return items
    },
    [sectionsParsed, ui.sectionFallbackLabel]
  )

  const sidebarItems = useMemo(
    () => [...fixedInputItems, ...editorialItems],
    [editorialItems, fixedInputItems]
  )

  const validSelectionNodeIds = useMemo(() => {
    return new Set([
      ...sidebarItems.map((item) => item.nodeId),
      ...outlineItems
        .filter((item) => item.kind === 'block')
        .map((item) => item.nodeId),
    ])
  }, [outlineItems, sidebarItems])

  const activeFixedNodeId = useMemo(
    () => (selection?.kind === 'shell' ? selection.nodeId : null),
    [selection]
  )

  const activeEditorialItem = useMemo<EditorialSectionItem | null>(
    () =>
      editorialItems.find((item) => item.sectionIndex === activeEditorialSectionIndex) ?? null,
    [activeEditorialSectionIndex, editorialItems]
  )

  const editorialSyncTarget = useMemo<MdxEditorSyncTarget | null>(() => {
    if (!selection || selection.kind === 'shell') return null

    if (selection.kind === 'block') {
      const parsed = parseBlockNodeId(selection.nodeId)
      const sectionIndex = parsed?.sectionIndex ?? selection.sectionIndex
      if (sectionIndex === undefined) return null

      return {
        key: selection.nodeId,
        kind: 'block',
        sectionIndex,
        blockIndex: parsed?.blockSeq ?? 0,
        blockName: parsed?.componentName ?? selection.blockName,
      }
    }

    if (selection.sectionIndex === undefined) return null

    return {
      key: selection.nodeId,
      kind: 'section',
      sectionIndex: selection.sectionIndex,
    }
  }, [selection])

  const previewHighlightNodeId = useMemo(() => {
    if (mdxEditingContextNodeId) {
      return mdxEditingContextNodeId
    }

    if (!selection) {
      return null
    }

    if (selection.kind === 'shell') {
      return selection.nodeId
    }

    if (
      selection.kind === 'block' &&
      selection.sectionIndex === activeEditorialSectionIndex &&
      validSelectionNodeIds.has(selection.nodeId)
    ) {
      return selection.nodeId
    }

    return activeEditorialItem?.nodeId ?? selection.nodeId ?? null
  }, [
    activeEditorialItem?.nodeId,
    activeEditorialSectionIndex,
    mdxEditingContextNodeId,
    selection,
    validSelectionNodeIds,
  ])

  const scrollTargetNodeId = useMemo(() => {
    if (selection?.kind === 'shell') return selection.nodeId
    return activeEditorialItem?.nodeId ?? null
  }, [activeEditorialItem?.nodeId, selection])

  const blockRangesMap = useMemo(
    () => buildSectionBlockRangesMap(content),
    [content]
  )

  const currentSectionIndex = activeEditorialSectionIndex ?? undefined

  const currentSection = useMemo(() => {
    if (currentSectionIndex === undefined) return null
    return sectionsParsed[currentSectionIndex] ?? null
  }, [currentSectionIndex, sectionsParsed])

  useEffect(() => {
    if (!sectionsParsed.length) {
      setActiveEditorialSectionIndex(null)
      return
    }

    setActiveEditorialSectionIndex((current) => {
      if (current === null) return 0
      return current >= 0 && current < sectionsParsed.length ? current : 0
    })
  }, [sectionsParsed])

  useLayoutEffect(() => {
    const storedWidth = window.localStorage.getItem(
      POINTER_EDITOR_PANEL_WIDTH_STORAGE_KEY
    )

    if (!storedWidth) {
      setEditorPanelWidth((current) => clampEditorPanelWidth(current))
      setIsEditorPanelWidthHydrated(true)
      return
    }

    const parsedWidth = Number(storedWidth)
    if (Number.isFinite(parsedWidth)) {
      setEditorPanelWidth(clampEditorPanelWidth(parsedWidth))
    }

    setIsEditorPanelWidthHydrated(true)
  }, [])

  useEffect(() => {
    if (!scrollTargetNodeId || isContentCollapsed || isDocumentBrowserOpen || isMdxMode) {
      return
    }

    const panel = document.querySelector<HTMLElement>('.pointer-editor-panel')
    const activeNode = panel?.querySelector<HTMLElement>(
      `[data-sidebar-node-id="${scrollTargetNodeId}"]`
    )

    if (!activeNode) return

    window.requestAnimationFrame(() => {
      activeNode.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
  }, [scrollTargetNodeId, isContentCollapsed, isDocumentBrowserOpen, isMdxMode])

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries
    const query = search.toLowerCase()
    return entries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(query) ||
        entry.slug.toLowerCase().includes(query)
    )
  }, [entries, search])

  const previewSrc = useMemo(() => {
    if (
      previewAdapter.channel !== 'iframe-postmessage' ||
      !draftId ||
      !effectiveDraftSlug
    ) {
      return 'about:blank'
    }
    return previewAdapter.iframeSrcBuilder({
      draftId,
      slug: effectiveDraftSlug,
      cacheKey: previewKey,
    })
  }, [
    draftId,
    effectiveDraftSlug,
    previewAdapter,
    previewKey,
  ])

  const countFilledFields = useCallback((fields: FieldDef[]) => {
    return fields.filter(
      (field) => metadata[field.key] !== undefined && metadata[field.key] !== ''
    ).length
  }, [metadata])

  const setMetadataField = useCallback(
    (key: string, value: string) => {
      setMetadata((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const renderField = useCallback(
    (field: FieldDef) => {
      if (field.key === 'coverImage') {
        return (
          <CoverImageField
            key={field.key}
            value={metadata[field.key] ?? ''}
            onChange={(nextValue) => setMetadataField(field.key, nextValue)}
            allowUpload={coverUploadAllowed}
            coverLabel={ui.coverImageLabel}
            publicHintIntro={ui.coverImagePublicHintIntro}
            publicHintCodeExample={ui.coverImagePublicHintCodeExample}
            publicHintOutro={ui.coverImagePublicHintOutro}
          />
        )
      }

      if (field.type === 'switch') {
        return (
          <div
            key={field.key}
            className="flex items-center justify-between gap-3 rounded-[8px] border border-[#e5e5e5] bg-white px-3 py-3"
          >
            <label
              htmlFor={`meta-${field.key}`}
              className="min-w-0 flex-1 cursor-pointer text-sm font-medium text-[#0a0a0a]"
            >
              {field.label}
            </label>
            <Switch
              id={`meta-${field.key}`}
              checked={metadata[field.key] !== 'false'}
              onCheckedChange={(checked) =>
                setMetadata((prev) => ({
                  ...prev,
                  [field.key]: checked ? 'true' : 'false',
                }))
              }
            />
          </div>
        )
      }

      if (field.multiline) {
        return (
          <label
            key={field.key}
            htmlFor={`meta-${field.key}`}
            className="block space-y-1.5 text-sm"
          >
            <span className="block text-[13px] font-medium text-[rgba(10,10,10,0.82)]">
              {field.label}
              {field.required ? <span className="ml-0.5 text-accent">*</span> : null}
            </span>
            <textarea
              id={`meta-${field.key}`}
              className="box-border min-h-[96px] w-full rounded-[8px] border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-[#0a0a0a] resize-y"
              value={metadata[field.key] ?? ''}
              placeholder={field.placeholder}
              onChange={(event) => setMetadataField(field.key, event.target.value)}
            />
          </label>
        )
      }

      return (
        <label
          key={field.key}
          htmlFor={`meta-${field.key}`}
          className="block space-y-1.5 text-sm"
        >
          <span className="block text-[13px] font-medium text-[rgba(10,10,10,0.82)]">
            {field.label}
            {field.required ? <span className="ml-0.5 text-accent">*</span> : null}
          </span>
          <input
            id={`meta-${field.key}`}
            className="box-border w-full rounded-[8px] border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-[#0a0a0a]"
            value={metadata[field.key] ?? ''}
            placeholder={field.placeholder}
            onChange={(event) => setMetadataField(field.key, event.target.value)}
          />
        </label>
      )
    },
    [
      coverUploadAllowed,
      metadata,
      setMetadataField,
      ui.coverImageLabel,
      ui.coverImagePublicHintCodeExample,
      ui.coverImagePublicHintIntro,
      ui.coverImagePublicHintOutro,
    ]
  )

  const applyEntryResponse = useCallback(
    (documentId: string, data: LoadedEditorDocumentPayload) => {
    const imageBaseDir = sandboxEditorAssetBasePath(documentId)
    const normalizedContent = rewriteRelativeImagePaths(
      data.content || '',
      imageBaseDir
    )

    setSelectedDocumentId(documentId)
    setMetadata(data.metadata || {})
    setContent(normalizedContent)
    initialMetadataRef.current = { ...(data.metadata || {}) }
    initialContentRef.current = normalizedContent
    const parsedSections = splitMdxSections(normalizedContent)
    setActiveEditorialSectionIndex(parsedSections.length ? 0 : null)
    setSelection(null)
    setHoveredNodeId(null)
    setIsMdxMode(false)
    setStatus('')
    },
    []
  )

  const deleteDraftRemote = useCallback(
    async (id: string | null) => {
      if (!id || !persistRemoteDrafts || !draftsApiPath) return
      try {
        await fetch(`${draftsApiPath}?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        })
      } catch {
        /* ignore */
      }
    },
    [draftsApiPath, persistRemoteDrafts]
  )

  const pushDraftToServer = useCallback(
    async (opts: {
      nextDraftId?: string | null
      /** ID do documento work (API de drafts mantém o campo `workFileId`). */
      documentId: string
      slug: string
      meta: Record<string, string>
      body: string
      /** Predefinido: incrementa a cache do iframe; use `false` quando o chamador faz `setPreviewKey` no fim. */
      bumpPreview?: boolean
    }) => {
      if (!persistRemoteDrafts || !draftsApiPath) return
      const payload =
        opts.nextDraftId != null
          ? {
              draftId: opts.nextDraftId,
              workFileId: opts.documentId,
              slug: opts.slug,
              metadata: opts.meta,
              content: opts.body,
            }
          : {
              workFileId: opts.documentId,
              slug: opts.slug,
              metadata: opts.meta,
              content: opts.body,
            }
      const res = await fetch(draftsApiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      const doc = (await res.json()) as { id: string }
      setDraftId(doc.id)
      draftIdRef.current = doc.id
      if (opts.bumpPreview !== false) {
        setPreviewKey((value) => value + 1)
      }
    },
    [draftsApiPath, persistRemoteDrafts]
  )

  const bootstrapDraft = useCallback(
    async (
      documentId: string,
      slug: string,
      meta: Record<string, string>,
      body: string,
      options?: { bumpPreview?: boolean }
    ) => {
      if (!persistRemoteDrafts) return
      const previousDraftId = draftIdRef.current
      if (previousDraftId) await deleteDraftRemote(previousDraftId)
      setDraftId(null)
      draftIdRef.current = null
      await pushDraftToServer({
        nextDraftId: undefined,
        documentId,
        slug,
        meta,
        body,
        bumpPreview: options?.bumpPreview,
      })
    },
    [deleteDraftRemote, pushDraftToServer]
  )

  const resyncPreview = useCallback(async () => {
    if (!persistRemoteDrafts) {
      setPreviewKey((v) => v + 1)
      return
    }
    if (!selectedDocumentId || !selectedEntry) {
      setPreviewKey((v) => v + 1)
      return
    }
    const id = draftIdRef.current
    try {
      if (id) {
        try {
          await pushDraftToServer({
            nextDraftId: id,
            documentId: selectedDocumentId,
            slug: effectiveDraftSlug,
            meta: metadata,
            body: content,
            bumpPreview: false,
          })
        } catch {
          await bootstrapDraft(selectedDocumentId, effectiveDraftSlug, metadata, content, {
            bumpPreview: false,
          })
        }
      } else {
        await pushDraftToServer({
          nextDraftId: undefined,
          documentId: selectedDocumentId,
          slug: effectiveDraftSlug,
          meta: metadata,
          body: content,
          bumpPreview: false,
        })
      }
    } catch {
      try {
        await bootstrapDraft(selectedDocumentId, effectiveDraftSlug, metadata, content, {
          bumpPreview: false,
        })
      } catch {
        /* ignore */
      }
    }
    setPreviewKey((v) => v + 1)
  }, [
    bootstrapDraft,
    content,
    effectiveDraftSlug,
    metadata,
    persistRemoteDrafts,
    pushDraftToServer,
    selectedEntry,
    selectedDocumentId,
  ])

  useEffect(() => {
    if (!isPublicSandbox || !isSandboxHydrated) return
    try {
      window.localStorage.setItem(
        SANDBOX_LOCAL_STORAGE_KEY,
        JSON.stringify(sandboxDocuments)
      )
    } catch {
      /* ignore */
    }
  }, [isPublicSandbox, isSandboxHydrated, sandboxDocuments])

  useEffect(() => {
    setMdxEditingContextNodeId(null)
  }, [selectedDocumentId])

  useEffect(() => {
    draftIdRef.current = draftId
  }, [draftId])

  useEffect(() => {
    return () => {
      const currentDraftId = draftIdRef.current
      if (!currentDraftId) return
      void deleteDraftRemote(currentDraftId)
    }
  }, [deleteDraftRemote])

  useEffect(() => {
    if (!persistRemoteDrafts || !selectedDocumentId || !selectedEntry) return
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => {
      const id = draftIdRef.current
      if (!id) return
      void pushDraftToServer({
        nextDraftId: id,
        documentId: selectedDocumentId,
        slug: effectiveDraftSlug,
        meta: metadata,
        body: content,
      }).catch(() => {})
    }, 450)
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    }
  }, [
    content,
    effectiveDraftSlug,
    metadata,
    persistRemoteDrafts,
    pushDraftToServer,
    selectedEntry,
    selectedDocumentId,
  ])

  useEffect(() => {
    if (!useIframePreview) return
    postHighlightToPreviewIframe(iframeRef.current, previewHighlightNodeId)
  }, [useIframePreview, previewHighlightNodeId, previewKey])

  useEffect(() => {
    if (!useIframePreview) return
    postHoverToPreviewIframe(iframeRef.current, hoveredNodeId)
  }, [hoveredNodeId, useIframePreview, previewKey])

  useEffect(() => {
    if (!selectedEntry || isDocumentBrowserOpen) {
      setHoveredNodeId(null)
    }
  }, [isDocumentBrowserOpen, selectedEntry])

  useEffect(() => {
    if (isPublicSandbox) return

    let active = true

    async function loadEntries() {
      try {
        const list = await dataAdapter.listDocuments()
        if (!active) return
        if (list === null) {
          setStatus(ui.editorDevOnly)
          return
        }
        setEntries(sortEntriesByTitle(list))
      } catch {
        if (active) setStatus(ui.failedLoadFileList)
      }
    }

    void loadEntries()

    return () => {
      active = false
    }
  }, [dataAdapter, isPublicSandbox, ui.editorDevOnly, ui.failedLoadFileList])

  useEffect(() => {
    if (!isDirty) return
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const loadEntry = useCallback(
    async (id: string, options?: { skipDirtyCheck?: boolean }) => {
      if (id === selectedDocumentId) {
        setIsDocumentBrowserOpen(false)
        return
      }

      if (
        !options?.skipDirtyCheck &&
        isDirty &&
        !window.confirm(ui.unsavedDiscardConfirm)
      ) {
        return
      }

      setIsLoading(true)
      setStatus('')
      setIsDocumentBrowserOpen(false)

      try {
        const data = await dataAdapter.loadDocument(id)
        applyEntryResponse(id, data)

        if (!isPublicSandbox) {
          const entry = entries.find((item) => item.documentId === id)
          const slug = resolveEffectiveSlug(
            data.metadata || {},
            data.metadata.title || entry?.title,
            entry?.slug
          )

          await bootstrapDraft(
            id,
            slug,
            data.metadata || {},
            rewriteRelativeImagePaths(
              data.content || '',
              sandboxEditorAssetBasePath(id)
            )
          )
        }
        setShowCreateForm(false)
      } catch (e) {
        if (e instanceof Error && e.message === 'Document not found') {
          setStatus(ui.documentNotFound)
        } else {
          setStatus(ui.failedLoadFile)
        }
      } finally {
        setIsLoading(false)
      }
    },
    [
      applyEntryResponse,
      bootstrapDraft,
      dataAdapter,
      entries,
      isDirty,
      isPublicSandbox,
      selectedDocumentId,
      ui.documentNotFound,
      ui.failedLoadFile,
      ui.unsavedDiscardConfirm,
    ]
  )

  useEffect(() => {
    function syncPanelWidthToViewport() {
      setEditorPanelWidth((current) => clampEditorPanelWidth(current))
    }

    window.addEventListener('resize', syncPanelWidthToViewport)
    return () => window.removeEventListener('resize', syncPanelWidthToViewport)
  }, [])

  useEffect(() => {
    if (!isEditorPanelWidthHydrated) return
    window.localStorage.setItem(
      POINTER_EDITOR_PANEL_WIDTH_STORAGE_KEY,
      String(Math.round(editorPanelWidth))
    )
  }, [editorPanelWidth, isEditorPanelWidthHydrated])

  useEffect(() => {
    return () => {
      document.body.classList.remove('pointer-editor-resizing')
    }
  }, [])

  useEffect(() => {
    if (!selection?.nodeId) return
    if (validSelectionNodeIds.has(selection.nodeId)) return

    if (selection.kind === 'block' && selection.sectionIndex !== undefined) {
      setSelection({
        kind: 'section',
        nodeId: `section-${selection.sectionIndex}`,
        sectionIndex: selection.sectionIndex,
      })
      return
    }

    setSelection(null)
  }, [selection, validSelectionNodeIds])

  useLayoutEffect(() => {
    if (selection?.kind !== 'shell' || !selection.nodeId || isDocumentBrowserOpen) {
      return
    }

    const root = shellEditorRef.current
    const field = getFirstEditableField(root)
    if (!field) return

    const timeoutId = window.setTimeout(() => {
      const nextField = getFirstEditableField(shellEditorRef.current)
      if (!nextField) return
      nextField.focus({ preventScroll: true })
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [isDocumentBrowserOpen, selection])

  useLayoutEffect(() => {
    if (!isMdxMode || !selection?.nodeId) {
      codeFocusKeyRef.current = null
      return
    }

    const textarea = codeTextareaRef.current
    if (!textarea) return

    const focusKey = selection.nodeId
    if (codeFocusKeyRef.current === focusKey) return

    let offset = 0

    if (selection.kind === 'section' && selection.sectionIndex !== undefined) {
      offset = findSectionStartCharOffsetInMdx(content, selection.sectionIndex)
    }

    if (selection.kind === 'block') {
      const parsed = parseBlockNodeId(selection.nodeId)
      if (parsed) {
        offset = findSectionStartCharOffsetInMdx(content, parsed.sectionIndex)
        const ranges = blockRangesMap.get(parsed.sectionIndex)
        const range = ranges?.[parsed.blockSeq]
        if (range) {
          offset += range.start
        }
      }
    }

    const line = content.slice(0, offset).split('\n').length - 1
    const lineHeight = 20

    requestAnimationFrame(() => {
      try {
        textarea.focus({ preventScroll: true })
        textarea.setSelectionRange(offset, offset)
      } catch {
        /* ignore */
      }
      textarea.scrollTop = Math.max(0, line * lineHeight - 48)
      codeFocusKeyRef.current = focusKey
    })
  }, [blockRangesMap, content, isMdxMode, selection])

  const finishEditorPanelResize = useCallback(
    (handle?: HTMLButtonElement | null) => {
      const resizeState = editorPanelResizeRef.current
      if (!resizeState) return

      if (handle?.hasPointerCapture(resizeState.pointerId)) {
        try {
          handle.releasePointerCapture(resizeState.pointerId)
        } catch {
          /* ignore */
        }
      }

      editorPanelResizeRef.current = null
      setIsPanelResizing(false)
      document.body.classList.remove('pointer-editor-resizing')
    },
    []
  )

  const handleEditorPanelResizePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return

      const startWidth = clampEditorPanelWidth(editorPanelWidth)
      editorPanelResizeRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startWidth,
      }

      setEditorPanelWidth(startWidth)
      setIsPanelResizing(true)
      document.body.classList.add('pointer-editor-resizing')
      event.currentTarget.setPointerCapture(event.pointerId)
      event.preventDefault()
    },
    [editorPanelWidth]
  )

  const handleEditorPanelResizePointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const resizeState = editorPanelResizeRef.current
      if (!resizeState || resizeState.pointerId !== event.pointerId) return

      const deltaX = event.clientX - resizeState.startX
      setEditorPanelWidth(clampEditorPanelWidth(resizeState.startWidth + deltaX))
    },
    []
  )

  const nudgeEditorPanelWidth = useCallback((delta: number) => {
    setEditorPanelWidth((current) => clampEditorPanelWidth(current + delta))
  }, [])

  const resetSandboxSample = useCallback(() => {
    if (!bundle.capabilities.canResetSample || !selectedDocumentId) return
    const sampleId = SANDBOX_SAMPLE_FOR_ENTRY_ID[selectedDocumentId]
    if (!sampleId) return
    const initial = sandboxEditorFixtureForSample(sampleId)
    if (!initial) return
    setSandboxDocuments((previous) => ({
      ...previous,
      [sampleId]: {
        metadata: { ...initial.metadata },
        content: initial.content,
      },
    }))
    const dir = sandboxEditorAssetBasePath(selectedDocumentId)
    const normalized = rewriteRelativeImagePaths(initial.content, dir)
    applyEntryResponse(selectedDocumentId, {
      metadata: { ...initial.metadata },
      content: normalized,
    })
    setStatus('')
  }, [applyEntryResponse, bundle.capabilities.canResetSample, selectedDocumentId])

  const saveEntry = useCallback(async () => {
    if (!selectedDocumentId) return
    setIsSaving(true)
    setStatus('')

    try {
      if (isPublicSandbox) {
        try {
          await dataAdapter.saveDocument(selectedDocumentId, metadata, content)
        } catch {
          setStatus(ui.couldNotSave)
          return
        }
        initialMetadataRef.current = { ...metadata }
        initialContentRef.current = content
        setEntries((previous) =>
          sortEntriesByTitle(
            previous.map((entry) =>
              entry.documentId === selectedDocumentId
                ? {
                    ...entry,
                    title: metadata.title || entry.title,
                    slug: resolveEffectiveSlug(metadata, entry.title, entry.slug),
                  }
                : entry
            )
          )
        )
        setStatus(ui.savedInBrowserDemo)
        window.setTimeout(() => setStatus(''), 2800)
        return
      }

      await dataAdapter.saveDocument(selectedDocumentId, metadata, content)

      setStatus(ui.savedSuccess)
      initialMetadataRef.current = { ...metadata }
      initialContentRef.current = content

      setEntries((previous) =>
        sortEntriesByTitle(
          previous.map((entry) =>
            entry.documentId === selectedDocumentId
              ? {
                  ...entry,
                  title: metadata.title || entry.title,
                  slug: resolveEffectiveSlug(metadata, entry.title, entry.slug),
                  published: parsePublished(metadata.published),
                }
              : entry
          )
        )
      )

      if (draftIdRef.current && selectedEntry) {
        await pushDraftToServer({
          nextDraftId: draftIdRef.current,
          documentId: selectedDocumentId,
          slug: effectiveDraftSlug,
          meta: metadata,
          body: content,
        }).catch(() => {})
      }

      window.setTimeout(() => setStatus(''), 2800)
    } catch (e) {
      const message = e instanceof Error ? e.message : ''
      setStatus(message || ui.failedSave)
    } finally {
      setIsSaving(false)
    }
  }, [
    content,
    dataAdapter,
    effectiveDraftSlug,
    isPublicSandbox,
    metadata,
    pushDraftToServer,
    selectedEntry,
    selectedDocumentId,
    ui.couldNotSave,
    ui.failedSave,
    ui.savedInBrowserDemo,
    ui.savedSuccess,
  ])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault()
        if (selectedDocumentId) {
          void saveEntry()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [saveEntry, selectedDocumentId])

  const createEntry = useCallback(async () => {
    const title = newEntryTitle.trim()
    if (!title) {
      setCreateStatus(ui.createTitleRequired)
      return
    }

    if (
      isDirty &&
      !window.confirm(ui.unsavedDiscardNewContent)
    ) {
      return
    }

    setIsCreating(true)
    setCreateStatus('')
    setStatus('')

    try {
      const createFn = dataAdapter.createDocument
      if (!createFn) {
        setCreateStatus(ui.failedLoadFile)
        return
      }
      const { entry: createdEntry, document: createdDoc } = await createFn(
        title,
        newEntrySlug.trim() || undefined
      )

      setEntries((previous) => sortEntriesByTitle([...previous, createdEntry]))
      setSearch('')
      setIsDocumentBrowserOpen(false)
      applyEntryResponse(createdEntry.documentId, createdDoc)
      await bootstrapDraft(
        createdEntry.documentId,
        createdEntry.slug,
        createdDoc.metadata || {},
        rewriteRelativeImagePaths(
          createdDoc.content || '',
          sandboxEditorAssetBasePath(createdEntry.documentId)
        )
      )
      setShowCreateForm(false)
      setNewEntryTitle('')
      setNewEntrySlug('')
      setCreateStatus('')
      setStatus(ui.newContentSuccess)
      window.setTimeout(() => setStatus(''), 2800)
    } catch {
      setCreateStatus(ui.failedCreate)
    } finally {
      setIsCreating(false)
    }
  }, [
    applyEntryResponse,
    bootstrapDraft,
    dataAdapter,
    isDirty,
    newEntrySlug,
    newEntryTitle,
    ui.createTitleRequired,
    ui.failedCreate,
    ui.failedLoadFile,
    ui.newContentSuccess,
    ui.unsavedDiscardNewContent,
  ])

  const insertNewSection = useCallback(() => {
    const baseTitle = ui.newSectionTitle
    const normalizedTitles = new Set(
      sectionsParsed
        .map((section) => section.title?.trim().toLowerCase())
        .filter(Boolean)
    )

    let nextTitle = baseTitle
    let suffix = 2
    while (normalizedTitles.has(nextTitle.toLowerCase())) {
      nextTitle = `${baseTitle} ${suffix}`
      suffix += 1
    }

    const nextContent = `${content.trimEnd()}\n\n# ${nextTitle}\n\n${ui.newSectionBodyLine}\n`
    const nextSections = splitMdxSections(nextContent)
    const nextIndex = nextSections.length - 1

    setContent(nextContent)
    setSelection({
      kind: 'section',
      nodeId: `section-${nextIndex}`,
      sectionIndex: nextIndex,
    })
    setActiveEditorialSectionIndex(nextIndex)
    setIsContentCollapsed(false)
    setIsMdxMode(false)
  }, [content, sectionsParsed, ui.newSectionBodyLine, ui.newSectionTitle])

  const onSelectFromPreview = useCallback((nextSelection: EditorSelection) => {
    setSelection(nextSelection)
    if (
      (nextSelection.kind === 'section' || nextSelection.kind === 'block') &&
      nextSelection.sectionIndex !== undefined
    ) {
      setActiveEditorialSectionIndex(nextSelection.sectionIndex)
    }
    if (nextSelection.kind === 'shell') {
      setIsContentCollapsed(false)
    }
    setIsMdxMode(false)
    setIsDocumentBrowserOpen(false)
  }, [])

  const onHoverFromPreview = useCallback((nodeId: string | null) => {
    setHoveredNodeId(nodeId)
  }, [])

  const onEditorHoverChange = useCallback((nodeId: string | null) => {
    setHoveredNodeId(nodeId)
  }, [])

  const onContentItemPick = useCallback(
    (item: ContentTreeItem) => {
      if (item.kind === 'shell' && activeFixedNodeId === item.nodeId) {
        setSelection(null)
        return
      }

      if (item.kind === 'shell') {
        setSelection({ kind: 'shell', nodeId: item.nodeId })
        setIsContentCollapsed(false)
        setIsMdxMode(false)
        return
      }

      if (item.kind === 'block') {
        setActiveEditorialSectionIndex(item.sectionIndex)
        setSelection({
          kind: 'block',
          nodeId: item.nodeId,
          sectionIndex: item.sectionIndex,
          blockName: item.blockName,
        })
        setIsMdxMode(false)
        return
      }

      setActiveEditorialSectionIndex(item.sectionIndex)
      setSelection({
        kind: 'section',
        nodeId: item.nodeId,
        sectionIndex: item.sectionIndex,
      })
      setIsMdxMode(false)
    },
    [activeFixedNodeId]
  )

  function renderShellEditor({ embedded = false }: { embedded?: boolean } = {}) {
    if (!selection || selection.kind !== 'shell') return null

    if (selection.nodeId === 'shell-hero') {
      return (
        <div
          ref={embedded ? shellEditorRef : undefined}
          className={cn('space-y-4', embedded && 'space-y-3')}
        >
          {!embedded ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#737373]">
                Title and Cover
              </p>
              <h2 className="mt-2 text-[16px] font-semibold leading-6 text-[rgba(10,10,10,0.82)]">
                {ui.shellHeroHeading}
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#737373]">
                {ui.shellHeroDescription}
              </p>
            </div>
          ) : null}
          <div className="space-y-3">{ui.heroFields.map(renderField)}</div>
        </div>
      )
    }

    if (selection.nodeId === 'shell-tags') {
      return (
        <div
          ref={embedded ? shellEditorRef : undefined}
          className={cn('space-y-4', embedded && 'space-y-3')}
        >
          {!embedded ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#737373]">
                Tags
              </p>
              <h2 className="mt-2 text-[16px] font-semibold leading-6 text-[rgba(10,10,10,0.82)]">
                {ui.shellTagsHeading}
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#737373]">
                {ui.shellTagsDescription}
              </p>
            </div>
          ) : null}
          <div className="space-y-3">{ui.tagFields.map(renderField)}</div>
        </div>
      )
    }

    if (selection.nodeId === 'shell-summary') {
      return (
        <div
          ref={embedded ? shellEditorRef : undefined}
          className={cn('space-y-4', embedded && 'space-y-3')}
        >
          {!embedded ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#737373]">
                Overview
              </p>
              <h2 className="mt-2 text-[16px] font-semibold leading-6 text-[rgba(10,10,10,0.82)]">
                {ui.shellSummaryHeading}
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#737373]">
                {ui.shellSummaryDescription}
              </p>
            </div>
          ) : null}
          <div className="space-y-3">{ui.overviewFields.map(renderField)}</div>
        </div>
      )
    }

    return (
      <div
        ref={embedded ? shellEditorRef : undefined}
        className={cn('space-y-4', embedded && 'space-y-3')}
      >
        {!embedded ? (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#737373]">
              Metadata
            </p>
            <h2 className="mt-2 text-[16px] font-semibold leading-6 text-[rgba(10,10,10,0.82)]">
              {ui.shellMetaHeading}
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#737373]">
              {ui.shellMetaDescription}
            </p>
          </div>
        ) : null}
        <div className="space-y-3">
          {ui.metadataGroups.map((group) => (
            <FieldGroup
              key={group.id}
              label={group.label}
              defaultOpen={group.defaultOpen}
              filledCount={countFilledFields(group.fields)}
              totalCount={group.fields.length}
            >
              <div className="space-y-3">
                {group.fields.map((field) => (
                  <div key={field.key}>{renderField(field)}</div>
                ))}
              </div>
            </FieldGroup>
          ))}
        </div>
      </div>
    )
  }

  function renderExpandedSelectionBody(item: ContentTreeItem) {
    if (item.kind === 'shell') {
      if (!selection || item.nodeId !== activeFixedNodeId || isContentCollapsed) return null
      return (
        <div
          className="min-w-0 px-10 pb-4 pt-1"
          onMouseEnter={() => setHoveredNodeId(item.nodeId)}
          onMouseLeave={() => setHoveredNodeId(null)}
        >
          {renderShellEditor({ embedded: true })}
        </div>
      )
    }

    return null
  }

  function renderEditorialBlocksEditor() {
    if (!selectedEntry) return null

    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-2 py-2">
        <MdxEditor
          value={content}
          onChange={setContent}
          imageUploadHandler={mdxImageUploadHandler}
          imageBasePath={`/work/${sandboxEditorAssetBasePath(selectedEntry.documentId)}`}
          editorKey={`${selectedDocumentId}-editorial-body`}
          surface="work-body"
          syncTarget={editorialSyncTarget}
          hoverNodeId={hoveredNodeId}
          onHoverNodeChange={onEditorHoverChange}
          onEditingContextChange={setMdxEditingContextNodeId}
          wrapperClassName="pointer-editor-mdx--sidebar min-h-0 w-full flex-1 overflow-hidden rounded-[8px] border border-[#e5e5e5] bg-white"
        />
      </div>
    )
  }

  function renderRawMdxEditor() {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#737373]">
            .mdx
          </p>
          <h2 className="mt-2 text-[16px] font-semibold leading-6 text-[rgba(10,10,10,0.82)]">
            {ui.rawMdxHeading}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#737373]">
            {ui.rawMdxDescription}
          </p>
        </div>
        <textarea
          ref={codeTextareaRef}
          className="min-h-[420px] flex-1 resize-none rounded-[8px] border border-[#e5e5e5] bg-white px-4 py-4 font-mono text-[13px] leading-6 text-[#0a0a0a] outline-none"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          spellCheck={false}
        />
      </div>
    )
  }

  const editorWorkspace = (
    <>
      {useIframePreview ? (
        <EditorPreviewBridge
          iframeRef={iframeRef}
          onSelectFromPreview={onSelectFromPreview}
          onHoverFromPreview={onHoverFromPreview}
          onPreviewReady={() => {
            postHighlightToPreviewIframe(iframeRef.current, previewHighlightNodeId)
            postHoverToPreviewIframe(iframeRef.current, hoveredNodeId)
          }}
          onPreviewRequestRefresh={() => void resyncPreview()}
        />
      ) : null}

        <div
          className="pointer-editor-panel relative h-full shrink-0"
          style={{ width: `${editorPanelWidth}px` }}
        >
          <aside className="relative flex h-full w-full flex-col overflow-hidden rounded-[8px] border border-[#e5e5e5] bg-white">
            <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
              <div
                className={cn(
                  'flex h-full min-h-0 w-[200%] transition-transform duration-300 ease-out motion-reduce:transition-none',
                  'will-change-transform motion-reduce:will-change-auto'
                )}
                style={{
                  transform: isDocumentBrowserOpen
                    ? 'translateX(0%)'
                    : 'translateX(-50%)',
                }}
              >
                <div
                  className={cn(
                    'flex h-full min-h-0 w-1/2 shrink-0 min-w-0 flex-col bg-white',
                    !isDocumentBrowserOpen && 'pointer-events-none select-none'
                  )}
                  aria-hidden={!isDocumentBrowserOpen}
                >
                  <PointerLibraryHeader />
                  <div className="flex flex-row flex-wrap items-center gap-3 border-b-0 px-2 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#737373]" />
                        <input
                          type="text"
                          placeholder={ui.searchPlaceholder}
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          className="h-[40px] w-full rounded-[8px] border border-[#e5e5e5] bg-white py-2 pl-8 pr-2 text-sm text-[#0a0a0a] placeholder:text-[#737373]"
                        />
                      </div>
                    </div>

                    {!isPublicSandbox ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateForm((prev) => !prev)
                            setCreateStatus('')
                          }}
                          className="flex h-[40px] shrink-0 items-center gap-2 rounded-[8px] border border-[#e5e5e5] bg-white px-4 text-sm font-medium leading-5 text-[#0a0a0a] transition-colors hover:bg-[#fafafa]"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {ui.newPage}
                        </button>

                        {showCreateForm ? (
                          <div className="w-full space-y-3 rounded-[8px] border border-[#e5e5e5] bg-white p-3">
                            <label className="block space-y-1.5 text-sm">
                              <span className="font-medium text-[#0a0a0a]">
                                {ui.createFormTitle}
                              </span>
                              <input
                                value={newEntryTitle}
                                onChange={(event) => setNewEntryTitle(event.target.value)}
                                placeholder="Ex.: New Product Vision"
                                className="w-full rounded-[8px] border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-[#0a0a0a]"
                              />
                            </label>
                            <label className="block space-y-1.5 text-sm">
                              <span className="font-medium text-[#0a0a0a]">
                                {ui.createFormSlug}
                              </span>
                              <input
                                value={newEntrySlug}
                                onChange={(event) => setNewEntrySlug(event.target.value)}
                                placeholder={
                                  newEntryTitle
                                    ? slugify(newEntryTitle)
                                    : ui.createFormSlugPlaceholderFromTitle
                                }
                                className="w-full rounded-[8px] border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-[#0a0a0a]"
                              />
                            </label>
                            {createStatus ? (
                              <p className="text-[11px] text-[#737373]">{createStatus}</p>
                            ) : null}
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCreateForm(false)
                                  setNewEntryTitle('')
                                  setNewEntrySlug('')
                                  setCreateStatus('')
                                }}
                                className="flex-1 rounded-[8px] border border-[#e5e5e5] bg-white px-3 py-2 text-sm font-medium text-[#0a0a0a]"
                              >
                                {ui.cancel}
                              </button>
                              <button
                                type="button"
                                onClick={createEntry}
                                disabled={isCreating}
                                className="flex-1 rounded-[8px] border border-[#0a0a0a] bg-[#0a0a0a] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                              >
                                {isCreating ? ui.creating : ui.create}
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto bg-white px-2 py-2">
                    {filteredEntries.length ? (
                      <div className="space-y-1.5">
                        {filteredEntries.map((entry) => {
                          const isActive = entry.documentId === selectedDocumentId
                          return (
                            <button
                              key={entry.documentId}
                              type="button"
                              onClick={() => void loadEntry(entry.documentId)}
                              className={cn(
                                'flex w-full items-start gap-3 rounded-[8px] border px-3 py-3 text-left transition-colors',
                                isActive
                                  ? 'border-[#d9d9d9] bg-white shadow-[0_8px_20px_rgba(0,0,0,0.04)]'
                                  : 'border-transparent bg-transparent hover:border-[#ededed] hover:bg-[rgba(250,250,250,1)]'
                              )}
                            >
                              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#737373]" />
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium text-[#0a0a0a]">
                                  {entry.title}
                                </div>
                                <div className="truncate text-[12px] leading-5 text-[#737373]">
                                  /{entry.slug}
                                </div>
                              </div>
                              {entry.published === false ? (
                                <span className="rounded-full bg-[#f5f5f5] px-2 py-1 text-[11px] font-medium text-[#737373]">
                                  Draft
                                </span>
                              ) : null}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-[#737373]">
                        {ui.noFilesFound}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className={cn(
                    'flex h-full min-h-0 w-1/2 shrink-0 min-w-0 flex-col bg-white',
                    isDocumentBrowserOpen && 'pointer-events-none select-none'
                  )}
                  aria-hidden={isDocumentBrowserOpen}
                >
          {/* Header documento — Figma 661:11223: p-8, voltar 32×32 sem borda, título 14 bold, painel 36 */}
          <div className="border-b border-[#e5e5e5]">
            <div className="flex min-w-0 items-center gap-2 p-2">
              <button
                type="button"
                aria-label={ui.openLibraryAriaLabel}
                onClick={() => {
                  if (
                    isDirty &&
                    !window.confirm(ui.unsavedOpenLibraryConfirm)
                  ) {
                    return
                  }
                  setIsDocumentBrowserOpen(true)
                }}
                className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#737373] transition-colors hover:bg-[rgba(0,0,0,0.04)] hover:text-[#0a0a0a]"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="min-w-0 truncate text-sm font-bold leading-6 text-[rgba(10,10,10,0.8)]">
                  {selectedDocumentTitle}
                </p>
                <p className="min-w-0 truncate text-[11px] leading-5 text-[#737373]">
                  {selectedEntry?.documentId || ui.noDocumentLoaded}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <SidebarHeaderActionButton
                  aria-label={ui.undoUnavailableAria}
                  disabled
                >
                  <Undo2 className="size-3.5" />
                </SidebarHeaderActionButton>
                <SidebarHeaderActionButton
                  aria-label={ui.redoUnavailableAria}
                  disabled
                >
                  <Redo2 className="size-3.5" />
                </SidebarHeaderActionButton>
                {bundle.capabilities.canResetSample && selectedDocumentId ? (
                  <button
                    type="button"
                    onClick={() => resetSandboxSample()}
                    className="flex h-[40px] shrink-0 items-center rounded-[8px] border border-[#e5e5e5] bg-white px-3 text-sm font-medium leading-5 text-[#0a0a0a] transition-colors hover:bg-[#fafafa]"
                  >
                    {ui.resetSample}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void saveEntry()}
                  disabled={isSaving || !isDirty || !selectedDocumentId}
                  className={cn(
                    'flex h-[40px] shrink-0 items-center gap-2 rounded-[8px] border border-[#e5e5e5] px-4 text-sm font-medium leading-5 transition-colors',
                    isDirty && selectedDocumentId && !isSaving
                      ? 'bg-white text-[#0a0a0a] hover:bg-[#fafafa]'
                      : 'cursor-not-allowed bg-[#fafafa] text-[#a3a3a3]'
                  )}
                >
                  {isSaving ? ui.saving : ui.save}
                </button>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {isLoading ? (
              <div className="flex min-h-0 flex-1 items-center justify-center px-2 py-6 text-sm text-[#737373]">
                {ui.loadingEditor}
              </div>
            ) : !selectedEntry ? (
              <div className="flex min-h-0 flex-1 items-center justify-center px-2 py-6 text-center text-sm text-[#737373]">
                {ui.selectDocumentInLibrary}
              </div>
            ) : (
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <div className="min-h-0 min-w-0 grow-0 shrink overflow-y-auto overflow-x-hidden overscroll-y-contain">
                  {leadingFixedSidebarItem ? (
                    <Fragment key={leadingFixedSidebarItem.nodeId}>
                      <SidebarFixedRow
                        label={leadingFixedSidebarItem.label}
                        expanded={
                          activeFixedNodeId === leadingFixedSidebarItem.nodeId &&
                          !isContentCollapsed
                        }
                        hovered={hoveredNodeId === leadingFixedSidebarItem.nodeId}
                        onClick={() => onContentItemPick(leadingFixedSidebarItem)}
                        onHoverChange={(isHovered) =>
                          setHoveredNodeId(
                            isHovered ? leadingFixedSidebarItem.nodeId : null
                          )
                        }
                        data-sidebar-node-id={leadingFixedSidebarItem.nodeId}
                      />
                      {activeFixedNodeId === leadingFixedSidebarItem.nodeId
                        ? renderExpandedSelectionBody(leadingFixedSidebarItem)
                        : null}
                    </Fragment>
                  ) : null}
                  {trailingFixedSidebarItems.map((item) => {
                    const isActive = activeFixedNodeId === item.nodeId
                    return (
                      <Fragment key={item.nodeId}>
                        <SidebarFixedRow
                          label={item.label}
                          expanded={isActive && !isContentCollapsed}
                          hovered={hoveredNodeId === item.nodeId}
                          onClick={() => onContentItemPick(item)}
                          onHoverChange={(isHovered) =>
                            setHoveredNodeId(isHovered ? item.nodeId : null)
                          }
                          className="border-t border-[#e5e5e5]"
                          data-sidebar-node-id={item.nodeId}
                        />
                        {isActive ? renderExpandedSelectionBody(item) : null}
                      </Fragment>
                    )
                  })}
                </div>

                <section className="pointer-editorial-blocks-panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-t border-[#e5e5e5] bg-white">
                  <div className="shrink-0 border-b border-[#e5e5e5] bg-white">
                    <SidebarGroupHeader label="Editorial Content" />
                  </div>
                  {renderEditorialBlocksEditor()}
                </section>
              </div>
            )}

            {status ? (
              <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[#e5e5e5] px-3 py-2">
                <span
                  className={cn(
                    'max-w-full truncate text-[11px] font-medium',
                    /success|saved|sucesso|guardado/i.test(status)
                      ? 'text-emerald-600'
                      : 'text-[#737373]'
                  )}
                >
                  {status}
                </span>
              </div>
            ) : null}
          </div>
                </div>
              </div>
            </div>
          </aside>

          <button
            type="button"
            aria-label={ui.adjustPanelAriaLabel}
            title={ui.adjustPanelTitle}
            onDoubleClick={() =>
              setEditorPanelWidth(clampEditorPanelWidth(DEFAULT_EDITOR_PANEL_WIDTH))
            }
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') {
                event.preventDefault()
                nudgeEditorPanelWidth(-24)
                return
              }

              if (event.key === 'ArrowRight') {
                event.preventDefault()
                nudgeEditorPanelWidth(24)
              }
            }}
            onPointerDown={handleEditorPanelResizePointerDown}
            onPointerMove={handleEditorPanelResizePointerMove}
            onPointerUp={(event) => finishEditorPanelResize(event.currentTarget)}
            onPointerCancel={(event) => finishEditorPanelResize(event.currentTarget)}
            onLostPointerCapture={(event) => finishEditorPanelResize(event.currentTarget)}
            className="group absolute bottom-0 right-0 top-px z-30 flex w-4 translate-x-1/2 cursor-col-resize touch-none items-center justify-center"
          >
            <span
              aria-hidden
              className={cn(
                'block h-[calc(100%-44px)] w-px rounded-full bg-[#d8d8d8] transition-colors',
                isPanelResizing
                  ? 'bg-[#0a0a0a]'
                  : 'group-hover:bg-[#a9a9a9] group-focus-visible:bg-[#0a0a0a]'
              )}
            />
          </button>
        </div>

        <section
          className={cn(
            'flex min-w-0 flex-1 flex-col overflow-hidden rounded-[8px] border border-black bg-white',
            isPanelResizing && 'pointer-events-none select-none'
          )}
        >
          <div className="relative flex-1 min-h-0 overflow-hidden">
            <div className="pointer-editor-preview-badge absolute left-1/2 top-0 z-20 flex -translate-x-1/2 items-center gap-1 rounded-b-[4px] bg-black py-1 px-2 text-[11px] font-medium tracking-[0.06em] text-white">
              <span>Preview</span>
            </div>
            {selectedEntry && !isDocumentBrowserOpen ? (
              previewAdapter.channel === 'iframe-postmessage' ? (
                <iframe
                  ref={iframeRef}
                  title="Preview draft"
                  className="h-full w-full border-0 bg-[#f5f5f5]"
                  src={previewSrc}
                />
              ) : (
                <previewAdapter.EmbeddedPreview
                  slug={effectiveDraftSlug}
                  metadata={metadata}
                  content={content}
                  highlightNodeId={previewHighlightNodeId}
                  hoverNodeId={hoveredNodeId}
                  onSelectFromPreview={onSelectFromPreview}
                  onHoverFromPreview={onHoverFromPreview}
                />
              )
            ) : (
              <div
                className="flex h-full flex-col items-center justify-center gap-3 bg-[#f5f5f5] px-6 text-center"
                role="status"
                aria-live="polite"
              >
                <ArrowLeft
                  className={cn(
                    'size-12 shrink-0 text-[#a3a3a3]',
                    'motion-safe:animate-nudge-left motion-reduce:animate-none'
                  )}
                  strokeWidth={1.25}
                  aria-hidden
                />
                <div className="flex max-w-[22rem] flex-col gap-1">
                  <p className="text-sm font-medium leading-5 text-[#0a0a0a]">
                    {ui.previewPickFileLine1}
                    <br />
                    {ui.previewPickFileLine2}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
    </>
  )

  return showSandboxBanner ? (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
      <div
        className="flex shrink-0 items-start gap-2 rounded-[8px] border border-[var(--blue-9)] bg-[rgba(0,144,255,0.1)] px-3 py-2 text-[12px] leading-snug text-[var(--blue-12)]"
        role="note"
      >
        <Info
          className="mt-0.5 size-[14px] shrink-0 text-[var(--blue-9)]"
          strokeWidth={2}
          aria-hidden
        />
        <span className="min-w-0">{ui.sandboxBanner}</span>
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 gap-[16px]">{editorWorkspace}</div>
    </div>
  ) : (
    editorWorkspace
  )
}
