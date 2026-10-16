# Publishing a New Article

Step-by-step checklist for turning [`src/pages/article-template.html`](../src/pages/article-template.html) into a live article. Follow it in order every time.

> `npm run build` runs `scripts/check-seo.js`, which warns about a leftover `noindex` or template placeholders. It does **not** catch wrong dates, a missing sitemap entry or a missing cover image, so use this checklist.

---

## 1. Create the page

- [ ] Copy `src/pages/article-template.html` → `src/pages/<slug>.html`
- [ ] Slug rules: lowercase, hyphen-separated, no special characters, descriptive (e.g. `why-design-systems-fail`). Links never include `.html`.

## 2. Allow indexing

- [ ] Replace `<meta name="robots" content="noindex, nofollow" />` with:
  ```html
  <meta name="robots" content="index, follow, max-image-preview:large" />
  ```
- [ ] Delete the `⚠️ TEMPLATE ONLY` comment above it.

## 3. Title & summary

| Field | Where | Guideline |
|---|---|---|
| Title | `<title>`, `og:title`, `twitter:title`, JSON-LD `headline` | ~50–60 characters. Keep ` · Renan Crociari` in the meta titles, but **not** in `headline` |
| Summary | `description`, `og:description`, `twitter:description`, JSON-LD `description` | 140–160 characters |
| `<h1>` | Page header | Can match the title or be slightly longer |

## 4. Slug — 5 places

- [ ] `<link rel="canonical">`
- [ ] `og:url`
- [ ] `og:image` and `twitter:image` (`/images/<slug>-og-image.jpg`)
- [ ] JSON-LD `mainEntityOfPage.@id` and `image`

## 5. Dates — 3 places, must match

Use ISO 8601 with timezone (e.g. `2026-11-04T09:00:00+00:00`).

- [ ] `article:published_time` and `article:modified_time`
- [ ] JSON-LD `datePublished` and `dateModified`
- [ ] Visible `<time datetime="YYYY-MM-DD">Mon D, YYYY</time>` in the header

## 6. Topics — keep in sync

- [ ] Visible tags in `.tags` (header)
- [ ] `article:tag` meta (one tag per topic)
- [ ] `article:section` (main category)
- [ ] JSON-LD `keywords`

## 7. Cover / OG image

- [ ] Create a **1200×630 JPG** (all existing OG images use this size)
- [ ] Save it as `public/images/<slug>-og-image.jpg`
- [ ] Fill in `og:image:alt` and `twitter:image:alt` (replace `[Describe the cover image]`)

## 8. Body content

- [ ] Replace the sample content (currently Springer Nature text)
- [ ] One `<h1>` only; use `<h2>`/`<h3>` in order for sections
- [ ] Images: descriptive `alt`, `loading="lazy"`, add `class="medium-zoom-image"` if you want them to zoom on click
- [ ] Keep the content inside `<article>`

## 9. Related cards & dialogs

- [ ] Choose which cards appear under "Keep reading"
- [ ] No `password-dialog.html` needed: protected-case cards are plain links; the gate lives on the case page (AGENTS.md Gotcha #12)
- [ ] Keep `email-dialog.html` (navbar and footer have email buttons)

## 10. Sitemap

- [ ] Add `https://www.renancrociari.com/<slug>` to `public/sitemap.xml` with `<lastmod>`

## 11. Build & verify locally

- [ ] `npm run build` → the output should say `✓ SEO check passed`
- [ ] `npm start` → open the page and check the browser console for `[SEO]` / `[password-dialog]` warnings

## 12. After deploying

- [ ] [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/): check the preview card (this also clears LinkedIn's cached preview)
- [ ] [Google Rich Results Test](https://search.google.com/test/rich-results): check that the `BlogPosting` structured data is valid
- [ ] Google Search Console → URL Inspection → *Request indexing* (optional, speeds things up)

---

## Updating an existing article

- [ ] Update `article:modified_time` and JSON-LD `dateModified` (leave the published dates alone)
- [ ] Update `<lastmod>` in `public/sitemap.xml`
- [ ] If the title or slug changes, follow [`CASE_TITLE_CHANGES.md`](CASE_TITLE_CHANGES.md) and add a 301 redirect in `public/.htaccess`
