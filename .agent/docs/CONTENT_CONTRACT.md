# Contrato de Conteúdo (Task 3)

## Schema Canónico

### Tipo: `page`

```yaml
---
title: "About Me"
slug: "about"
type: "page"
status: "published"
description: "15+ years of experience in ideating, crafting, and leading digital experiences..."
order: 1
featured_image: "../images/img-renan.webp"
og_image: "../images/renan-og-image.jpg"
created_at: "2024-01-01"
updated_at: "2024-06-20"
---

# Bio

With over 15 years of experience as an **end-to-end Product Designer**...
```

### Tipo: `work`

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
order: 1
featured_image: "../images/case-farfetch/ff-case-featured.webp"
og_image: "../images/ff-case-og-image.jpg"
protected_password: null  # null = público, string = hash BCrypt
created_at: "2024-01-15"
updated_at: "2024-06-20"
---

# Executive Summary

## The company

Farfetch is a global leader...

## My role

As the first Product Designer...

## The problem

We collaborated with more than 12 fashion brands...
```

---

## Estrutura de Arquivos

```
content/
├── pages/
│   ├── home.md          #-index.html hero + projects grid
│   └── about.md        # about.html completo
└── work/
    ├── farfetch-performance.md
    ├── dating-platform.md
    └── journal-finder.md
```

---

## Campos Obrigatórios

| Campo | Tipo | Descrição |
|-------|------|----------|
| `title` | string | Título visível |
| `slug` | string | Identificador único (URL-safe) |
| `type` | `"page"` \| `"work"` | Tipo de documento |
| `status` | `"published"` \| `"draft"` \| `"protected"` | Estado editorial |
| `description` | string | Meta description (SEO) |
| `order` | number | Ordem de exibição |
| `featured_image` | string | Caminho relativo da imagem principal |
| `og_image` | string | Caminho para Open Graph |
| `protected_password` | string \| null | Hash da senha (se protected) |
| `created_at` | ISO date | Data de criação |
| `updated_at` | ISO date | Data de atualização |

---

## Campos Opcionais

| Campo | Tipo | Descrição |
|-------|------|----------|
| `tags` | string[] | Tags/skills (para work) |
| `password_hint` | string | Hint para lembrete de senha |

---

## Caminhos de Imagem

- **Regra:** sempre caminhos relativos ao arquivo MDX
- **Exemplo:** `../images/case-farfetch/ff-case-featured.webp`
- **Preview:** o renderer resolve para o caminho correto no contexto

---

## Políticas

### 1. Slug Reservados

```typescript
const RESERVED = ['admin', 'api', 'editor', 'downloads', 'images', 'styles', 'scripts']
```

### 2. Status

| Status | Pública? | Editável? | Visível no site |
|-------|----------|----------|----------------|
| `published` | Sim | Sim | Sim |
| `draft` | Não | Sim | Não |
| `protected` | Sim (com senha) | Sim | Sim |

### 3. Imagens

- Apenas caminhos relativos allowed
- Não permite `http://` ou `https://`
- Validação em tempo de parse

---

## Mapeamento do Conteúdo Atual

### `pages/` existentes

| Origem (HTML) | Destino (MDX) |
|--------------|---------------|
| `index.html` hero section | `pages/home.md` |
| `about.html` | `pages/about.md` |

### `work/` existentes

| Origem (HTML) | Destino (MDX) | Status |
|--------------|---------------|--------|
| improving-the-performance-of-farfetchs... | `work/farfetch-performance.md` | published |
| redesigning-the-mobile-experience-of-a-dating-platform | `work/dating-platform.md` | published |
| connecting-every-discovery-with-a-worthy-home | `work/journal-finder.md` | **protected** |

---

## Critérios de Aceite

- [ ] Schema único para `pages` e `work`
- [ ] Conteúdo atual pode ser convertido sem ambiguidade
- [ ] Caminhos de imagem continuam válidos
- [ ] Slugs não conflitam com rotas do sistema

---

*Contrato definido em: 2026-04-17*
*Pertence à Task 3 do plano: portfolio-os-integration.md*