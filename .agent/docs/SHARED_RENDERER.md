# Renderer Compartilhado (Task 6)

## Visão Geral

O renderer converte MDX + frontmatter → HTML idêntico ao site publicado. Ambos (preview e site) usam a mesma camada.

---

## Arquitetura

```
┌─────────────────────────────────────────┐
│           MDX Input                    │
│  (frontmatter + conteúdo)              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         @portfolio-os/core                │
│  • parseFrontmatter()                     │
│  • ContentLoader                        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    RenderizadorHTML                      │
│  • headings → <h1-6 class="t-...">    │
│  • paragraphs → <p class="...">        │
│  • ProcessTimeline → .process-timeline     │
│  • ImpactResults → .featured-metrics     │
│  • Figure → <figure>                   │
│  • etc                                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│           HTML Output                   │
│  + styles/main.css                    │
+ styles/global.css                    │
└─────────────────────────────────────────┘
```

---

## mapping: Bloco → HTML + CSS

| Bloco MDX | Output HTML | Classes CSS |
|-----------|-----------|-------------|
| `# Title` | `<h2 class="mt-3xl">` | `mt-3xl` |
| `## Title` | `<h3 class="mt-2xl">` | `mt-2xl` |
| `### Title` | `<h3 class="mt-xl">` | `mt-xl` |
| Parágrafo | `<p class="mt-md">` | `mt-md` |
| `**bold**` | `<strong>` | - |
| `<ul>` | `<ul class="ul">` | `ul` |
| `<li>` | `<li class="li mt-sm">` | `li mt-sm` |
| ProcessTimeline | `<div class="process-timeline">` | custom |
| ImpactResults | `<div class="featured-metrics">` | custom |
| GalleryGrid | `<div class="wrapper two-column-image">` | custom |
| Figure | `<figure><img class="..."><figcaption>` | custom |
| PullQuote | `<blockquote class="pull-quote">` | custom |
| Callout | `<div class="callout variant">` | custom |
| TOC | `<nav class="toc"><ul>` | custom |

---

## Classes de Espaçamento (CSS reuse)

```css
/* Spacing tokens - já existem em main.css */
.mt-xs    { margin-top: var(--spacing-xs); }
.mt-sm    { margin-top: var(--spacing-sm); }
.mt-md    { margin-top: var(--spacing-md); }
.mt-lg    { margin-top: var(--spacing-lg); }
.mt-xl    { margin-top: var(--spacing-xl); }
.mt-2xl   { margin-top: var(--spacing-2xl); }
.mt-3xl   { margin-top: var(--spacing-3xl); }
.mt-4xl   { margin-top: var(--spacing-4xl); }
.mt-5xl   { margin-top: var(--spacing-5xl); }

.mb-xs    { margin-bottom: var(--spacing-xs); }
.mb-sm    { margin-bottom: var(--spacing-sm); }
.mb-md    { margin-bottom: var(--spacing-md); }
.mb-lg    { margin-bottom: var(--spacing-lg); }
.mb-xl    { margin-bottom: var(--spacing-xl); }
.mb-2xl   { margin-bottom: var(--spacing-2xl); }
.mb-3xl   { margin-bottom: var(--spacing-3xl); }
.mb-4xl   { margin-bottom: var(--spacing-4xl); }
```

---

## Classes de Tipografia (CSS reuse)

```css
/* Typography - já existem em global.css */
.display-xxxl { font: var(--font-display-xxxl); }
.display-xxl  { font: var(--font-display-xxl); }
.display-xl  { font: var(--font-display-xl); }
.display-lg  { font: var(--font-display-lg); }
.display-md  { font: var(--font-display-md); }

.t-white      { color: var(--typography-white); }
.t-gray-100  { color: var(--typography-gray-100); }
.t-gray-200  { color: var(--typography-gray-200); }
.t-gray-300  { color: var(--typography-gray-300); }
.t-green-light { color: var(--typography-green-light); }

.body-large  { font: var(--font-body-large); }
.body-medium { font: var(--font-body-medium); }
.body-small  { font: var(--font-body-small); }

.t-semibold { font-weight: 600; }
.t-bold    { font-weight: 700; }
.t-upper   { text-transform: uppercase; }
.t-ct      { text-align: center; }
```

---

## Componentes Shell (head + navbar + footer)

O renderer NÃO gera esses elementos. Eles são injetados pelo template da página:

```html
<!-- src/pages/template.html -->
<head>
  <!-- CSS links -->
  <link rel="stylesheet" href="../styles/global.css" />
  <link rel="stylesheet" href="../styles/reset.css" />
  <link rel="stylesheet" href="../styles/main.css" />
</head>
<body class="{{bodyClass}}">
  <include src="components/email-dialog.html"></include>
  <include src="components/navbar.html"></include>
  
  <!-- RENDERED CONTENT -->
  {{content}}
  
  <include src="components/password-dialog.html"></include>
  <include src="components/footer.html"></include>
</body>
```

---

## Implementação: steps

### Step 1: Parser MDX → AST
Usar `remark-parse` + `remark-rehype` + `rehype-stringify`

### Step 2: Custom renderer para blocos
Converter nós MDXcustom para classes CSS

### Step 3: Injeção de frontmatter
Gerar `<h1>`, tags, featured image baseado em frontmatter

### Step 4: Output HTML
Retornar HTML com classes de espaçamento

---

## Interface de Uso

```typescript
import { renderDocument } from '@portfolio-os/core/renderer'

const html = await renderDocument({
  type: 'work',
  file: 'work/farfetch-performance.md',
  content: readFileSync(...),
})

// html = string com todo o article-content
//ready para injetar no template
```

---

## Critérios de Aceite

- [ ] Preview e site público usam o mesmo renderer
- [ ] Não existe implementação paralela
- [ ] Saída HTML estruturalmente equivalente

---

*Renderer compartilhado - Task 6*
*Pertence ao plano: portfolio-os-integration.md*
*Definido em: 2026-04-17*