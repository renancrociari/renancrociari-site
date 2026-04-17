# Portfolio-OS Integration

Integração do renancrociari-site com o portfolio-os como workspace local.

## Estrutura

- `adapters/` - Leitura e escrita de conteúdo no formato do portfolio-os
- `renderer/` - Renderer compartilhado entre site e preview
- `content/` - Conteúdo em MDX canônico (pages/ e work/)
- `editor/` - Integração da UI do editor

## Packages Consumidos

- `@portfolio-os/core` - Tipos, content loader, slug/contracts
- `@portfolio-os/blocks` - Registry editorial
- `@portfolio-os/editor` - Mutações, adapters, preview plumbing

## Configuração de Resolução

O Parcel resolve os packages via aliases configurados no package.json.
