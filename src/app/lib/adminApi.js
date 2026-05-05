/**
 * Admin API Service
 * All admin API calls with proper authentication using HTTP-only cookies
 */

import axios from "axios";
import { TokenManager } from "@/app/lib/auth-token";

const API_BASE_URL = ""; // Hit the Next.js local proxy instead of absolute Render URL to fix 401s

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add request interceptor to attach token
api.interceptors.request.use(
    (config) => {
        const token = TokenManager.getToken('admin');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

class AdminAPI {
    /**
     * Helper method to handle API responses
     */
    async handleResponse(request) {
        try {
            const response = await request;
            return response.data;
        } catch (error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                if (error.response.status === 401) {
                    // Unauthorized - dispatch global event for logout handler
                    if (typeof window !== "undefined") {
                        window.dispatchEvent(new Event("admin:unauthorized"));
                    }
                    throw new Error("Unauthorized - Please login");
                }
                const message = error.response.data?.message || "Request failed";
                throw new Error(message);
            } else if (error.request) {
                // The request was made but no response was received
                throw new Error("Network error - No response received");
            } else {
                // Something happened in setting up the request
                throw new Error(error.message);
            }
        }
    }

    // ==================== AUTHENTICATION ====================

    async login(email, password) {
        return this.handleResponse(
            api.post("/api/admin/auth/login", { email, password })
        );
    }

    async register(name, email, password, role = "admin") {
        return this.handleResponse(
            api.post("/api/admin/auth/register", { name, email, password, role })
        );
    }

    async logout() {
        return this.handleResponse(api.post("/api/admin/auth/logout"));
    }

    async forgotPassword(email) {
        return this.handleResponse(
            api.post("/api/admin/auth/forgot-password", { email })
        );
    }

    async verifyResetCode(email, otp) {
        return this.handleResponse(
            api.post("/api/admin/auth/verify-reset-code", { email, otp })
        );
    }

    async resetPassword(email, resetToken, newPassword) {
        return this.handleResponse(
            api.post("/api/admin/auth/reset-password", { email, resetToken, newPassword })
        );
    }

    // ==================== VENDOR MANAGEMENT ====================

    async getAllVendors(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.handleResponse(
            api.get(`/api/admin/vendors/get-all?${params}`)
        );
    }

    async getVendorById(vendorId) {
        return this.handleResponse(
            api.get(`/api/admin/vendors/single?vendorId=${vendorId}`)
        );
    }

    async approveVendor(vendorId, locationBody = {}) {
        return this.handleResponse(
            api.patch(`/api/admin/vendors/approve?vendorId=${vendorId}`, locationBody)
        );
    }

    async rejectVendor(vendorId, reason) {
        return this.handleResponse(
            api.patch(
                `/api/admin/vendors/reject?vendorId=${vendorId}&reason=${encodeURIComponent(
                    reason
                )}`
            )
        );
    }

    async suspendVendor(vendorId, reason) {
        return this.handleResponse(
            api.patch(
                `/api/admin/vendors/suspend?vendorId=${vendorId}&reason=${encodeURIComponent(
                    reason
                )}`
            )
        );
    }

    async reactivateVendor(vendorId) {
        return this.handleResponse(
            api.patch(`/api/admin/vendors/reactivate?vendorId=${vendorId}`)
        );
    }

    async updateVendorStatus(vendorId, suspended) {
        return this.handleResponse(
            api.patch(
                `/api/admin/vendors/status?vendorId=${vendorId}&suspended=${suspended}`
            )
        );
    }

    async updateCommission(commissionRate) {
        return this.handleResponse(
            api.patch("/api/admin/vendors/commission", { commissionRate })
        );
    }

    async getVendorPerformance(vendorId) {
        return this.handleResponse(
            api.get(`/api/admin/vendors/performance?vendorId=${vendorId}`)
        );
    }

    async getVendorMetrics() {
        return this.handleResponse(api.get("/api/admin/vendors/metrics"));
    }

    async getVendorFoods(vendorId) {
        return this.handleResponse(
            api.get(`/api/admin/vendors/foods?vendorId=${vendorId}`)
        );
    }

    async updateVendorDeliveryMode(vendorId, deliveryManagedBy) {
        return this.handleResponse(
            api.patch(`/api/admin/vendors/${vendorId}/delivery-mode`, { deliveryManagedBy })
        );
    }

    // ==================== USER MANAGEMENT ====================

    async getAllUsers(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.handleResponse(
            api.get(`/api/admin/user/all?${params}`)
        );
    }

    async getUserById(userId) {
        return this.handleResponse(
            api.get(`/api/admin/user/single?userId=${userId}`)
        );
    }

    async getUserStats() {
        return this.handleResponse(api.get("/api/admin/user/stats"));
    }

    async suspendUser(userId, reason) {
        return this.handleResponse(
            api.patch(
                `/api/admin/user/suspend?userId=${userId}&reason=${encodeURIComponent(
                    reason
                )}`
            )
        );
    }

    async banUser(userId, reason) {
        return this.handleResponse(
            api.patch(
                `/api/admin/user/ban?userId=${userId}&reason=${encodeURIComponent(
                    reason
                )}`
            )
        );
    }

    async reactivateUser(userId) {
        return this.handleResponse(
            api.patch(`/api/admin/user/reactivate?userId=${userId}`)
        );
    }

    async getUserMetrics() {
        return this.handleResponse(api.get("/api/admin/users/metrics"));
    }

    // ==================== ADMIN MANAGEMENT ====================

    async getAllAdmins() {
        return this.handleResponse(api.get("/api/admin/get-all"));
    }

    async getMe() {
        return this.handleResponse(api.get("/api/admin/me"));
    }

    async deleteAdmin(adminId) {
        return this.handleResponse(
            api.delete(`/api/admin/delete/${adminId}`)
        );
    }

    // ==================== CATEGORY MANAGEMENT ====================

    async getAllCategories() {
        return this.handleResponse(
            api.get("/api/categories/admin/all")
        );
    }

    async createCategory(categoryData) {
        return this.handleResponse(
            api.post("/api/categories", categoryData)
        );
    }

    async updateCategory(categoryId, categoryData) {
        return this.handleResponse(
            api.put(`/api/categories/${categoryId}`, categoryData)
        );
    }

    async deleteCategory(categoryId) {
        return this.handleResponse(
            api.delete(`/api/categories/${categoryId}`)
        );
    }

    async getCategoryMetrics() {
        return this.handleResponse(api.get("/api/admin/categories/metrics"));
    }

    // ==================== LOCATION MANAGEMENT ====================

    async getAllStates() {
        return this.handleResponse(api.get("/api/admin/locations/states"));
    }

    async getLocationMetrics() {
        return this.handleResponse(api.get("/api/admin/locations/metrics"));
    }

    async createState(stateData) {
        return this.handleResponse(api.post("/api/admin/locations/states", stateData));
    }

    async toggleStateStatus(stateId, isActive) {
        return this.handleResponse(api.patch(`/api/admin/locations/states/${stateId}/activate`, { isActive }));
    }

    async getAllCities(stateId = null) {
        const url = stateId ? `/api/admin/locations/cities?stateId=${stateId}` : "/api/admin/locations/cities";
        return this.handleResponse(api.get(url));
    }

    async createCity(cityData) {
        return this.handleResponse(api.post("/api/admin/locations/cities", cityData));
    }

    async updateCity(cityId, cityData) {
        return this.handleResponse(api.patch(`/api/admin/locations/cities/${cityId}`, cityData));
    }

    async toggleCityStatus(cityId, isActive) {
        return this.handleResponse(api.patch(`/api/admin/locations/cities/${cityId}/activate`, { isActive }));
    }

    async getLocationRequests() {
        return this.handleResponse(api.get("/api/admin/locations/location-requests"));
    }

    async approveVendorLocation(vendorId, payload) {
        return this.handleResponse(api.patch(`/api/admin/vendors/approve?vendorId=${vendorId}`, payload));
    }

    // ==================== RIDER MANAGEMENT ====================

    async getAllRiders(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.handleResponse(
            api.get(`/api/admin/riders?${params}`)
        );
    }

    async createRider(vendorId, riderData) {
        // Use global endpoint if no specific vendor selected
        const url = vendorId ? `/api/admin/vendors/${vendorId}/riders` : `/api/admin/riders`;
        return this.handleResponse(
            api.post(url, riderData)
        );
    }

    async updateRider(riderId, riderData) {
        return this.handleResponse(
            api.patch(`/api/admin/riders/${riderId}`, riderData)
        );
    }

    async deleteRider(riderId) {
        return this.handleResponse(
            api.delete(`/api/admin/riders/${riderId}`)
        );
    }

    /**
     * Fetch riders available for assignment
     * Used by admin rider assignment modal
     */
    async getAvailableRiders(params = {}) {
        return this.handleResponse(
            api.get('/api/admin/riders', { 
                params: { available: true, managedBy: "admin", ...params }
            })
        );
    }

    // ==================== ACTIVITY & AUDIT LOGS ====================

    async getActivities(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.handleResponse(
            api.get(`/api/admin/activities?${params}`)
        );
    }

    // ==================== NOTIFICATIONS ====================

    async getAdminUnreadCount() {
        return this.handleResponse(api.get('/api/admin/notifications/unread-count'));
    }

    async getAdminNotifications(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.handleResponse(api.get(`/api/admin/notifications?${query}`));
    }

    async markAdminAsRead(id) {
        return this.handleResponse(api.patch(`/api/admin/notifications/${id}/read`));
    }

    async markAllAdminAsRead() {
        return this.handleResponse(api.patch('/api/admin/notifications/read-all'));
    }

    async deleteAdminNotification(id) {
        return this.handleResponse(api.delete(`/api/admin/notifications/${id}`));
    }

    // ==================== ORDER MANAGEMENT ====================

    async getAllOrders(filters = {}) {
        const params = new URLSearchParams(filters);
        const data = await this.handleResponse(api.get(`/api/admin/orders?${params}`));
        console.log("All Orders Response:", data);
        return data;
    }

    async getOrderStats(filters = {}) {
        const params = new URLSearchParams(filters);
        const data = await this.handleResponse(api.get(`/api/admin/orders/stats?${params}`));
        console.log("Order Stats Response:", data);
        return data;
    }

    async getSingleOrder(orderId) {
        const data = await this.handleResponse(api.get(`/api/admin/orders/${orderId}`));
        console.log("Single Order Response:", data);
        return data;
    }

    async adminOverrideOrderStatus(orderId, status, reason) {
        return this.handleResponse(
            api.patch(`/api/admin/orders/${orderId}/status`, { status, reason })
        );
    }

    async getPlatformManagedOrders(filters = {}) {
        const params = new URLSearchParams(filters);
        const data = await this.handleResponse(api.get(`/api/admin/orders/platform-managed?${params}`));
        // console.log("Platform Managed Orders Response:", data);
        return data;
    }

    /**
     * Assign a rider to a platform-managed order
     * PATCH /api/admin/orders/:vendorOrderId/assign-rider
     */
    async assignRiderToOrder(vendorOrderId, riderId) {
        return this.handleResponse(
            api.patch(`/api/admin/orders/${vendorOrderId}/assign-rider`, { riderId })
        );
    }

    async getCommissionLedger(filters = {}) {
        const params = new URLSearchParams(filters);
        const data = await this.handleResponse(api.get(`/api/admin/orders/commission-ledger?${params}`));
        // console.log("Commission Ledger Response:", data);
        return data;
    }

    // ==================== FINANCE & REVENUE ====================

    async getFinanceSummary(params = {}) {
        const query = new URLSearchParams(params).toString();
        const data = await this.handleResponse(api.get(`/api/admin/finance/summary?${query}`));
        // console.log("Finance Summary Response:", data);
        return data;
    }

    async getFinanceChart(period = "7days") {
        const data = await this.handleResponse(api.get(`/api/admin/finance/chart?period=${period}`));
        // console.log("Finance Chart Response:", data);
        return data;
    }

    async getTransactions(params = {}) {
        const query = new URLSearchParams(params).toString();
        const data = await this.handleResponse(api.get(`/api/admin/finance/transactions?${query}`));
        // console.log("Transactions Response:", data);
        return data;
    }

    async getVendorBreakdown(params = {}) {
        const query = new URLSearchParams(params).toString();
        const data = await this.handleResponse(api.get(`/api/admin/finance/vendor-breakdown?${query}`));
        // console.log("Vendor Revenue Breakdown Response:", data);
        return data;
    }

    async getUnreleasedEscrow(params = {}) {
        const query = new URLSearchParams(params).toString();
        const data = await this.handleResponse(api.get(`/api/admin/finance/escrow?${query}`));
        return data;
    }

    async getRefundsList(params = {}) {
        const query = new URLSearchParams(params).toString();
        const data = await this.handleResponse(api.get(`/api/admin/finance/refunds?${query}`));
        return data;
    }

    // ==================== DASHBOARD ANALYTICS ====================

    async getOperationalVelocity() {
        return this.handleResponse(api.get(`/api/admin/dashboard/operational-velocity`));
    }

    // ==================== BANK & WALLET ====================

    async getPublicBanks() {
        return this.handleResponse(api.get("/api/wallet/public/banks"));
    }

    async resolveAccount(accountNumber, bankCode) {
        return this.handleResponse(
            api.get(`/api/wallet/public/resolve-account?accountNumber=${accountNumber}&bankCode=${bankCode}`)
        );
    }

    async getWalletBreakdown() {
        return this.handleResponse(api.get("/api/admin/finance/wallet-breakdown"));
    }

    async getPayoutHistory(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.handleResponse(api.get(`/api/admin/finance/payout-history?${query}`));
    }

    // ==================== PROMO MANAGEMENT ====================

    async getVendorDeliveryPromos() {
        return this.handleResponse(api.get("/api/admin/promos/vendor-delivery"));
    }

    async createVendorDeliveryPromo(payload) {
        return this.handleResponse(api.post("/api/admin/promos/vendor-delivery", payload));
    }

    async deactivateVendorDeliveryPromo(promoId) {
        return this.handleResponse(api.patch(`/api/admin/promos/vendor-delivery/${promoId}/deactivate`));
    }

    async getPlatformDeliveryPromos() {
        return this.handleResponse(api.get("/api/admin/promos/platform-delivery"));
    }

    async createPlatformDeliveryPromo(payload) {
        return this.handleResponse(api.post("/api/admin/promos/platform-delivery", payload));
    }

    async deactivatePlatformDeliveryPromo(promoId) {
        return this.handleResponse(api.patch(`/api/admin/promos/platform-delivery/${promoId}/deactivate`));
    }

    async getPlatformPromoStats(promoId) {
        return this.handleResponse(api.get(`/api/admin/promos/platform-delivery/${promoId}/stats`));
    }

    async getDiscounts() {
        return this.handleResponse(api.get("/api/admin/discounts"));
    }

    async createDiscount(payload) {
        return this.handleResponse(api.post("/api/admin/discounts", payload));
    }

    async updateDiscount(discountId, payload) {
        return this.handleResponse(api.patch(`/api/admin/discounts/${discountId}`, payload));
    }

    async activateDiscount(discountId) {
        return this.handleResponse(api.patch(`/api/admin/discounts/${discountId}/activate`));
    }

    async deactivateDiscount(discountId) {
        return this.handleResponse(api.patch(`/api/admin/discounts/${discountId}/deactivate`));
    }

    async deleteDiscount(discountId) {
        return this.handleResponse(api.delete(`/api/admin/discounts/${discountId}`));
    }

    async updatePlatformDeliveryPromo(promoId, payload) {
        return this.handleResponse(
            api.patch(`/api/admin/promos/platform-delivery/${promoId}`, payload)
        );
    }

    async reactivatePlatformDeliveryPromo(promoId) {
        return this.handleResponse(
            api.patch(`/api/admin/promos/platform-delivery/${promoId}/reactivate`)
        );
    }

    // ==================== PLATFORM CONFIG ====================

    async getPlatformConfig() {
        return this.handleResponse(api.get("/api/admin/platform-config"));
    }

    async updatePlatformConfig(configData) {
        return this.handleResponse(api.put("/api/admin/platform-config", configData));
    }
}

export default new AdminAPI();


// Last day for 2x usage outside the hours of 5–11am PT / 12–6pm GMT. Standard limits return tomorrow for these hours.
