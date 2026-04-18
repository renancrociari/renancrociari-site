---
name: portfolio-os-v2-integration
description: >-
  Implementa e valida a integração Portfolio-OS no renancrociari-site conforme o plano v2
  (.agent/docs/portfolio-os-integration/v2), sidecar Next, contratos de work, templates fiéis,
  build Parcel e testes obrigatórios. Usar quando o utilizador trabalha nesta integração,
  no editor-sidecar, em content/work, routing-manifest, build-content, ou pede continuidade
  até fechar a Fase 1 (work) ou Fase 2 (pages).
---

# Integração Portfolio-OS — plano v2 (execução até pronto)

## Fontes obrigatórias (ler nesta ordem)

1. Plano e backlog: [`.agent/docs/portfolio-os-integration/v2/v2 copy.md`](../../../.agent/docs/portfolio-os-integration/v2/v2%20copy.md)
2. Cobertura harness vs plano: [`.agent/docs/portfolio-os-integration/v2/harness/COBERTURA-HARNESS-PLANO.md`](../../../.agent/docs/portfolio-os-integration/v2/harness/COBERTURA-HARNESS-PLANO.md)
3. Critérios de aceite: [`.agent/docs/portfolio-os-integration/v2/harness/CRITERIOS-ACEITE-CANONICOS.md`](../../../.agent/docs/portfolio-os-integration/v2/harness/CRITERIOS-ACEITE-CANONICOS.md)
4. Matriz de verificação: [`.agent/docs/portfolio-os-integration/v2/harness/MATRIZ-VERIFICACAO.md`](../../../.agent/docs/portfolio-os-integration/v2/harness/MATRIZ-VERIFICACAO.md)
5. Contratos: [`.agent/docs/portfolio-os-integration/v2/harness/contracts/`](../../../.agent/docs/portfolio-os-integration/v2/harness/contracts/)

## Regra de paragem (definição de pronto)

**Não declarar a tarefa concluída** enquanto:

- `npm run harness:verify` não correr sem **FAIL** (WARN exigem decisão explícita no PR ou no plano).
- `npm run build` não concluir com sucesso (site Parcel sem sidecar no artefato).
- Para alterações que toquem APIs ou contratos: existirem testes automatizados alinhados ao plano (secção “Testes” e backlog B17–B19) **ou** o agente tiver implementado esses testes nesta sessão e estiverem a passar.
- O plano **`.agent/docs/portfolio-os-integration/v2/v2 copy.md`** não tiver sido **atualizado** após a entrega: secção **«Atualização de status»** + checklists do backlog com **`[x]`** nos itens feitos (**HARNESS-DOC1**).

Se o utilizador pedir “continua até acabar”, iterar: **implementar próximo item P0 do backlog** → **correr harness + build** → **correr/adicionar testes** → **atualizar `v2 copy.md`** → repetir até não haver P0 aberto para o escopo acordado (Fase 1 `work` ou Fase 2 `pages`).

## Escopo por fase

- **Fase 1:** apenas `work` com os três cases (`farfetch-performance`, `dating-platform`, `journal-finder`). Não expandir `pages` até a Fase 1 estar verde (ver `HARNESS-F2-1`).
- **Fase 2:** `pages`, `/api/editor/pages`, templates fiéis — só após critérios da Fase 1.

## Caminhos e shell

O repositório pode estar em pastas com **espaços** (ex.: `Arquivos Locais`). Usar sempre caminhos entre aspas em comandos e `path.join` no código.

## Verificação mínima após mudanças relevantes

Na raiz do repo:

```bash
npm run harness:verify
npm run test:portfolio-os
npm run build
```

Para fluxo completo do editor em dev:

```bash
npm start
```

Validar manualmente ou por E2E os cenários em `CRITERIOS-ACEITE-CANONICOS.md` (HARNESS-S*) e proteção `journal-finder` (HARNESS-P5).

## Áreas críticas do plano (não saltar)

- **Manifesto:** `src/portfolio-os-integration/config/routing-manifest.mjs` — única fonte editorial vs URL pública.
- **Templates fiéis:** preview e `build-content` devem partilhar adapters; parar de usar renderer heurístico para work gerido quando B14/B15 fecharem.
- **Draft + imagens:** reescrita de paths a partir de `workFileId` (B5, B12).
- **journal-finder:** preview sem senha no editor; rota pública protegida.

## Atualização de documentação (obrigatória após entrega verificada)

Quando a implementação estiver correta e os testes aplicáveis tiverem passado:

1. Editar **`v2 copy.md`** (não só comentar no chat).
2. **«Atualização de status»:** data e resumo do que foi implementado/validado.
3. **Backlog (B0–B20, Fase 2):** marcar **`[x]`** em cada checklist satisfeito; deixar **`[ ]`** no que continuar pendente.
4. **`v2.md`:** se for espelho, manter o aviso ou alinhar texto mínimo conforme o plano-fonte.

Isto corresponde ao harness **HARNESS-DOC1** e ao passo 7 de [`harness/EXECUCAO.md`](../../../.agent/docs/portfolio-os-integration/v2/harness/EXECUCAO.md).

## Relação com AGENTS.md

Seguir preferências do projeto em [`AGENTS.md`](../../../AGENTS.md) (português, `npm start`, paths com espaço).
