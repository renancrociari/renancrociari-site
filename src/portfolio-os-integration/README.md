# Portfolio-OS Integration

Integração do renancrociari-site com o portfolio-os como workspace local.

## Estrutura

- `adapters/` - Leitura e escrita de conteúdo no formato do portfolio-os
- `renderer/` - Renderer compartilhado entre site e preview
- `blocks/` - Catálogo authorable importado de `@portfolio-os/blocks` (surface `work-body`) para o editor
- `content/` - Conteúdo em MDX canônico (pages/ e work/)
- `editor/` - Integração da UI do editor

## Packages Consumidos

- `@portfolio-os/core` - Tipos, content loader, slug/contracts
- `@portfolio-os/blocks` - Registry editorial
- `@portfolio-os/editor` - Mutações, adapters, preview plumbing

## Configuração de Resolução

Os packages `@portfolio-os/*` estão em `package.json` como dependências `file:../portfolio-main/packages/...` (caminho relativo ao repo do site). O Parcel e o Node resolvem-nos via `node_modules` após `npm install`.
