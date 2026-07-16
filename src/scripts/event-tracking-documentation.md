# Event Tracking Documentation

Reference of all Google Analytics events tracked on renancrociari.com via GTM dataLayer.

## Event Structure

Every event pushed to the dataLayer includes:

| Field | Description |
|---|---|
| `event` | The event name (e.g. `click_nav_link`) |
| `event_category` | Groups events by context (e.g. `home_nav`, `about`) |
| `event_label` | Identifies the specific element clicked (e.g. `linkedin`) |
| `page_location` | The URL path where the event was triggered (e.g. `/about`) |

---

## 1. Navigation Events

**Event name:** `click_nav_link`

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

| Label | Element |
|---|---|
| `springer_nature` | Springer Nature details toggle |
| `farfetch` | Farfetch details toggle |
| `esapiens` | eSapiens details toggle |
| `triata` | Triata details toggle |

### CTAs (LinkedIn & Resumé)

**Event name:** `click_cta`  
**Category:** `about`

| Label | Element |
|---|---|
| `linkedin_profile` | LinkedIn profile link (in skillset section) |
| `resume_pdf` | Resumé (PDF) link (in skillset section) |

### Testimonials

**Event name:** `click_testimonial`  
**Category:** `about`

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

#### Subject Pages (Driving Platform Growth)

**Category:** `case_study_subject_pages`

| Label | Element |
|---|---|
| `desktop` | Figma Desktop prototype link |
| `mobile` | Figma Mobile prototype link |

#### Journal Finder (Connecting Every Discovery)

**Category:** `case_study_journal_finder`

| Label | Element |
|---|---|
| `desktop` | Figma Desktop prototype link |
| `mobile` | Figma Mobile prototype link |

---

## 4. Email Dialog Events

**Event name:** `click_copy_email`  
**Category:** `email`

| Label | Element |
|---|---|
| `copy` | Copy email button in the email dialog |

---

## GTM Container

- **Container ID:** `GTM-P7FKT9N`
- **Implementation:** Events are pushed to `window.dataLayer` and are available for GA4 Event tags in GTM.
- **Localhost exclusion:** GTM only loads on production (hostname check in the GTM snippet).
