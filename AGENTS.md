## Learned User Preferences

- Prefere instruções e discussão deste projeto em português.
- Quer subir o ambiente completo (site Parcel + API local do editor) com um único comando na raiz do repositório (`npm start`).
- A implementação e revisões de progresso costumam seguir o plano e backlog em `.agent/docs/portfolio-os-integration.md`, com pedidos explícitos de continuidade quando o trabalho está em curso.

## Learned Workspace Facts

- O plano e backlog executável da integração Portfolio-OS estão em `.agent/docs/portfolio-os-integration.md`.
- `npm start` na raiz executa `node scripts/dev-server.js` e sobe o stack completo (Parcel para o site e API local usada pelo fluxo do editor); portas habituais 1234 para o site e 3001 para a API.
- `npm run dev`, `npm run dev:all` e `npm run dev:generated` sobem só o Parcel em HTTP, sem o processo da API do `dev-server`.
- `npm run start:https` usa Parcel com TLS, esperando `localhost+3.pem` e `localhost+3-key.pem` na raiz do projeto.
- A integração no código do site vive sob `src/portfolio-os-integration/` (incluindo adapters e renderer partilhado).
- O clone costuma residir sob um path com espaço (`Arquivos Locais`); comandos de shell devem usar o path completo entre aspas para evitar falhas.
