# Migração de Conteúdo (Task 5)

## Status

Arquivos MDX criados em `content/`:
- `pages/home.md`
- `pages/about.md`
- `work/farfetch-performance.md`
- `work/dating-platform.md`
- `work/journal-finder.md` (protegido)

---

## Estrutura Criada

```
content/
├── pages/
│   ├── home.md              # Hero + projects grid
│   └── about.md            # Bio + experiência + skills + testimonials
└── work/
    ├── farfetch-performance.md
    ├── dating-platform.md
    └── journal-finder.md
```

---

## Conversão Aplicada

### HTML → MDX

| Padrão HTML | Output MDX |
|-----------|------------|
| `<h1 class="t-gray-200">` | `# Title` |
| `<h2 class="mt-5xl">` | `## Title` |
| `<h3 class="mt-3xl">` | `### Title` |
| `<p class="mt-md">` | Parágrafo com newline |
| `<strong>` | `**bold**` |
| `<ul class="ul">` | `- ` bullet |
| `<li class="li mt-sm">` | `- ` item |
| `<img src="...">` | `![Alt](path)` |
| `<figure>...</figure>` | Imagem com caption como nota |
| `<div class="text-block">` | Seção com `---` separator |
| `<div class="executive-summary">` | Seção com `## Executive Summary` |
| `<div class="featured-metrics">` | `### Achievements` section |

---

## Frontmatter Extraído

Cada documento ganhou frontmatter com:

- `title`: Título da página
- `slug`: Identificador único
- `type`: `"page"` ou `"work"`
- `status`: `"published"` | `"draft"` | `"protected"`
- `description`: Meta description
- `tags`: Lista de habilidades (work only)
- `order`: Ordem de exibição
- `featured_image`: Caminho da imagem principal
- `og_image`: Caminho para Open Graph
- `protected_password`: Hash (se protected) ou null
- `created_at`: Data ISO
- `updated_at`: Data ISO

---

## Caminhos de Imagem Corrigidos

| Original (HTML) | Novo (MDX) |
|-----------------|-----------|
| `../images/...` | `../images/...` |
| `../../public/...` | Manter caminho relatif |

Os caminhos relatif são mantidos - o renderer resolverá para o path correto.

---

## Limites da Migração

### Preservado no Formato Original

Os arquivos MDX contém **conteúdo editável**. O **shell** permanece em:

- Arquivos `.html` originals em `src/pages/`
- CSS em `src/styles/`
- Componentes em `src/components/`

### Não Migrado (Shell)

- `design-system.html` - página de referência
- `buttons.html` - página de referência
- `homepage_evaluation.html` - utilitário
- `Lighthouse-report.html` - utilitário

---

## Script de Conversão (para referência futura)

```javascript
// scripts/migrate-html-to-mdx.js
// Este script pode ser usado para futuras migrações
import fs from 'fs/promises'
import path from 'path'

const CONTENT_DIR = 'content'

// Regex patterns para conversão
const patterns = [
  { regex: /<h1[^>]*>(.*?)<\/h1>/gi, replace: '# $1\n\n' },
  { regex: /<h2[^>]*>(.*?)<\/h2>/gi, replace: '## $1\n\n' },
  { regex: /<h3[^>]*>(.*?)<\/h3>/gi, replace: '### $1\n\n' },
  { regex: /<p[^>]*>(.*?)<\/p>/gi, replace: '$1\n\n' },
  { regex: /<strong>(.*?)<\/strong>/gi, replace: '**$1**' },
  { regex: /<ul[^>]*>/gi, replace: '' },
  { regex: /<\/ul>/gi, replace: '\n' },
  { regex: /<li[^>]*>(.*?)<\/li>/gi, replace: '- $1\n' },
  { regex: /<img src="([^"]+)"[^>]*>/gi, replace: '![Image]($1)' },
  { regex: /<figure>.*?<img src="([^"]+)".*?alt="([^"]*)".*?<\/figure>/gi, replace: '![$2]($1)\n' },
]

async function convertHtmlToMdx(htmlContent) {
  let mdx = htmlContent
  for (const { regex, replace } of patterns) {
    mdx = mdx.replace(regex, replace)
  }
  return mdx
}

// Uso:
// const html = await fs.readFile('src/pages/case.html', 'utf-8')
// const mdx = await convertHtmlToMdx(html)
// await fs.writeFile('content/work/case.md', mdx, 'utf-8')
```

---

## Validação

Para validar a migração:

```bash
# Listar arquivos criados
ls -la content/pages/
ls -la content/work/

# Verificar frontmatter
head -20 content/work/farfetch-performance.md

# Verificar que MDX é válido (parse)
node -e "
import { parseFrontmatter } from '@portfolio-os/core'
const fs = await import('fs/promises')
const content = await fs.readFile('content/work/farfetch-performance.md', 'utf-8')
console.log(parseFrontmatter(content))
"
```

---

## Próximos Passos

1. **Converter para HTML final** - usar renderer para gerar HTML das páginas
2. **Testar rotas** - garantir que `/work/farfetch-performance` carrega
3. **Validar imagens** - verificar que todos os caminhos de imagem resolvem

---

*Migração de conteúdo - Task 5*
*Executado em: 2026-04-17*
*Pertence ao plano: portfolio-os-integration.md*