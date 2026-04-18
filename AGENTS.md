## Learned User Preferences

- Prefere instruções e discussão deste projeto em português.
- Quer subir o ambiente completo (site Parcel + API local do editor) com um único comando na raiz do repositório (`npm start`).
- A implementação e revisões de progresso da integração Portfolio-OS seguem sobretudo `.agent/docs/portfolio-os-integration/v2/v2 copy.md` e o harness v2; documentação legada agregada pode estar em `.agent/docs/portfolio-os-integration.md`. Costuma pedir continuidade explícita quando o trabalho está em curso.
- Ao fechar marcos relevantes da integração v2, espera que a secção «Atualização de status» (e checklists) em `v2 copy.md` reflitam o estado real; `v2.md` como espelho deve permanecer alinhado quando aplicável.

## Learned Workspace Facts

- O plano e backlog executável da integração Portfolio-OS (v2) estão em `.agent/docs/portfolio-os-integration/v2/v2 copy.md`; o harness e critérios `HARNESS-*` em `.agent/docs/portfolio-os-integration/v2/harness/`. A skill do Cursor `portfolio-os-v2-integration` (`.cursor/skills/portfolio-os-v2-integration/SKILL.md`) define o fluxo até implementação + testes conforme o plano.
- `npm start` na raiz executa `node scripts/dev-server.js` e sobe o stack completo (Parcel para o site e API local usada pelo fluxo do editor); portas habituais 1234 para o site e 3001 para a API.
- `npm run harness:verify` na raiz corre o script estático do harness v2 (estrutura, MDX canónico dos três cases, manifesto `work`); não substitui testes HTTP/E2E do plano.
- `npm run test:portfolio-os` na raiz corre testes Node (`tests/portfolio-os-v2/`: manifesto, pipeline de render, migração, serialização, **paridade HTML** `work-html-parity.test.mjs`) e, com `NODE_ENV=development`, testes `tsx` das rotas `editor-sidecar/tests/api-contract.test.ts` (work + drafts); complementam o harness.
- `npm run test:e2e` corre **Playwright** (`playwright.config.ts` na raiz): sobe o **sidecar Next** sozinho (`next dev -p 3001` com CWD `editor-sidecar/`) para o smoke em `tests/e2e/editor-work.spec.ts`. Não substitui o ambiente completo `npm start` (Parcel + API). Em CI usar `CI=1 npx playwright test`; após clone executar `npx playwright install chromium`.
- `npm run dev`, `npm run dev:all` e `npm run dev:generated` sobem só o Parcel em HTTP, sem o processo da API do `dev-server`.
- `npm run start:https` usa Parcel com TLS, esperando `localhost+3.pem` e `localhost+3-key.pem` na raiz do projeto.
- A integração no código do site vive sob `src/portfolio-os-integration/` (incluindo adapters e renderer partilhado).
- O clone costuma residir sob um path com espaço (`Arquivos Locais`); comandos de shell devem usar o path completo entre aspas para evitar falhas.
