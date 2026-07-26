# Password Protection System

## Overview

This project implements a client-side password protection system for case study pages. The system uses SHA-256 password hashing and sessionStorage for authentication.

## Default Password

**Password:** `demo123`

> **Note:** This is a demo password. To change it, see the "Changing Passwords" section below.

## How It Works

1. **Protected Pages**: Case study pages check for authentication on load
2. **Password Dialog**: Users enter a password to unlock protected content
3. **Validation**: Password is hashed with SHA-256 and compared to stored hash
4. **Session Storage**: Authentication tokens are stored in sessionStorage
5. **Redirect**: On success, users are redirected to the protected page

## Testing the Password Dialog

Visit the **Design System** page (`/design-system.html`) and click the "Open Password Dialog" button to test the functionality.

## Protected Pages

Currently protected pages:
- **Case Study 1**: Improving the performance of Farfetch's top fashion eCommerce brands
- **Case Study 2**: Redesigning the mobile experience of a dating platform

## Changing Passwords

### Step 1: Generate a New Password Hash

Open your browser console and run:

```javascript
async function generateHash(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate hash for your new password
await generateHash('your-new-password');
```

### Step 2: Update the Configuration

Edit `src/scripts/password-config.js` and replace the hash:

```javascript
export const PASSWORD_CONFIG = {
  'case-study-1': {
    hash: 'YOUR_NEW_HASH_HERE',
    redirectUrl: '/improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands.html'
  },
  'case-study-2': {
    hash: 'YOUR_NEW_HASH_HERE',
    redirectUrl: '/redesigning-the-mobile-experience-of-a-dating-platform.html'
  }
};
```

## Different Passwords for Different Pages

You can set different passwords for each protected page by using different hashes:

```javascript
export const PASSWORD_CONFIG = {
  'case-study-1': {
    hash: 'hash_for_farfetch_case_study',
    redirectUrl: '/improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands.html'
  },
  'case-study-2': {
    hash: 'hash_for_dating_platform_case_study',
    redirectUrl: '/redesigning-the-mobile-experience-of-a-dating-platform.html'
  }
};
```

## Adding Password Protection to New Pages

### Step 1: Add Content ID to Configuration

Edit `src/scripts/password-config.js`:

```javascript
export const PASSWORD_CONFIG = {
  // ... existing configs ...
  'new-content-id': {
    hash: 'your_password_hash',
    redirectUrl: '/path-to-your-protected-page.html'
  }
};
```

### Step 2: Add Protection Script to Page

Add this script tag in the `<head>` section of your protected page:

```html
<script type="module">
  import { initProtectedPage } from '../scripts/protected-page.js';
  initProtectedPage('new-content-id');
</script>
```

### Step 3: Include Password Dialog Component

Add this line before the closing `</body>` tag:

```html
<include src="components/password-dialog.html"></include>
```

## Security Notes

⚠️ **Important**: This is a client-side only solution. The password hash is visible in the source code.

**Security Level**: Medium - Protects against casual users, not determined attackers.

**Best For**: 
- Portfolio case studies
- Work samples
- Content you want to share selectively but isn't highly confidential

**Not Suitable For**:
- Highly sensitive content
- NDA-protected work requiring strong security
- Content that must be completely hidden from public view

## Session Behavior

- **Session Persistence**: Authentication persists while the browser tab/window is open
- **Browser Close**: Authentication is cleared when the browser is closed
- **Refresh**: Authentication persists on page refresh
- **New Tab**: New tabs require re-authentication

## Files Structure

```
src/
├── scripts/
│   ├── password-config.js      # Password hashes and page mappings
│   ├── password-auth.js        # Authentication utilities
│   ├── protected-page.js       # Page protection logic
│   └── script.js               # Main script with dialog integration
└── components/
    └── password-dialog.html    # Password dialog UI component
```

## Troubleshooting

### Password dialog doesn't open
- Check that the button has `data-content-id` attribute
- Verify the content ID exists in `password-config.js`

### "Content ID not found" error
- Ensure the content ID in the button matches the config
- Check console for error messages

### Redirect doesn't work
- Verify the `redirectUrl` in config is correct
- Check browser console for errors

### Authentication doesn't persist
- Check that sessionStorage is enabled in browser
- Verify no browser extensions are blocking storage
