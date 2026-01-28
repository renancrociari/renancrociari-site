/**
 * Password Configuration
 * 
 * This file stores password hashes and protected page mappings.
 * 
 * To generate a new password hash, run this in the browser console:
 * 
 * async function generateHash(password) {
 *   const encoder = new TextEncoder();
 *   const data = encoder.encode(password);
 *   const hashBuffer = await crypto.subtle.digest('SHA-256', data);
 *   const hashArray = Array.from(new Uint8Array(hashBuffer));
 *   return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
 * }
 * 
 * Then call: await generateHash('your-password')
 */

// Password hashes (SHA-256)
// Default password for demo: "demo123"
export const PASSWORD_CONFIG = {
    'case-study-1': {
        hash: 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791',
        redirectUrl: '/improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands.html'
    },
    'case-study-2': {
        hash: 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791',
        redirectUrl: '/redesigning-the-mobile-experience-of-a-dating-platform.html'
    }
};

// Session storage key for authentication tokens
export const AUTH_KEY = 'rc_auth_tokens';
