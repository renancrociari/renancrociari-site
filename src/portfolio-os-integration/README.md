# Portfolio-OS Integration

Integração do renancrociari-site com o portfolio-os como workspace local.

## Estrutura

- `adapters/` - Leitura e escrita de conteúdo no formato do portfolio-os
- `renderer/` - Renderer compartilhado entre site e preview
- `blocks/` - Catálogo authorable importado de `@portfolio-os/blocks` (surface `work-body`) para o editor
- `content/` - Conteúdo em MDX canônico (pages/ e work/)
- `editor/` - Integração da UI do editor

## Packages Consumidos

- `@portfolio-os/core` - Tipos, content loader, slug/contracts (na API Node usamos `scripts/lib/slugify.cjs` alinhado ao `slugify` do core)
- `@portfolio-os/blocks` - Registry editorial (catálogo authorable no editor)
- `@portfolio-os/editor` - Mutações, adapters, preview plumbing

## Editor

- Campos extra para **Work**: `description`, `featured_image`, `tags` (vírgulas), gravados no frontmatter com o mesmo formato que o build.
- Campos extra para **About** (`slug === about`): `description` (hero/SEO), `featured_image`.
- Alterações nos metadados atualizam o preview em tempo real.

## Configuração de Resolução

Os packages `@portfolio-os/*` estão em `package.json` como dependências `file:../portfolio-main/packages/...` (caminho relativo ao repo do site). O Parcel e o Node resolvem-nos via `node_modules` após `npm install`.
