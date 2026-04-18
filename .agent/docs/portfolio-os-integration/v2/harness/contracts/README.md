# Contratos de referência

Estes ficheiros são **normativos para implementação e revisão**, não necessariamente carregados em runtime pelo site.

| Ficheiro | Conteúdo |
|----------|----------|
| [`work-frontmatter.schema.json`](./work-frontmatter.schema.json) | Chaves esperadas no frontmatter MDX de `work` após normalização. |
| [`work-api-responses.schema.json`](./work-api-responses.schema.json) | Formas mínimas de resposta JSON das rotas do editor (lista, load). |
| [`routing-manifest-work-entry.schema.json`](./routing-manifest-work-entry.schema.json) | Campos obrigatórios por entrada em `MANAGED_ROUTE_MANIFEST.work`. |
| [`preview-instrumentation.md`](./preview-instrumentation.md) | Atributos `data-editor-*` e mensagens postMessage esperadas. |

Ajuste os esquemas quando o wire format do pacote `@portfolio-os/editor` evoluir; mantenha-os **sincronizados** com `editor-sidecar/app/api/editor/*/route.ts`.
