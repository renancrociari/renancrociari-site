# Google Analytics & GTM — Configuration & Event Tracking Guide

Complete reference for how Google Tag Manager (GTM) and Google Analytics 4 (GA4) are set up, how events flow from the site to GA4, and how to add new tracking.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│  Browser (renancrociari.com)                                     │
│                                                                  │
│  ┌────────────────┐    window.dataLayer.push()    ┌───────────┐  │
│  │  analytics.js  │ ─────────────────────────────▶│ dataLayer │  │
│  │  (custom code) │                               │  (array)  │  │
│  └────────────────┘                               └─────┬─────┘  │
│                                                         │        │
│  ┌──────────────────────────────────────────────────────▼──────┐ │
│  │  GTM Container (GTM-P7FKT9N)                                │ │
│  │  Reads dataLayer → fires GA4 Event tags                     │ │
│  └──────────────────────────────────────────────────────┬──────┘ │
└─────────────────────────────────────────────────────────┼────────┘
                                                          │
                                              ┌───────────▼───────────┐
                                              │  Google Analytics 4   │
                                              │  (GA4 Property)       │
                                              └───────────────────────┘
```

**Key concept:** The site never talks to GA4 directly. All event data is pushed to `window.dataLayer`, which GTM reads and forwards to GA4 via configured tags inside the GTM container.

---

## GTM Container Setup

| Property | Value |
|---|---|
| **Container ID** | `GTM-P7FKT9N` |
| **Container Type** | Web |
| **Loading method** | Inline `<script>` in `<head>` + `<noscript>` iframe fallback in `<body>` |

### Two-part installation

GTM requires two snippets on every page:

#### 1. `<head>` script (JavaScript loader)

Located inline in the `<head>` of every page (`src/pages/*.html`):

```html
<!-- Google Tag Manager -->
<script>
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    (function (w, d, s, l, i) {
      w[l] = w[l] || []; w[l].push({
        'gtm.start': new Date().getTime(), event: 'gtm.js'
      }); var f = d.getElementsByTagName(s)[0],
        j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : ''; j.async = true; j.src =
          'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', 'GTM-P7FKT9N');
  }
</script>
<!-- End Google Tag Manager -->
```

> **Localhost exclusion:** The `if` guard prevents GTM from loading on `localhost` and `127.0.0.1`, avoiding polluted analytics during development.

> **Note:** This snippet cannot be extracted into a PostHTML component because Parcel's `<include>` directive does not work inside `<head>`.

#### 2. `<body>` noscript fallback (PostHTML component)

**File:** `src/components/gtm-noscript.html`

```html
<!-- Google Tag Manager (noscript) -->
<noscript>
  <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-P7FKT9N" height="0" width="0"
    style="display:none;visibility:hidden">
  </iframe>
</noscript>
<!-- End Google Tag Manager (noscript) -->
```

**Usage:** Included on every page immediately after the opening `<body>` tag:

```html
<body class="...">
  <include src="components/gtm-noscript.html"></include>
  ...
```

This provides basic GTM functionality for users who have JavaScript disabled.

---

## File Architecture

| File | Purpose |
|---|---|
| `src/components/gtm-noscript.html` | PostHTML component — GTM noscript iframe fallback. Included in every page's `<body>`. |
| `src/scripts/analytics.js` | All custom event tracking logic. Pushes events to `window.dataLayer`. Loaded as `<script type="module">` in every page's `<head>`. |
| `docs/EVENT_TRACKING.md` | Quick-reference table of all tracked events (event name, category, label). |
| `docs/ANALYTICS.md` | This file — comprehensive setup & integration guide. |

---

## The dataLayer & Event Structure

### What is the dataLayer?

`window.dataLayer` is a JavaScript array that acts as a message bus between your site code and GTM. When you push an object to it, GTM picks it up and can use the values to fire tags (e.g. send data to GA4).

### Event payload structure

Every custom event pushed by `analytics.js` follows a consistent schema:

```javascript
window.dataLayer.push({
  event: 'click_nav_link',           // Event name — identifies what happened
  event_category: 'main_nav',        // Context group — where it happened
  event_label: 'about',              // Specific element — what was clicked
  page_location: '/about'            // URL path — automatically captured
});
```

| Field | Type | Description |
|---|---|---|
| `event` | `string` | The event name, used as the GA4 event name. Example: `click_nav_link` |
| `event_category` | `string` | Groups events by area/feature. Example: `home_nav`, `about`, `email` |
| `event_label` | `string` | Identifies the specific element or action. Example: `linkedin`, `desktop` |
| `page_location` | `string` | The `window.location.pathname` at the time of the event. Auto-populated. |

### Helper function

All events go through a single helper in `analytics.js`:

```javascript
function trackEvent(eventName, eventCategory, eventLabel) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    event_category: eventCategory,
    event_label: eventLabel,
    page_location: window.location.pathname
  });
}
```

The `window.dataLayer = window.dataLayer || []` guard ensures the array exists even if GTM hasn't loaded (e.g. on localhost).

---

## All Tracked Events

### 1. Navigation — `click_nav_link`

Tracks clicks on navigation links across three distinct nav regions.

| Category | Location | Tracked Elements |
|---|---|---|
| `home_nav` | Home page hero nav (index only) | `about`, `resume`, `linkedin`, `email` |
| `main_nav` | Main navbar component (all pages) | `home`, `about`, `resume`, `linkedin`, `email` |
| `footer_nav` | Footer component (all pages) | `home`, `about`, `resume`, `linkedin`, `email` |

**Label derivation:** The `getNavLabel()` helper uses the element's `textContent`, lowercased and accent-stripped (`"Resumé"` → `"resume"`).

---

### 2. About Page — Experience Companies — `click_experience`

**Category:** `about`

Tracks clicks on the accordion `<details>/<summary>` elements in the experience section.

| Label | Company |
|---|---|
| `springer_nature` | Springer Nature |
| `farfetch` | Farfetch |
| `esapiens` | eSapiens |
| `triata` | Triata |

**Detection:** Matches the `alt` attribute of the company logo `<img>` inside the `<summary>` against a lookup map.

---

### 3. About Page — CTAs — `click_cta`

**Category:** `about`

Tracks clicks on the LinkedIn profile and Resumé download links in the skillset section.

| Label | Element |
|---|---|
| `linkedin_profile` | LinkedIn profile link |
| `resume_pdf` | Resumé (PDF) download link |

**Detection:** Checks the `href` attribute for `linkedin` or `cv`/`resume` substrings.

---

### 4. About Page — Testimonials — `click_testimonial`

**Category:** `about`

Tracks clicks on testimonial author profile pictures and name links.

| Label | Author |
|---|---|
| `sara_cruz` | Sara Cruz |
| `leandro_kitamura` | Leandro Kitamura |
| `felipe_trevisan` | Felipe Trevisan |
| `cinthia_nakazato` | Cínthia Nakazato |

**Detection:** Matches the link text and nested `<img>` alt text against a lookup map.

---

### 5. Case Study — Figma Prototypes — `click_figma_prototype`

Tracks clicks on Figma prototype CTA buttons on protected case study pages.

| Category | Page | Labels |
|---|---|---|
| `case_study_subject_pages` | Turning Organic Traffic | `desktop`, `mobile` |
| `case_study_journal_finder` | Scaling a Journal Matching Platform | `desktop`, `mobile` |

**Detection:** Selects `<a>` elements matching `[aria-label*="igma"]` inside `.cv-btn`, then checks the `aria-label` for `desktop` vs `mobile`.

---

### 6. Email Dialog — `click_copy_email`

**Category:** `email`

| Label | Element |
|---|---|
| `copy` | Copy email button (`.btn-copy-email`) in the email dialog |

---

## How analytics.js Initializes

```javascript
// Safe DOM-ready: handles both cases — already loaded or still loading
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAnalytics);
} else {
  initAnalytics();
}
```

The `initAnalytics()` function checks `document.body.className` to determine which page the user is on, then attaches only the relevant event listeners. This means:

- **Navigation events** (nav, footer) are attached on every page.
- **About-specific events** only attach when `body.className` includes `about`.
- **Case study events** only attach on their respective pages (checked via body class like `subject-pages` or `journal-finder`).

---

## How to Add a New Tracked Event

### Step 1 — Identify the interaction

Determine the element, the page(s) it appears on, and a meaningful event name.

### Step 2 — Add tracking code in `analytics.js`

Inside the `initAnalytics()` function, add a new section. Follow the numbered comment pattern:

```javascript
// ─────────────────────────────────────────────────────────────
// 10. NEW SECTION — Description of what is being tracked
// ─────────────────────────────────────────────────────────────
if (bodyClass.includes('page-body-class')) {
  document.querySelectorAll('.target-selector').forEach(el => {
    el.addEventListener('click', () => {
      trackEvent('event_name', 'event_category', 'label');
    });
  });
}
```

**Conventions:**
- Use `snake_case` for event names, categories, and labels.
- Prefix event names with the action type: `click_`, `view_`, `submit_`, etc.
- Wrap page-specific tracking in a `bodyClass.includes()` guard to avoid unnecessary DOM queries.

### Step 3 — Update the event reference

Add the new event to `docs/EVENT_TRACKING.md` in the appropriate section.

### Step 4 — Configure GTM (if needed)

If the new event name hasn't been used before, you may need to create a corresponding **GA4 Event Tag** in the GTM container (`GTM-P7FKT9N`) with a trigger matching the new `event` name. If using a generic "catch-all" GA4 event tag in GTM, this step may not be necessary.

### Step 5 — Test

1. Run the dev server (`npm start`).
2. Open Chrome DevTools → Console.
3. Type `dataLayer` and press Enter to inspect the array.
4. Perform the interaction and verify the new event appears in the dataLayer.
5. Use GTM's [Preview mode](https://tagmanager.google.com/) to verify the tag fires correctly.

> **Reminder:** GTM does not load on localhost, but `dataLayer.push()` still executes. You can inspect `window.dataLayer` directly in the console to verify events are being pushed with the correct payload.

---

## GTM Inside the Build Pipeline

| Concern | Detail |
|---|---|
| **Head script** | Duplicated in each page's `<head>`. Cannot be componentized due to Parcel/PostHTML limitation with `<head>` includes. |
| **Noscript fallback** | Extracted into `src/components/gtm-noscript.html`. Included via `<include>` in every page's `<body>`. |
| **analytics.js** | Imported as `<script type="module" src="../scripts/analytics.js">` in each page's `<head>`. Bundled by Parcel. |
| **Localhost guard** | Prevents GTM from loading during local development. Does **not** prevent `dataLayer.push()` calls, so events can still be inspected in the console. |

---

## Checklist: New Page Analytics Setup

When creating a new page, ensure:

- [ ] The GTM `<script>` block is in the `<head>` (copy from an existing page).
- [ ] `<include src="components/gtm-noscript.html"></include>` is the first element after `<body>`.
- [ ] `<script type="module" src="../scripts/analytics.js"></script>` is in the `<head>`.
- [ ] If the page needs custom event tracking, add the logic inside `initAnalytics()` in `analytics.js` with a `bodyClass` guard.
- [ ] Update `docs/EVENT_TRACKING.md` with any new events.
