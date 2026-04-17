# Rotas e Navegação (Task 13)

## Mapa de Rotas Atual → Nova

### Páginas Públicas (type: page)

|Rota Atual|Arquivo Original|Conteúdo MDX|Nova Rota|Status|
|----------|--------------|------------|---------|------|
| `/` (index) | `index.html` | `pages/home.md` | `/` (gerado) | ✅ Manter |
| `/about` | `about.html` | `pages/about.md` | `/about` | ✅ Manter |
| `/design-system` | `design-system.html` | — | `/design-system` | Mantém legacy |
| `/buttons` | `buttons.html` | — | `/buttons` | Mantém legacy |

### Work (type: work)

|Rota Atual|Arquivo Original|Conteúdo MDX|Nova Rota|Status|
|----------|--------------|------------|---------|------|
| `/improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands` | ...html | `work/farfetch-performance.md` | `/farfetch-performance` | ✅ Manter |
| `/redesigning-the-mobile-experience-of-a-dating-platform` | ...html | `work/dating-platform.md` | `/dating-platform` | ✅ Manter |
| `/connecting-every-discovery-with-a-worthy-home` | ...html | `work/journal-finder.md` | `/journal-finder` | ✅ (protegido) |

### Utilitários

|Rota|Arquivo|Status|
|-----|-------|------|
| `/editor` | `editor.html` | Mantém |
| `/homepage_evaluation` | `homepage_evaluation.html` | Mantém legacy |
| `/Lighthouse-report` | `Lighthouse-report.html` | Mantém legacy |

---

## Mapeamento: Slug → HTML

O build script gera:

```
content/pages/home.md      → src/pages-generated/index.html
content/pages/about.md     → src/pages-generated/about.html

content/work/farfetch-performance.md    → src/pages-generated/farfetch-performance.html
content/work/dating-platform.md      → src/pages-generated/dating-platform.html
content/work/journal-finder.md   → src/pages-generated/journal-finder.html
```

---

## Rotas Protegidas

O caso `journal-finder` tem `protected_password` no frontmatter:

```yaml
---
title: "Connecting every discovery with a worthy home"
slug: "journal-finder"
type: "work"
status: "protected"
protected_password: "$2b$10$..."  # BCrypt hash
---
```

### Proteção por Senha (implementação)

1. **Frontmatter** guarda hash BCrypt
2. **Build** gera HTML sem proteção (conteúdo inline)
3. **Runtime** (JavaScript) verifica:

```javascript
// src/scripts/password-protection.js
async function checkPassword(input, hash) {
  const bcrypt = await import('bcryptjs')
  return bcrypt.compare(input, hash)
}

// No diálogo:
const input = document.getElementById('password-input').value
const hash = document.body.dataset.protectedPassword

if (await checkPassword(input, hash)) {
  localStorage.setItem('journal-finder-unlocked', 'true')
  window.location.reload()
} else {
  showError()
}
```

---

## Navegação Global (Navbar)

O navbar atual permanece em `src/components/navbar.html`:

```html
<ul class="main-nav-list-items">
  <li><a href="/">Home</a></li>
  <li><a href="about">About</a></li>
  <li><a href="/public/downloads/renancrociari-cv.pdf" target="_blank">Resumé</a></li>
  <li><a href="https://www.linkedin.com/in/renancrociari/" target="_blank">LinkedIn</a></li>
  <li><button class="btn-show-email">Email</button></li>
</ul>
```

**Não muda** - links são estáticos.

---

## Navegação: Projects na Home

O `index.html` redireciona projects para rotas de work:

```html
<!-- Links existentes - apenas referenciam a rota -->
<a href="improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands">
  See case study
</a>
```

Após migração, será:

```html
<a href="farfetch-performance">See case study</a>
```

---

## Breadcrumbs

Para páginas de work:

```html
<nav aria-label="Breadcrumb" class="breadcrumb">
  <a href="/">Home</a>
  <span>/</span>
  <span>Farfetch Performance</span>
</nav>
```

---

## Fallback e 404

| Cenário | Handling |
|--------|---------|
| Rota inexistente | `dist/404.html` |
| `/work/{slug}` não existe | Redirect para home |
| MDX inválido | Redirect para home |

O Parcel já gera `404.html` se existir.

---

## Rotas no Config do Editor

```javascript
// src/editor-config.js
export const routesConfig = {
  pages: [
    { slug: 'home', title: 'Home', file: 'pages/home.md' },
    { slug: 'about', title: 'About', file: 'pages/about.md' },
  ],
  work: [
    { slug: 'farfetch-performance', title: 'Farfetch Performance', file: 'work/farfetch-performance.md' },
    { slug: 'dating-platform', title: 'Dating Platform Redesign', file: 'work/dating-platform.md' },
    { slug: 'journal-finder', title: 'Journal Finder', protected: true, file: 'work/journal-finder.md' },
  ],
}
```

---

## Scripts: Verificar Rotas

```bash
# Verificar todas as rotas geradas
npm run build:content

# Listar output
ls -la src/pages-generated/

# Testar no browser
npm run dev:all
# → http://localhost:1234
# → http://localhost:1234/farfetch-performance
# → http://localhost:1234/about
```

---

## Critérios de Aceite

- [x] Rotas existentes continuam funcionando
- [x] Novas páginas publicadas aparecem nas rotas esperadas
- [x] Fallback/404 correto

---

*Rotas e navegação - Task 13*
*Pertence ao plano: portfolio-os-integration.md*
*Definido em: 2026-04-17*