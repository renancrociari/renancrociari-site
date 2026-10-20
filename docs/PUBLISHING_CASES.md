# Publishing a New Case Study

Step-by-step checklist for creating (or overhauling) a case study page. There is no case template yet — copy the closest existing case (e.g. [`driving-day-1-retention-for-a-social-platform-with-8m-users.html`](../src/pages/driving-day-1-retention-for-a-social-platform-with-8m-users.html)) and replace its content.

> `npm run build` runs `scripts/check-seo.js`, which only warns about a stray `noindex` or article-template placeholders. It does **not** catch a wrong description, out-of-sync JSON-LD, a missing sitemap entry or a missing OG image, so use this checklist.
>
> Renaming an existing case? Use [`CASE_TITLE_CHANGES.md`](CASE_TITLE_CHANGES.md) instead.

---

## 1. Title & slug

- [ ] **Outcome-driven title:** verb + quantified result + context — e.g. *Boosting ecommerce conversion by 87% for global fashion brands*.
- [ ] **Slug = title in kebab case**, following the rules in [`CASE_TITLE_CHANGES.md` → URL Slug Formatting Rules](CASE_TITLE_CHANGES.md#url-slug-formatting-rules) (`%` → `percent`, `8.6` → `8-6`, `+` dropped).
- [ ] Create `src/pages/<slug>.html`. Links never include `.html`.

## 2. Description

One sentence, **140–160 characters**, leading with **role + company + quantified impact**:

> *I led the mobile redesign for an 8M+ member social app, streamlining first-session discovery to lift Day 1 retention and accelerate user activation.*

- [ ] Only claim results you can back up in the page body.

## 3. Head metadata

Copy the `<head>` from an existing case and update every field below. Keep the GTM script first.

| Field | Places | Rule |
|---|---|---|
| Title | `<title>`, `og:title`, `twitter:title`, JSON-LD `headline` | Meta titles end with ` · Renan Crociari`; `headline` does **not** |
| Description | `description`, `og:description`, `twitter:description`, JSON-LD `description` | Identical text in all 4 places |
| URL | `<link rel="canonical">`, `og:url`, JSON-LD `mainEntityOfPage.@id` | `https://www.renancrociari.com/<slug>` (always `https://www`) |
| OG image | `og:image`, `twitter:image`, JSON-LD `image` | `https://www.renancrociari.com/images/<short>-case-og-image.jpg` |
| Image alt | `og:image:alt`, `twitter:image:alt` | Describe what's in the image |

Fixed values (don't change, don't duplicate):

- [ ] `og:type` = `article` — **exactly one** tag
- [ ] `og:locale` = `en_US`
- [ ] `og:image:width` = `1200`, `og:image:height` = `630`
- [ ] `twitter:card` = `summary_large_image`
- [ ] No `twitter:domain` / `twitter:url` (removed site-wide; X ignores them)

## 4. Structured data (JSON-LD `Article`)

- [ ] `@type`: `Article` (articles use `BlogPosting`; cases use `Article`)
- [ ] `headline`, `description`, `image`, `mainEntityOfPage.@id` match the meta tags above
- [ ] `dateModified`: ISO 8601 with timezone (e.g. `2026-10-15T23:30:15+01:00`)
- [ ] `inLanguage`: `en-US`
- [ ] `author`: Person with `url` `/about`, `jobTitle`, `sameAs` LinkedIn (copy as is)
- [ ] `publisher`: Person, Renan Crociari
- [ ] `about`: `Organization` with the **client/company name** (e.g. Farfetch, eSapiens, Springer Nature)
- [ ] Protected cases only: `isAccessibleForFree: false` + `hasPart` (see §8)

## 5. OG image

- [ ] **1200×630 JPG**, saved in `public/images/` (e.g. `ff-case-og-image.jpg`, `sl-mobile-og-image.jpg`)
- [ ] Shows the product, not just text — it's the LinkedIn preview recruiters see

## 6. Page structure

```html
<body class="<case-class>">
  <include src="components/gtm-noscript.html"></include>   <!-- always first -->
  <include src="components/email-dialog.html"></include>
  <include src="components/navbar.html"></include>

  <main>
  <article>
    <header class="content-header mt-5xl">  <!-- h1 + tags + featured image -->
    <div class="article-content">
      <div class="executive-summary">…</div>
      … sections …
    </div>
  </article>

  <h2 class="wrapper t-ct mt-5xl">More case studies</h2>
  <section class="featured-projects related-projects wrapper mt-xl">…cards…</section>
  </main>

  <include src="components/password-dialog.html"></include>  <!-- protected cases only, see §8 -->
  <include src="components/footer.html"></include>
</body>
```

- [ ] **One `<h1>`** (the case title). Main sections are `<h2>`, sub-sections `<h3>` — never skip a level.
- [ ] **Executive summary** (`<h2>Executive summary</h2>`) with 4 `<h3>` blocks in this order: **The company / My role / The problem / Impact**. Impact = 3 quantified bullets.
- [ ] `.tags` in the header list the disciplines (Product Strategy / User Research / …).
- [ ] Featured image: `fetchpriority="high"`, **no** `loading="lazy"`.
- [ ] Other images: descriptive `alt`, `loading="lazy"`, `class="medium-zoom-image"` for zoom. No empty `id=""`.
- [ ] External links with `target="_blank"` always get `rel="noopener noreferrer"`.

## 7. Cards

- [ ] Create `src/components/card-<name>.html` (copy an existing card; title inside `<h3><a class="project-card-link" href="/<slug>">…</a></h3>`, "See case study" stays a decorative `<div aria-hidden="true">`).
- [ ] Add the card to the homepage grid in `src/pages/index.html`.
- [ ] Add it to the "More case studies" section of the other cases (each case shows the other 3) and, if relevant, `about.html` / `article-template.html`.

## 8. Password protection (optional)

Protected cases use a **paywall**: the full case is in the HTML and indexed by Google, and visitors without access see the password dialog on top of it. `?ref=cases` or the password unlocks it. It's light protection (view-source and Google snippets still show the text), meant to stop casual visitors.

- [ ] Follow AGENTS.md → *Password Protected Case Study Checklist*: config hash, `data-protected-content` on `<body>`, inline Paywall gate script in `<head>`, `password-dialog.html` include.
- [ ] JSON-LD gets Google's paywall markup (required so the hidden content isn't treated as cloaking):
  ```json
  "isAccessibleForFree": false,
  "hasPart": { "@type": "WebPageElement", "isAccessibleForFree": false, "cssSelector": ".article-content" }
  ```
- [ ] Cards stay **plain links** (no `.btn-show-password`), so other pages don't need `password-dialog.html` (AGENTS.md Gotcha #12).
- [ ] Keep the page indexable (no `noindex`) and in the sitemap.

## 9. Sitemap

- [ ] Add `https://www.renancrociari.com/<slug>` to `public/sitemap.xml` with `<lastmod>` (same date as JSON-LD `dateModified`).

## 10. Build & verify locally

- [ ] `npm run build` → `✓ SEO check passed`
- [ ] `npm start` → open the page; check the console for `[SEO]` / `[password-dialog]` warnings
- [ ] Quick checks:
  ```bash
  grep -c '<h1' dist/<slug>.html              # 1
  grep -c 'og:type' dist/<slug>.html          # 1
  grep -c '<main>' dist/<slug>.html           # 1
  grep -c 'application/ld+json' dist/<slug>.html  # 1
  ```

## 11. After deploying

- [ ] `bash scripts/test-redirects.sh` (live) — all checks pass
- [ ] [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) — preview card renders (also refreshes LinkedIn's cache)
- [ ] [Google Rich Results Test](https://search.google.com/test/rich-results) — `Article` is valid (protected cases: paywall fields recognised)
- [ ] Google Search Console → URL Inspection → *Request indexing* (public and protected cases)

---

## Updating an existing case

- [ ] Update JSON-LD `dateModified` and the sitemap `<lastmod>`
- [ ] If the description changes, update all 4 places (§3)
- [ ] Title or slug change → [`CASE_TITLE_CHANGES.md`](CASE_TITLE_CHANGES.md) (includes the 301 redirect in `public/.htaccess`)
