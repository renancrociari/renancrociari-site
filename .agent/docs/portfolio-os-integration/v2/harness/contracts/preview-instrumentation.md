# Instrumentação de preview (norma do plano v2)

Este ficheiro resume o que o plano exige para **preview fiel** e **sincronização com a sidebar**. A implementação concreta vive em `editor-sidecar/` e nos template adapters; aqui apenas o contrato verificável.

## Atributos `data-editor-*` no DOM do preview

Além dos atributos no documento raço usados pelo bootstrap do editor, os nós editáveis devem ser endereçáveis de forma estável:

| Atributo | Função |
|----------|--------|
| `data-editor-kind` | Tipo lógico do nó (ex.: secção vs bloco). |
| `data-editor-node-id` | Identificador estável alinhado ao outline. |
| `data-editor-section-index` | Índice da secção no documento. |
| `data-editor-block` | Marca blocos authorable dentro da secção. |

## Shell editorial (slots fixos)

O plano nomeia estes identificadores de shell; os adapters devem mapeá-los para o DOM real de cada case:

- `shell-hero`
- `shell-meta`
- `shell-tags`
- `shell-summary`

Secções e blocos seguem o padrão esperado pelo outline (ex.: `section-*`, `sec{n}-blk{m}-Component` — ajustar ao código real do projeto).

## Mensagens `postMessage` (canal iframe)

Mínimo esperado para interação editor ↔ preview:

| Tipo | Uso |
|------|-----|
| `READY` | Preview pronto para receber seleção/highlight. |
| `SELECT` | Clique no preview → sidebar. |
| `HIGHLIGHT` | Sidebar → destaque no DOM. |
| `HOVER` | Sincronização de hover. |
| `REQUEST_REFRESH` | Iframe → parent: pedir `resyncPreview` (re-POST do draft + bump da `cacheKey` do iframe). Disparado com throttle (~2s) após falha de carregamento de `img` dentro de nós instrumentados (`[data-editor-node-id]`) ou em `pageshow` com cache back-forward (`persisted`). |

## Proteção `journal-finder`

- **Preview no editor:** não bloquear por senha.
- **Rota pública:** manter fluxo de `authId` / verificação existente.
