# Build e Geração (Task 12)

## Atual

O site atual usa **Parcel** para build:
- Input: `src/pages/*.html`
- Output: `dist/`
- Processa includes via `posthtml-include`

```bash
npm run build
# → parcel build src/pages/*.html --dist-dir ./dist
# → cp -r public/downloads dist/downloads
# → cp -r public/images dist/images
# → node scripts/fix-paths.js
```

---

## Nova Integração: MDX → HTML

O pipeline completo fica:

```
1. content/work/*.md    ← Editor salva aquí
   content/pages/*.md
   
2. scripts/content/build-content.js  ← Converte MDX → HTML
   → src/pages-generated/
   
3. Parcel processa:
   - src/pages/*.html (original)
   - src/pages-generated/*.html (gerado de MDX)
   
4. Output: dist/
```

---

## Build Script (Atualizado)

```bash
# novo build script
npm run build
# 1. Gera HTML a partir do MDX (se houver alterações)
node scripts/content/build-content.js

# 2. Parcel build (ambos orig + gerado)
parcel build src/pages/*.html src/pages-generated/*.html \
  --dist-dir ./dist \
  --public-url ./ 

# 3. Copia assets
cp -r public/downloads dist/downloads
cp -r public/images dist/images
cp public/.htaccess dist/.htaccess

# 4. Corrige paths
node scripts/fix-paths.js
```

---

## Novo Scripts: package.json

```json
{
  "scripts": {
    "dev": "parcel src/pages/*.html",
    "dev:generated": "parcel src/pages-generated/*.html",
    "dev:all": "parcel src/pages/*.html src/pages-generated/*.html",
    "build:content": "node scripts/content/build-content.js",
    "build": "npm run build:content && parcel build src/pages/*.html src/pages-generated/*.html --dist-dir ./dist --public-url ./ && cp -r public/downloads dist/downloads && cp -r public/images dist/images && cp public/.htaccess dist/.htaccess && node scripts/fix-paths.js",
    "build:legacy": "parcel build src/pages/*.html --dist-dir ./dist --public-url ./ && cp -r public/downloads dist/downloads && cp -r public/images dist/images && cp public/.htaccess dist/.htaccess && node scripts/fix-paths.js"
  }
}
```

---

## Diferença: Legacy vs Novo

|Modo|Input|Output|
|-----|-----|------|
|Legado (build:legacy)|src/pages/*.html|dist/* (HTML original)|
|Novo (build)|src/pages/*.html + content/*|dist/* (MDX → HTML gerado)|

---

## Fluxo: Editor Publica

```
1. Editor modifica content/work/farfetch-performance.md
2. Salvar → arquivo MDX atualizado
3. npm run build:content  → gera HTML em src/pages-generated/
4. npm run build      → Parcel processa gerado + legacy
5. dist/ contains página atualizada
6. git add dist/ && git commit && git push
```

---

## Ganchos (hooks)

Para automatizar:

```json
{
  "scripts": {
    "prebuild": "node scripts/content/build-content.js --check"
  }
}
```

 `--check` verifica se MDX mudou desde último build.

---

## Assets

|Path original|Copy no build|
|-----------|------------|
|public/downloads/*|dist/downloads/*|
|public/images/*|dist/images/*|

Imagens em MDX (`../images/case-farfetch/...`) são resolvidas pelo Parcel com `--public-url ./`.

---

## Critérios de Aceite

- [ ] build gera site final sem quebrar deploy
- [ ] conteúdo editável entra no bundle final
- [ ] caminhos públicos continuam estáveis

---

*Build e geração - Task 12*
*Pertence ao plano: portfolio-os-integration.md*
*Definido em: 2026-04-17*