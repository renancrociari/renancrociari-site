# Integração do `portfolio-os` ao `renancrociari-site` como workspace local

## Resumo
A integração deve transformar o `renancrociari-site` no repositório operacional principal, consumindo o `portfolio-os` como **workspace local** para contrato de conteúdo, editor e renderer compartilhado.

O objetivo é preservar a estrutura visual e o deploy atual do site, enquanto o conteúdo passa a ser editável via `portfolio-os` com **preview fiel ao site real**.

## Mudanças principais
- **Workspace local**
  - O `renancrociari-site` passa a apontar para o `portfolio-os` via workspace local no próprio ambiente de desenvolvimento.
  - Consumir apenas os packages necessários, não o monorepo inteiro como runtime do site.
- **Contrato editorial**
  - Migrar o conteúdo existente para o formato canónico do `portfolio-os`:
    - `content/pages/*`
    - `content/work/*`
  - Manter o shell e a identidade visual atuais do site.
- **Renderer compartilhado**
  - Criar um renderer único usado por:
    - site público
    - preview do editor
  - O preview não pode ter uma renderização paralela ou simplificada.
- **Editor integrado**
  - Usar o editor do `portfolio-os` para ler/gravar os arquivos do `renancrociari-site`.
  - O editor opera sobre os mesmos documentos que alimentam o site publicado.
- **Preview fiel**
  - Reutilizar os mesmos componentes, CSS e regras de resolução de paths do site real.
  - Preview deve ser equivalente ao HTML publicado, não apenas “parecido”.

## Como o workspace local entra
1. **Adicionar o `portfolio-os` como dependência local**
   - O `renancrociari-site` passa a resolver os packages do `portfolio-os` a partir de um path local de workspace.
   - Isso permite iterar em contratos, blocks e editor sem publicar pacote.

2. **Consumir só o necessário**
   - No site original, importar apenas:
     - `core` para tipos, content loader e slug/contracts
     - `blocks` para registry editorial
     - `editor` para mutações, adapters e preview plumbing
   - O tema default só entra se algum componente for reaproveitado explicitamente; o shell principal continua sendo o do site existente.

3. **Manter o repo original como app principal**
   - O build, deploy e páginas continuam no `renancrociari-site`.
   - O `portfolio-os` vira biblioteca local de capacidades, não o host da aplicação final.

## Plano de implementação
1. **Inventário do site atual**
   - Mapear páginas, includes, componentes repetidos, assets e regras de navegação.
   - Separar o que é conteúdo editável do que é shell visual.

2. **Configurar o workspace local**
   - Fazer o `renancrociari-site` resolver o `portfolio-os` localmente.
   - Garantir que scripts de dev/build enxerguem os packages sem publicar nada.

3. **Definir o contrato de conteúdo**
   - Migrar o conteúdo para MDX com frontmatter canónico.
   - Definir quais páginas viram `pages` e quais viram `work`.

4. **Criar o adapter do repositório**
   - Implementar leitura, escrita e listagem dos documentos no formato esperado pelo editor.
   - Garantir compatibilidade com paths de imagens e slugs atuais.

5. **Extrair renderer compartilhado**
   - Centralizar a conversão de conteúdo em markup final.
   - Reusar esse renderer no site publicado e no preview.

6. **Integrar o editor**
   - Conectar a UI do editor ao adapter do repo original.
   - Gravação deve atualizar o conteúdo do próprio `renancrociari-site`.

7. **Garantir preview fiel**
   - Usar o mesmo CSS, os mesmos partials e o mesmo mapeamento de blocos.
   - Validar que o preview reproduz o layout final sem divergência estrutural.

8. **Migrar e validar conteúdo**
   - Converter páginas existentes.
   - Verificar rota, renderização, imagens, links e responsividade.
   - Corrigir qualquer diferença no renderer compartilhado, não no preview.

## Critérios de aceite
- O `renancrociari-site` roda e publica como antes.
- O conteúdo passa a ser editável via `portfolio-os`.
- O `portfolio-os` é consumido como **workspace local**.
- Preview do editor e site público compartilham o mesmo renderer.
- O preview é visualmente fiel ao site real.
- Não há necessidade de reescrever o site em Next.js.

## Riscos e mitigação
- **Drift entre preview e produção**
  - Mitigação: uma única camada de renderização compartilhada.
- **Quebra de layout ao mover conteúdo para MDX**
  - Mitigação: migrar incrementalmente e validar página por página.
- **Dependência demais do tema default**
  - Mitigação: manter o shell do site original como fonte visual primária.
- **Acoplamento frágil ao workspace local**
  - Mitigação: definir interfaces claras e evitar imports profundos entre packages.

## Suposições
- O objetivo é preservar a estrutura existente do `renancrociari-site`.
- O preview fiel é requisito obrigatório, não um bônus.
- O repo original continua sendo o host final do site publicado.
- O `portfolio-os` entra como workspace local para desenvolvimento, edição e renderização compartilhada, não como substituto do site.

# Tasks

Abaixo está o backlog técnico priorizado para implementar o plano no `renancrociari-site`, usando `portfolio-os` como workspace local.

**Legenda**
- `P0`: bloqueador para o resto
- `P1`: necessário para a entrega principal
- `P2`: importante, mas pode entrar depois do núcleo
- `P3`: melhoria/robustez

**1. Workspace local do `portfolio-os`**
- Prioridade: `P0`
- Dependências: nenhuma
- Tarefas:
  - adicionar o `portfolio-os` ao ambiente local do repo original
  - configurar resolução dos packages necessários
  - ajustar scripts de dev/build para consumir o workspace local
- Critérios de aceite:
  - o repo original consegue importar `@portfolio-os/core`, `@portfolio-os/blocks` e `@portfolio-os/editor`
  - `install`, `dev` e `build` funcionam sem publicar pacote
  - nenhuma funcionalidade depende de download remoto do `portfolio-os`

**2. Inventário do site atual**
- Prioridade: `P0`
- Dependências: nenhuma
- Tarefas:
  - mapear páginas HTML existentes
  - identificar includes, componentes, navegação, hero, footer e cards
  - listar assets e fontes de conteúdo por página
  - separar shell fixo de conteúdo editável
- Critérios de aceite:
  - existe um mapa claro do que será conteúdo e do que permanecerá shell
  - todas as rotas atuais relevantes estão catalogadas
  - os assets necessários para o preview estão identificados

**3. Contrato de conteúdo**
- Prioridade: `P0`
- Dependências: `2`
- Tarefas:
  - definir o esquema canónico de `pages` e `work`
  - padronizar frontmatter, slug, SEO, status e ordem
  - definir política de imagens e caminhos
  - mapear conteúdo atual para o novo contrato
- Critérios de aceite:
  - há um schema único para os documentos
  - fica claro o que vai para `content/pages/*` e `content/work/*`
  - o conteúdo atual pode ser convertido sem ambiguidade

**4. Estratégia de compatibilidade de blocos**
- Prioridade: `P1`
- Dependências: `1`, `3`
- Tarefas:
  - listar blocos do `portfolio-os` que o site realmente suporta
  - definir equivalentes simples para blocos sem match visual
  - bloquear ou degradar blocos avançados sem suporte real
- Critérios de aceite:
  - não há blocos que o preview renderize e o site real não consiga publicar
  - existe fallback explícito para incompatibilidades
  - o catálogo suportado está documentado

**5. Migração de conteúdo**
- Prioridade: `P1`
- Dependências: `3`
- Tarefas:
  - converter conteúdo atual para MDX canónico
  - criar estrutura `content/pages` e `content/work`
  - migrar metadados e assets
  - corrigir links e referências internas
- Critérios de aceite:
  - o conteúdo antigo existe no novo formato
  - nenhuma página perdeu informação essencial
  - os caminhos de imagem continuam válidos

**6. Renderer compartilhado**
- Prioridade: `P0`
- Dependências: `1`, `3`, `4`
- Tarefas:
  - extrair a renderização para uma camada comum
  - garantir mesma saída para site público e preview
  - centralizar resolução de headings, blocos e assets
- Critérios de aceite:
  - o preview e a página pública usam o mesmo renderer
  - não existe implementação paralela de renderização
  - a saída HTML é estruturalmente equivalente nos dois contextos

**7. Shell visual preservado**
- Prioridade: `P0`
- Dependências: `2`, `6`
- Tarefas:
  - manter layout, tipografia, grid, navbar e footer atuais
  - impedir que o tema default do `portfolio-os` vire shell principal
  - garantir carregamento das mesmas folhas de estilo no preview
- Critérios de aceite:
  - o site publicado continua visualmente consistente com o original
  - o preview usa o mesmo sistema visual
  - breakpoints e responsividade se comportam igual

**8. Adapter de leitura**
- Prioridade: `P0`
- Dependências: `1`, `3`
- Tarefas:
  - listar documentos do repo original
  - ler documento por slug/ID
  - expor metadados e conteúdo ao editor
  - resolver paths de imagens
- Critérios de aceite:
  - o editor consegue abrir conteúdo real do repo
  - a listagem reflete o estado atual do site
  - os assets aparecem corretamente no preview

**9. Adapter de escrita**
- Prioridade: `P1`
- Dependências: `1`, `3`, `8`
- Tarefas:
  - salvar conteúdo no formato do repo original
  - atualizar frontmatter sem corromper MDX
  - criar novos documentos de `pages` e `work`
  - definir falhas claras para slugs inválidos ou arquivos ausentes
- Critérios de aceite:
  - editar e salvar altera os arquivos corretos do repo
  - o MDX continua válido após gravação
  - documentos novos podem ser criados com segurança

**10. Integração do editor**
- Prioridade: `P0`
- Dependências: `1`, `6`, `8`, `9`
- Tarefas:
  - conectar a UI do editor aos adapters do repo original
  - abrir documentos do `renancrociari-site`
  - persistir alterações no próprio repo
  - manter a lista de documentos sincronizada com o conteúdo real
- Critérios de aceite:
  - o editor consegue editar conteúdo real do site
  - salvar no editor altera o conteúdo publicado
  - a navegação do editor reflete o conteúdo do repo

**11. Preview fiel**
- Prioridade: `P0`
- Dependências: `6`, `7`, `8`
- Tarefas:
  - apontar preview para o renderer compartilhado
  - carregar o CSS real do site
  - garantir mesmas imagens, links e componentes
  - validar que não existe renderer simplificado
- Critérios de aceite:
  - o preview bate visualmente com a versão publicada
  - o preview usa o mesmo shell do site real
  - alterações no editor aparecem no preview sem diferença estrutural

**12. Build e geração**
- Prioridade: `P1`
- Dependências: `5`, `6`, `7`
- Tarefas:
  - criar script de build para conteúdo editorial
  - integrar ao pipeline atual do Parcel
  - copiar/servir assets nos mesmos caminhos
  - garantir que o artefato final continue publicável como hoje
- Critérios de aceite:
  - build gera o site final sem quebrar o deploy
  - conteúdo editável entra no bundle final
  - caminhos públicos continuam estáveis

**13. Rotas e navegação**
- Prioridade: `P1`
- Dependências: `3`, `5`, `7`
- Tarefas:
  - preservar URLs atuais
  - mapear novas páginas para rotas equivalentes
  - manter navegação, breadcrumbs e 404
  - validar que páginas novas não quebram o routing
- Critérios de aceite:
  - as rotas existentes continuam funcionando
  - novas páginas publicadas aparecem nas rotas esperadas
  - fallback/404 continua correto

**14. Validação visual e funcional**
- Prioridade: `P0`
- Dependências: `6`, `7`, `10`, `11`, `12`, `13`
- Tarefas:
  - comparar preview com página pública
  - validar HTML, tipografia, espaçamento e hierarquia
  - validar responsividade
  - validar imagens, links e embeds
- Critérios de aceite:
  - preview e site publicado são equivalentes
  - não há regressões visuais críticas
  - blocos e imagens se comportam de forma consistente

**15. Segurança operacional e rollback**
- Prioridade: `P2`
- Dependências: `9`, `10`, `12`
- Tarefas:
  - garantir backup antes de migrar conteúdo
  - definir rollback do conteúdo em caso de falha
  - impedir corrupção de arquivos pelo editor
  - garantir que o site continua publicável mesmo sem o editor
- Critérios de aceite:
  - existe caminho de recuperação se a edição falhar
  - o site não depende do editor para publicar
  - gravações inválidas não quebram o repo

**16. Documentação operacional**
- Prioridade: `P2`
- Dependências: `1`, `10`, `11`, `12`
- Tarefas:
  - documentar instalação do workspace local
  - documentar fluxo de edição
  - documentar preview fiel
  - documentar inclusão de novas páginas/cases
- Critérios de aceite:
  - alguém novo consegue rodar o fluxo sem contexto extra
  - os passos de edição e preview estão claros
  - o processo de migração está reproduzível

## Ordem recomendada de execução

1. `1` Workspace local
2. `2` Inventário do site
3. `3` Contrato de conteúdo
4. `4` Compatibilidade de blocos
5. `6` Renderer compartilhado
6. `7` Shell visual preservado
7. `8` Adapter de leitura
8. `9` Adapter de escrita
9. `10` Integração do editor
10. `11` Preview fiel
11. `5` Migração de conteúdo
12. `12` Build e geração
13. `13` Rotas e navegação
14. `14` Validação visual e funcional
15. `15` Segurança operacional
16. `16` Documentação operacional

## Dependências críticas
- O item mais bloqueador é o **renderer compartilhado**: sem ele, preview fiel vira aproximação.
- O segundo bloqueador é o **workspace local**: sem isso, o `portfolio-os` não entra no repo original com ciclo de desenvolvimento viável.
- O terceiro ponto crítico é o **contrato de conteúdo**: sem ele, a migração vira ad hoc e frágil.

Se quiser, eu posso transformar isso em um backlog mais operacional ainda, no formato:
- `task`
- `owner`
- `estimate`
- `blocked_by`
- `done_when`

para você já usar como checklist de implementação.