# Operacional - Como Rodar o Projeto

## Quick Start (5 minutos)

```bash
git clone git@github.com:renancrociari/renancrociari-site.git
cd renancrociari-site
npm install
npm run dev
```

**Resultado:**
- Site: http://localhost:1234
- API: http://localhost:3001
- Editor: http://localhost:1234/editor.html

---

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia Parcel + API (ambos) |
| `npm run dev:generated` | Apenas MDX gerado |
| `npm run build` | Build completo (MDX + assets) |
| `npm run build:legacy` | Build original (sem MDX) |
| `npm run build:content` | Só converte MDX → HTML |

---

## Editar Conteúdo

1. Abrir http://localhost:1234/editor.html
2. Selecionar documento em `work/` ou `pages/`
3. Editar frontmatter ou MDX
4. Salvar

O preview atualiza em tempo real.

---

## Criar Novo Case

```bash
# 1. Arquivo
touch content/work/novo-case.md

# 2. Frontmatter
---
title: "Nome do Case"
slug: "novo-case"
type: "work"
status: "published"
description: "Descrição SEO"
tags:
  - UX Research
order: 4
featured_image: "../images/case/featured.webp"
og_image: "../images/case-og.jpg"
protected_password: null
created_at: "2024-01-01"
updated_at: "2024-01-01"
---

# Executive Summary

## My role
...

# Solution
```

```bash
# 3. Build
npm run build:content
```

Output: `src/pages-generated/novo-case.html`

---

## Criar Nova Página

```bash
touch content/pages/contato.md
```

Mesma estrutura, mas `type: "page"`.

---

## Deploy

```bash
npm run build
git add dist/
git commit -m "build: atualiza site"
git push
```

---

## Estrutura

```
renancrociari-site/
├── content/
│   ├── pages/      # Páginas editáveis
│   └── work/       # Cases editáveis
├── src/
│   ├── pages/         # HTML original
│   ├── pages-generated/  # MDX → HTML
│   ├── components/    # Navbar, footer
│   └── styles/       # CSS do site
├── scripts/content/ # Converte MDX
└── dist/           # Output
```

---

## Troubleshooting

| Problema | Solução |
|---------|--------|
| Imagem não carrega | Verificar caminho em `featured_image` |
| Build falha | `npm run build:legacy` |
| Preview diferente | Limpar cache do browser |
| Editor não abre | Verificar porta 3001 (`npm run dev:api`) |

---

## Referências

- Schema de conteúdo: `.agent/docs/CONTENT_CONTRACT.md`
- Build: `.agent/docs/BUILD.md`
- Rotas: `.agent/docs/ROUTING.md`
- Segurança: `.agent/docs/SECURITY.md`

---

*Atualizado: 2026-04-17*