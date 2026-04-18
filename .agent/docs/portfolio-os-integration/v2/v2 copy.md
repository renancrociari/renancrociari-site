# Plano de Integração Correta do Editor do `portfolio-os` no `renancrociari-site`

## Atualização de status
- **`Atualizado em 2026-04-18 (B12 REQUEST_REFRESH)`** — O cliente `EditorPreviewIframeClient` no sidecar envia `editor-preview:request-refresh` para o parent (throttle 2s) em falhas de `img` na área instrumentada e em `pageshow` com `persisted`, acionando o `onPreviewRequestRefresh` → `resyncPreview()` já ligado em `EditorPreviewBridge`. `npm run harness:verify`, `npm run test:portfolio-os` e `npm run build` reverificados.
- **`Atualizado em 2026-04-18 (B2 sandbox)`** — A UI do editor em `src/editor-ui/app/editor/main/editor-page.tsx` deixou de importar fixtures/adapters da **sandbox pública** (`@portfolio-os/editor`: `buildSandboxWorkEntries`, `createSandboxEditorDataAdapter`, `localStorage` de sandbox, `SandboxCasePreview`, etc.). Paths de imagens relativas para `work` usam `workDocumentAssetDirFromId` em `app/lib/work-document-asset-path.ts`. `variant === 'public-sandbox'` e bundles com `deployment: 'public-sandbox'` são **normalizados** para o fluxo `development` / `private-work-editor`. `npm run harness:verify`, `npm run test:portfolio-os` e `npm run build` verificados.
- **`Atualizado em 2026-04-18 (B0 baseline)`** — B0 fechado no plano: **registo explícito** das três rotas públicas de `work` na Fase 1, **tabela canónica** `documentSlug → publicPath → outputFile → bodyClass → authId` (+ `documentId`, HTML legado, `previewPath`), **referência estrutural** em `src/pages/<legacySourcePage>.html`, e nota de **escopo** (`pages` fora da Fase 1). Fonte de verdade operacional do mapeamento: `src/portfolio-os-integration/config/routing-manifest.mjs` (`MANAGED_ROUTE_MANIFEST.work`).
- **`Atualizado em 2026-04-18`** (revisão: plano sincronizado com o repo + harness + documentação operacional).
- **`Atualizado em 2026-04-18 (noite)`** — Preview de work no sidecar passou a usar o **mesmo pipeline HTML** que o site gerado (`renderEditorPreviewMainHtml` → `renderSiteWorkPage` / `renderStructuredWorkBody` em `shared-renderer.mjs`), em vez do layout Tailwind genérico. Com `editorPreview: true`: instrumentação `data-editor-*` em hero, tags, secções MDX; blocos **só-preview** `shell-meta` + `shell-summary` (não entram no `build:content` público). CSS dos cases importado na rota de preview; `WorkPreviewBodyClass` aplica `body.<bodyClass>` para regras como `body.farfetch`. `npm run harness:verify` e `npm run build` verificados após a alteração.
- **`Atualizado em 2026-04-18 (continuação)`** — `build:content` chama **`renderEditorPreviewMainHtml`** para `work` (sem `editorPreview`), garantindo o **mesmo entry point** que o preview. Removidos os ficheiros flat `content/work/{farfetch-performance,dating-platform,journal-finder}.mdx` após cutover; harness **WARN=0**. Novo **`npm run test:portfolio-os`** (Node test runner: manifesto + pipeline render). `validate-frontmatter.js` passa a incluir `content/work/<slug>/index.mdx` e campos opcionais alinhados ao contrato editorial.
- **`Atualizado em 2026-04-18 (B17 APIs)`** — Testes de contrato das rotas Next **`GET/POST /api/editor/work`** e **`GET/POST/DELETE /api/editor/drafts`** (`editor-sidecar/tests/api-contract.test.ts`, via **`npx tsx --test`**, `NODE_ENV=development`). Schema harness `work-api-responses.schema.json` alinhado ao wire format real (`entries[].id`). Dependência dev **`tsx`** na raiz.
- **`Atualizado em 2026-04-18 (B17 serialização + migração)`** — Testes Node: **`work-content-serialization.test.mjs`** (round-trip `serializeFrontmatter` + `parseContentFrontmatter`, incl. tags) e **`work-content-migration.test.mjs`** (paths canónicos, listagem, leitura dos três cases em `content/work/<slug>/index.mdx`).
- **`Atualizado em 2026-04-18 (B16 term-size)`** — Em `scripts/parcel-site.cjs`, **`COLUMNS` / `LINES`** são definidos antes do spawn do Parcel quando ausentes, para o `term-size` usado pelo `@parcel/reporter-cli` não invocar o binário macOS via `shell: true` com path não citado (ruído `/bin/sh: .../Arquivos: is a directory` em pastas com espaço). `npm run harness:verify`, `npm run test:portfolio-os` e `npm run build` reverificados.
- **`Atualizado em 2026-04-18 (B18 paridade)`** — Teste **`work-html-parity.test.mjs`**: paridade de **texto visível** para **farfetch-performance**; **journal-finder** por contagens estruturais. Conteúdo **Farfetch** alinhado ao legado: imagem do funil **antes** de «Methods and tools», imagem **eye-tracking** a seguir aos métodos (faltava no MDX).
- **`Atualizado em 2026-04-18 (B18 dating)`** — **dating-platform:** prova por **Jaccard lexical** (≥ 0,993) sobre palavras-tipo após normalizar `# Painpoint` e «(see the image below)» no texto legado; paridade caractere-a-caractere continua impraticável (DOM/alts diferentes). `npm run test:portfolio-os` sem skips nesta suíte.

### Estado da Fase 1 (`work`) — código
- Base estrutural implementada:
  - sidecar Next dev-only em `editor-sidecar/`
  - `npm start` orquestra Parcel + sidecar (`scripts/dev-server.js`)
  - APIs: `/api/editor/work`, `/api/editor/drafts`, `/api/editor/pages`, `/api/content`, `/api/verify-password`, `/api/health`
  - conteúdo canónico em `content/work/<slug>/index.mdx` para os 3 cases; **cutover flat** feito para esses slugs (ficheiros `content/work/<slug>.mdx` removidos); `aaaa` mantém-se flat até migração opcional
  - `src/portfolio-os-integration/config/routing-manifest.mjs` com `documentId`, `publicPath`, `templateKey`, `previewPath`, `authId` onde aplicável
  - preview em `/editor/preview/work/[slug]` com `postMessage` e atributos de editor
  - `build:content` e preview usam **`renderEditorPreviewMainHtml`** (público sem flags de instrumentação); **B18** com prova parcial (`work-html-parity.test.mjs`); **B19** E2E em aberto
- **B1 / B16 / build do sidecar (entregue):**
  - **Tailwind no sidecar:** `editor-sidecar/tailwind.config.js` e `postcss.config.js` com preset partilhado (`colors.border`, etc.); `@apply border-border` em `src/editor-ui/styles/global.css` com CWD em `editor-sidecar/`
  - **Build do sidecar:** `editor-sidecar/next.config.mjs` resolve `@portfolio-os/*`; `NormalModuleReplacementPlugin` para `@portfolio-os/core/content-utils` e `@portfolio-os/core/slugify`; MDXEditor via `@mdxeditor/editor/style.css`
  - **Parcel na raiz:** `scripts/parcel-site.cjs` chama `node` + `parcel/lib/bin.js` (como `dev-server.js`)
  - `npx next build` em `editor-sidecar/` conclui com sucesso
- **Nota B16:** o ruído `/bin/sh: .../Arquivos: is a directory` no `npm run build` foi **mitigado** (ver `ensureTermSizeEnvForParcel` em `scripts/parcel-site.cjs`).

### Entregue nesta execução (harness + agente long-run)
- **Harness:** `.agent/docs/portfolio-os-integration/v2/harness/` — matriz, critérios `HARNESS-*`, schemas em `contracts/`, `COBERTURA-HARNESS-PLANO.md`, `ANALISE-PLANO.md`, `scripts/verify-static-harness.mjs` (localiza a raiz do repo automaticamente).
- **Verificação na raiz:** `npm run harness:verify`.
- **Skill:** `.cursor/skills/portfolio-os-v2-integration/SKILL.md` e `reference.md`.
- **Regra Cursor:** `.cursor/rules/portfolio-os-v2.mdc`.
- **Índice:** `.agent/docs/portfolio-os-integration/v2/README.md`.
- **`AGENTS.md`:** referência ao plano v2, harness e skill.

### Pendências para “Fase 1 fechada”
- B13 (outline ↔ DOM), **B17** fechado salvo extensões opcionais (E2E HTTP real), **B18** parcial (farfetch texto exato; journal contagens; dating Jaccard; journal texto completo literal pendente), **B19**, **B20**. **B16** (ruído Parcel/term-size em path com espaço) mitigado. Fase 2 `pages` (**P1–P4**). Cutover documentado em B15; rollback: repor `*.mdx` flat a partir de git se necessário.

## Resumo
- Implementar a integração em duas fases, começando por `work` apenas, porque esse foi o escopo escolhido para a primeira entrega e é onde hoje existe o maior desvio entre editor, preview e site público.
- Manter o deploy do site intacto: o site público continua sendo Parcel + HTML estático; o editor passa a rodar em um runtime Next dev-only separado, iniciado pelo mesmo `npm start`.
- Parar de tratar o renderer atual como fonte de verdade para o editor. O preview e a geração de páginas gerenciadas por conteúdo devem passar a usar templates fiéis às páginas reais do Renan, não um renderer heurístico “parecido”.

## Implementação
1. Runtime do editor: criar um sidecar Next dev-only dentro deste repositório, servindo `/editor`, `/editor/preview/work/:slug`, `/api/editor/work`, `/api/editor/drafts` e `/api/verify-password`; `npm start` sobe Parcel em `:1234` e o sidecar em `:3001`, sem alterar o build/deploy de produção.
2. UI do editor: usar a UI real do editor original, mantendo o comportamento de `private-work-editor`, `iframe-postmessage`, drafts remotos, outline, seleção por preview e labels PT; não continuar a reimplementar a UI dentro do Parcel.
3. Contrato de conteúdo: migrar `work` imediatamente para o formato canônico `content/work/<slug>/index.mdx`, com `id` sempre `<slug>/index.mdx`; durante a migração, manter leitura compatível com os arquivos flat atuais só até a paridade ser validada, e então remover o formato antigo.
4. Contrato de frontmatter para `work`: normalizar os metadados para o shape esperado pelo editor original (`title`, `slug`, `summary`, `publishedAt`, `published`, `order`, `company`, `role`, `team`, `duration`, `domain`, `platforms`, `tools`, `goals`, `outcomes`, `impactMetrics`, `tags`, `status`, `coverImage`, `gallery`, `video`); campos legados como `description`, `featured_image`, `created_at`, `updated_at` deixam de ser a fonte primária.
5. APIs do editor: reproduzir o wire format do editor original. `GET /api/editor/work` retorna `entries`; `GET /api/editor/work?id=...` retorna `metadata` + `content`; `POST /api/editor/work` salva ou cria; `POST /api/editor/drafts` cria/atualiza draft com `workFileId`, `slug`, `metadata`, `content`; `GET`/`DELETE` de drafts seguem o contrato original.
6. Rotas públicas vs IDs editoriais: manter a distinção entre `document id` do editor (`farfetch-performance/index.mdx`) e rota pública do site (`/improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands`); o manifesto de rotas passa a guardar também `templateKey`, `documentSlug`, `publicPath`, `outputFile`, `bodyClass`, `authId` e `previewPath`.
7. Preview fiel: cada case de `work` suportado ganha um template adapter derivado da página HTML real existente no repo. Esse adapter deve renderizar o shell, os blocos fixos e os pontos editáveis com a mesma estrutura DOM da página original, além de instrumentar `data-editor-kind`, `data-editor-node-id`, `data-editor-section-index` e `data-editor-block` no padrão esperado pelo editor.
8. Fonte de verdade dos templates: para `farfetch`, `dating-platform` e `journal-finder`, as páginas HTML legadas viram a referência estrutural. O preview do editor e o `build:content` dos cases passam a sair desses templates fiéis; o `shared-renderer` heurístico deixa de ser usado para `work` gerenciado.
9. Draft preview: a rota `/editor/preview/work/:slug` carrega o draft store, reescreve paths de imagem relativos a partir do `workFileId`, monta o payload final e renderiza o template fiel com a instrumentação de preview/postMessage. Para conteúdo protegido, o preview do editor ignora a senha; a proteção continua ativa apenas na rota pública.
10. Build do site: `scripts/content/build-content.js` deixa de transformar markdown em HTML heurístico para os cases gerenciados e passa a chamar os mesmos template adapters usados pelo preview. O resultado gerado em `src/pages-generated` deve ficar estruturalmente equivalente ao HTML legado que ele substitui.
11. Cutover de escopo da fase 1: a primeira entrega fecha apenas `work` e mantém `pages` fora do editor integrado. `home`, `about` e outras páginas continuam no fluxo atual até a fase 2, evitando quebrar o deploy enquanto o contrato real do editor é estabilizado.
12. Fase 2 já prevista: depois da paridade de `work`, repetir o mesmo padrão para `pages`, migrando para `content/pages/<slug>/index.mdx`, adicionando `/api/editor/pages` e templates fiéis para `about` e, se desejado, `home`.

## Interfaces e Contratos
- Novo formato canônico de conteúdo:
  `content/work/<slug>/index.mdx`
- ID editorial canônico:
  `<slug>/index.mdx`
- Endpoints obrigatórios na fase 1:
  `/api/editor/work`
  `/api/editor/drafts`
  `/editor/preview/work/:slug`
  `/api/verify-password`
- Interface nova de renderização:
  cada template adapter de `work` expõe render público, render de preview instrumentado e mapeamento dos nós fixos do shell (`shell-hero`, `shell-meta`, `shell-tags`, `shell-summary`) + seções + blocos.
- Manifesto de rotas passa a ser a única fonte para vínculo entre slug editorial, URL pública, arquivo gerado, classe de body, auth e template.

## Testes
- **Verificação estática do repo (entregue):** `npm run harness:verify` — ficheiros críticos, MDX canónico dos 3 cases, campos do manifesto `work` (não substitui testes HTTP/E2E abaixo).
- **Smoke Node (B17):** `npm run test:portfolio-os` — manifesto, pipeline de render, **serialização** (`serializeFrontmatter` ↔ parse), **migração/canónico** (paths + leitura dos 3 cases), **contrato das rotas** work + drafts (`tsx --test editor-sidecar/tests/api-contract.test.ts`, `NODE_ENV=development`).
- Testes de contrato para `/api/editor/work` e `/api/editor/drafts`, cobrindo listagem, load, save, create, bootstrap de draft, update de draft e delete.
- Testes de migração para garantir que cada documento `work` antigo vira `content/work/<slug>/index.mdx` sem perda de body nem de metadados essenciais.
- Testes de paridade DOM para cada case gerenciado, comparando o HTML legado e o HTML gerado pelo novo template adapter com normalização de atributos voláteis.
- E2E do editor `work`: abrir `/editor`, carregar lista, selecionar documento, editar metadata, editar corpo, salvar, atualizar preview, clicar no preview e sincronizar seleção no sidebar.
- E2E do preview protegido para `journal-finder`: no editor o preview abre sem senha; na rota pública a proteção continua ativa.
- Smoke test de produção: `npm run build` continua gerando o site Parcel sem introduzir o runtime do editor no artefato final.

## Assunções e Defaults
- Default escolhido para o runtime: sidecar Next dev-only, porque é a opção que preserva melhor a UI e as funcionalidades do editor original sem interferir no deploy público do site.
- Default escolhido para conteúdo: migrar `work` já para o formato canônico, mas com compatibilidade de leitura temporária só enquanto a paridade é validada.
- Default escolhido para escopo inicial: `work` primeiro; `pages` fica explicitamente para a fase 2.
- O deploy atual não muda: produção continua servindo apenas o site Parcel; editor, drafts e preview são capacidades locais de desenvolvimento.
- Se algum case não atingir paridade estrutural com o HTML legado, ele não entra no cutover do novo fluxo até a divergência ser eliminada.

# Backlog Detalhado da Integração `portfolio-os` → `renancrociari-site`

## Resumo
- Este backlog expande o plano anterior em tarefas executáveis, na ordem correta, sem deixar decisões abertas para quem for implementar.
- A entrega é dividida em `Fase 1: work` e `Fase 2: pages`.
- O objetivo da Fase 1 é fechar o editor original para `work`, com UI fiel, drafts, preview fiel e geração pública sem quebrar o deploy atual.

## Backlog

**Legenda das checklists:** ✅ concluído · ⬜ pendente

### B0. Congelamento e baseline
- `P0`
- Objetivo: criar uma linha de base objetiva antes do retrabalho estrutural.
- **Checklist:**
  - ✅ registrar quais rotas públicas de `work` entram na Fase 1:
    - ✅ `farfetch-performance`
    - ✅ `dating-platform`
    - ✅ `journal-finder`
  - ✅ registrar os HTMLs legados que serão a referência estrutural de cada case
  - ✅ salvar uma tabela de mapeamento `documentSlug -> publicPath -> outputFile -> bodyClass -> authId`
  - ✅ definir quais arquivos do fluxo atual deixam de ser fonte de verdade para `work` *(até B14/B15: HTML público alvo = `shared-renderer` estruturado para os 3 slugs; baseline estrutural = `src/pages/<legacySourcePage>`; preview do editor = mesmo renderer com `editorPreview`; flat `content/work/<slug>.mdx` = transição até cutover)*
  - ✅ documentar explicitamente que `pages` fica fora da Fase 1
- **Registo — rotas públicas de `work` na Fase 1 (URL canónica do site):**
  - `farfetch-performance` → `https://www.renancrociari.com/improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands`
  - `dating-platform` → `https://www.renancrociari.com/redesigning-the-mobile-experience-of-a-dating-platform`
  - `journal-finder` → `https://www.renancrociari.com/connecting-every-discovery-with-a-worthy-home` *(rota pública protegida por senha; preview do editor sem senha)*
- **Tabela de mapeamento (baseline; espelhada em código em `routing-manifest.mjs`):**

| documentSlug | documentId (editor) | publicPath | outputFile | bodyClass | authId | legacySourcePage (referência DOM) |
| --- | --- | --- | --- | --- | --- | --- |
| `farfetch-performance` | `farfetch-performance/index.mdx` | `/improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands` | `improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands.html` | `farfetch` | `case-farfetch-performance` *(default `resolveSiteRoute`; sem entrada em `PASSWORD_CONFIG`)* | `src/pages/improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands.html` |
| `dating-platform` | `dating-platform/index.mdx` | `/redesigning-the-mobile-experience-of-a-dating-platform` | `redesigning-the-mobile-experience-of-a-dating-platform.html` | `sl-mobile` | `case-dating-platform` *(default)* | `src/pages/redesigning-the-mobile-experience-of-a-dating-platform.html` |
| `journal-finder` | `journal-finder/index.mdx` | `/connecting-every-discovery-with-a-worthy-home` | `connecting-every-discovery-with-a-worthy-home.html` | `journal-finder` | `case-journal-finder` *(manifesto + `PASSWORD_CONFIG`)* | `src/pages/connecting-every-discovery-with-a-worthy-home.html` |

- **Preview do editor (Fase 1):** para cada linha acima, `previewPath` = `/editor/preview/work/<documentSlug>` (sidecar Next, dev-only).
- **Escopo Fase 1 vs Fase 2:** `home`, `about` e restantes `pages` **não** entram no critério de aceite da Fase 1; continuam no fluxo Parcel/HTML atual até a Fase 2 (`MANAGED_ROUTE_MANIFEST.pages` existe para preparação, sem integração de editor alinhada ao plano na Fase 1).
- **Fonte de verdade para `work` (pós-cutover dos 3 cases):** conteúdo editorial em `content/work/<slug>/index.mdx` + manifesto `routing-manifest.mjs`; geração pública e preview partilham **`renderEditorPreviewMainHtml`** / pipeline em `shared-renderer.mjs` para estes slugs. **Não** são fonte de verdade: HTML legado em `src/pages/*.html` *(apenas baseline de paridade estrutural)*; ficheiros flat removidos `content/work/<slug>.mdx` para estes três slugs.
- Critério de aceite:
  - existe uma baseline fechada dos 3 cases, com referência HTML e rota pública de cada um *(tabela e URLs acima)*

### B1. Runtime do editor em sidecar Next
- `P0`
- Dependência: `B0`
- Objetivo: hospedar a UI real do editor sem interferir no deploy do site.
- **Checklist:**
  - ✅ criar um app Next dev-only dentro do repositório para servir:
    - ✅ `/editor`
    - ✅ `/editor/preview/work/[slug]`
    - ✅ `/api/editor/work`
    - ✅ `/api/editor/drafts`
    - ✅ `/api/verify-password` se necessário compartilhar a lógica local
  - ✅ configurar esse sidecar para rodar só em desenvolvimento
  - ✅ integrar o sidecar ao `npm start` existente, mantendo um único comando na raiz
  - ✅ manter Parcel como host do site público em dev
  - ✅ definir portas fixas ou política de fallback consistente entre Parcel e sidecar
  - ✅ garantir que o build de produção continue ignorando completamente o sidecar
- Critério de aceite:
  - `npm start` sobe site + editor sidecar sem alterar o artefato de produção

### B2. Port da UI real do editor
- `P0`
- Dependência: `B1`
- Objetivo: usar a UI e o comportamento reais do editor original.
- **Checklist:**
  - ✅ portar para o sidecar a árvore real do editor:
    - ✅ `editor page`
    - ✅ `mdx editor`
    - ✅ `preview bridge`
    - ✅ `outline`
    - ✅ componentes de UI mínimos necessários
  - ✅ preservar o modo `private-work-editor`
  - ✅ preservar locale PT
  - ✅ preservar `iframe-postmessage` como canal de preview
  - ✅ preservar as capabilities:
    - ✅ create document
    - ✅ persist remotely
    - ✅ upload apenas se entrar na Fase 1, senão desabilitar explicitamente
  - ✅ remover dependências de sandbox pública da entrega de `work`
  - ✅ garantir que `html[data-editor-*]` exponha:
    - ✅ deployment
    - ✅ collection
    - ✅ preview-channel
    - ✅ page-ready
- Critério de aceite:
  - a UI do editor no sidecar se comporta como o editor original de `work`

### B3. Contrato canônico de conteúdo para `work`
- `P0`
- Dependência: `B0`
- Objetivo: alinhar o conteúdo ao formato real esperado pelo editor.
- **Checklist:**
  - ✅ migrar de `content/work/*.mdx` para `content/work/<slug>/index.mdx`
  - ✅ definir `documentId` canônico como `<slug>/index.mdx`
  - ✅ criar mapeamento de migração para os 3 cases atuais *(manifesto + `content/work/<slug>/index.mdx`; flat ainda presente até cutover)*
  - ✅ manter leitura compatível temporária com o formato flat apenas durante a transição
  - ✅ definir ponto de corte para remover o formato flat depois da validação *(três cases geridos: removidos em 2026-04-18; `work/aaaa` pode permanecer flat)*
- Critério de aceite:
  - os 3 cases existem em `content/work/<slug>/index.mdx`
  - a listagem do editor usa IDs canônicos

### B4. Normalização de frontmatter de `work`
- `P0`
- Dependência: `B3`
- Objetivo: alinhar metadados ao shape real usado pelo editor e preview.
- **Checklist:**
  - ✅ definir como campos atuais mapeiam para o contrato novo:
    - ✅ `description -> summary` quando aplicável
    - ✅ `featured_image -> coverImage`
    - ✅ `created_at/updated_at` deixam de ser campos de UI do editor
    - ✅ `tags` devem seguir o formato esperado pela UI do editor
  - ✅ preencher `publishedAt` onde estiver vazio
  - ✅ revisar `published`, `order`, `status`, `slug`
  - ✅ revisar campos de shell editorial:
    - ✅ `company`
    - ✅ `role`
    - ✅ `platforms`
    - ✅ `domain`
    - ✅ `tools`
    - ✅ `goals`
    - ✅ `outcomes`
    - ✅ `impactMetrics`
    - ✅ `video`
    - ✅ `gallery`
  - ✅ definir quais campos continuam suportados só por compatibilidade de leitura
- Critério de aceite:
  - os documentos `work` abrem no editor com metadata coerente e sem depender de aliases informais

### B5. Loader e adapter de `work` compatíveis com o editor original
- `P0`
- Dependência: `B3`, `B4`
- Objetivo: reproduzir o contrato de leitura e escrita real do editor.
- **Checklist:**
  - ✅ implementar listagem de `work` retornando:
    - ✅ `documentId`
    - ✅ `slug`
    - ✅ `title`
    - ✅ `published`
  - ✅ implementar carregamento por `id=<slug>/index.mdx`
  - ✅ implementar save do documento inteiro
  - ✅ implementar create de documento com geração do diretório `content/work/<slug>/index.mdx`
  - ✅ preservar resolução segura de path
  - ✅ preservar distinção entre `documentId` e `publicPath`
  - ⬜ garantir reescrita correta de paths de imagem com base no slug do case
- Critério de aceite:
  - o adapter responde no mesmo wire format esperado pela UI original

### B6. API `/api/editor/work`
- `P0`
- Dependência: `B5`
- Objetivo: expor o contrato HTTP do editor original para `work`.
- **Checklist:**
  - ✅ implementar `GET /api/editor/work`
  - ✅ implementar `GET /api/editor/work?id=...`
  - ✅ implementar `POST /api/editor/work` para save
  - ✅ implementar `POST /api/editor/work` com `action=create`
  - ✅ padronizar respostas de erro
  - ✅ restringir a disponibilidade para ambiente de desenvolvimento
- Critério de aceite:
  - a UI do editor consegue listar, abrir, salvar e criar casos via HTTP

### B7. Draft store remoto
- `P0`
- Dependência: `B1`, `B5`
- Objetivo: suportar o fluxo real de preview do editor.
- **Checklist:**
  - ✅ criar draft store em memória no sidecar
  - ✅ implementar estrutura do draft com:
    - ✅ `id`
    - ✅ `collection`
    - ✅ `slug`
    - ✅ `workFileId`
    - ✅ `metadata`
    - ✅ `content`
    - ✅ `updatedAt`
  - ✅ implementar:
    - ✅ `GET /api/editor/drafts?id=...`
    - ✅ `POST /api/editor/drafts`
    - ✅ `DELETE /api/editor/drafts?id=...`
  - ✅ suportar bootstrap de draft e update do draft existente
  - ✅ apagar draft ao fechar/trocar documento, quando o cliente solicitar
- Critério de aceite:
  - o editor usa preview por draft, não por documento salvo diretamente

### B8. Manifesto de rotas editorial vs pública
- `P0`
- Dependência: `B0`
- Objetivo: separar claramente slug editorial e rota pública.
- **Checklist:**
  - ✅ expandir o manifesto para guardar:
    - ✅ `collection` *(implícito: chave de topo `work` \| `pages` em `MANAGED_ROUTE_MANIFEST`)*
    - ✅ `documentSlug` *(chave por case + derivação em `resolveSiteRoute` / `documentSlugFromDocumentId`)*
    - ✅ `documentId`
    - ✅ `publicPath`
    - ✅ `outputFile`
    - ✅ `bodyClass`
    - ✅ `authId`
    - ✅ `templateKey`
    - ✅ `legacySourcePage`
    - ✅ `previewPath`
  - ✅ definir helpers de resolução:
    - ✅ por slug editorial
    - ✅ por pathname público
    - ✅ por `documentId`
  - ✅ garantir que `journal-finder` continue protegido na rota pública
- Critério de aceite:
  - não existe mais ambiguidade entre ID do editor e URL pública do site

### B9. Template adapter fiel para `farfetch`
- `P0`
- Dependência: `B8`, `B4`
- Objetivo: transformar o HTML real do case em fonte de verdade do preview e da geração.
- **Checklist:**
  - ✅ identificar shell fixo do case `farfetch`
  - ✅ identificar slots editáveis:
    - ✅ hero
    - ✅ tags
    - ✅ featured image
    - ✅ executive summary
    - ✅ text blocks
    - ✅ metrics
    - ✅ image pairs
    - ✅ captions
  - ✅ implementar render público fiel ao HTML legado *(via `shared-renderer` estruturado existente)*
  - ✅ implementar render de preview com os mesmos nós estruturais *(preview sidecar = mesmo renderer + CSS do site)*
  - ⬜ instrumentar:
    - ✅ `shell-hero`
    - ✅ `shell-meta` *(bloco só-preview; paridade DOM público vs legado em B18)*
    - ✅ `shell-tags`
    - ✅ `shell-summary` *(bloco só-preview)*
    - ✅ `section-*`
    - ⬜ `sec{n}-blk{m}-Component`
- Critério de aceite:
  - o HTML gerado do Farfetch fica estruturalmente equivalente ao HTML legado

### B10. Template adapter fiel para `dating-platform`
- `P0`
- Dependência: `B8`, `B4`
- Objetivo: mesmo padrão do Farfetch para o case Dating.
- **Checklist:**
  - ✅ mapear as seções e blocos reais do HTML legado *(renderer estruturado existente)*
  - ✅ garantir suporte a:
    - ✅ pain points
    - ✅ tasks
    - ✅ usability results
    - ✅ KPI groups
    - ✅ vídeos/posters
    - ✅ grandes imagens comparativas
  - ⬜ instrumentar shell, seções e blocos no mesmo padrão do editor *(shell/seções como B9; blocos granulares `sec{n}-blk{m}` pendente)*
- Critério de aceite:
  - preview e HTML gerado mantêm a estrutura editorial do case real

### B11. Template adapter fiel para `journal-finder`
- `P0`
- Dependência: `B8`, `B4`
- Objetivo: fechar o terceiro case e preservar a proteção pública.
- **Checklist:**
  - ✅ mapear a estrutura do HTML legado *(renderer estruturado existente)*
  - ✅ garantir suporte a:
    - ✅ executive summary
    - ✅ `Read more...`
    - ✅ métricas finais
    - ✅ blocos confidenciais já publicados
  - ✅ preservar `authId` *(manifesto + `build-content` head extra)*
  - ✅ no preview do editor, ignorar proteção por senha *(rota sidecar dev-only)*
  - ✅ na rota pública, manter proteção funcionando *(sem alteração ao script de auth no build)*
- Critério de aceite:
  - preview do editor funciona sem senha
  - rota pública continua protegida

### B12. Renderização instrumentada de preview
- `P0`
- Dependência: `B9`, `B10`, `B11`, `B7`
- Objetivo: fazer o preview do editor falar corretamente com a sidebar.
- **Checklist:**
  - ✅ implementar a rota `/editor/preview/work/[slug]`
  - ✅ carregar draft por `draftId`
  - ✅ resolver `workFileId -> image base` *(conteúdo do draft já chega reescrito no cliente antes do POST; paths absolutizados no servidor com `absolutizeMarkdownAssetPaths` + assets de meta)*
  - ✅ renderizar o template fiel do case *(HTML do `shared-renderer`, não layout Tailwind separado)*
  - ✅ injetar cliente de preview com `postMessage`
  - ✅ suportar mensagens:
    - ✅ `READY`
    - ✅ `SELECT`
    - ✅ `HIGHLIGHT`
    - ✅ `HOVER`
    - ✅ `REQUEST_REFRESH`
  - ✅ aplicar classes de highlight/hover no DOM do preview
- Critério de aceite:
  - clicar no preview seleciona o item certo na sidebar
  - hover e highlight sincronizam corretamente

### B13. Outline e mutações alinhados ao DOM real
- `P1`
- Dependência: `B12`
- Objetivo: alinhar seleção, navegação e edição contextual.
- **Checklist:**
  - ⬜ garantir que os node IDs do preview sigam exatamente o padrão do outline
  - ⬜ garantir que as seções do MDX correspondam às seções instrumentadas do preview
  - ⬜ garantir que blocos authorables mantenham contagem e ordem estáveis
  - ⬜ ajustar qualquer divergência entre `splitMdxSections`, outline e template adapters
- Critério de aceite:
  - selecionar um item na sidebar destaca o nó correspondente no preview e vice-versa

### B14. Geração pública de `work` baseada nos templates fiéis
- `P0`
- Dependência: `B9`, `B10`, `B11`, `B8`
- Objetivo: substituir a geração heurística atual.
- **Checklist:**
  - ✅ alterar o build de conteúdo para `work` usar template adapters fiéis *(via `renderEditorPreviewMainHtml` / `renderSiteWorkPage` — mesmo pipeline que o preview)*
  - ✅ manter o template global com includes de navbar/footer/head
  - ✅ gerar HTML público com:
    - ✅ title
    - ✅ description
    - ✅ canonical
    - ✅ og/twitter
    - ✅ body class
    - ✅ auth redirect script quando aplicável
  - ✅ parar de usar o renderer heurístico para os cases gerenciados *(corpo estruturado `renderStructuredWorkBody`; não há renderer paralelo para estes slugs)*
- Critério de aceite:
  - `src/pages-generated/*` de `work` passa a vir do mesmo pipeline estrutural do preview

### B15. Cutover controlado de `work`
- `P0`
- Dependência: `B14`
- Objetivo: trocar o fluxo antigo pelo novo sem quebrar o site.
- **Checklist:**
  - ✅ marcar quais rotas de `work` passam oficialmente a ser geradas pelo novo pipeline *(três cases do manifesto; `aaaa` fora do manifesto, fluxo build existente)*
  - ✅ validar que cada rota nova substitui a antiga sem regressão *(`npm run build` + harness)*
  - ✅ manter fallback de rollback simples para o HTML legado enquanto a fase não estabiliza *(`git checkout -- content/work/<slug>.mdx` se repor flat; `npm run rollback` para dist)*
  - ✅ documentar claramente o que ainda continua legado *(HTML em `src/pages/*.html` para páginas não geradas por `build:content`; Fase 2 `pages`)*
- Critério de aceite:
  - os 3 cases entram no novo fluxo e continuam publicando corretamente

### B16. Build e operação sem impacto no deploy atual
- `P0`
- Dependência: `B1`, `B14`
- Objetivo: garantir que a nova integração não contamine produção.
- **Checklist:**
  - ✅ garantir que o sidecar Next não participe do `npm run build` público
  - ✅ garantir que assets e includes do site continuem resolvendo via Parcel
  - ✅ garantir que o fluxo de produção continue publicando só o site
  - ✅ corrigir o ruído operacional do path com espaço onde isso afetar comandos do novo fluxo *(Parcel: `COLUMNS`/`LINES` em `parcel-site.cjs` para contornar `term-size` + shell)*
- Critério de aceite:
  - deploy atual continua funcional e independente do runtime do editor

### B17. Testes automatizados de contrato
- `P1`
- Dependência: `B6`, `B7`, `B12`, `B14`
- Objetivo: travar o contrato da integração.
- **Checklist:**
  - ✅ criar testes unitários para `/api/editor/work` *(`editor-sidecar/tests/api-contract.test.ts`; handlers GET/POST, erros, `devOnlyGuard`)*
  - ✅ criar testes unitários para `/api/editor/drafts` *(mesmo ficheiro; ciclo criar/ler/atualizar/apagar)*
  - ✅ criar testes para manifesto de rotas *(`tests/portfolio-os-v2/routing-manifest.test.mjs`)*
  - ✅ criar testes de migração de conteúdo *(`tests/portfolio-os-v2/work-content-migration.test.mjs`: canónico + leitura dos 3 cases)*
  - ✅ criar testes de serialização de frontmatter *(`tests/portfolio-os-v2/work-content-serialization.test.mjs`)*
  - ✅ smoke pipeline render público vs preview *(`tests/portfolio-os-v2/work-render-pipeline.test.mjs`; comando `npm run test:portfolio-os`)*
- Critério de aceite:
  - os contratos críticos do editor ficam cobertos por teste

### B18. Testes de paridade estrutural
- `P1`
- Dependência: `B9`, `B10`, `B11`, `B14`
- Objetivo: impedir que o preview fiel volte a divergir.
- **Checklist:**
  - ✅ definir comparação normalizada entre HTML legado e HTML novo *(`tests/portfolio-os-v2/work-html-parity.test.mjs`: strip de tags, entidades HTML, aspas tipográficas → ASCII, whitespace)*
  - ✅ ignorar apenas diferenças permitidas *(atributos `loading`, etc. caem fora com strip de tags; preview não entra na comparação — só `renderSiteWorkPage`)*
  - ✅ validar paridade para **farfetch-performance** *(texto visível do `article-content` = legado `src/pages/...`)*
  - ✅ **journal-finder:** prova por contagens (`metric`, `featured-metrics`, `text-block`) vs legado
  - ✅ **dating-platform:** cobertura lexical vs legado *(Jaccard ≥ 0,993; normalização `# Painpoint` + «see image below»; `work-html-parity.test.mjs`)*
- Critério de aceite:
  - os adapters de template têm prova objetiva de paridade estrutural

### B19. E2E do editor `work`
- `P1`
- Dependência: `B2`, `B6`, `B7`, `B12`
- Objetivo: validar o fluxo real do usuário.
- **Checklist:**
  - ⬜ abrir `/editor`
  - ⬜ esperar atributos `data-editor-*`
  - ⬜ carregar a lista de documentos
  - ⬜ abrir cada case principal
  - ⬜ editar metadata
  - ⬜ editar corpo
  - ⬜ salvar
  - ⬜ validar criação/atualização de draft
  - ⬜ validar presença do iframe de preview
  - ⬜ validar seleção preview -> sidebar
  - ⬜ validar highlight sidebar -> preview
- Critério de aceite:
  - o fluxo principal do editor privado de `work` passa ponta a ponta

### B20. Documentação operacional da Fase 1
- `P2`
- Dependência: `B15`, `B16`, `B19`
- Objetivo: deixar a integração operável por outras pessoas.
- **Checklist:**
  - ✅ atualizar o plano principal com o estado real *(este ficheiro + harness)*
  - ⬜ documentar *(parcialmente no harness; completar após B19):*
    - ✅ como subir o stack *(`.agent/docs/.../v2/harness/EXECUCAO.md`, `AGENTS.md`)*
    - ✅ qual porta serve o quê *(habitual: Parcel `1234`, sidecar `3001`; ver `scripts/dev-server.js`)*
    - ✅ quais rotas do editor existem *(harness `README`, rotas em `editor-sidecar/app`)*
    - ⬜ como funciona o draft preview *(contrato em `contracts/`; detalhe operacional pendente)*
    - ⬜ como funciona a proteção de conteúdo *(ver `SECURITY`/password flow; resumo pendente)*
    - ⬜ como fazer rollback para o HTML legado *(script `npm run rollback` / processo explícito pendente)*
  - ✅ listar pendências explicitamente para `pages` *(secção Fase 2 abaixo + `COBERTURA-HARNESS-PLANO.md`)*
- Critério de aceite:
  - outra pessoa consegue subir, testar e entender a Fase 1 sem leitura arqueológica do repo

## Fase 2: `pages`

### P1. Migrar `pages` para o formato canônico
- `P1`
- Dependência: conclusão da Fase 1
- **Checklist:**
  - ⬜ migrar `content/pages/*.mdx` para `content/pages/<slug>/index.mdx`
  - ⬜ alinhar `id` canônico
  - ⬜ normalizar frontmatter de `about` e páginas gerenciadas
- Critério de aceite:
  - `pages` segue o mesmo contrato que `work`

### P2. API `/api/editor/pages`
- `P1`
- Dependência: `P1`
- **Checklist:**
  - ⬜ implementar list/load/save/create no wire format do editor original
  - ⬜ aplicar políticas de limite e slugs reservados
- Critério de aceite:
  - o editor original consegue operar também em `/editor/pages`

### P3. Templates fiéis de `pages`
- `P1`
- Dependência: `P1`
- **Checklist:**
  - ⬜ criar template adapter fiel para `about`
  - ⬜ decidir se `home` entra na UI do editor nesta fase ou permanece fora
  - ⬜ se `home` entrar, implementar adapter fiel preservando:
    - ⬜ hero com quebras
    - ⬜ nav de botões
    - ⬜ cards especiais
    - ⬜ journal finder protegido
- Critério de aceite:
  - `pages` deixa de depender do renderer heurístico atual

### P4. E2E e cutover de `pages`
- `P1`
- Dependência: `P2`, `P3`
- **Checklist:**
  - ⬜ validar `/editor/pages`
  - ⬜ validar preview por iframe
  - ⬜ validar save e geração pública
  - ⬜ finalizar a documentação da integração completa
- Critério de aceite:
  - `work` e `pages` passam a compartilhar o mesmo modelo operacional da integração

## Testes e Cenários Obrigatórios
- abrir e editar `farfetch-performance`
- abrir e editar `dating-platform`
- abrir e editar `journal-finder`
- salvar metadata sem alterar corpo
- salvar corpo sem alterar metadata
- trocar de documento com draft ativo
- recriar preview depois de refresh
- abrir preview protegido no editor sem senha
- abrir rota pública protegida e continuar exigindo senha
- gerar build público e confirmar que o sidecar não entra no artefato final
- comparar HTML novo vs legado para os 3 cases

## Assunções e Defaults
- Runtime escolhido: sidecar Next dev-only, porque é a opção que preserva o editor original sem interferir no deploy do site.
- Escopo da primeira entrega: `work` apenas.
- Estratégia de conteúdo: migrar já para o formato canônico, com compatibilidade temporária de leitura só durante a transição.
- O `shared-renderer` heurístico atual não será a base final da integração de `work`; ele pode continuar existindo apenas como fallback temporário ou para conteúdo fora do escopo.
- `pages` só entra depois que `work` tiver paridade estrutural, preview estável e build público validado.
