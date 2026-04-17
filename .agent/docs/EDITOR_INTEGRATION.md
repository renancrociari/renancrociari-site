# Integração do Editor (Task 10)

## Arquitetura

O editor do `portfolio-os` precisa conectar ao `renancrociari-site` via adapters que leem/gravam no repo original.

```
┌─────────────────────────────────────────────┐
│         Editor UI (portfolio-os)           │
│   React + Monaco + Block Registry          │
└─────────────────┬─────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│      Editor Adapters (site-specific)          │
│  • WorkAdapter → content/work/*.md         │
│  • PagesAdapter → content/pages/*.md      │
└─────────────────┬─────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│    API Server (renancrociari-site)         │
│  • GET/POST /api/editor/work              │
│  • GET/POST /api/editor/pages             │
│  • File system read/write                 │
└─────────────────────────────────────────────┘
```

---

## API Endpoints

### Work Collection

| Método | Endpoint | Ação |
|--------|----------|------|
| GET | `/api/editor/work` | Listar todos os work |
| GET | `/api/editor/work?id={slug}` | Carregar documento |
| POST | `/api/editor/work` | Criar/Atualizar |
| DELETE | `/api/editor/work?id={slug}` | Remover |

### Pages Collection

| Método | Endpoint | Ação |
|--------|----------|------|
| GET | `/api/editor/pages` | Listar todas as pages |
| GET | `/api/editor/pages?id={slug}` | Carregar documento |
| POST | `/api/editor/pages` | Criar/Atualizar |

---

## Implementação: API Server

```javascript
// scripts/editor-api.js
import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import { parseFrontmatter, serializeFrontmatter } from '@portfolio-os/core'

const app = express()
app.use(express.json({ limit: '10mb' }))

const CONTENT_DIR = path.join(process.cwd(), 'content')

// Helper: list documents
async function listDocuments(collection) {
  const dir = path.join(CONTENT_DIR, collection)
  const files = await fs.readdir(dir)
  
  return Promise.all(
    files
      .filter(f => f.endsWith('.md'))
      .map(async f => {
        const raw = await fs.readFile(path.join(dir, f), 'utf-8')
        const { data } = parseFrontmatter(raw)
        return {
          id: data.slug || f.replace('.md', ''),
          slug: data.slug || f.replace('.md', ''),
          title: data.title,
          published: data.status === 'published',
          order: data.order,
        }
      })
  )
}

// GET /api/editor/work
app.get('/api/editor/work', async (req, res) => {
  const docs = await listDocuments('work')
  res.json({ entries: docs })
})

// GET /api/editor/work?id={slug}
app.get('/api/editor/work', async (req, res) => {
  const { id } = req.query
  const file = path.join(CONTENT_DIR, 'work', `${id}.md`)
  const raw = await fs.readFile(file, 'utf-8')
  const { data, content } = parseFrontmatter(raw)
  
  res.json({
    metadata: data,
    content: content,
    slug: data.slug,
    status: data.status,
  })
})

// POST /api/editor/work
app.post('/api/editor/work', async (req, res) => {
  const { id, metadata, content } = req.body
  const file = path.join(CONTENT_DIR, 'work', `${id}.md`)
  
  const full = serializeFrontmatter(metadata, content)
  await fs.writeFile(file, full, 'utf-8')
  
  res.json({ success: true })
})

// GET /api/editor/pages (same pattern)
app.get('/api/editor/pages', async (req, res) => {
  const docs = await listDocuments('pages')
  res.json({ entries: docs })
})

app.listen(3456, () => {
  console.log('Editor API running on http://localhost:3456')
})
```

---

## Editor Configuration no Site

```javascript
// src/editor-config.js
import { createEditorAdapterBundle } from '@portfolio-os/editor/adapters'

export const editorConfig = {
  // adapters para work e pages
  adapters: createEditorAdapterBundle({
    work: {
      apiBasePath: '/api/editor/work',
    },
    pages: {
      apiBasePath: '/api/editor/pages',
    },
  }),
  
  // Configurações de preview
  preview: {
    baseUrl: '/',
    styles: [
      '/styles/global.css',
      '/styles/reset.css',
      '/styles/main.css',
    ],
  },
  
  // Blocos disponíveis
  blocks: {
    work: ['ProcessTimeline', 'ImpactResults', 'GalleryGrid', 'PullQuote', 'Callout', 'Figure', 'VideoEmbed'],
    page: ['PullQuote', 'Callout', 'Figure'],
  },
}
```

---

## Carregar Editor na Página

```html
<!-- src/pages/editor.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Editor · Renan Crociari</title>
  <link rel="stylesheet" href="../styles/global.css" />
  <link rel="stylesheet" href="../styles/reset.css" />
  <link rel="stylesheet" href="../styles/main.css" />
  <!-- Editor styles -->
  <link rel="stylesheet" href="@portfolio-os/editor/styles" />
</head>
<body class="editor">
  <div id="editor-root"></div>
  
  <script type="module" src="../scripts/editor.tsx"></script>
</body>
</html>
```

```typescript
// src/scripts/editor.tsx
import { createEditor } from '@portfolio-os/editor'
import { editorConfig } from '../editor-config'

const editor = createEditor({
  ...editorConfig,
  root: document.getElementById('editor-root'),
})

editor.mount()
```

---

## Fluxo: Abrir Documento

1. Usuário acessa `/editor`
2. Editor carrega adapters (work + pages)
3. Lista documentos disponíveis
4. Usuário seleciona documento
5. Adapter carrega via API (`GET /api/editor/work?id={slug}`)
6. Editor exibe frontmatter + conteúdo MDX
7. Preview renderiza o HTML

---

## Fluxo: Salvar Documento

1. Usuário edita conteúdo
2. Clica "Salvar"
3. Editor chama `adapter.saveDocument(slug, metadata, content)`
4. API recebe `POST /api/editor/work`
5..Serializa frontmatter + conteúdo
6. Grava em `content/work/{slug}.md`
7. Editor mostra "Salvo com sucesso"

---

## Critérios de Aceite

- [ ] Editor consegue abrir conteúdo real do site
- [ ] Salvar altera arquivos corretos do repo
- [ ] Navegação do editor reflete conteúdo do repo

---

*Integração do editor - Task 10*
*Pertence ao plano: portfolio-os-integration.md*
*Definido em: 2026-04-17*