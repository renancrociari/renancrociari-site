# Estratégia de Compatibilidade de Blocos (Task 4)

## Análise: Portfolio-OS Blocks vs Site Real

### Blocos existentes no `portfolio-os`

| Bloco | Suportado no Site? | Estratégia |
|------|-------------------|------------|
| `CaseHero` | ⚠️ Shell | Usar frontmatter → renderizar hero manual |
| `MetadataPanel` | ⚠️ Shell | Usar frontmatter → renderizar tags manual |
| `ProcessTimeline` | ✅ Parser | Mapear para HTML estruturado |
| `ImpactResults` | ✅ Parser | Mapear para métricas inline |
| `GalleryGrid` | ✅ Parser | Mapear para HTML `.two-column-image` |
| `PullQuote` | ✅ Parser | Mapear para HTML blockquote |
| `FigmaEmbed` | ❌ Bloquear | Não existe no site atual |
| `Callout` | ✅ Parser | Mapear para HTML `.callout` |
| `Figure` | ✅ Parser | Mapear para `<figure>` |
| `VideoEmbed` | ✅ Parser | Mapear para `<video>` ou link |
| `TOC` | ⚠️ Manual | Mapear para lista `<ul>` manual |
| `BeforeAfter` | ❌ Legado | Converter para Figure duplo |
| `Confidential` | ❌ Remover | Não fazer parte do MDX |

---

## Estratégia: Parser，而非 Componentes

O site atual usa **HTML puro + Parcel** (não React). A estratégia será:

1. **Parser MDX → HTML** (não JSX)
2. **Cada bloco vira HTML** (não componente React)
3. **Editor usa preview HTML** (não preview React)

### Blocos suportados + output HTML

```
ProcessTimeline    → <div class="process-timeline">...</div>
ImpactResults      → <div class="featured-metrics">...</div>
GalleryGrid      → <div class="two-column-image">...</div>
PullQuote         → <blockquote class="pull-quote">...</blockquote>
Callout           → <div class="callout variant">...</div>
Figure            → <figure><img...><figcaption>...</figure>
VideoEmbed        → <div class="video-embed"><iframe...>
TOC              → <nav class="toc"><ul>...
```

### Blocos NÃO suportados (sem equivalente visual)

| Bloco | Ação | Motivo |
|------|------|--------|
| `FigmaEmbed` | Bloquear no editor | Site não suporta embed Figma |
| `Confidential` | Remover | Legacy - não usar |
| `BeforeAfter` | Converter para 2 Figures | Legacy pattern |

---

## Catálogo Suportado para o Site

```
SUPORTADOS:
✓ headings (h1-h6)
✓ paragraphs (p)
✓ lists (ul, ol, li)
✓ bold/italic/strong
✓ links (a)
✓ inline images
✓ ProcessTimeline
✓ ImpactResults
✓ GalleryGrid
✓ PullQuote
✓ Callout
✓ Figure
✓ VideoEmbed
✓ TOC
✓ BeforeAfter (converter para 2 figuras)

BLOQUEADOS NO EDITOR:
✗ FigmaEmbed
✗ Confidential
```

---

## Critérios de Aceite

- [ ] Blocos do preview podem ser publicados no site real
- [ ] Fallback claro para incompatibilidades
- [ ] Catálogo documentado

---

*Estratégia definida em: 2026-04-17*
*Pertence à Task 4 do plano: portfolio-os-integration.md*