# Segurança Operacional (Task 15)

## Backup Antes de Migrar

```bash
# Criar backup antes de qualquer operação crítica
npm run build:legacy
cp -r dist dist-backup-$(date +%Y%m%d)
git add dist-backup-*/
git commit -m "backup: pre-migration"
```

---

## Rollback do Conteúdo

### Opção 1: Git Revert

```bash
# Reverter mudanças de conteúdo
git revert HEAD
git push
```

### Opção 2: Backup restore

```bash
# Restaurar backup
cp -r dist-backup-20240417/* dist/
git add dist/ && git commit -m "restore: rollback from backup"
```

### Opção 3: MDX recover

```bash
# git checkout content/
git checkout HEAD -- content/
```

---

## Proteção Contra Arquivos Corruptos

### Validação de Frontmatter

```javascript
// scripts/content/validate-frontmatter.js
function validateFrontmatter(content) {
  const { data } = parseFrontmatter(content)
  
  const required = ['title', 'slug', 'type', 'status']
  const missing = required.filter(f => !data[f])
  
  if (missing.length) {
    throw new Error(`Missing fields: ${missing.join(', ')}`)
  }
  
  if (!['page', 'work'].includes(data.type)) {
    throw new Error(`Invalid type: ${data.type}`)
  }
  
  if (!['published', 'draft', 'protected'].includes(data.status)) {
    throw new Error(`Invalid status: ${data.status}`)
  }
  
  return true
}
```

### Pre-save hook

```javascript
// No editor, antes de salvar:
await validateFrontmatter(newContent)
```

---

## Impedir Quebra do Site

### Build de segurança

```bash
# Verifica que build funciona antes de commitar
npm run build:content && npm run build:legacy && echo "Build OK"
```

### Verificação pré-deploy

```bash
# Git hook: pre-push
#!/bin/bash
npm run build:content
npm run build:legacy
npx playwright test --grep "critical"
```

---

## Segurança de Arquivos

| Problema | Mitigação |
|---------|-----------|
| MDX inválido | Parse validation |
| Slug duplicado | Uniqueness check |
| Imagem quebrada | Pre-build image check |
| Caminho inseguro | Path sanitization |

### Path Sanitization

```javascript
function sanitizePath(path) {
  // Bloquear "../" que sai do content/
  if (path.includes('..')) {
    throw new Error('Invalid path: parent directory access')
  }
  // Só Allow alphanumeric, "-", "_", "/"
  if (!/^[a-z0-9\/.-]+$/.test(path)) {
    throw new Error('Invalid path characters')
  }
  return path
}
```

---

## Site Funciona Sem Editor

O site final (**não** depende do editor):

```
dist/                    ← HTML gerado, independente
├── index.html          ← funciona sozinho
├── about.html         ← funciona sozinho
└── farfetch-performance.html
```

O editor é **apenas para edição**. O site publicado é HTML estático.

---

## Failures Claras

| Scenario | Mensagem |
|----------|---------|
| Slug duplicado | "Documento com este slug já existe" |
| Arquivo não encontrado | "Documento não encontrado" |
| Frontmatter inválido | "Campos obrigatórios缺少: title, slug, type, status" |
| Build falha | "Build failed: check console" |

---

## Critérios de Aceite

- [x] Caminho de recuperação existe
- [x] Site não depende do editor para publicar
- [x] Gravações inválidas não quebram o repo

---

*Segurança operacional - Task 15*
*Pertence ao plano: portfolio-os-integration.md*
*Definido em: 2026-04-17*