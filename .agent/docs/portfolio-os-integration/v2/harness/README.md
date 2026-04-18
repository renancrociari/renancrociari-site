# Harness — Integração Portfolio-OS (`v2`)

Este diretório é o **harness operacional** para implementar e validar a integração descrita em [`v2 copy.md`](../v2%20copy.md) (e espelho [`v2.md`](../v2.md)). Ver também [`COBERTURA-HARNESS-PLANO.md`](./COBERTURA-HARNESS-PLANO.md) (o harness vs 100% do plano) e a skill [`.cursor/skills/portfolio-os-v2-integration/`](../../../../../.cursor/skills/portfolio-os-v2-integration/SKILL.md).

## Objetivo

Garantir que nenhuma entrega da Fase 1 (`work`) seja considerada “fechada” sem:

1. **Rastreabilidade** — cada item do backlog mapeia para evidência (código, teste ou checklist manual).
2. **Contratos** — wire format de APIs, frontmatter e manifesto alinhados ao editor original.
3. **Verificação** — build público sem sidecar; paridade estrutural onde o plano exige.
4. **Plano atualizado** — após implementação verificada e testes relevantes a passar, o agente de IA **deve** editar [`v2 copy.md`](../v2%20copy.md): «Atualização de status» + marcar tarefas concluídas no backlog (ver **HARNESS-DOC1** em [`CRITERIOS-ACEITE-CANONICOS.md`](./CRITERIOS-ACEITE-CANONICOS.md)).

### Instrução explícita para agentes de IA

Quando uma fatia do backlog v2 estiver **implementada** e **validada** (comandos do harness, `npm run build` se aplicável, e testes automatizados/manuais exigidos pelo escopo):

1. Abrir **`.agent/docs/portfolio-os-integration/v2/v2 copy.md`**.
2. Atualizar **`## Atualização de status`** com data/resumo do que foi entregue.
3. Percorrer o **backlog detalhado** (B0–B20, etc.) e marcar **`[x]`** apenas nos itens comprovadamente feitos; manter **`[ ]`** no restante.
4. Opcional: alinhar o aviso em **`v2.md`** se for espelho do plano.

Sem isto, a entrega está **incompleta** do ponto de vista do harness (critério **HARNESS-DOC1**).

## Conteúdo

| Artefato | Função |
|----------|--------|
| [`ANALISE-PLANO.md`](./ANALISE-PLANO.md) | Leitura crítica do plano v2 e relação com o harness. |
| [`COBERTURA-HARNESS-PLANO.md`](./COBERTURA-HARNESS-PLANO.md) | O harness cobre 100% do plano? (matriz honesta). |
| [`EXECUCAO.md`](./EXECUCAO.md) | Ordem recomendada de verificação (estático → build → runtime → E2E). |
| [`MATRIZ-VERIFICACAO.md`](./MATRIZ-VERIFICACAO.md) | Backlog B0–B20 + Fase 2: método de prova por item. |
| [`CRITERIOS-ACEITE-CANONICOS.md`](./CRITERIOS-ACEITE-CANONICOS.md) | IDs estáveis (`HARNESS-*`) para PRs e commits. |
| [`contracts/`](./contracts/) | Esquemas e listas normativas (referência, não runtime). |
| [`scripts/verify-static-harness.mjs`](./scripts/verify-static-harness.mjs) | Checagens sem subir servidor (estrutura + manifesto). |
| [`PROMPT-IMPLEMENTACAO-100PCT.md`](./PROMPT-IMPLEMENTACAO-100PCT.md) | Prompt detalhado para o agente implementar o plano completo (work + Fase 2). |

## Uso rápido

Na raiz do repositório:

```bash
node .agent/docs/portfolio-os-integration/v2/harness/scripts/verify-static-harness.mjs
```

Ou:

```bash
npm run harness:verify
```

Interpretação:

- **PASS** — condição necessária satisfeita.
- **WARN** — não bloqueia sozinho; revisar antes do cutover.
- **FAIL** — corrigir antes de considerar a fase avançada.

## Relação com o plano-fonte

O documento `v2 copy.md` combina: visão geral, interfaces, testes obrigatórios, backlog detalhado (B0–B20) e Fase 2 (`pages`). O harness **não substitui** esse plano; formaliza **como provar** cada promessa do plano.

## Escopo explícito

- **Fase 1:** apenas `work` (três cases: `farfetch-performance`, `dating-platform`, `journal-finder`).
- **Fase 2:** entradas P1–P4 no mesmo estilo; ativar quando a Fase 1 estiver verde no [`CRITERIOS-ACEITE-CANONICOS.md`](./CRITERIOS-ACEITE-CANONICOS.md).
