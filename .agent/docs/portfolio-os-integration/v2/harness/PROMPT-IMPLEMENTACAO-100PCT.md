# Prompt mestre — implementar 100% do plano v2 (work + Fase 2 `pages`)

Copia o bloco **«Prompt para o agente»** abaixo para uma nova conversa no Cursor (ou anexa este ficheiro). Ajusta apenas o escopo se quiseres **só Fase 1** (recomendado até fechar `work`).

---

## Prompt para o agente

```text
És o agente de implementação do repositório renancrociari-site. Objetivo: executar até ao fim o plano de integração Portfolio-OS v2, respeitando skill, harness e critérios de aceite.

### 1) Leitura obrigatória (por esta ordem)

1. Skill: `.cursor/skills/portfolio-os-v2-integration/SKILL.md` e `reference.md`
2. Plano-fonte e backlog: `.agent/docs/portfolio-os-integration/v2/v2 copy.md`
3. Harness:
   - `harness/EXECUCAO.md` — ordem de verificação
   - `harness/MATRIZ-VERIFICACAO.md` — método de prova por item (B0–B20, P1–P4)
   - `harness/CRITERIOS-ACEITE-CANONICOS.md` — IDs HARNESS-* e HARNESS-DOC1
   - `harness/contracts/` — frontmatter, API, instrumentação de preview
   - `harness/COBERTURA-HARNESS-PLANO.md` — o que o script estático não cobre sozinho
4. Regra do projeto: `.cursor/rules/portfolio-os-v2.mdc`
5. Código-alvo principal: `editor-sidecar/`, `src/portfolio-os-integration/`, `scripts/content/build-content.js`, `content/work/`, `src/portfolio-os-integration/config/routing-manifest.mjs`

Idioma das mensagens ao utilizador: português. Não editar ficheiros `.env`.

### 2) Estado atual do repo (síntese — confirma no código)

- Já existe: sidecar Next, `npm start` com Parcel + sidecar, APIs `/api/editor/work`, `/api/editor/drafts`, rotas de preview, manifesto, conteúdo canónico `content/work/<slug>/index.mdx` para os 3 cases, compatibilidade com MDX flat (WARN no harness até cutover).
- **Ainda em aberto para “Fase 1 fechada”:** templates fiéis por case (B9–B11), `build-content` a usar os mesmos adapters que o preview sem depender do `shared-renderer.mjs` para work gerido (B14), cutover e remoção de flat (B15), testes de contrato/paridade/E2E (B17–B19), outline/DOM (B13), completar B12 (imagens via workFileId, REQUEST_REFRESH se necessário), ruído de path com espaço (B16 onde aplicável), documentação operacional restante (B20).
- **Não há** ficheiros `*.test.*` / `*.spec.*` na raiz do projeto — a suíte de testes do plano há-de ser **criada** (Node test runner, Vitest ou Playwright conforme decisão mínima e consistente com o repo).

### 3) Definição de pronto (não negociável)

Depois de cada fatia implementada **e** validada:

- `npm run harness:verify` sem FAIL (WARN: documentar ou corrigir antes do cutover).
- `npm run build` na raiz com sucesso (site Parcel; sidecar não entra no artefato público).
- Testes aplicáveis ao escopo da alteração a passar (contrato API, migração, paridade DOM, E2E — conforme matriz).
- **HARNESS-DOC1:** atualizar `.agent/docs/portfolio-os-integration/v2/v2 copy.md`:
  - secção «Atualização de status» com o que foi feito;
  - marcar `[x]` nos itens de backlog com evidência; deixar `[ ]` no pendente;
  - alinhar aviso em `v2.md` se for espelho.

Não declares a tarefa concluída sem estes passos.

### 4) Ordem de execução recomendada (Fase 1 — `work`)

Segue dependências do plano; em caso de dúvida, a ordem abaixo minimiza retrabalho:

1. **Baseline (B0):** fechar o item em aberto sobre “fonte de verdade” dos ficheiros do fluxo antigo (documentar no plano o que deixa de ser canónico quando B14/B15 fecharem).
2. **B2:** remover dependências de sandbox pública se ainda existirem para a entrega `work` (checklist em `v2 copy.md`).
3. **B5/B12:** garantir reescrita correta de paths de imagem a partir de `workFileId` / slug; completar `REQUEST_REFRESH` no canal postMessage se o editor original o exigir para paridade.
4. **B9 → B10 → B11:** para cada um dos três slugs (`farfetch-performance`, `dating-platform`, `journal-finder`):
   - Usar o HTML legado em `src/pages` (ficheiros referenciados por `legacySourcePage` no `routing-manifest.mjs`) como referência estrutural.
   - Implementar template adapter com: render público, render preview instrumentado, shell (`shell-hero`, `shell-meta`, `shell-tags`, `shell-summary`), secções e blocos com `data-editor-kind`, `data-editor-node-id`, `data-editor-section-index`, `data-editor-block`.
   - **journal-finder:** preview sem senha no editor; rota pública com `authId` / proteção existente.
5. **B14:** alterar `scripts/content/build-content.js` para que os três cases geridos usem **os mesmos adapters** que o preview; meta (title, description, canonical, og/twitter, body class, script de auth quando aplicável); deixar de usar `shared-renderer` heurístico para esses cases.
6. **B15:** cutover documentado; remover `content/work/<slug>.mdx` flat após validação; rollback simples documentado.
7. **B13:** alinhar outline / `splitMdxSections` / IDs com o DOM instrumentado.
8. **B17:** testes de contrato HTTP (work + drafts), manifesto, migração MDX, serialização frontmatter.
9. **B18:** testes de paridade estrutural (HTML legado vs gerado, normalização de atributos voláteis).
10. **B19:** E2E editor `work` (fluxo completo + journal-finder preview vs público).
11. **B16:** mitigar ruído de shell com path com espaço, se ainda afetar comandos.
12. **B20:** completar documentação operacional (draft preview, proteção, rollback) para além do harness.

### 5) Fase 2 — `pages` (só depois da Fase 1 verde)

Só iniciar quando o plano marcar Fase 1 fechada e `HARNESS-F2-1` for aplicável:

- **P1:** `content/pages/<slug>/index.mdx`, ids canónicos, frontmatter.
- **P2:** `/api/editor/pages` completo no wire format (já pode existir stub — completar e testar).
- **P3:** templates fiéis (`about`; `home` opcional conforme decisão documentada).
- **P4:** E2E, cutover, documentação final.

### 6) Verificação contínua

Em cada iteração: implementar → `npm run harness:verify` → `npm run build` → testes → atualizar `v2 copy.md` (HARNESS-DOC1).

### 7) Escopo mínimo de ficheiros a não alargar sem necessidade

Não refactors grandes fora de `editor-sidecar`, `src/portfolio-os-integration`, `scripts/content`, `content/work` / `content/pages`, testes novos, e plano `v2 copy.md`. Preserva o deploy Parcel-only em produção.

---

**Instrução final:** Implementa o backlog na ordem acima até todos os itens P0/P1 do âmbito escolhido estarem verificados e documentados no plano. Se encontrares bloqueio externo (ex.: pacote `portfolio-main`), documenta no «Atualização de status» e propõe workaround mínimo alinhado ao plano.
```

---

## Como usar

- **Fase 1 apenas:** no prompt, substitui o §5 por: “Não iniciar Fase 2 (`pages`); parar após B20 da Fase 1 com plano atualizado.”
- **Incluir este ficheiro no repositório** permite versionar o prompt junto ao harness; o índice em `v2/README.md` pode apontar para aqui se quiseres.
