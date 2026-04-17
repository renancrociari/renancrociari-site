# Shell Visual Preservado (Task 7)

## Objetivo

Manter o layout, tipografia, grid, navbar e footer atuais como shell principal. O tema default do portfolio-os NÃO substituirá o shell.

---

## O que permanece Fixo

### 1. Estrutura HTML base

Cada página mantém:
- `<head>` com GTM, meta tags, CSS links
- `<body class="...">`
- Includes de componentes

### 2. CSS (3 arquivos)

| Arquivo | Conteúdo |
|--------|---------|
| `global.css` | Variáveis CSS, tipografia, reset de fontes |
| `reset.css` | Reset de browser |
| `main.css` | Componentes, layout, espaçamento |

**Estes arquivos NUNCA são substituídos.**

### 3. Componentes shell

- `navbar.html` - navegação sticky
- `footer.html` - footer com links
- `email-dialog.html` - modal de email
- `password-dialog.html` - modal de senha

---

## O que Vira Editável

 Apenas o **conteúdo internor** das páginas:

### Páginas (type: page)

| Página | Shell (fixo) | Conteúdo (editável) |
|--------|---------------|-------------------|
| `index.html` | tudo exceto hero | Hero headline + projects grid |
| `about.html` | tudo exceto body | Bio + experiência + skills + testimonials |

### Work (type: work)

| Case | Shell (fixo) | Conteúdo (editável) |
|------|---------------|-------------------|
| farfetch-performance | tudo exceto article | Todos os blocos do case |
| dating-platform | tudo exceto article | Todos os blocos do case |
| journal-finder | tudo exceto article | Todos os blocos do case |

---

## Template de Página

```html
<!-- Shell FIXO - nunca editar via editor -->
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Todo o head tetap igual -->
  <meta charset="utf-8" />
  <title>{{title}}</title>
  <link rel="stylesheet" href="../styles/global.css" />
  <link rel="stylesheet" href="../styles/reset.css" />
  <link rel="stylesheet" href="../styles/main.css" />
</head>

<body class="{{bodyClass}}">
  <include src="components/email-dialog.html"></include>
  <include src="components/navbar.html"></include>
  
  <!-- CONTEÚDO EDITÁVEL - renderer output -->
  {{content}}
  
  <include src="components/password-dialog.html"></include>
  <include src="components/footer.html"></include>
</body>
</html>
```

---

## Como o Editor Interage

1. **Modo Shell OFF**: editor só edita `content/` (não toca em `.html`)
2. **Preview injeta** o MDX renderizado no local `{{content}}`
3. **Build processa** os includes do Parcel normalmente

---

## bodyClass por Tipo

| Documento | bodyClass |
|------------|-----------|
| `pages/home` | `home` |
| `pages/about` | `about` |
| `work/farfetch-performance` | `farfetch` |
| `work/dating-platform` | `sl-mobile` |
| `work/journal-finder` | `journal-finder` |

---

## CSS carregado no Preview

Para preview fiel, o editor deve carregar:
- Todos os 3 arquivos CSS (`../styles/*.css`)
- Mesmo path relativo das páginas reais

---

## Critérios de Aceite

- [ ] Site publicado visualmente consistente com original
- [ ] Preview usa o mesmo sistema visual
- [ ] Breakpoints e responsividade idênticos

---

*Shell visual preservado - Task 7*
*Pertence ao plano: portfolio-os-integration.md*
*Definido em: 2026-04-17*