# Validação Visual e Funcional (Task 14)

## Checkpoints de Validação

### 1. Preview vs Site Publicado

| Aspecto | Método | Critério |
|--------|--------|---------|
| Layout | Screenshot comparison | Pixel-perfect |
| Tipografia | Inspecionar CSS | Fontes idênticos |
| Espaçamento | Medir margins/padding | Iguais |
| Imagens | Verificar paths | Carregam |

### 2. HTML Estrutural

```bash
# Comparar HTML gerado vs original
diff -u <(cat dist/index.html) <(curl -s http://localhost:1234/ | head -100)
```

### 3. Tipografia

```css
/* Verificar que classes batem */
.display-xl     → font-size: 48px
.display-lg     → font-size: 36px
.body-medium   → font-size: 16px
.t-gray-200    → color: #2a2a2a
.t-green-light → color: #38C545
```

### 4. Componentes check

| Componente | CSS Class | Presente? |
|-----------|---------|----------|
| Hero | `.hero` | ✅ |
| Featured Image | `.featured-image` | ✅ |
| Navbar | `.navbar` | ✅ |
| Footer | `.footer` | ✅ |
| Tags | `.tag` | ✅ |
| Metrics | `.featured-metrics` | ✅ |

---

## Testes Automatizados

### Visual Regression

```javascript
// scripts/visual-test.js
import { chromium } from 'playwright'

async function validatePage(url, screenshotName) {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  await page.goto(url)
  
  // Screenshot para comparação
  await page.screenshot({ path: `tests/screenshots/${screenshotName}.png` })
  
  // Verificar elementos
  const hero = await page.$('.hero')
  const navbar = await page.$('.navbar')
  const footer = await page.$('.footer')
  
  console.log({
    hero: !!hero,
    navbar: !!navbar,
    footer: !!footer,
  })
  
  await browser.close()
}

await validatePage('http://localhost:1234/', 'home')
await validatePage('http://localhost:1234/about', 'about')
await validatePage('http://localhost:1234/farfetch-performance', 'farfetch')
```

### Responsividade

```javascript
// Testar breakpoints
const viewports = [
  { width: 375, name: 'mobile' },
  { width: 768, name: 'tablet' },
  { width: 1024, name: 'desktop' },
  { width: 1440, name: 'wide' },
]

for (const vp of viewports) {
  await page.setViewportSize({ width: vp.width, height: 900 })
  await page.screenshot({ path: `tests/screenshots/${vp.name}.png` })
}
```

---

## Checklist de Validação

### Home Page (`/`)

- [ ] Hero headline "Great questions drive transformation"
- [ ] Subtítulo com bio
- [ ] Navegação (Home, About, Resumé, LinkedIn, Email)
- [ ] 4 project cards visíveis
- [ ] Footer com links sociais

### About Page (`/about`)

- [ ] Hero headline com description
- [ ] Featured image do Renan
- [ ] Seção "Who am I?"
- [ ] Experiência (4 collapsing details)
- [ ] Skills (tags)
- [ ] Testimonials (4)

### Work Page (`/work/{slug}`)

- [ ] Hero headline (h1)
- [ ] Tags (skills)
- [ ] Featured image
- [ ] Executive Summary (grid de 4)
- [ ] Corpo do case
- [ ] Imagens inline
- [ ] Featured metrics (se houver)
- [ ] Footer

---

## Imagens e Assets

```bash
# Verificar todas imagens carregam
# Executar no browser console:
const images = document.querySelectorAll('img')
const broken = []
for (const img of images) {
  if (!img.complete || img.naturalWidth === 0) {
    broken.push(img.src)
  }
}
console.log(broken)
```

---

## Links

```bash
# Verificar links internos
const links = document.querySelectorAll('a[href^="/"]')
for (const link of links) {
  const href = link.getAttribute('href')
  const response = await fetch(href)
  if (!response.ok) {
    console.log('Broken:', href)
  }
}
```

---

## Performance

```bash
# Lighthouse CI
npx lighthouse http://localhost:1234/ \
  --output json \
  --output-path tests/lighthouse-home.json \
  --chrome-flags="--headless" \
  --quiet
```

---

## Scripts de Teste

```bash
# package.json
{
  "scripts": {
    "test:visual": "npx playwright test",
    "test:links": "node scripts/test-links.js",
    "test:images": "node scripts/test-images.js"
  }
}
```

---

## Critérios de Aceite

- [x] Preview e site publicado são equivalentes
- [x] Não há regressões visuais críticas
- [x] Blocos e imagens se comportam de forma consistente

---

*Validação visual e funcional - Task 14*
*Pertence ao plano: portfolio-os-integration.md*
*Definido em: 2026-04-17*