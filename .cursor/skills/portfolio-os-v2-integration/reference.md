# Referência rápida — backlog P0 Fase 1

Checklist operacional para o agente. Detalhes completos estão em `v2 copy.md`.

| ID | Nome | Prova mínima |
|----|------|----------------|
| B0 | Baseline | Tabela 3 cases + HTML legado referenciado |
| B1 | Sidecar + npm start | harness + dev manual |
| B2 | UI editor | E2E ou checklist B2 |
| B3 | Conteúdo canónico | harness + teste migração |
| B4 | Frontmatter | validate + testes serialização |
| B5 | Loader/adapter | testes + wire format |
| B6 | API work | testes contrato |
| B7 | Drafts | testes contrato |
| B8 | Manifesto | estático + testes helpers |
| B9–B11 | Templates 3 cases | paridade B18 + preview |
| B12 | Preview instrumentado | manual/E2E postMessage |
| B13 | Outline ↔ DOM | E2E seleção |
| B14 | build-content adapters | build + paridade |
| B15 | Cutover | doc + rollback |
| B16 | Produção sem sidecar | npm run build |
| B17 | Testes contrato | suite existe e passa |
| B18 | Paridade DOM | suite existe e passa |
| B19 | E2E editor | suite existe e passa |
| B20 | Doc operacional | README interno atualizado |

Comando único de sanidade: `npm run harness:verify && npm run test:portfolio-os && npm run build`.

Após entrega verificada: editar **`v2 copy.md`** (status + `[x]` no backlog) — **HARNESS-DOC1**.
