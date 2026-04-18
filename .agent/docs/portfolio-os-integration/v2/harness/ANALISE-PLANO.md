# Análise do plano (`v2 copy.md`)

Síntese do documento-fonte e de como o harness garante implementação **completa** em relação ao que é verificável.

## Forças do plano

1. **Separação clara de runtime:** sidecar Next só em dev; Parcel permanece o deploy público — reduz risco de misturar bundles.
2. **Contrato editorial explícito:** `content/work/<slug>/index.mdx`, ID `<slug>/index.mdx`, manifesto como fonte única entre slug editorial e URL pública.
3. **Escopo de fase:** Fase 1 só `work` com três cases nomeados; Fase 2 `pages` isolada — evita explosão de escopo.
4. **Backlog executável (B0–B20):** dependências e critérios de aceite por bloco; bom para rastreio em PR.
5. **Testes nomeados:** contrato de API, migração, paridade DOM, E2E, smoke de build — alinhados com [`MATRIZ-VERIFICACAO.md`](./MATRIZ-VERIFICACAO.md).

## Riscos e pontos de atenção

| Área | Risco | Mitigação no harness |
|------|--------|----------------------|
| **Templates fiéis (B9–B11)** | Grande superfície DOM + três layouts distintos | IDs `HARNESS-B1/B2`, matriz B18, contrato `preview-instrumentation.md` |
| **Heurística vs adapters (B14)** | Regressão visual se o cutover for cedo | Critérios `HARNESS-B1`; WARN enquanto existir MDX flat |
| **Draft + imagens (B7/B12)** | Paths relativos e `workFileId` | Critérios API + cenários S3/S4 |
| **Outline vs DOM (B13)** | Deriva entre MDX, outline e `data-editor-node-id` | E2E `HARNESS-*` e matriz B13 |
| **journal-finder** | Duplo comportamento auth preview/público | `HARNESS-P5`, entrada `authId` no manifest (verificado estaticamente) |
| **CSS do sidecar** | Bloqueio de compilação (`border-border` etc.) | Documentado no plano; resolver fora do harness estático — validação manual/E2E em `/editor` |

## O que “100% correto” significa aqui

O plano mistura **requisitos objetivos** (ficheiros, campos JSON, rotas) e **requisitos de paridade** (HTML legado ≈ gerado). O harness declara:

- **Prova automática parcial:** `verify-static-harness.mjs` + testes quando existirem (B17/B18).
- **Prova manual/E2E obrigatória** para UI, postMessage completo e paridade visual — registada pelos IDs `HARNESS-S*`, `HARNESS-P*`, `HARNESS-E` na matriz.

Nenhum harness substitui revisão humana de **paridade estética fina**; o plano já exige testes de paridade DOM normalizada — isso é o elo para “correto” no sentido estrutural.

## Próximo passo após ler isto

1. [`EXECUCAO.md`](./EXECUCAO.md) — ordem de execução.
2. `npm run harness:verify` — baseline estático.
3. Preencher testes em aberto na matriz (coluna **T** / **E**) até todos os itens **P0 e P1** da Fase 1 estarem cobertos (incluindo B13, B17, B18, B19 — ver legenda de prioridades em `v2 copy.md`).
