# Critérios de aceite canônicos (IDs `HARNESS-*`)

Use estes IDs em PRs, issues e commits para afirmar **o que** foi validado. Um critério só é “aceito” quando o método de prova na [matriz](./MATRIZ-VERIFICACAO.md) foi executado.

## Arquitetura e deploy

| ID | Critério |
|----|----------|
| HARNESS-A1 | O site público em produção continua sendo **Parcel + estático**; o sidecar Next **não** entra no artefato de `npm run build`. |
| HARNESS-A2 | Em dev, **um único comando** (`npm start`) sobe Parcel + sidecar com portas definidas ou política de fallback documentada. |
| HARNESS-A3 | Endpoints obrigatórios Fase 1 existem no sidecar: `/api/editor/work`, `/api/editor/drafts`, `/api/verify-password`, rota de preview `work`. |

## Contrato de conteúdo

| ID | Critério |
|----|----------|
| HARNESS-C1 | Documentos `work` geridos na Fase 1 residem em `content/work/<slug>/index.mdx` com **documentId** canônico `<slug>/index.mdx`. |
| HARNESS-C2 | Frontmatter expõe o shape esperado pelo editor (`title`, `slug`, `summary`, `publishedAt`, `published`, `order`, `company`, `role`, `team`, `duration`, `domain`, `platforms`, `tools`, `goals`, `outcomes`, `impactMetrics`, `tags`, `status`, `coverImage`, `gallery`, `video`); campos legados só como compatibilidade de leitura até o corte. |
| HARNESS-C3 | Existe distinção explícita entre **ID editorial** (`farfetch-performance/index.mdx`) e **URL pública** (`/improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands`); manifesto é fonte única de vínculo. |

## APIs

| ID | Critério |
|----|----------|
| HARNESS-API1 | `GET /api/editor/work` retorna `entries` no wire format esperado pela UI original. |
| HARNESS-API2 | `GET /api/editor/work?id=<id>` retorna `metadata` + `content`. |
| HARNESS-API3 | `POST /api/editor/work` persiste documento; suporta fluxo de criação alinhado ao `action=create` (ou equivalente documentado). |
| HARNESS-API4 | Drafts: `GET`/`POST`/`DELETE` em `/api/editor/drafts` com `workFileId`, `slug`, `metadata`, `content` e semântica de bootstrap/update. |

## Preview e DOM

| ID | Critério |
|----|----------|
| HARNESS-P1 | Templates fiéis expõem **render público**, **render preview instrumentado** e mapeamento shell (`shell-hero`, `shell-meta`, `shell-tags`, `shell-summary`) + seções + blocos. |
| HARNESS-P2 | Instrumentação inclui `data-editor-kind`, `data-editor-node-id`, `data-editor-section-index`, `data-editor-block` conforme padrão do editor. |
| HARNESS-P3 | Atributos no `html`/`body` necessários ao cliente: `data-editor-deployment`, `data-editor-collection`, `data-editor-preview-channel`, `data-editor-page-ready` (nomes exatos conforme implementação do editor). |
| HARNESS-P4 | Mensagens postMessage cobrem pelo menos `READY`, `SELECT`, `HIGHLIGHT`, `HOVER`; `REQUEST_REFRESH` quando o plano exigir paridade com o original. |
| HARNESS-P5 | **journal-finder:** preview do editor **não** exige senha; rota pública permanece protegida. |

## Build e paridade

| ID | Critério |
|----|----------|
| HARNESS-B1 | `scripts/content/build-content.js` gera HTML público dos cases gerenciados pelo **mesmo pipeline estrutural** do preview (adapters fiéis), não pelo renderer heurístico compartilhado. |
| HARNESS-B2 | Para cada um dos três cases, existe **prova de paridade** (teste automatizado) entre HTML legado e HTML novo após normalização de atributos voláteis. |

## Cenários obrigatórios do plano (manuais até existir E2E)

| ID | Cenário |
|----|---------|
| HARNESS-S1 | Abrir e editar `farfetch-performance`, `dating-platform`, `journal-finder`. |
| HARNESS-S2 | Salvar só metadata; salvar só corpo. |
| HARNESS-S3 | Trocar de documento com draft ativo. |
| HARNESS-S4 | Recriar preview após refresh. |
| HARNESS-S5 | `npm run build` sem incluir runtime do editor no output público. |

## Documentação do plano (fecho de entrega)

| ID | Critério |
|----|----------|
| HARNESS-DOC1 | Depois de **implementação correta** e dos **testes aplicáveis** a passar (mais `npm run harness:verify` sem FAIL e `npm run build` quando o escopo tocar build), o agente **atualiza** o plano [`.agent/docs/portfolio-os-integration/v2/v2 copy.md`](../v2%20copy.md): (1) secção **«Atualização de status»** com o que foi feito nesta entrega; (2) **checklists do backlog** — marcar `[x]` só onde houver evidência; deixar `[ ]` no que ficar pendente; (3) se `v2.md` for espelho, manter alinhamento (p. ex. aviso no topo). Não fechar PR/sessão sem esta sincronização quando houve trabalho real no backlog v2. |

## Fase 2 (ativação condicional)

| ID | Critério |
|----|----------|
| HARNESS-F2-1 | `pages` no formato canônico e `/api/editor/pages` apenas após HARNESS-B2 verde para `work`. |
