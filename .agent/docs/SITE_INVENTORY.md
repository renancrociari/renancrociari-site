# Inventário do Site Atual (Task 2)

## Visão Geral

| Métrica | Valor |
|--------|-------|
| Páginas HTML | 13 |
| Componentes reutilizáveis | 4 |
| Arquivos CSS | 3 |
| Imagens/assets | ~70 |

---

## 1. Páginas HTML (`src/pages/*.html`)

### 1.1 Páginas Públicas

| Arquivo | Rota | Tipo | Protegida | Conteúdo Principal |
|--------|-----|-----|---------|----------------|
| `index.html` | `/` | **page** | Não | Home: hero, projects grid |
| `about.html` | `/about` | **page** | Não | Bio, experiência, skills, testimonials |
| `design-system.html` | `/design-system` | **page** | Não | Design system (referência) |
| `homepage_evaluation.html` | `/homepage_evaluation` | **page** | Não | Avaliação Homepage |
| `Lighthouse-report.html` | `/Lighthouse-report` | **page** | Não | Relatório Lighthouse |
| `buttons.html` | `/buttons` | **page** | Não | Botões (referência) |
| `editor.html` | `/editor` | **page** | Não | Editor de conteúdo |

### 1.2 Case Studies (Work)

| Arquivo | Rota | Tipo | Protegida | Status |
|--------|-----|-----|---------|--------|
| `improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands.html` | `/improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands` | **work** | Não | Público |
| `redesigning-the-mobile-experience-of-a-dating-platform.html` | `/redesigning-the-mobile-experience-of-a-dating-platform` | **work** | Não | Público |
| `connecting-every-discovery-with-a-worthy-home.html` | `/connecting-every-discovery-with-a-worthy-home` | **work** | **Sim** (password) | Protegido |

---

## 2. Componentes Reutilizáveis (`src/components/*.html`)

| Arquivo | Descrição | usa `include` |
|--------|----------|--------------|
| `navbar.html` | Navegação principal (aberta/fechar) | Não |
| `footer.html` | Footer com links sociais | Não |
| `email-dialog.html` | Modal para revelar email | Sim (index, about) |
| `password-dialog.html` | Modal de senha para conteúdo protegido | Sim (index, case protected) |

---

## 3. Estrutura de Conteúdo (Separando Shell de Editável)

### 3.1 Shell Visual (FIXO - não editável)

- Layout base: `<head>`, `<body class="">` (todas as páginas)
- CSS: `global.css`, `reset.css`, `main.css`
- Componentes: `navbar.html`, `footer.html`
- Tipografia + design tokens no CSS

### 3.2 Conteúdo Editável por Página

#### INDEX (`index.html`)

| Sección | Tipo | Editável? |
|---------|------|----------|
| Hero headline (`<h1 class="hero">`) | Texto | **Sim** |
| Hero subtext (bio) | Texto | **Sim** |
| Project cards (4 items) | Lista de **work** | **Sim** |
| Nav links | Fixo | Não |
| Footer links | Fixo | Não |

**Contrato proposto:** cada project card referencia um `work` por slug.

#### ABOUT (`about.html`)

| Sección | Tipo | Editável? |
|---------|------|----------|
| Hero headline | Texto | **Sim** |
| Featured image | Asset path | **Parcial** |
| Bio text (`<div class="text-block">`) | Texto longo | **Sim** |
| Experience list (`<details>`) | Lista estruturada | **Sim** |
| Skills (`<div class="tag-list">`) | Lista de tags | **Sim** |
| Testimonials | Lista | **Sim** |

**Contrato proposto:** `pages/about.md` com frontmatter para metadata.

#### CASE STUDIES (`*.html` em `/pages`)

| Sección | Tipo | Editável? |
|---------|------|----------|
| Title + meta (head) | Texto | **Sim** |
| Hero headline | Texto | **Sim** |
| Tags (skills) | Lista | **Sim** |
| Featured image | Asset path | **Parcial** |
| Executive summary | Bloco estruturado | **Sim** |
| Body content | MDX/HTML | **Sim** |
| Métricas | Bloco estruturado | **Sim** |
| Inline images | Asset paths | **Parcial** |

**Contrato proposto:** cada case study = `work/{slug}.md` com frontmatter + corpo MDX.

---

## 4. Assets (`src/images/`)

### 4.1 Estrutura de Pastas

| Pasta | Conteúdo | Usado por |
|-------|----------|----------|
| `/` | Logotipos, fotos perfil, icons | Global |
| `/icons/` | Social icons (linkedin, medium, dribbble) | Navbar, Footer |
| `/case-farfetch/` | Imagens do case Farfetch | Case study |
| `/case-sl-mobile/` | Imagens do case dating | Case study |
| `/case-journal-finder/` | Imagens do case journal | Case study (protegido) |

### 4.2 Imagens Globais

```
renan-profile.webp       → About page (perfil)
img-renan.webp          → About (featured)
sara-picture.webp      → About (testimonial)
leandro-picture.webp   → About (testimonial)
felipe-picture.webp    → About (testimonial)
cinthia-picture.webp   → About (testimonial)
springernature-logo.svg → About (experience)
farfetch-logo.svg      → About (experience)
esapiens-logo.svg      → About (experience)
triata-logo.svg        → About (experience)
```

### 4.3 Caminhos de Imagem

- **Regra atual:** caminhos relativos da página (`../images/` ou `../../public/`)
- **Para MDX:** manter caminhos relativos, resolver na renderização

---

## 5. Navegação e Rotas

### 5.1 Rotas Atuais

| Rota | Arquivo |
|-----|---------|
| `/` | `index.html` |
| `/about` | `about.html` |
| `/design-system` | `design-system.html` |
| `/buttons` | `buttons.html` |
| `/editor` | `editor.html` |
| `/homepage_evaluation` | `homepage_evaluation.html` |
| `/Lighthouse-report` | `Lighthouse-report.html` |
| `/improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands` | ... |
| `/redesigning-the-mobile-experience-of-a-dating-platform` | ... |
| `/connecting-every-discovery-with-a-worthy-home` | ... (protegido) |

### 5.2 Navegação Global

- **Navbar:** Home, About, Resumé (PDF), LinkedIn, Email
- **Footer:** Home, About, Resumé (PDF), LinkedIn, Email
- **Links externos:** LinkedIn, Medium, Dribbble (ocultos atualmente)

---

## 6. Categorização para o Contrato Editorial

### Proposta: `pages/` vs `work/`

| Tipo | Origem | Destino no Contrato |
|------|-------|-------------------|
| Home page especial | `index.html` (partial hero + projects) | `pages/home.md` |
| About page | `about.html` | `pages/about.md` |
| Páginas utilitárias | `design-system.html`, `buttons.html`, etc. | Ignorar ou `pages/_system/*.md` |
| Case studies | `improving-the-performance-of-farfetchs...html` | `work/farfetch-performance.md` |
| Case studies | `redesigning-the-mobile-experience-of-a-dating-platform.html` | `work/dating-platform.md` |
| Case studies | `connecting-every-discovery-with-a-worthy-home.html` | `work/journal-finder.md` (protegido) |

### Proposta: Frontmatter Canónico

```yaml
---
title: "Improving the performance of Farfetch's top fashion eCommerce brands"
slug: "farfetch-performance"
type: "work"
status: "published"  # published | draft | protected
description: "At Farfetch, I led design efforts to optimize e-commerce performance..."
tags:
  - Product Strategy
  - User Research
  - Conversion Rate Optimization
  - Data Analysis
  - UI Design
  - Product Design
  - Usability Testing
featured_image: "../images/case-farfetch/ff-case-featured.webp"
og_image: "../images/ff-case-og-image.jpg"
protected_password: null  # null = público, string = hash da senha
order: 1
created_at: "2024-01-15"
updated_at: "2024-06-20"
---
```

---

## 7. Observações Importantes

1. **HTML com includes:** o Parcel processa `<include src="...">` em tempo de build
2. **Contraste de shell/conteúdo:** o shell é robusto (head, body class, CSS links); o conteúdo é texto puro interspersed
3. **Imagens inline nos cases:** hardcoded em `<img src="...">` - não componentes
4. **Proteção por senha:** usa `password-dialog.html` com data attributes para ativar
5. **Case protegido:** "Connecting every discovery..." usa botão que abre dialog, não rota protegida

---

## 8. Próximos Passos (Task 3 - Contrato de Conteúdo)

- [ ] Definir schema canónico para `pages/` e `work/`
- [ ] Mapear frontmatter (title, slug, status, order, tags, images, protected)
- [ ] Definir política de caminhos de imagem
- [ ] Validar migração de conteúdo existente para MDX

---

*Inventário gerado em: 2026-04-17*
*Pertence à Task 2 do plano: portfolio-os-integration.md*