# Password Protection System (Paywall Model)

## Overview

Protected case studies are **public, indexable pages with a paywall**:

- The full case is in the HTML, so Google can crawl and index it.
- Visitors without access see the password dialog on top of the case (the case is hidden behind it).
- The password or a `?ref=cases` link unlocks it.

It is **light protection**, designed to stop casual visitors (e.g. colleagues browsing the portfolio), not determined ones. The text is visible in view-source, and Google may quote any part of it in search snippets.

## Password

The password is not stored in the repo, only its SHA-256 hash in `password-config.js` (see "Changing Passwords" below). The comment there mentioning `demo123` is outdated.

## Currently Protected Cases

| Content ID | Page |
|---|---|
| `case-journal-finder` | `/scaling-a-journal-matching-platform-to-1m-sessions-with-8-6-percent-conversion` |
| `case-subject-pages` | `/turning-organic-traffic-into-250k-readers-with-scalable-landing-pages` |

## How It Works

1. **Before first paint**, an inline (non-module) script in the page `<head>` checks access (`?ref=cases`, `localStorage.rc_recruiter_access`, `sessionStorage.rc_auth_tokens[contentId]`). Without access it adds `.is-locked` to `<html>`.
2. **CSS** (`main.css`) hides the page when `html.is-locked`, except the password dialog.
3. **`script.js`** reads `<body data-protected-content="<contentId>">`, processes any `?ref=` token, and opens the password dialog (full screen, same design as before) if the visitor still has no access.
4. **Valid password** → token stored in `sessionStorage`, `.is-locked` removed, dialog fades out; the case is revealed in place (no reload).
5. **"Back to website" / ESC** → never reveals the case:
   - Came from another page of this site → `history.back()` (returns to that page).
   - Came from outside (Google, LinkedIn, bookmark, new tab) → `/`.
6. **Google** sees the full case. The JSON-LD declares it as paywalled content so hiding it from visitors isn't treated as cloaking:
   ```json
   "isAccessibleForFree": false,
   "hasPart": { "@type": "WebPageElement", "isAccessibleForFree": false, "cssSelector": ".article-content" }
   ```

Cards linking to protected cases (`card-journal-finder.html`, `card-subject-pages.html`, homepage cards) are **plain links**; the gate lives on the case page.

The homepage still supports legacy links of the form `/#password-protected?content=<id>` (old redirect flow): it opens the dialog and redirects to the case after a valid password.

## Recruiter Access Token (`?ref=cases`)

Share links that skip the password:

- **Homepage:** `https://www.renancrociari.com?ref=cases`
- **Direct case:** `https://www.renancrociari.com/scaling-a-journal-matching-platform-to-1m-sessions-with-8-6-percent-conversion?ref=cases`

How it works:
1. Any page opened with `?ref=cases` unlocks **all** protected cases in that browser (`localStorage`, no expiry).
2. The `?ref=` parameter is removed from the URL bar (`history.replaceState`) and an `access_recruiter_token` event is pushed to the dataLayer.
3. Visitors without the token still see the password dialog.

To change the token, edit `RECRUITER_TOKEN` in `src/scripts/password-config.js` **and** the `'cases'` string in the inline Paywall gate script of every protected page.

## Changing Passwords

Generate a hash in the browser console:

```javascript
async function generateHash(password) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}
await generateHash('your-new-password');
```

Then replace the `hash` for the content ID in `src/scripts/password-config.js`. Each content ID can have its own password.

## Adding Protection to a New Case

1. **Config** — add the content ID to `src/scripts/password-config.js`:
   ```javascript
   'new-content-id': {
     hash: 'your_password_hash',
     redirectUrl: '/new-case-slug'
   }
   ```
2. **Body** — `<body class="..." data-protected-content="new-content-id">`.
3. **Head** — copy the inline `<!-- Paywall gate -->` script from an existing protected case, place it before `script.js`, and change `contentId`.
4. **JSON-LD** — add `isAccessibleForFree: false` and `hasPart` (see "How It Works" §6).
5. **Dialog** — include `<include src="components/password-dialog.html"></include>` before the footer.
6. **Cards** — plain `<a class="btn ..." href="new-case-slug">` links.
7. Keep the page indexable and listed in `public/sitemap.xml`.

## Removing Protection From a Case

Remove `data-protected-content`, the inline Paywall gate script, the `isAccessibleForFree`/`hasPart` JSON-LD fields and the `password-dialog.html` include. Optionally remove the config entry.

## Session Behavior

- **Password**: stored in `sessionStorage` — lasts while the tab is open; new tabs ask again.
- **`?ref=cases`**: stored in `localStorage` — persists across tabs and browser restarts until storage is cleared.

## Files

```
src/
├── scripts/
│   ├── password-config.js   # Hashes, content IDs, redirect URLs, recruiter token
│   ├── password-auth.js     # Hashing, token checks, ?ref= handling
│   └── script.js            # Dialog logic, paywall unlock / leave behaviour
├── styles/main.css          # html.is-locked rules
├── components/
│   └── password-dialog.html # Dialog UI
└── pages/<protected-case>.html  # data-protected-content + inline Paywall gate + JSON-LD
```

## Testing

- Open a protected case in a private window → dialog shows, no flash of the case.
- "Back to website" after arriving from the homepage → back to the homepage card; after opening the URL directly → `/`.
- Enter the password → case revealed in place; reload → still unlocked (same tab).
- Open with `?ref=cases` → no dialog, URL cleaned.
- Design System page (`/design-system`) → "Open Password Dialog" demo still works.

## Troubleshooting

- **Blank page, no dialog** → `password-dialog.html` missing on the protected page (console: `[password-dialog] Protected page ... is missing`), or a JS error prevents `script.js` from running.
- **Case visible without password** → check `data-protected-content` on `<body>` and the inline gate script's `contentId`.
- **"Content ID not found"** → the content ID isn't in `password-config.js`.
