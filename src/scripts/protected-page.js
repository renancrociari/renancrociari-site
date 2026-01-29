/**
 * Protected Page Module
 * 
 * Handles access control for password-protected pages.
 * Include this script on any page that requires authentication.
 */

import { isAuthenticated } from './password-auth.js';

/**
 * Initialize protection for a page
 * Redirects to home page with password dialog if user is not authenticated
 * @param {string} contentId - The ID of the protected content
 */
export function initProtectedPage(contentId) {
    // Check if user is authenticated
    if (!isAuthenticated(contentId)) {
        // Store the attempted URL for potential redirect back after auth
        sessionStorage.setItem('rc_attempted_url', window.location.pathname);

        // Redirect to home page with hash to open password dialog
        window.location.href = `/#password-protected?content=${contentId}`;
    } else {
        // User is authenticated, show the page content
        document.body.style.visibility = 'visible';
    }
}
