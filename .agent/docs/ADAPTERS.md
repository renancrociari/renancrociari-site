# Adapters de Leitura e Escrita (Tasks 8-9)

## 1. Adapter de Leitura (Task 8)

### Interface: ContentLoader

```typescript
import { createContentLoader } from '@portfolio-os/core'

const loader = createContentLoader({
  contentDir: 'content',
  publicDir: 'public',
  baseUrl: '/',
})

// Listar documentos
const docs = loader.listDocuments('work')
// [{ slug: 'farfetch-performance', title: '...', status: 'published', ... }]

// Ler documento por slug
const doc = await loader.loadDocument('work', 'farfetch-performance')
// { frontmatter: {...}, content: '...', html: '...' }

// Listar todos os docs (pages + work)
const all = loader.listAll()
```

### Implementação

```typescript
// Pseudo-implementation
import * as fs from 'fs/promises'
import * as path from 'path'
import parseFrontmatter from '@portfolio-os/core/parse-frontmatter'

export function createContentLoader(config) {
  const contentDir = path.resolve(process.cwd(), config.contentDir)
  
  async function listDocuments(type: 'page' | 'work') {
    const dir = path.join(contentDir, type === 'page' ? 'pages' : 'work')
    const files = await fs.readdir(dir)
    
    return files
      .filter(f => f.endsWith('.md'))
      .map(async f => {
        const raw = await fs.readFile(path.join(dir, f), 'utf-8')
        const { data } = parseFrontmatter(raw)
        return {
          slug: data.slug || f.replace('.md', ''),
          title: data.title,
          status: data.status,
          order: data.order,
          type,
          file: f,
        }
      })
  }
  
  async function loadDocument(type: 'page' | 'work', slug: string) {
    const dir = path.join(contentDir, type === 'page' ? 'pages' : 'work')
    const file = await fs.readFile(path.join(dir, `${slug}.md`), 'utf-8')
    const { data, content } = parseFrontmatter(file)
    
    return { frontmatter: data, content }
  }
  
  return { listDocuments, loadDocument }
}
```

---

## 2. Adapter de Escrita (Task 9)

### Interface: Mutations

```typescript
import { createMutations } from '@portfolio-os/editor/mutations'

const mutations = createMutations({
  contentDir: 'content',
  baseWriter: {
    write: (path, content) => fs.writeFile(path, content),
  },
})

// Atualizar documento
await mutations.updateDocument('work', 'farfetch-performance', {
  title: 'Novo título',
  content: '# Executive Summary\n\nNovo conteúdo...',
})

// Criar novo documento
await mutations.createDocument('work', {
  title: 'Novo Case',
  slug: 'novo-case',
  type: 'work',
  content: '# Novo\n\nConteúdo...',
})

// Excluir documento
await mutations.deleteDocument('work', 'slug-para-excluir')
```

---

## 3. Frontmatter Serialização

```typescript
// serializeFrontmatter(data: FrontmatterData, content: string) => string
import { serializeFrontmatter } from '@portfolio-os/core'

const full = serializeFrontmatter(
  {
    title: 'Improving the performance...',
    slug: 'farfetch-performance',
    type: 'work',
    status: 'published',
    description: 'At Farfetch...',
    tags: ['Product Strategy', 'User Research'],
    order: 1,
    featured_image: '../images/case-farfetch/ff-case-featured.webp',
    og_image: '../images/ff-case-og-image.jpg',
    protected_password: null,
    created_at: '2024-01-15',
    updated_at: '2024-06-20',
  },
  contentBody
)
// Retorna: full MDX file com frontmatter no topo
```

---

## 4. Resolução de Paths de Imagem

```typescript
// helpers para resolver caminhos relativos
import { rewriteRelativeImagePaths } from '@portfolio-os/core'

// Para display no editor (preview)
function resolveForEditor(imagePath: string, docPath: string): string {
  // "../images/case-farfetch/ff-case-featured.webp"
  // → "/images/case-farfetch/ff-case-featured.webp"
  return imagePath.replace(/^\.\.\//, '/')
}

// Para build final (mantém relativo para o MDX)
function resolveForBuild(imagePath: string): string {
  // Mantém como está
  return imagePath
}
```

---

## Critérios de Aceite

- [ ] Editor abre conteúdo real do repo
- [ ] Listagem reflete estado atual
- [ ] assets aparecem no preview
- [ ] Salvar altera arquivos corretos
- [ ] MDX continua válido após gravação

---

*Adapters - Tasks 8-9*
*Pertence ao plano: portfolio-os-integration.md*
*Definido em: 2026-04-17*