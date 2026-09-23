# Event Tracking Documentation

Reference of all Google Analytics events tracked on renancrociari.com via GTM dataLayer.

> **Important:** Every event listed here must also have a matching **GTM Trigger + GA4 Event Tag** configured and published inside GTM container `GTM-P7FKT9N`. Without this, the event is pushed to `dataLayer` but **never reaches GA4 reports**. See `docs/ANALYTICS.md` → "How to Add a New Tracked Event" for step-by-step instructions.

## Event Structure

Every event pushed to the dataLayer includes:

| Field | Description |
|---|---|
| `event` | The event name (e.g. `click_nav_link`) |
| `event_category` | Groups events by context (e.g. `home_nav`, `about`) |
| `event_label` | Identifies the specific element clicked (e.g. `linkedin`) |
| `page_location` | The URL path where the event was triggered (e.g. `/about`) |

## GTM Status Legend

| Status | Meaning |
|---|---|
| ✅ Active | GTM Trigger + GA4 Event Tag are published. Event appears in GA4 reports. |
| ⏳ Pending | Code pushes to `dataLayer`, but GTM tag is not yet configured. **Event is NOT reaching GA4.** |

---

## 1. Navigation Events

**Event name:** `click_nav_link`  
**GTM Status:** ✅ Active

### Home Hero Nav (`home_nav`) — index page only

| Label | Element | Description |
|---|---|---|
| `about` | About link | Navigates to about page |
| `resume` | Resumé link | Opens CV PDF in new tab |
| `linkedin` | LinkedIn link | Opens LinkedIn profile in new tab |
| `email` | Email button | Opens email dialog |

### Main Navbar (`main_nav`) — all pages with navbar

| Label | Element | Description |
|---|---|---|
| `home` | Home link | Navigates to homepage |
| `about` | About link | Navigates to about page |
| `resume` | Resumé link | Opens CV PDF in new tab |
| `linkedin` | LinkedIn link | Opens LinkedIn profile in new tab |
| `email` | Email button | Opens email dialog |

### Footer Nav (`footer_nav`) — all pages with footer

| Label | Element | Description |
|---|---|---|
| `home` | Home link | Navigates to homepage |
| `about` | About link | Navigates to about page |
| `resume` | Resumé link | Opens CV PDF in new tab |
| `linkedin` | LinkedIn link | Opens LinkedIn profile in new tab |
| `email` | Email button | Opens email dialog |

---

## 2. About Page Events

### Experience Companies

**Event name:** `click_experience`  
**Category:** `about`  
**GTM Status:** ✅ Active

| Label | Element |
|---|---|
| `springer_nature` | Springer Nature details toggle |
| `farfetch` | Farfetch details toggle |
| `esapiens` | eSapiens details toggle |
| `triata` | Triata details toggle |

### CTAs (LinkedIn & Resumé)

**Event name:** `click_cta`  
**Category:** `about`  
**GTM Status:** ✅ Active

| Label | Element |
|---|---|
| `linkedin_profile` | LinkedIn profile link (in skillset section) |
| `resume_pdf` | Resumé (PDF) link (in skillset section) |

### Testimonials

**Event name:** `click_testimonial`  
**Category:** `about`  
**GTM Status:** ✅ Active

| Label | Element |
|---|---|
| `sara_cruz` | Sara Cruz profile picture or name link |
| `leandro_kitamura` | Leandro Kitamura profile picture or name link |
| `felipe_trevisan` | Felipe Trevisan profile picture or name link |
| `cinthia_nakazato` | Cínthia Nakazato profile picture or name link |

---

## 3. Case Study Events

### Figma Prototypes

**Event name:** `click_figma_prototype`  
**GTM Status:** ✅ Active

#### Subject Pages (Turning Organic Traffic)

**Category:** `case_study_subject_pages`

| Label | Element |
|---|---|
| `desktop` | Figma Desktop prototype link |
| `mobile` | Figma Mobile prototype link |

#### Journal Finder (Scaling a Journal Matching Platform)

**Category:** `case_study_journal_finder`

| Label | Element |
|---|---|
| `desktop` | Figma Desktop prototype link |
| `mobile` | Figma Mobile prototype link |

---

## 4. Email Dialog Events

**Event name:** `click_copy_email`  
**Category:** `email`  
**GTM Status:** ✅ Active

| Label | Element |
|---|---|
| `copy` | Copy email button in the email dialog |

---

## 5. Auth Events

**Event name:** `access_recruiter_token`  
**Category:** `auth`  
**GTM Status:** ✅ Active

| Label | Trigger | Description |
|---|---|---|
| `ref_parameter` | First visit with `?ref=` URL parameter | Fired once when `checkRecruiterToken()` detects a valid `?ref=` parameter, before the URL is cleaned. Captures the original full URL (with `?ref=cases`) in `page_location`. |

**Event name:** `view_password_dialog`  
**Category:** `auth`  
**GTM Status:** ✅ Active

| Label | Trigger | Description |
|---|---|---|
| `case-journal-finder` | Password dialog opens for Journal Finder | Fired when password dialog opens (via card button click or unauthenticated redirect) for Journal Finder. |
| `case-subject-pages` | Password dialog opens for Subject Pages | Fired when password dialog opens (via card button click or unauthenticated redirect) for Subject Pages. |
| `<contentId>` | Password dialog opens for any configured content | Fired with the specific `contentId` (or `'unknown'`) when the password dialog opens. Captures current URL in `page_location`. |

---

## GTM Container

- **Container ID:** `GTM-P7FKT9N`
- **Implementation:** Events are pushed to `window.dataLayer` and are available for GA4 Event tags in GTM.
- **Localhost exclusion:** GTM only loads on production (hostname check in the GTM snippet).
- **Full setup guide:** See `docs/ANALYTICS.md` → "How to Add a New Tracked Event" → Step 4.
