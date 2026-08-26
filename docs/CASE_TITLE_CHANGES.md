# Case Study Title Changes — Workflow Guide

This document covers the full checklist for renaming a case study title and/or URL across the project. Use it whenever you need to update a case study's display title, URL slug, or both.

---

## When to Use This Guide

- Changing a case study's **display title** (the text shown in headings, cards, and meta tags)
- Changing a case study's **URL slug** (the URL path used to access the page)
- Both at the same time

---

## Checklist

### 1. Rename the HTML File

| What | Details |
|------|---------|
| **Location** | `src/pages/<old-slug>.html` → `src/pages/<new-slug>.html` |
| **How** | `mv src/pages/<old-slug>.html src/pages/<new-slug>.html` |

### 2. Update the Case Study Page (`src/pages/<new-slug>.html`)

Update all occurrences of the old title and URL within the page:

| Element | Line Area | What to Change |
|---------|-----------|----------------|
| `<title>` | `<head>` | Page title text |
| `<link rel="canonical">` | `<head>` | URL slug in `href` |
| `og:url` | Facebook meta | URL slug in `content` |
| `og:title` | Facebook meta | Title text in `content` |
| `twitter:url` | Twitter meta | URL slug in `content` |
| `twitter:title` | Twitter meta | Title text in `content` |
| `<h1>` | Page body | Heading text |

### 3. Update the Homepage (`src/pages/index.html`)

| Element | What to Change |
|---------|----------------|
| `<h2>` inside the project card | Display title text |
| `<a href="...">` inside the project card | URL slug |

### 4. Update the Card Component (`src/components/card-<name>.html`)

Each case study has a reusable card component used on other pages (e.g., "more case studies" sections):

| Element | What to Change |
|---------|----------------|
| `<h2>` | Display title text |
| `<a href="...">` | URL slug |

### 5. Update the Sitemap (`public/sitemap.xml`)

| Element | What to Change |
|---------|----------------|
| `<loc>` | Full URL with new slug |

### 6. Add .htaccess Redirect (`public/.htaccess`)

Add a 301 redirect from the old URL to the new one under the `# Redirects for renamed case studies` section:

```apache
Redirect 301 /old-slug /new-slug
```

> **Why:** Preserves SEO juice and prevents broken backlinks from external sites, social media shares, and search engine indexes.

### 7. Update Documentation

| File | What to Change |
|------|----------------|
| `AGENTS.md` | Update the "Current Pages & Routes" table |
| `docs/PASSWORD_PROTECTION.md` | Update title and `redirectUrl` references (if the case is listed) |
| `docs/COMPONENTS.md` | Update filename references in "Currently Using" sections |
| `docs/CASE_TITLE_CHANGES.md` | Add the rename to the History table below |

### 8. Password Protection (if applicable)

If the case study is password-protected, also update:

| File | What to Change |
|------|----------------|
| `src/scripts/password-config.js` | Update `redirectUrl` value for the matching content ID |
| Homepage `data-content-id` button | No change needed (content ID is independent of the title/slug) |
| `src/pages/<new-slug>.html` | Ensure `initProtectedPage('content-id')` still references the correct content ID |

---

## URL Slug Formatting Rules

When converting a title to a URL slug:

| Rule | Example |
|------|---------|
| Lowercase everything | `Boosting eCommerce` → `boosting-ecommerce` |
| Replace spaces with hyphens | `global fashion brands` → `global-fashion-brands` |
| Remove special characters (`'`, `'`, etc.) | `Farfetch's` → `farfetchs` |
| Convert percentages to words | `87.5%` → `87-percent` or `87-5-percent` |
| Remove dots from numbers (or use hyphens) | `87.5` → `87-5` |

---

## Rename History

| Date | Old Title | New Title | Old Slug | New Slug |
|------|-----------|-----------|----------|----------|
| 2026-08-26 | Improving the performance of Farfetch's top fashion eCommerce brands | Boosting eCommerce conversion by 87.5% for global fashion brands | `improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands` | `boosting-ecommerce-conversion-by-87-percent-for-global-fashion-brands` |

---

## Files Quick Reference

All files that may need changes when renaming a case study:

```
src/pages/<slug>.html              # The case study page itself
src/pages/index.html               # Homepage project card
src/components/card-<name>.html    # Reusable card component
public/sitemap.xml                 # Sitemap URL
public/.htaccess                   # 301 redirect
AGENTS.md                          # Routes table
docs/PASSWORD_PROTECTION.md        # Password protection docs (if protected)
docs/COMPONENTS.md                 # Component usage docs
docs/CASE_TITLE_CHANGES.md         # This file (rename history)
src/scripts/password-config.js     # Only if password-protected
```
