/**
 * Secure Token Manager
 * 
 * Implements an in-memory token storage with localStorage fallback for iOS reliability.
 * Handles token persistence safely while avoiding XSS risks where possible.
 */

const STORAGE_KEYS = {
    user: 'melachow_access_token_v1',
    vendor: 'melachow_vendor_token_v1',
    admin: 'melachow_admin_token_v1',
    rider: 'melachow_rider_token_v1'
};

// In-memory storage (primary)
let memoryTokens = {
    user: null,
    vendor: null,
    admin: null,
    rider: null
};

export const TokenManager = {
    /**
     * Set the access token
     * @param {string} token - The JWT access token
     * @param {string} role - The role (user, vendor, admin)
     */
    setToken: (token, role = 'user') => {
        if (!token) return;

        // Save to memory
        memoryTokens[role] = token;

        // Save to localStorage (fallback for iOS/Reloads)
        try {
            if (typeof window !== "undefined") {
                localStorage.setItem(STORAGE_KEYS[role] || STORAGE_KEYS.user, token);
            }
        } catch (e) {
            console.warn(`SecureAuth: LocalStorage unavailable for ${role}`, e);
        }
    },

    /**
     * Get the access token
     * @param {string} role - The role (user, vendor, admin)
     * @returns {string|null} - The token or null
     */
    getToken: (role = 'user') => {
        // Return memory token if available
        if (memoryTokens[role]) return memoryTokens[role];

        // Fallback to localStorage
        try {
            if (typeof window !== "undefined") {
                return localStorage.getItem(STORAGE_KEYS[role] || STORAGE_KEYS.user);
            }
        } catch (e) {
            // Ignore errors
        }
        return null;
    },

    /**
     * Clear the access token
     * @param {string} role - The role (user, vendor, admin)
     */
    clearToken: (role = 'user') => {
        memoryTokens[role] = null;
        try {
            if (typeof window !== "undefined") {
                localStorage.removeItem(STORAGE_KEYS[role] || STORAGE_KEYS.user);
            }
        } catch (e) {
            // Ignore errors
        }
    },

    /**
     * Initialize tokens from storage (call on app boot)
     */
    initialize: () => {
        try {
            if (typeof window !== "undefined") {
                Object.keys(STORAGE_KEYS).forEach(role => {
                    const stored = localStorage.getItem(STORAGE_KEYS[role]);
                    if (stored) {
                        memoryTokens[role] = stored;
                        console.log(`[TokenManager] ${role} token initialized on app boot`);
                    }
                });
            }
        } catch (e) { }
    }
};

// ✅ Auto-initialize on import (Client-side only)
if (typeof window !== 'undefined') {
    TokenManager.initialize();
}

