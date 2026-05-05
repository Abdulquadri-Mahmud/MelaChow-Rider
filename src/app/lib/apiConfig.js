/**
 * API Configuration for MelaChow Frontend
 * 
 * This file centralizes API URL configuration to support the iOS Safari
 * cookie fix via Next.js API proxy.
 * 
 * IMPORTANT: Always use getApiUrl() instead of hardcoded URLs
 */

/**
 * Get the base API URL
 * 
 * In production (Vercel):
 * - Returns relative URL "/api" to use Next.js proxy
 * - Makes cookies first-party on iOS Safari/PWA
 * 
 * In development:
 * - Can use direct backend URL or proxy (configurable)
 * 
 * @returns {string} Base API URL
 */
export const getApiUrl = () => {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
        const base = process.env.NEXT_PUBLIC_API_URL || 'https://grubdash-api.onrender.com';
        return base.endsWith('/api') ? base : `${base}/api`;
    }

    // Client-side: Use relative URL to leverage Next.js proxy
    // This makes all API requests go through the frontend domain
    // Example: https://grub-dash-frontend-xi.vercel.app/api/user/auth/profile
    //          ↓ (proxied to)
    //          https://grub-dash-api.vercel.app/api/user/auth/profile
    return '/api';
    // return 'http://localhost:3001/api';
};

/**
 * Get full API URL (with base)
 * 
 * @param {string} endpoint - API endpoint (e.g., "/user/auth/profile")
 * @returns {string} Full API URL
 * 
 * @example
 * getFullApiUrl('/user/auth/profile')
 * // Returns: "/api/user/auth/profile" (production)
 * // Returns: "http://localhost:5000/api/user/auth/profile" (dev, if configured)
 */
export const getFullApiUrl = (endpoint) => {
    const baseUrl = getApiUrl();

    // Remove leading slash from endpoint if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    // Ensure base URL doesn't end with slash
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    return `${cleanBaseUrl}/${cleanEndpoint}`;
};

/**
 * Check if we're using the proxy
 * 
 * @returns {boolean} True if using Next.js proxy
 */
export const isUsingProxy = () => {
    return getApiUrl().startsWith('/');
};

/**
 * Default fetch options for API requests
 * 
 * CRITICAL: credentials: "include" is required for cookies to work
 */
export const defaultFetchOptions = {
    credentials: 'include', // ✅ REQUIRED for cookies
    headers: {
        'Content-Type': 'application/json',
    },
};

/**
 * Default axios config for API requests
 * 
 * CRITICAL: withCredentials: true is required for cookies to work
 */
export const defaultAxiosConfig = {
    withCredentials: true, // ✅ REQUIRED for cookies
    headers: {
        'Content-Type': 'application/json',
    },
};

/**
 * Helper function to make API requests with fetch
 * 
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 * 
 * @example
 * const data = await apiFetch('/user/auth/profile');
 */
export const apiFetch = async (endpoint, options = {}) => {
    const url = getFullApiUrl(endpoint);
    const mergedOptions = {
        ...defaultFetchOptions,
        ...options,
        headers: {
            ...defaultFetchOptions.headers,
            ...options.headers,
        },
    };

    return fetch(url, mergedOptions);
};

/**
 * Migration Guide:
 * 
 * OLD (Direct backend URL):
 * ```javascript
 * fetch('https://grub-dash-api.vercel.app/api/user/auth/profile', {
 *   credentials: 'include'
 * })
 * ```
 * 
 * NEW (Using proxy):
 * ```javascript
 * import { apiFetch } from './apiConfig';
 * 
 * apiFetch('/user/auth/profile')
 * ```
 * 
 * OR manually:
 * ```javascript
 * import { getFullApiUrl, defaultFetchOptions } from './apiConfig';
 * 
 * fetch(getFullApiUrl('/user/auth/profile'), defaultFetchOptions)
 * ```
 */

export default {
    getApiUrl,
    getFullApiUrl,
    isUsingProxy,
    defaultFetchOptions,
    defaultAxiosConfig,
    apiFetch,
};

