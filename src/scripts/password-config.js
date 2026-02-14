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
    'case-journal-finder': {
        hash: 'e4e2ff1a6fc2a6ce836b66c424aa2bdd4803d5b92d9750b0db4df4b1d1a8a597',
        redirectUrl: '/connecting-every-discovery-with-a-worthy-home'
    }
};

// Session storage key for authentication tokens
export const AUTH_KEY = 'rc_auth_tokens';
