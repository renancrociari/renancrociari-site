/**
 * Password Authentication Module
 * 
 * Provides utilities for password hashing, validation, and session management.
 */

import { PASSWORD_CONFIG, AUTH_KEY, RECRUITER_TOKEN, RECRUITER_KEY } from './password-config.js';

/**
 * Hash a password using SHA-256
 * @param {string} password - The password to hash
 * @returns {Promise<string>} The hashed password as a hex string
 */
export async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate a password for a specific content ID
 * @param {string} contentId - The ID of the protected content
 * @param {string} password - The password to validate
 * @returns {Promise<boolean>} True if password is valid, false otherwise
 */
export async function validatePassword(contentId, password) {
    const config = PASSWORD_CONFIG[contentId];
    if (!config) {
        console.error(`No password configuration found for content ID: ${contentId}`);
        return false;
    }

    const hash = await hashPassword(password);
    return hash === config.hash;
}

/**
 * Store authentication token for a content ID
 * @param {string} contentId - The ID of the protected content
 */
export function storeAuthToken(contentId) {
    const tokens = getAuthTokens();
    tokens[contentId] = Date.now();
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(tokens));
}

/**
 * Check for recruiter access token in URL parameters.
 * If valid, stores recruiter session access and cleans URL.
 * @returns {boolean} True if recruiter token was validated and stored
 */
export function checkRecruiterToken() {
    try {
        const url = new URL(window.location.href);
        const refParam = url.searchParams.get('ref');

        if (refParam && refParam.toLowerCase() === RECRUITER_TOKEN.toLowerCase()) {
            sessionStorage.setItem(RECRUITER_KEY, JSON.stringify({ grantedAt: Date.now() }));

            // Clean ?ref= parameter from the URL without reloading
            url.searchParams.delete('ref');
            const searchStr = url.searchParams.toString();
            const cleanUrl = url.pathname + (searchStr ? `?${searchStr}` : '') + url.hash;
            window.history.replaceState(null, '', cleanUrl);

            return true;
        }
    } catch (error) {
        console.error('Error checking recruiter token:', error);
    }
    return false;
}

/**
 * Check if recruiter session access is active
 * @returns {boolean} True if recruiter access is granted for this session
 */
export function hasRecruiterAccess() {
    try {
        return !!sessionStorage.getItem(RECRUITER_KEY);
    } catch (error) {
        return false;
    }
}

/**
 * Check if user is authenticated for a specific content ID
 * @param {string} contentId - The ID of the protected content
 * @returns {boolean} True if authenticated, false otherwise
 */
export function isAuthenticated(contentId) {
    // Recruiter token grants session-wide access to all protected content
    if (hasRecruiterAccess()) {
        return true;
    }
    const tokens = getAuthTokens();
    return !!tokens[contentId];
}

/**
 * Get all authentication tokens from session storage
 * @returns {Object} Object containing all auth tokens
 */
function getAuthTokens() {
    const stored = sessionStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : {};
}

/**
 * Clear authentication for a specific content ID or all content
 * @param {string|null} contentId - The ID of the content to clear, or null to clear all
 */
export function clearAuth(contentId = null) {
    if (contentId) {
        const tokens = getAuthTokens();
        delete tokens[contentId];
        sessionStorage.setItem(AUTH_KEY, JSON.stringify(tokens));
    } else {
        sessionStorage.removeItem(AUTH_KEY);
        sessionStorage.removeItem(RECRUITER_KEY);
    }
}

/**
 * Get the redirect URL for a content ID
 * @param {string} contentId - The ID of the protected content
 * @returns {string|null} The redirect URL or null if not found
 */
export function getRedirectUrl(contentId) {
    const config = PASSWORD_CONFIG[contentId];
    return config ? config.redirectUrl : null;
}

