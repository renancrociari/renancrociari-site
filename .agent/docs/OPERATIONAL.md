# Documentação Operacional (Task 16)

## Instalação do Workspace Local

```bash
# 1. Clone do repositório
git clone git@github.com:renancrociari/renancrociari-site.git
cd renancrociari-site

# 2. Instalar dependências
npm install

# 3. Workspace local já configurado (package.json)
# Verificar:
ls -la node_modules/@portfolio-os/
# → blocks -> ../../portfolio-main/packages/blocks
# → core -> ../../portfolio-main/packages/core
# → editor -> ../../portfolio-main/packages/editor
```

---

## Fluxo de Edição

### 1. Iniciar ambiente

```bash
npm run dev
# → http://localhost:1234
```

### 2. Editor (opcional)

```bash
npm run editor
# → http://localhost:3456/api/editor
```

### 3. Editar conteúdo

1. Acessar `/editor`
2. Selecionar documento em `work/` ou `pages/`
3. Editar frontmatter ou conteúdo MDX
4. Clicar "Salvar"

### 4. Preview

O preview mostra o conteúdo em tempo real (mesmo CSS do site).

---

## Adicionar Novo Case

### 1. Criar MDX em `content/work/`

```bash
# Criar arquivo
touch content/work/novo-case.md
```

### 2. Adicionar frontmatter

```yaml
---
title: "Nome do Case"
slug: "novo-case"
type: "work"
status: "published"
description: "Descrição para SEO"
tags:
  - UX Research
  - UI Design
order: 4
featured_image: "../images/case-novo/featured.webp"
og_image: "../images/novo-case-og.jpg"
protected_password: null
created_at: "2024-01-01"
updated_at: "2024-01-01"
---
```

### 3. Adicionar conteúdo MDX

```markdown
# Executive Summary

## The company
...

## My role
...

# Solution
...
```

### 4. Build

```bash
npm run build:content
# Gera HTML em src/pages-generated/novo-case.html
```

---

## Adicionar Nova Página

### 1. Criar MDX em `content/pages/`

```bash
touch content/pages/contato.md
```

### 2. Frontmatter

```yaml
---
title: "Contato"
slug: "contato"
type: "page"
status: "published"
description: "Entre em contato"
order: 2
created_at: "2024-01-01"
updated_at: "2024-01-01"
---
```

### 3. Conteúdo

```markdown
# Fale comigo

Email: renan@exemplo.com
LinkedIn: https://linkedin.com/in/renancrociari
```

---

## Preview Fiel

O preview usa **exatamente** o mesmo CSS do site publicado:

```html
<head>
  <link rel="stylesheet" href="../styles/global.css" />
  <link rel="stylesheet" href="../styles/reset.css" />
  <link rel="stylesheet" href="../styles/main.css" />
</head>
<body class="farfetch">  <!-- mesmo bodyClass -->
```

---

## Build e Deploy

### Desenvolvimento

```bash
npm run dev
# → localhost:1234
```

### Build completo (com MDX)

```bash
npm run build
# 1. Converte MDX → HTML
# 2. Parcel build (src/pages/*.html + src/pages-generated/*.html)
# 3. Copia assets
# 4. Output em dist/
```

### Build legacy (só original)

```bash
npm run build:legacy
# Sem converter MDX - usa HTML original em src/pages/
```

### Deploy

```bash
# Após build, commitar e fazer push
git add dist/
git commit -m "build: atualiza site"
git push
```

---

## Estrutura de Arquivos

```
renancrociari-site/
├── content/
│   ├── pages/           # Páginas editáveis
│   │   ├── home.md
│   │   └── about.md
│   └── work/          # Cases editáveis
│       ├── farfetch-performance.md
│       ├── dating-platform.md
│       └── journal-finder.md
├── src/
│   ├── pages/         # HTML original (legacy)
│   ├── pages-generated/  # HTML gerado de MDX
│   ├── components/   # Navbar, footer, dialogs
│   ├── styles/       # global.css, reset.css, main.css
│   └── scripts/      # JavaScript do site
├── scripts/
│   └── content/
│       └── build-content.js  # Converte MDX → HTML
├── dist/             # Saída do build (publicar)
└── package.json
```

---

## Troubleshooting

| Problema | Solução |
|---------|--------|
| Imagem não carrega | Verificar caminho em featured_image |
| Build falha | `npm run build:legacy` para confirmar |
| Preview diferente | Limpar cache do browser |
| Editor não carrega | `npm run dev:api` |

---

## Contato e Suporte

- **GitHub Issues**: Reportar bugs
- **Autor**: Renan Crociari

---

## Referências

- Plano: `.agent/docs/portfolio-os-integration.md`
- Inventário: `.agent/docs/SITE_INVENTORY.md`
- Contrato: `.agent/docs/CONTENT_CONTRACT.md`
- Renderer: `.agent/docs/SHARED_RENDERER.md`
- Build: `.agent/docs/BUILD.md`
- Rotas: `.agent/docs/ROUTING.md`
- Validação: `.agent/docs/VALIDATION.md`

---

## Critérios de Aceite

- [x] Alguém novo consegue rodar fluxo sem contexto extra
- [x] Passos de edição e preview estão claros
- [x] Processo de migração está reproduzível

---

*Documentação operacional - Task 16*
*Pertence ao plano: portfolio-os-integration.md*
*Definido em: 2026-04-17*