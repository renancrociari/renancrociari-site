# Cobertura do harness vs plano (`v2 copy.md`)

Este documento responde se o harness **cobre 100%** do necessário para uma implementação **correta e completa** do plano.

## Resposta curta

| Camada | Coberto pelo harness? | Notas |
|--------|-------------------------|-------|
| Estrutura de ficheiros, manifesto, MDX canónico | **Sim (parcial automatizado)** | `verify-static-harness.mjs` + critérios `HARNESS-*` |
| Contratos JSON/frontmatter (documentação) | **Sim (referência)** | `contracts/*.schema.json` |
| Testes de API, migração, paridade DOM, E2E | **Não automatizados no harness** | O plano **exige** estes testes; o harness **lista** e a skill **obriga** a implementá-los |
| Paridade visual “pixel perfect” | **Não** | Fora de escopo de verificação puramente automática; plano usa paridade **estrutural** normalizada |
| Comportamento em runtime (editor, iframe, senhas) | **Parcial** | Requer `npm start` + checklist / E2E |

**Conclusão:** o harness cobre **100% da rastreabilidade e dos pré-requisitos estáticos**; **não** cobre sozinho 100% da prova de correção porque uma fatia obrigatória do plano são **testes executáveis** (B17, B18, B19) que ainda têm de existir no repositório. A skill `portfolio-os-v2-integration` fecha essa lacuna ao impor definição de pronto e ordem de trabalho.

**Documentação:** após código + testes verdes, o agente deve ainda cumprir **HARNESS-DOC1** — atualizar `v2 copy.md` (status e checklists). Sem isso, a entrega não está “fechada” no sentido do harness.

## Mapa plano → artefacto de prova

| Secção do plano | O que “feito” significa | Onde está coberto |
|-----------------|------------------------|-------------------|
| § Implementação 1–2 (runtime + UI) | Sidecar + UI fiel | Estático: rotas; manual/E2E: `HARNESS-A2`, B2, B19 |
| §3–4 (conteúdo + frontmatter) | Canónico + normalizado | `contracts/work-frontmatter.schema.json`, `HARNESS-C*`, migração **teste** |
| §5–6 (APIs + manifesto) | Wire format + campos | `contracts/work-api-responses.schema.json`, manifest, **testes API** B17 |
| §7–8 (templates fiéis) | Adapters por case | B9–B11, **paridade** B18 — não coberto só pelo script estático |
| §9 (draft preview) | Draft store + imagens | B7, B12 — **testes** + manual |
| §10 (build-content) | Mesmo pipeline que preview | B14, `npm run build`, **paridade** B18 |
| §11–12 (fases) | Escopo work primeiro; pages depois | `CRITERIOS-ACEITE-CANONICOS.md` `HARNESS-F2-1` |
| Testes (secção do plano) | Lista de tipos de teste | `MATRIZ-VERIFICACAO.md` — cada linha com S/T/M/E/B |
| Backlog B0–B20 | Checklists | Matriz + skill (não parar até P0 verificáveis fechados) |

## Lacunas explícitas do script estático (preencher com código de teste)

1. **GET/POST** reais para `/api/editor/work` e `/api/editor/drafts` (corpo, erros, create).
2. **Migração** flat → canónico sem perda de dados.
3. **Paridade DOM** legado vs gerado (normalização documentada).
4. **E2E** fluxo editor + journal-finder auth (preview vs público).
5. **`REQUEST_REFRESH`** no canal postMessage — **código:** iframe `EditorPreviewIframeClient` → parent `EditorPreviewBridge` → `resyncPreview` (ver `preview-instrumentation.md`). **Teste automatizado** dedicado ainda não cobre o fluxo completo.
6. **CSS/Tailwind do sidecar** — sintoma: build dev do `/editor`; não é verificação de ficheiro única.

## Quando considerar a Fase 1 “fechada”

Alinhar com a skill: todos os **P0** do backlog Fase 1 com evidência na matriz, **mais** `npm run harness:verify` sem FAIL, **mais** `npm run build` verde, **mais** testes B17/B18/B19 existentes e a passar (ou justificativa explícita no plano se algo for adiado).
