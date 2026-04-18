# Cobertura do harness vs plano (`v2 copy.md`)

Este documento define em que sentido o **harness v2** (diretório `.agent/docs/portfolio-os-integration/v2/harness/` + comandos na raiz do repo) cobre **100%** da implementação prevista no plano-fonte [`.agent/docs/portfolio-os-integration/v2/v2 copy.md`](../v2%20copy.md).

## O que significa «100%» aqui

| Significado | Sim / Não |
|-------------|-----------|
| **100% de rastreabilidade** — cada requisito verificável do plano v2 tem **método de prova** atribuído (matriz, critério `HARNESS-*`, contrato, ou comando). | **Sim** |
| **100% só com `npm run harness:verify`** — o script estático prova estrutura e manifesto; **não** substitui testes HTTP, paridade HTML nem E2E. | **Não** |
| **100% da pilha de verificação obrigatória** — quando se correm, na ordem de [`EXECUCAO.md`](./EXECUCAO.md), os comandos listados em [Pilha canónica](#pilha-canónica-de-verificação), a implementação está **demonstrada** segundo o plano (salvo itens explicitamente manuais ou adiados no próprio `v2 copy.md`). | **Sim** (definição operacional de «implementação completa») |

Ou seja: o harness **cobre 100% do plano** no sentido de **completude do método de verificação**. A execução real exige **toda a pilha**, não apenas o script estático.

## Pilha canónica de verificação

Comandos na raiz do repositório (caminhos com espaço: usar aspas):

| Ordem | Comando | O que fecha no plano |
|-------|---------|----------------------|
| 1 | `npm run harness:verify` | Estrutura de ficheiros, MDX canónico (`work` + `pages` mínimos), manifesto `work`, `WARN` flat legado |
| 2 | `npm run test:portfolio-os` | B17 (APIs work/drafts/pages em `api-contract.test.ts`), B18 (paridade HTML), B13 (outline/DOM), migração, serialização, manifesto, pipeline de render (`tests/portfolio-os-v2/*.test.mjs`) |
| 3 | `npm run test:e2e` | B19 (`tests/e2e/editor-work.spec.ts`); Fase 2 P4 (`tests/e2e/editor-pages.spec.ts` — `/editor/pages`) |
| 4 | `npm run build` | B14/B16: `build:content` + Parcel; artefato sem sidecar; `prebuild` → `validate:content:check` |
| 5 | Atualizar plano | **HARNESS-DOC1** — `v2 copy.md` (status + checklists) |

Runtime manual (`npm start`) e cenários **HARNESS-S*** em [`CRITERIOS-ACEITE-CANONICOS.md`](./CRITERIOS-ACEITE-CANONICOS.md) fecham o que os testes ainda não automatizam por completo (ex.: alguns fluxos de UI ou journal na rota pública com senha).

## Mapa: «Implementação» (§ itens 1–12 do plano)

Cada número corresponde aos parágrafos numerados em **## Implementação** em `v2 copy.md`.

| # | Tema | Artefactos / prova |
|---|------|-------------------|
| 1 | Runtime sidecar + `npm start` + portas | `verify-static-harness.mjs` (`dev-server`, rotas API); **HARNESS-A1**, **HARNESS-A2**, **HARNESS-A3** |
| 2 | UI real do editor | B2; E2E B19; critérios preview **HARNESS-P3** |
| 3 | Conteúdo canónico `content/work/<slug>/index.mdx` | **HARNESS-C1**; checagem MDX no harness estático; `work-content-migration.test.mjs` |
| 4 | Frontmatter normalizado | `contracts/work-frontmatter.schema.json`; `work-content-serialization.test.mjs` |
| 5 | APIs wire format | `contracts/work-api-responses.schema.json`; **HARNESS-API1–4**; `api-contract.test.ts` (work + drafts + pages) |
| 6 | Manifesto editorial vs público | `routing-manifest.mjs` + `routing-manifest-work-entry.schema.json`; `routing-manifest.test.mjs`; **HARNESS-C3** |
| 7 | Preview fiel + instrumentação DOM | **HARNESS-P1**, **HARNESS-P2**; `preview-instrumentation.md`; B9–B12 |
| 8 | Templates = referência HTML legado | **HARNESS-B1**; `work-html-parity.test.mjs`; `work-render-pipeline.test.mjs` |
| 9 | Draft + paths + postMessage | B7/B12; testes de drafts em `api-contract.test.ts`; **HARNESS-P4** |
| 10 | `build-content` = mesmo pipeline que preview | **HARNESS-B1**; `npm run build`; B14 |
| 11 | Cutover Fase 1 só `work` | **HARNESS-F2-1**; WARN flat no harness |
| 12 | Fase 2 `pages` | Matriz P1–P4; ficheiros `pages-content.mjs`, rotas preview/API; MDX `content/pages/home|about` no estático |

## Mapa: «Interfaces e Contratos» e «Testes» (§ do plano)

| Secção do plano | Cobertura |
|-----------------|-----------|
| Formato `content/work/...`, ID `…/index.mdx` | Contrato + harness MDX + testes de migração |
| Endpoints Fase 1 | Lista em **HARNESS-A3**; presença de ficheiros em `verify-static-harness.mjs`; prova HTTP em `api-contract.test.ts` |
| Interface de renderização (adapters) | **HARNESS-P1**; B9–B11 na [`MATRIZ-VERIFICACAO.md`](./MATRIZ-VERIFICACAO.md) |
| Manifesto único | Schema `routing-manifest-work-entry`; importação dinâmica no script estático |
| § **Testes** (lista de tipos de teste) | `harness:verify` (estático); `test:portfolio-os` (Node + tsx); `test:e2e` (Playwright); smoke produção = `npm run build` |
| Paridade DOM / journal público | B18 + B11/B19; E2E e/ou manual **HARNESS-P5** |

## Mapa: backlog B0–B20 e Fase 2 (P1–P4)

| Bloco | Onde está 100% rastreado |
|-------|---------------------------|
| B0–B20 | Uma linha cada em [`MATRIZ-VERIFICACAO.md`](./MATRIZ-VERIFICACAO.md) (colunas S/T/M/E/B) + skill `portfolio-os-v2-integration` |
| Fase 2 P1–P4 | Secção «Fase 2 — `pages`» na mesma matriz + checagens estáticas para `home`/`about` + testes API pages em `api-contract.test.ts` |

Prioridades P0/P1/P2 no plano-fonte: ver secções **«Quando considerar a Fase 1 fechada»** e **«Fase 2 (`pages`)»** abaixo.

## O que o script estático faz e não faz

| Camada | Coberto pelo `verify-static-harness.mjs`? | Complemento obrigatório no plano |
|--------|------------------------------------------|----------------------------------|
| Ficheiros críticos, rotas, `pages-content.mjs`, `build-content.js` | Sim | — |
| MDX canónico work (3 cases) + pages (`home`, `about`) | Sim | Conteúdo editorial validado também por `validate:content` / testes |
| Campos `MANAGED_ROUTE_MANIFEST.work` | Sim (import) | — |
| HTTP real, corpos de erro, criação de documentos | Não | `npm run test:portfolio-os` → `api-contract.test.ts` |
| Migração flat → canónico | Não | `work-content-migration.test.mjs` |
| Paridade HTML legado vs gerado | Não | `work-html-parity.test.mjs` |
| E2E fluxo editor | Não | `npm run test:e2e` |
| **REQUEST_REFRESH** / cadeia iframe ↔ bridge | Parcialmente (código + `preview-instrumentation.md`) | E2E ou manual **HARNESS-S4** para prova holística do fluxo |
| **Pixel perfect** / julgamento estético | Não | Fora de escopo; plano exige paridade **estrutural** (B18) |
| CSS/Tailwind só do sidecar (`/editor`) | Não | Build `next build` em `editor-sidecar` + uso manual |

## Quando considerar a Fase 1 “fechada”

Alinhar com a skill: todos os **P0** do backlog Fase 1 **e** os itens **P1** dessa fase (**B13** outline/DOM, **B17** contratos, **B18** paridade, **B19** E2E) com evidência na [`MATRIZ-VERIFICACAO.md`](./MATRIZ-VERIFICACAO.md), **mais** `npm run harness:verify` sem FAIL, **mais** `npm run build` verde, **mais** os testes referidos em B17/B18/B19 a passar (ou justificativa explícita no plano se algo for adiado). **B20** (P2) é documentação operacional: deve estar tratada para a integração ser operável, mas a legenda P2 distingue-a dos bloqueios P0/P1.

## Fase 2 (`pages`) — prioridade P1 no plano

As entregas **P1–P4** em [`v2 copy.md`](../v2%20copy.md) (migração canónica, API, templates, E2E/cutover) usam o marcador **`P1`** nas checklists do plano-fonte. O harness cobre-as na matriz (secção «Fase 2 — `pages`»), no script estático (ficheiros `content/pages/<slug>/index.mdx`, rotas do sidecar, `pages-content.mjs`), nos testes (`api-contract` para pages; **P4** com E2E `tests/e2e/editor-pages.spec.ts`) e na skill com o mesmo rigor de prova que na Fase 1 quando o escopo incluir `pages`.

## Conclusão

- **100% do plano v2** = **100% dos requisitos com método de prova** (este documento + matriz + critérios + comandos).
- **Implementação completa** = esse método **executado** (pilha canónica + **HARNESS-DOC1**), não só `harness:verify`.
- Contratos em [`contracts/`](./contracts/) são referência normativa; mantê-los alinhados ao código quando o wire format mudar.
