import axios from "axios";
import { TokenManager } from "./auth-token";

const BASE_URL = "/api";

const API = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

// Add request interceptor to attach rider token
API.interceptors.request.use(
    (config) => {
        const token = TokenManager.getToken('rider');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

let riderRefreshPromise = null;

const refreshRiderAccessToken = async () => {
    riderRefreshPromise ||= axios.post("/api/auth/rider/refresh", {}, { withCredentials: true })
        .then((response) => {
            const accessToken = response.data?.accessToken;
            if (!accessToken) throw new Error("Rider refresh response did not include an access token");
            TokenManager.setToken(accessToken, "rider");
            return accessToken;
        })
        .finally(() => { riderRefreshPromise = null; });
    return riderRefreshPromise;
};

// Refresh an expired access token once before treating the session as invalid.
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const request = error.config;
        const isAuthRequest = request?.url?.startsWith("/auth/rider/");
        if (error.response?.status !== 401 || !request || request._riderAuthRetried || isAuthRequest) {
            return Promise.reject(error);
        }

        request._riderAuthRetried = true;
        try {
            const accessToken = await refreshRiderAccessToken();
            request.headers = request.headers || {};
            request.headers.Authorization = `Bearer ${accessToken}`;
            return API(request);
        } catch (refreshError) {
            TokenManager.clearToken('rider');
            if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("rider:unauthorized"));
            }
            return Promise.reject(refreshError);
        }
    }
);

// Auth
export const riderLogin = async (phone, password) => {
    const response = await API.post("/auth/rider/login", { phone, password });
    return response.data;
};

export const riderRegister = async (payload) => {
    const response = await API.post("/riders/register", payload);
    return response.data;
};

export const riderForgotPassword = async (phoneOrEmail) => {
    const response = await API.post("/auth/rider/forgot-password", { phoneOrEmail });
    return response.data;
};

export const verifyRiderResetCode = async (phoneOrEmail, otp) => {
    const response = await API.post("/auth/rider/verify-reset-code", { phoneOrEmail, otp });
    return response.data;
};

export const riderResetPassword = async (phoneOrEmail, resetToken, newPassword) => {
    const response = await API.post("/auth/rider/reset-password", { phoneOrEmail, resetToken, newPassword });
    return response.data;
};

export const getRiderProfile = async () => {
    const response = await API.get("/auth/rider/me");
    return response.data;
};

export const updateRiderProfile = async (riderId, data) => {
    const response = await API.patch(`/riders/${riderId}`, data);
    return response.data;
};

// Status
export const toggleRiderAvailability = async (riderId, status, reason) => {
    if (!riderId || riderId === 'undefined') {
        throw new Error('Invalid rider ID passed to toggleRiderAvailability');
    }
    // console.log("riderId:", riderId)
    const response = await API.patch(`/riders/${riderId}/status`, { status, ...(reason ? { reason } : {}) });
    return response.data;
};

// Orders
export const getActiveRiderOrder = async (riderId) => {
    const response = await API.get(`/riders/${riderId}/active-order`);
    return response.data;
};

export const getPendingOffers = async (riderId) => {
    const response = await API.get(`/riders/${riderId}/pending-offers`);
    return response.data;
};

export const acceptOffer = async (riderId, orderId) => {
    const response = await API.patch(`/riders/${riderId}/status`, { status: "on_delivery", orderId });
    return response.data;
};

export const riderPickedUpOrder = async (riderId, orderId) => {
    const response = await API.patch(`/riders/${riderId}/picked-up`, { orderId });
    return response.data;
};

export const requestDeliveryOTP = async (riderId, orderId, { resend = false } = {}) => {
    const response = await API.post(`/riders/${riderId}/request-delivery-otp`, { orderId, resend });
    return response.data;
};

export const riderConfirmDelivery = async (riderId, orderId, otp) => {
    const response = await API.post(`/riders/${riderId}/confirm-delivery`, { orderId, otp });
    return response.data;
};

export const getRiderWallet = async (riderId) => {
    const response = await API.get(`/riders/${riderId}/wallet`);
    return response.data;
};

// Notifications
export const getRiderNotifications = async (limit = 20, unread = false) => {
    const response = await API.get(`/riders/notifications?limit=${limit}&unread=${unread}`);
    return response.data;
};

export const getRiderUnreadCount = async () => {
    const response = await API.get(`/riders/notifications/unread`);
    return response.data;
};

export const getSingleNotification = async (id) => {
    const response = await API.get(`/riders/notifications/${id}`);
    return response.data;
};

export const markNotificationAsRead = async (id) => {
    const response = await API.patch(`/riders/notifications/${id}/read`);
    return response.data;
};

// Single Order Detail
export const getRiderSpecificOrder = async (riderId, orderId) => {
    const response = await API.get(`/riders/${riderId}/orders/${orderId}`);
    return response.data;
};

// Ã¢â€â‚¬Ã¢â€â‚¬ Delivery Overhaul Ã¢â‚¬â€ Termination & Disputed Delivery Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

/**
 * Rider-initiated order termination.
 * Resets the order back to ready_for_pickup and re-broadcasts.
 * Logs a strike if food was already picked up.
 *
 * POST /riders/:riderId/orders/:orderId/terminate
 * Body: { note }
 */
export const terminateOrder = async (riderId, orderId, note = "") => {
    const response = await API.post(`/riders/${riderId}/orders/${orderId}/terminate`, { note });
    return response.data;
};

/**
 * Rider flags an order as undeliverable (food spoiled / previous rider unreachable).
 * Triggers vendor remake window (15 min) + admin escalation if no response.
 *
 * POST /riders/:riderId/orders/:orderId/undeliverable
 * Body: { reason }
 */
export const reportUndeliverable = async (riderId, orderId, reason = "") => {
    const response = await API.post(`/riders/${riderId}/orders/${orderId}/undeliverable`, { reason });
    return response.data;
};

// Ã¢â€â‚¬Ã¢â€â‚¬ Payout API Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

// Fetch live bank list from Paystack via rider-scoped route.
// NOTE: /wallet/banks uses vendorAuth Ã¢â‚¬â€ calling it as a rider returns 401
// which triggers the rider logout interceptor. Use /riders/banks instead.
export const getBankList = async () => {
    const response = await API.get('/riders/banks');
    return response.data;
};

// Resolve account name before saving (confirm before committing)
export const resolveRiderAccountName = async (riderId, accountNumber, bankCode) => {
    const response = await API.get(
        `/riders/${riderId}/payout/resolve-account?accountNumber=${accountNumber}&bankCode=${bankCode}`
    );
    return response.data;
};

// Save bank account and create Paystack recipient
export const saveRiderBankAccount = async (riderId, data) => {
    const response = await API.post(`/riders/${riderId}/payout/bank-account`, data);
    return response.data;
};

// Get saved bank account details
export const getRiderBankAccount = async (riderId) => {
    const response = await API.get(`/riders/${riderId}/payout/bank-account`);
    return response.data;
};

// Initiate withdrawal to bank account
export const initiateWithdrawal = async (riderId, amount) => {
    const response = await API.post(`/riders/${riderId}/payout/withdraw`, { amount });
    return response.data;
};

// Fetch withdrawal history
export const getRiderWithdrawalHistory = async (riderId) => {
    const response = await API.get(`/riders/${riderId}/payout/history`);
    return response.data;
};

// Public Bank Discovery (for registration onboarding)
export const getPublicBankList = async () => {
    const response = await API.get('/wallet/public/banks');
    return response.data;
};

export const resolvePublicAccount = async (accountNumber, bankCode) => {
    const response = await API.get('/wallet/public/resolve-account', {
        params: { account_number: accountNumber, bank_code: bankCode }
    });
    return response.data;
};

export default API;
