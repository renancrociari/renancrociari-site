# Dialog Components Usage Guide

This project has two reusable dialog components that can be included in any page.

## Components Available

### 1. Email Dialog Component
**File:** `/src/components/email-dialog.html`

**Purpose:** Display a dialog to show and copy the email address

**Usage:**
```html
<include src="components/email-dialog.html"></include>
```

**Features:**
- Shows email address: me@renancrociari.com
- Copy to clipboard functionality
- Success/error feedback messages
- Back button to close dialog

**Trigger Button:**
```html
<button class="btn body-medium btn-green btn-show-email" aria-haspopup="dialog">Email</button>
```

---

### 2. Password Dialog Component
**File:** `/src/components/password-dialog.html`

**Purpose:** Display a dialog for password-protected content

**Usage:**
```html
<include src="components/password-dialog.html"></include>
```

**Features:**
- Password input field
- Submit button
- Error message for incorrect password
- Back button to close dialog

**Trigger Button:**
```html
<button class="btn body-medium btn-green btn-show-password" aria-haspopup="dialog">Enter password</button>
```

---

## Using Both Components on the Same Page

You can use both components on the same page by including them separately:

```html
<!-- Email Dialog -->
<include src="components/email-dialog.html"></include>

<!-- Password Dialog -->
<include src="components/password-dialog.html"></include>

<!-- Trigger buttons -->
<button class="btn body-medium btn-green btn-show-email" aria-haspopup="dialog">Email</button>
<button class="btn body-medium btn-green btn-show-password" aria-haspopup="dialog">Enter password</button>
```

**Note:** Each dialog has its own trigger class:
- Email dialog: `.btn-show-email`
- Password dialog: `.btn-show-password`

The JavaScript in `script.js` handles each dialog independently.

**⚠️ Important:** You must include the dialog component on any page where you want to use its trigger button. For example, if your footer has the password dialog button, you need to include the password dialog component on that page:

```html
<!-- Include the dialog component -->
<include src="components/password-dialog.html"></include>

<!-- Then include the footer with the trigger button -->
<include src="components/footer.html"></include>
```

---

## Component Structure

All dialog components follow the same structure:
- Located in `/src/components/`
- Included using Parcel's `<include>` syntax
- Self-contained HTML markup
- Styled using existing CSS classes
- Controlled by JavaScript in `/src/scripts/script.js`

---

## Currently Using These Components

### Email Dialog:
- `index.html`
- `about.html`
- `redesigning-the-mobile-experience-of-a-dating-platform.html`
- `improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands.html`
- `assets.html` (test page)

### Password Dialog:
- `dialog-content-protected.html` (test page)

---

## Benefits

✅ **Single source of truth** - Update once, changes everywhere
✅ **Reduced duplication** - No repeated code across pages
✅ **Easy maintenance** - Modify components independently
✅ **Consistency** - Same behavior across all pages
✅ **Flexibility** - Use either or both dialogs on any page

---

## Navbar Components

### navbar-gray.html
Navbar with **gray logo** variant for light backgrounds.

**Usage:**
```html
<include src="components/navbar-gray.html"></include>
```

**Used by:**
- `about.html`
- `design-system.html`

### navbar-white.html
Navbar with **white logo** variant for dark backgrounds.

**Usage:**
```html
<include src="components/navbar-white.html"></include>
```

**Used by:**
- `redesigning-the-mobile-experience-of-a-dating-platform.html`
- `improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands.html`

**Features:**
- Complete navigation with logo, hamburger menu, and navigation links
- Mobile-responsive with hamburger menu toggle
- Social media icons (LinkedIn, Medium, Dribbble)
- Email dialog trigger button
- Scroll behavior and animations handled by `script.js`
