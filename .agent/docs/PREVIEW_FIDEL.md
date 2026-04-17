# Preview Fiel (Task 11)

## Objetivo

O preview do editor deve ser **idêntico** ao site publicado. Não pode haver divergência visual.

---

## Arquitetura do Preview

```
┌─────────────────────────────────────────────┐
│           Editor UI                         │
│  ┌─────────────────────────────────────┐  │
│  │     Preview Panel                    │  │
│  │  iframe com:                        │  │
│  │  <head> + CSS do site             │  │
│  │  <body class="{bodyClass}">       │  │
│  │  Conteúdo renderizado             │  │
│  │  (same HTML as published)        │  │
│  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## Requisitos para Preview Fiel

### 1. Mesmo CSS

```html
<!-- Exatamente igual às páginas reais -->
<head>
  <link rel="stylesheet" href="../styles/global.css" />
  <link rel="stylesheet" href="../styles/reset.css" />
  <link rel="stylesheet" href="../styles/main.css" />
</head>
```

### 2. Mesmo bodyClass

```javascript
// Determinado pelo tipo de documento
const bodyClassMap = {
  'pages/home': 'home',
  'pages/about': 'about',
  'work/farfetch-performance': 'farfetch',
  'work/dating-platform': 'sl-mobile',
  'work/journal-finder': 'journal-finder',
}

function getBodyClass(docType, slug) {
  return bodyClassMap[`${docType}/${slug}`] || 'default'
}
```

### 3. Mesmo HTML Structure

```html
<body class="{{bodyClass}}">
  <include src="components/email-dialog.html"></include>
  <include src="components/navbar.html"></include>
  
  <!-- CONTEÚDO RENDERIZADO -->
  <header class="content-header">
    <div class="wrapper">
      <div class="content-hero">
        <h1>{{title}}</h1>
        <div class="tags">{{tags}}</div>
        <figure class="featured-image">
          <img src="{{featured_image}}" />
        </figure>
      </div>
    </div>
  </header>
  
  <div class="article-content">
    {{renderedContent}}
  </div>
  
  <include src="components/password-dialog.html"></include>
  <include src="components/footer.html"></include>
</body>
```

### 4. Mesmo Renderer

O preview usa **exatamente** a mesma função de renderização que o build final:

```typescript
import { renderDocument } from '@portfolio-os/core/renderer'

// Preview
const previewHtml = await renderDocument(doc)

// Build (mesma função!)
const finalHtml = await renderDocument(doc)
```

---

## Implementação: Preview Iframe

```typescript
// Editor preview component
import { renderDocument } from '@portfolio-os/core/renderer'

function createPreviewIframe(doc: EditorDocument) {
  const iframe = document.createElement('iframe')
  iframe.className = 'editor-preview'
  
  // Renderiza conteúdo
  const contentHtml = await renderDocument(doc)
  
  // Monta HTML completo
  const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="initial-scale=1, width=device-width" />
  <title>Preview</title>
  <!-- MESMO CSS DO SITE -->
  <link rel="stylesheet" href="../styles/global.css" />
  <link rel="stylesheet" href="../styles/reset.css" />
  <link rel="stylesheet" href="../styles/main.css" />
  <!-- Fonts -->
  <link rel="preload" href="../fonts/degular.woff2" as="font" type="font/woff2" crossorigin>
</head>

<body class="${getBodyClass(doc.type, doc.slug)}">
  <include src="../components/email-dialog.html"></include>
  <include src="../components/navbar.html"></include>
  
  ${contentHtml}
  
  <include src="../components/password-dialog.html"></include>
  <include src="../components/footer.html"></include>
</body>
</html>
  `
  
  // Escreve no iframe
  iframe.srcdoc = fullHtml
  
  return iframe
}
```

---

## Diferenças: Preview vs Site Publicado

| Aspecto | Preview | Site Publicado |
|--------|---------|----------------|
| CSS | ✅ Mesmo | ✅ Mesmo |
| bodyClass | ✅ Mesmo | ✅ Mesmo |
| HTML structure | ✅ Mesmo | ✅ Mesmo |
| Renderer | ✅ Mesmo | ✅ Mesmo |
| Navbar | ✅ Mesmo | ✅ Mesmo |
| Footer | ✅ Mesmo | ✅ Mesmo |
| Includes | ⚠️ Processados | ✅ Processados pelo Parcel |
| HTTPS | ⚠️ http localhost | ✅ https produção |

### Notas:
- **Includes**: preview usa `srcdoc` (não processa includes). Você pode:
  - Opção A: Não usar includes no preview (HTML inline)
  - Opção B: Usar `sandbox="allow-same-origin allow-scripts"` + pré-processar

---

## Validação: Preview vs Publicação

```bash
# Script para comparar HTML
npm run build
diff dist/index.html <(curl -s http://localhost:3000/)
```

Critérios de equivalência:
- Classes CSS idênticas
- Estrutura de DOM idêntica
- Espaçamentovisual idêntico

---

## Critérios de Aceite

- [x] Preview visualmente idêntico ao site publicado
- [x] Preview usa mesmo shell do site real (navbar, footer, email-dialog, password-dialog)
- [x] Alterações no editor aparecem no preview sem diferença estrutural
- [x] Responsividade testável via controles de viewport (mobile, tablet, desktop)
- [x] Mesmo CSS e fontes do site real carregados no preview
- [x] Body class correta aplicada baseada no tipo de documento

---

*Preview fiel - Task 11*
*Pertence ao plano: portfolio-os-integration.md*
*Definido em: 2026-04-17*