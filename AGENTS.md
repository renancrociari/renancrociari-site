# Renan Crociari Portfolio — Project Rules & Agent Guide

## Project Overview

Personal portfolio website for **Renan Crociari**, a Senior Product Designer with 15+ years of experience. The site showcases interactive case studies, design system documentation, and professional information live at [renancrociari.com](https://www.renancrociari.com).

---

## Reference Files

The following files contain detailed instructions for specific tasks. Read them before performing the related work.

### Design System

- **File:** `.agent/skills/design-system/SKILL.md`
- **When to use:** Before adding or modifying any visual components, spacing, typography, colors, or UI elements. This is the authoritative source for all design tokens, component styles, and utility classes used across the project.

### Deploy Workflow

- **File:** `.agent/workflows/deploy.md`
- **When to use:** When deploying the website to Umbler hosting via GitHub Actions.

### Environment Setup Workflow

- **File:** `.agent/workflows/setup_environment.md`
- **When to use:** When setting up the local development environment for the first time (Node.js, dependencies, HTTPS certificates, dev server).

### Case Title Changes

- **File:** `docs/CASE_TITLE_CHANGES.md`
- **When to use:** When renaming a case study title, URL slug, or both. Contains the full checklist of files to update, slug formatting rules, and rename history.

### Skills Registration

- **Config:** `opencode.json` registers `.agent/skills` via `"skills": { "paths": [".agent/skills"] }`.
- **Adding a new skill:** Create a folder at `.agent/skills/<name>/SKILL.md` with valid frontmatter (`name` matching the folder name, plus a `description`). The loader scans `**/SKILL.md` recursively, so no config change is needed — just restart opencode.
- **Workflows:** `.agent/workflows/*.md` are process documents, not registered skills.

---

## Tech Stack & Architecture

| Layer | Technology | Details / Notes |
| :--- | :--- | :--- |
| **Bundler** | Parcel 2 (`parcel`) | Entry points: `src/pages/*.html`. Uses `@parcel/transformer-raw` for images. |
| **Templating** | PostHTML Include (`posthtml-include`) | Component includes via `<include src="components/...">` (Root configured to `./src`). |
| **Styling** | Vanilla CSS (No Frameworks) | 3-file system: `reset.css` → `global.css` (design tokens) → `main.css`. |
| **JavaScript** | Vanilla ES6+ JS | Main interactivity in `script.js` + ES module utilities for password auth & analytics. |
| **Typography** | Degular & Source Serif | Self-hosted web fonts stored in `src/fonts/`. |
| **Image Zoom** | `medium-zoom` | Lightbox zoom for case study images (`.medium-zoom-image`). |
| **Auth System** | SHA-256 + SessionStorage | Client-side password protection for select case studies. |
| **Analytics** | GTM + GA4 (`analytics.js`) | DataLayer event tracking; GTM script is bypassed on `localhost`/`127.0.0.1`. See `docs/ANALYTICS.md` for full setup guide. |
| **Hosting & CI/CD** | Umbler (Apache Shared) | GitHub Actions (`deploy-to-umbler.yml`) using `rsync` over SSH. |
| **Node Version** | Node.js v18+ | Required for local development and build pipeline. |

---

## Project Structure

```
renancrociari-2026/
├── AGENTS.md             # Project rules & agent guide (this file)
├── src/
│   ├── pages/            # Standalone HTML entry points (one file per URL route)
│   ├── components/       # Reusable PostHTML partials (navbar, footer, dialogs, gtm-noscript)
│   ├── styles/           # CSS hierarchy (reset.css -> global.css -> main.css)
│   ├── scripts/          # JavaScript logic (script.js, analytics.js, password auth)
│   ├── fonts/            # Self-hosted Degular and Source Serif web font files
│   └── images/           # Project images (processed verbatim by Parcel raw transformer)
├── public/               # Static assets copied directly to dist (favicons, .htaccess, downloads, OG images)
├── scripts/              # Node.js build post-processing scripts (fix-paths.js)
├── dist/                 # Production build destination directory (generated, gitignored)
├── .github/workflows/    # GitHub Actions CI/CD workflows (deploy-to-umbler.yml)
└── .agent/               # Agent skills (design-system) and workflows (deploy, setup_environment)
```

### Current Pages & Routes

| File (`src/pages/`) | Route | Protection |
| :--- | :--- | :--- |
| `index.html` | `/` | Public |
| `about.html` | `/about` | Public |
| `boosting-ecommerce-conversion-by-87-percent-for-global-fashion-brands.html` | `/boosting-ecommerce-conversion-by-87-percent-for-global-fashion-brands` | Public |
| `redesigning-the-mobile-experience-of-a-dating-platform.html` | `/redesigning-the-mobile-experience-of-a-dating-platform` | Public |
| `connecting-every-discovery-with-a-worthy-home.html` | `/connecting-every-discovery-with-a-worthy-home` | Password (`case-journal-finder`) |
| `driving-platform-growth-through-targeted-researcher-acquisition.html` | `/driving-platform-growth-through-targeted-researcher-acquisition` | Password (`case-subject-pages`) |
| `design-system.html` | `/design-system` | Public (internal reference) |
| `buttons.html` | `/buttons` | Public (internal reference) |

---

## Development Commands & Environment

| Command | Action | Description |
| :--- | :--- | :--- |
| `npm install` | Dependencies | Installs all required dev and runtime dependencies. |
| `npm start` | Dev Server | Launches Parcel dev server on HTTPS (`https://localhost:1234`) using local `mkcert` certificates. |
| `npm run build` | Production Build | Runs Parcel build, copies `public/` static assets, and executes `scripts/fix-paths.js`. |

### Local HTTPS Setup (`mkcert`)
Local development runs over HTTPS using `localhost+3.pem` and `localhost+3-key.pem` at the project root. HTTPS is required for Web Crypto API features used by the password authentication system when testing on local network mobile devices.

---

## Code Conventions & Standards

### 1. HTML Pages & Routing
- **Location**: All pages live in `src/pages/*.html`.
- **Clean URLs**: Server uses Apache `.htaccess` rewriting. **Never use `.html` in link `href` attributes** (e.g., use `<a href="/about">`, not `<a href="/about.html">`).
- **Required Meta Tags**: Every page must contain complete SEO metadata (title, description, canonical URL, OG tags, favicon links, and GTM script).
- **Component Includes**: HTML partials are imported via `<include src="components/<name>.html"></include>`. Note that root is `./src`, so path starts with `components/`.
- **Dialog Requirement**: If a page contains a dialog trigger button (e.g., `.btn-show-email` or `.btn-show-password`), the corresponding dialog partial (`email-dialog.html` or `password-dialog.html`) **must** be included on that page.

### 2. CSS Architecture & Design Tokens
- **`reset.css`**: CSS reset pattern (`all: unset` + `display: revert`).
- **`global.css`**: Defines `:root` CSS custom properties (colors, typography, spacing, border-radius). **This is the single source of truth for design tokens.**
- **`main.css`**: Contains layout, component, and page-specific styles.
- **Active Dark Mode**: `:root` is currently configured for dark theme (`--background-body: #141414`). A commented-out white mode palette exists in `global.css` for reference.
- **Page Frame Border**: The site `body` has a signature gradient border: `border: 8px solid; border-image: linear-gradient(0deg, #C8F686, #75EF81) 1;`.
- **Utility Classes**: Use `{property}-{size}` pattern (e.g., `.mt-xl`, `.py-md`). Layout wrapper is `.wrapper` (max-width 1344px, centered, 32px padding).

### 3. JavaScript Patterns
- **`src/scripts/script.js`**: Primary script handling UI interactions (dialog toggles, smooth scroll, navbar behavior, `mediumZoom`).
- **Language**: Preserve Brazilian Portuguese comments in legacy JS code files (`script.js`).
- **Analytics (`analytics.js`)**: Isolated GTM `dataLayer.push` logic for custom user actions. See `docs/ANALYTICS.md` for the comprehensive setup guide and `docs/EVENT_TRACKING.md` for a quick event reference table.
- **Password Auth System**:
  - `password-config.js`: Contains content IDs, SHA-256 password hashes, and target redirect URLs. Session storage key is `rc_auth_tokens`.
  - `password-auth.js`: Handles SHA-256 hashing and `sessionStorage` token validation.
  - `protected-page.js`: Included on protected pages to enforce authentication checks. Unauthenticated users are redirected to `/#password-protected?content=<contentId>`.
  - Password trigger buttons use `data-content-id` attribute to identify which content config entry to validate against.

---

## Guide: Adding New Pages & Case Studies

### 1. Standard Page Checklist
1. Create `src/pages/<page-name>.html`.
2. Include head metadata, fonts, and GTM script block (copy from an existing page like `about.html`).
3. Add GTM noscript fallback as the first element after `<body>`: `<include src="components/gtm-noscript.html"></include>`.
4. Add navbar component: `<include src="components/navbar.html"></include>`.
5. Add main body content using design system classes and CSS custom variables.
6. Add dialog components if used (`email-dialog.html`, `password-dialog.html`).
7. Add footer component: `<include src="components/footer.html"></include>`.
8. Link images with `class="medium-zoom-image"` if image lightbox zoom is desired.
9. Update `public/sitemap.xml` with the new route.

### 2. Password Protected Case Study Checklist
1. Generate SHA-256 hash for desired password:
   ```javascript
   const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('your-password'));
   const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
   ```
2. Add content ID mapping in `src/scripts/password-config.js`:
   ```javascript
   'new-case-study': {
     hash: 'HASH_STRING_HERE',
     redirectUrl: '/new-case-study'
   }
   ```
3. On the homepage (`index.html`), add a card button with `data-content-id` matching the config key:
   ```html
   <button class="btn body-medium btn-white btn-show-password" data-content-id="new-case-study">
     View case study
   </button>
   ```
4. Include protection check script in `<head>` of the protected page `src/pages/new-case-study.html`:
   ```html
   <script type="module">
     import { initProtectedPage } from '../scripts/protected-page.js';
     initProtectedPage('new-case-study');
   </script>
   ```
5. Include `<include src="components/password-dialog.html"></include>` in the HTML page.
6. Update `public/sitemap.xml` with the new route.

---

## Build Pipeline & Deployment

### Build Pipeline Sequence (`npm run build`)
1. Parcel builds pages: `parcel build src/pages/*.html --dist-dir ./dist --public-url ./`
2. Copies static downloads: `cp -r public/downloads dist/downloads`
3. Copies static images: `cp -r public/images dist/images`
4. Copies `.htaccess`: `cp public/.htaccess dist/.htaccess`
5. Fixes asset paths: `node scripts/fix-paths.js` (rewrites relative path glitches for `/downloads/`).

### Deployment via GitHub Actions
- Workflow: `.github/workflows/deploy-to-umbler.yml`.
- Triggered manually via `workflow_dispatch` (or `/deploy` workflow / `gh workflow run deploy-to-umbler.yml`).
- Synchronization uses `rsync` with required flags `--no-perms --no-owner --no-group` to handle Umbler shared hosting permissions.
- Deploying from non-main branches requires setting input `confirm_non_main: "yes"`.

---

## Critical Agent Gotchas

1. **PostHTML Root Path**: PostHTML root is set to `./src` in `.posthtmlrc`. Component include paths must be `components/<file>.html` (not `src/components/<file>.html`).
2. **Raw Image Transformer**: Images (`.jpg`, `.png`, `.webp`) are configured with `@parcel/transformer-raw` in `.parcelrc`. Filenames are preserved as-is without content-hashing.
3. **No `.html` Links**: Always link to extensionless paths (`href="/about"`). `.htaccess` automatically resolves them to `.html` files.
4. **Fix-Paths Script**: If new subdirectories under `public/` are referenced in HTML, verify if `scripts/fix-paths.js` needs updating to rewrite Parcel bundle relative paths.
5. **HTTPS Certificates**: Dev server requires `localhost+3.pem` and `localhost+3-key.pem` in project root. Do not commit `.pem` or `.key` files to git (they are gitignored).
6. **Design System Adherence**: Always consult `.agent/skills/design-system/SKILL.md` before adding or modifying visual components, spacing, or typography. When in doubt, cross-reference `src/styles/global.css` as the authoritative source of truth for current variable names and values.
7. **Sitemap Maintenance**: When adding or removing pages, update `public/sitemap.xml` to keep it in sync.
8. **Footer Component**: The footer (`src/components/footer.html`) includes a `.btn-show-email` trigger button (not a password button). Pages using the footer must include `email-dialog.html`.
9. **GTM Noscript Component**: The `gtm-noscript.html` component must be the **first child element** after the opening `<body>` tag on every page. This is required by Google Tag Manager for proper tracking when JavaScript is disabled.
10. **Analytics Documentation**: For GTM/GA4 configuration details, event tracking reference, and how to add new events, see `docs/ANALYTICS.md`.
11. **Case Title Changes Documentation**: When adding new features that impact how case study titles, URLs, or cards work (e.g., new meta tags, new card components, new routing logic, new analytics events), update `docs/CASE_TITLE_CHANGES.md` to keep the checklist current.
