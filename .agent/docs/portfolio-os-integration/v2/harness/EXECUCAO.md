# Execução do harness (ordem recomendada)

Siga esta ordem para minimizar falsos negativos e retrabalho. Cada etapa supõe a anterior razoavelmente verde.

## 1. Verificação estática (sem rede, sem servidor)

```bash
npm run harness:verify
```

Confirma presença de rotas/arquivos críticos, conteúdo canônico dos três cases e campos obrigatórios no `routing-manifest`.

## 2. Build de produção do site (Parcel)

O plano exige que **o artefato público não inclua o runtime Next do sidecar**.

```bash
npm run build
```

Critério: conclui sem erro; `dist/` contém apenas o site estático esperado (sem empacotar `editor-sidecar` como dependência de produção).

## 3. Stack de desenvolvimento completo

```bash
npm start
```

Validar manualmente (ou via E2E quando existir):

- Site Parcel na porta esperada (padrão **1234**).
- Sidecar Next na porta da API (padrão **3001**).
- [`CRITERIOS-ACEITE-CANONICOS.md`](./CRITERIOS-ACEITE-CANONICOS.md) — seção *Cenários obrigatórios do plano*.

## 4. Testes automatizados (quando implementados)

Conforme [`MATRIZ-VERIFICACAO.md`](./MATRIZ-VERIFICACAO.md):

- Contrato HTTP: `GET/POST` em `/api/editor/work` e `/api/editor/drafts`.
- Migração de conteúdo e serialização de frontmatter.
- Paridade DOM (HTML legado vs gerado), com normalização documentada.

## 5. E2E do editor `work`

Fluxo ponta a ponta: lista → abrir documento → metadata/corpo → salvar → preview/draft → seleção preview ↔ sidebar.

Registrar falhas com ID `HARNESS-*` de [`CRITERIOS-ACEITE-CANONICOS.md`](./CRITERIOS-ACEITE-CANONICOS.md).

## 6. Cutover e documentação

Antes de remover formato flat ou heurísticas de fallback:

- Atualizar o plano principal com o estado real.
- Preencher pendências explícitas para Fase 2 (`pages`).

## 7. Atualização obrigatória do plano (`v2 copy.md`) — agentes de IA

**Depois** de a implementação estar correta e **todos os testes aplicáveis** ao escopo terem passado (incluindo, quando relevante, `npm run harness:verify` sem FAIL e `npm run build`):

1. Editar **`.agent/docs/portfolio-os-integration/v2/v2 copy.md`**.
2. Atualizar a secção **«Atualização de status»** (data + bullets do que foi feito).
3. Marcar **`[x]`** nos itens de checklist do backlog **cuja evidência existe**; não marcar trabalho ainda em aberto.
4. Cumpre o critério **HARNESS-DOC1** em [`CRITERIOS-ACEITE-CANONICOS.md`](./CRITERIOS-ACEITE-CANONICOS.md).

Este passo é **parte da definição de pronto** do harness, não documentação opcional.

## Paths com espaço (macOS)

O repositório pode residir em `Arquivos Locais/...`. Sempre usar **caminho entre aspas** em shell e garantir que scripts Node usem `path.join` a partir da raiz do repo — item coberto em B16.
