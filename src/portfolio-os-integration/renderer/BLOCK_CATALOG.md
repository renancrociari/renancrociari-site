# Catálogo de Blocos - Compatibilidade Portfolio-OS

Documentação definitiva dos blocos suportados pelo renderer compartilhado.

## Resumo de Compatibilidade

| Portfolio-OS | Renderer Local | Categoria | Status |
|--------------|----------------|-----------|--------|
| `CaseHero` | `hero` | narrative | ✅ |
| `PullQuote` | `quote` | narrative | ✅ |
| `Callout` | `callout` | narrative | ✅ |
| `TOC` | `toc` | narrative | ✅ |
| `ImpactResults` / `Stats` | `results` | evidence | ✅ |
| `MetadataPanel` | `metadata` | evidence | ✅ |
| `Figure` | `image` | media | ✅ |
| `GalleryGrid` / `ImageGrid` | `gallery` | media | ✅ |
| `FigmaEmbed` | `figma` | media | ✅ |
| `VideoEmbed` | `video` | media | ✅ |
| `ProcessTimeline` | `timeline` | process | ✅ |
| `BeforeAfter` | - | legacy | ❌ Fallback |
| `Confidential` | - | legacy | ❌ Fallback |

---

## Blocos Suportados

### Narrative

#### `CaseHero` → `hero`
```typescript
interface CaseHeroProps {
  title: string;
  subtitle?: string;
  image?: string;
  tags?: string[];
}
```
- **Status**: ✅ Suportado
- **Renderização**: Hero principal com título, subtítulo, imagem e tags
- **Notas**: Usado automaticamente para case studies a partir do frontmatter

#### `PullQuote` → `quote`
```typescript
interface PullQuoteProps {
  quote: string;        // obrigatório
  author?: string;
  role?: string;
  company?: string;
  
  // Formato legado (suportado para compatibilidade)
  text?: string;        // alias de quote
  source?: string;      // concatenado com author
}
```
- **Status**: ✅ Suportado
- **Notas**: `role` e `company` são concatenados com `author` no formato "Author, Role · Company"

#### `Callout` → `callout`
```typescript
interface CalloutProps {
  title?: string;
  variant?: 'insight' | 'warning' | 'note';
  children?: string;
}
```
- **Status**: ✅ Suportado
- **Variantes**:
  - `insight` (padrão): Fundo verde (#ecfdf5), borda verde
  - `warning`: Fundo amarelo (#fffbeb), borda amarela
  - `note`: Fundo azul (#eff6ff), borda azul

#### `TOC` → `toc`
```typescript
interface TOCProps {
  title?: string;       // default: "On this page"
  items: string;        // JSON: [{id: string, label: string}]
}
```
- **Status**: ✅ Suportado
- **Exemplo**:
```json
[{"id": "context", "label": "Context"}, {"id": "outcome", "label": "Outcome"}]
```

### Evidence

#### `ImpactResults` / `Stats` → `results`
```typescript
interface ImpactResultsProps {
  title?: string;
  summary?: string;
  // Métricas (até 3)
  metricOneLabel?: string;
  metricOneValue?: string;    // obrigatório para mostrar
  metricOneNote?: string;
  metricTwoLabel?: string;
  metricTwoValue?: string;
  metricTwoNote?: string;
  metricThreeLabel?: string;
  metricThreeValue?: string;
  metricThreeNote?: string;
  
  // Formato legado alternativo
  items?: Array<{label: string, value: string, note?: string}>;
}
```
- **Status**: ✅ Suportado
- **Layout**: Grid responsivo, 3 colunas em desktop

#### `MetadataPanel` → `metadata`
```typescript
interface MetadataPanelProps {
  rows?: Array<{label: string, value: string}>;
}
```
- **Status**: ✅ Suportado
- **Uso**: Painel de metadados para case studies (ano, duração, time, etc.)

### Media

#### `Figure` → `image`
```typescript
interface FigureProps {
  src: string;          // obrigatório
  alt: string;          // obrigatório
  caption?: string;
  fullWidth?: boolean | string;  // pode ser expression
}
```
- **Status**: ✅ Suportado
- **Notas**: Usa `<figure>` com `<figcaption>` quando há caption

#### `GalleryGrid` / `ImageGrid` → `gallery`
```typescript
interface GalleryGridProps {
  columns?: number;     // 1-4, default: 2
  items: string;        // JSON: [{src, alt?, caption?, url?}]
}
```
- **Status**: ✅ Suportado
- **Exemplo**:
```json
[{"src": "/images/1.png", "alt": "Discovery", "caption": "Synthesis board"}]
```

#### `FigmaEmbed` → `figma`
```typescript
interface FigmaEmbedProps {
  url: string;          // obrigatório - URL do Figma
  title?: string;
  height?: number;      // default: 640
  caption?: string;
}
```
- **Status**: ✅ Suportado
- **Notas**: Normaliza URLs de design para formato embed automaticamente

#### `VideoEmbed` → `video`
```typescript
interface VideoEmbedProps {
  url: string;          // obrigatório
  title?: string;
  provider?: 'youtube'; // auto-detectado se não especificado
  
  // Formato legado
  src?: string;         // alias de url
}
```
- **Status**: ✅ Suportado
- **YouTube**: Extrai video ID automaticamente de youtube.com/watch?v= ou youtu.be/
- **MP4**: Renderiza player nativo `<video>`

### Process

#### `ProcessTimeline` → `timeline`
```typescript
interface ProcessTimelineProps {
  title?: string;
  items: string;        // JSON: [{title, period?, description?}]
}
```
- **Status**: ✅ Suportado
- **Exemplo**:
```json
[{"title": "Discovery", "period": "Week 1", "description": "Problem mapping"}]
```

---

## Blocos Markdown Nativos

| Bloco | Props | Descrição |
|-------|-------|-----------|
| `heading` | `level` (1-6), `text`, `anchor?` | Títulos hierárquicos |
| `paragraph` | `text`, `className?` | Parágrafos de texto |
| `list` | `items` (array), `ordered` (bool) | Listas ordenadas/não ordenadas |
| `divider` | - | Linha horizontal `<hr>` |
| `embed` | `url`, `title?` | Embed genérico |
| `textBlock` | `title?`, `content`, `columns?` | Bloco de texto com título opcional |

---

## Blocos Não Suportados (Fallback)

### `BeforeAfter`
- **Status**: ❌ Não implementado
- **Fallback**: `<!-- [BeforeAfter] Bloco legado não implementado -->`
- **Razão**: Legado, mantido apenas para compatibilidade runtime

### `Confidential`
- **Status**: ❌ Não implementado
- **Fallback**: `<!-- [Confidential] Bloco legado não implementado -->`
- **Razão**: Legado, mantido apenas para compatibilidade runtime

---

## Sistema de Fallback

### Modos de Fallback

O renderer suporta 4 modos de fallback configuráveis via `options.fallbackMode`:

| Modo | Comportamento | Uso recomendado |
|------|---------------|-----------------|
| `comment` (padrão) | HTML comment invisível | Produção - silencioso |
| `warning` | Bloco amarelo com aviso | Preview - visível mas não intrusivo |
| `error` | Bloco vermelho indicando erro | Debug - destaca problemas |
| `degraded` | Tenta renderizar com o que tem | Recuperação graceful |

### Exemplo de Uso

```javascript
// Modo padrão (comment)
renderBlocks(blocks);  // Blocos inválidos viram <!-- ... -->

// Modo warning no preview
renderBlocks(blocks, { fallbackMode: 'warning' });

// Modo error para debug
renderBlocks(blocks, { fallbackMode: 'error' });
```

### Validação de Props

Props obrigatórias são validadas automaticamente:

```javascript
// Bloco sem prop obrigatória retorna fallback
{ type: 'Figure', props: { caption: 'Image' } }  
// → <!-- [Figure] Props faltando: src, alt -->
```

---

## Aliases Suportados

O renderer resolve automaticamente aliases para o nome canônico:

| Alias | Resolve para |
|-------|--------------|
| `Stats` | `ImpactResults` → `results` |
| `ImageGrid` | `GalleryGrid` → `gallery` |

---

## Integração com Portfolio-OS

### Importando o renderer

```javascript
import { 
  renderBlocks, 
  renderDocument, 
  renderCaseStudy 
} from './renderer/shared-renderer.js';

// Renderizar array de blocos
const html = renderBlocks(document.blocks, { 
  baseUrl: '/',
  isPreview: true 
});
```

### Parse de JSON em Props

Blocos que recebem arrays via props (GalleryGrid, ProcessTimeline, TOC) aceitam:
- **String JSON**: `'[{"src":"..."}]'` (formato Portfolio-OS)
- **Array**: `[{src: "..."}]` (formato programático)

A conversão é automática via `JSON.parse()` com fallback seguro.
