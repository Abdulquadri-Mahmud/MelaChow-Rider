/**
 * Example: Updated API Service with iOS Safari Cookie Fix
 * 
 * This file demonstrates how to migrate from absolute URLs to relative URLs
 * using the apiConfig helper to support the Next.js API proxy.
 * 
 * File: src/app/lib/api.js (EXAMPLE - Partial Migration)
 */

import axios from "axios";
import { TokenManager } from "./auth-token";
import { getFullApiUrl, apiFetch, defaultAxiosConfig } from "./apiConfig";

// Initialize token from storage
TokenManager.initialize();

// Add request interceptor to attach token
axios.interceptors.request.use(
    (config) => {
        const token = TokenManager.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Helper to dispatch unauthorized event
const dispatchUserUnauthorized = () => {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("user:unauthorized"));
    }
};

/**
 * EXAMPLE 1: Fetch User Profile
 * 
 * BEFORE:
 * const res = await fetch("https://grub-dash-api.vercel.app/api/user/auth/profile", {
 *   credentials: "include"
 * });
 * 
 * AFTER (Option 1 - Using apiFetch helper):
 */
export const fetchUser = async () => {
    const token = TokenManager.getToken();
    const headers = {};

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // ✅ Using apiFetch helper (recommended)
    const res = await apiFetch("/user/auth/profile", {
        headers: headers
    });

    if (res.status === 401) {
        return null;
    }

    if (!res.ok) {
        throw new Error("Unauthorized or fetch failed!");
    }

    const data = await res.json();
    return data;
};

/**
 * EXAMPLE 2: Create Order
 * 
 * BEFORE:
 * const res = await axios.post(
 *   "https://grub-dash-api.vercel.app/api/orders/create",
 *   orderData,
 *   { withCredentials: true }
 * );
 * 
 * AFTER (Using getFullApiUrl + defaultAxiosConfig):
 */
export const createOrder = async (orderData) => {
    try {
        // ✅ Using getFullApiUrl helper
        const res = await axios.post(
            getFullApiUrl("/orders/create"),
            orderData,
            defaultAxiosConfig // Includes withCredentials: true
        );

        return res.data;
    } catch (error) {
        console.error("Create Order Error:", error);

        if (error.response && error.response.status === 401) {
            dispatchUserUnauthorized();
        }

        const message =
            error.response?.data?.message ||
            error.message ||
            "Failed to create order";

        throw new Error(message);
    }
};

/**
 * EXAMPLE 3: Verify Payment
 * 
 * BEFORE:
 * const res = await axios.post(
 *   `https://grub-dash-api.vercel.app/api/orders/verify/${reference}`,
 *   body,
 *   { withCredentials: true }
 * );
 * 
 * AFTER:
 */
export const verifyPayment = async (reference, body = {}) => {
    try {
        // ✅ Using template literal with getFullApiUrl
        const res = await axios.post(
            getFullApiUrl(`/orders/verify/${reference}`),
            body,
            defaultAxiosConfig
        );

        return res.data;
    } catch (error) {
        console.error("Verify Payment Error:", error);

        if (error.response && error.response.status === 401) {
            dispatchUserUnauthorized();
        }

        const message =
            error.response?.data?.message ||
            error.message ||
            "Failed to verify payment";

        throw new Error(message);
    }
};

/**
 * EXAMPLE 4: Get Wallet
 * 
 * BEFORE:
 * const res = await axios.get("https://grub-dash-api.vercel.app/api/user/my-wallet", {
 *   withCredentials: true,
 * });
 * 
 * AFTER:
 */
export const getWallet = async () => {
    try {
        // ✅ Clean and simple
        const res = await axios.get(
            getFullApiUrl("/user/my-wallet"),
            defaultAxiosConfig
        );
        return res.data;
    } catch (error) {
        console.error("Get Wallet Error:", error);
        if (error.response && error.response.status === 401) {
            dispatchUserUnauthorized();
        }
        throw error;
    }
};

/**
 * EXAMPLE 5: Fund Wallet
 * 
 * BEFORE:
 * const res = await axios.post("https://grub-dash-api.vercel.app/api/user/wallet/fund", data, {
 *   withCredentials: true,
 * });
 * 
 * AFTER:
 */
export const fundWallet = async (data) => {
    try {
        const res = await axios.post(
            getFullApiUrl("/user/wallet/fund"),
            data,
            defaultAxiosConfig
        );
        return res.data;
    } catch (error) {
        console.error("Fund Wallet Error:", error);
        if (error.response && error.response.status === 401) {
            dispatchUserUnauthorized();
        }
        throw error;
    }
};

/**
 * EXAMPLE 6: Public API (No Auth Required)
 * 
 * BEFORE:
 * const res = await axios.get(
 *   `https://grub-dash-api.vercel.app/api/public/reviews/vendor/${vendorId}?${params}`
 * );
 * 
 * AFTER:
 */
export const getRestaurantReviews = async (vendorId, page = 1, limit = 10, rating = null) => {
    try {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        if (rating && rating !== 'all') {
            params.append('rating', rating.toString());
        }

        // ✅ Public endpoints also use proxy (for consistency)
        const res = await axios.get(
            getFullApiUrl(`/public/reviews/vendor/${vendorId}?${params}`)
            // Note: No auth config needed for public endpoints
        );

        return res.data;
    } catch (error) {
        console.error("Get Restaurant Reviews Error:", error);
        return {
            success: false,
            data: {
                restaurant: { averageRating: 0, totalReviews: 0 },
                reviews: [],
                pagination: { currentPage: page, totalPages: 0, totalReviews: 0 },
            },
            error: error.message
        };
    }
};

/**
 * EXAMPLE 7: Verify Discount
 * 
 * BEFORE:
 * const res = await axios.post("https://grub-dash-api.vercel.app/api/discounts/verify", data, {
 *   withCredentials: true,
 * });
 * 
 * AFTER:
 */
export const verifyDiscount = async (data) => {
    try {
        const res = await axios.post(
            getFullApiUrl("/discounts/verify"),
            data,
            defaultAxiosConfig
        );
        return res.data;
    } catch (error) {
        if (error.response && error.response.status === 401) {
            dispatchUserUnauthorized();
        }
        throw error;
    }
};

/**
 * EXAMPLE 8: Get Vendor by ID
 * 
 * BEFORE:
 * const res = await axios.get(`https://grub-dash-api.vercel.app/api/user/vendors/${vendorId}`, {
 *   withCredentials: true,
 * });
 * 
 * AFTER:
 */
export const getVendorById = async (vendorId) => {
    try {
        const res = await axios.get(
            getFullApiUrl(`/user/vendors/${vendorId}`),
            defaultAxiosConfig
        );
        return res.data;
    } catch (error) {
        console.error("Get Vendor By ID Error:", error);
        if (error.response && error.response.status === 401) {
            dispatchUserUnauthorized();
        }
        throw error;
    }
};

/**
 * Migration Summary:
 * 
 * 1. Import helpers:
 *    import { getFullApiUrl, apiFetch, defaultAxiosConfig } from "./apiConfig";
 * 
 * 2. Replace absolute URLs:
 *    - "https://grub-dash-api.vercel.app/api/ENDPOINT"
 *    + getFullApiUrl("/ENDPOINT")
 * 
 * 3. Use default config:
 *    - { withCredentials: true, headers: {...} }
 *    + defaultAxiosConfig (or merge with it)
 * 
 * 4. For fetch calls, use apiFetch helper:
 *    - fetch("https://...", { credentials: "include" })
 *    + apiFetch("/endpoint")
 * 
 * Benefits:
 * ✅ Works on iOS Safari
 * ✅ Works on iOS PWAs
 * ✅ Cleaner code
 * ✅ Centralized configuration
 * ✅ Easy to switch between proxy/direct
 */
