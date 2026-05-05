import axios from "axios";
import { getPromoDeviceId } from "./promoDevice";

// Helper to dispatch unauthorized event
const dispatchUserUnauthorized = () => {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("user:unauthorized"));
    }
};

/**
 * Create order using V2 API with enhanced validation
 * 
 * @param {Object} orderData - Order payload containing items, delivery address, and fees
 * @param {Array<Object>} orderData.items - Array of order items with food details
 * @param {Array<Object>} orderData.vendorDeliveryFees - Delivery fees per vendor
 * @param {Object} orderData.deliveryAddress - Delivery address details
 * @param {string} orderData.phone - User's phone number
 * @returns {Promise<Object>} Created order response with Paystack authorization URL
 * 
 * @example
 * const order = await createOrderV2({
 *   items: [...],
 *   vendorDeliveryFees: [...],
 *   deliveryAddress: {...},
 *   phone: "+2348012345678"
 * });
 */
export const createOrderV2 = async (orderData) => {
    try {
        const deviceId = getPromoDeviceId();
        const response = await axios.post(
            "/api/orders/v2/create",
            { ...orderData, deviceId },
            {
                withCredentials: true, // ✅ Send cookies for authentication
                headers: {
                    "Content-Type": "application/json",
                    ...(deviceId ? { "X-MelaChow-Device-Id": deviceId } : {}),
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Create Order Error:", error);

        // Dispatch unauthorized event for 401 errors
        if (error.response && error.response.status === 401) {
            dispatchUserUnauthorized();
        }

        // Extract user-friendly error message
        const message =
            error.response?.data?.message ||
            error.message ||
            "Failed to create order";

        throw new Error(message);
    }
};

/**
 * Verify payment using API
 * 
 * @param {string} reference - Paystack payment reference
 * @returns {Promise<Object>} Verified order with payment details
 */
export const verifyPaymentV2 = async (reference) => {
    try {
        const response = await axios.post(
            `/api/orders/verify/${reference}`,
            {}, // Empty body - backend handles verification
            {
                withCredentials: true, // ✅ Send cookies for authentication
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data;
    } catch (error) {
        // Dispatch unauthorized event for 401 errors
        if (error.response && error.response.status === 401) {
            console.warn("Payment Verification Unauthorized: Dispatching user:unauthorized event.");
            dispatchUserUnauthorized();
        } else {
            console.error("Verify Payment Error:", error);
        }

        // Handle 400 Payment Failed logic (Business Logic Failure)
        if (error.response && error.response.status === 400 && error.response.data?.order) {
            // Throw a specific error object that the UI can catch and use
            const paymentError = new Error(error.response.data.message || "Payment not successful");
            paymentError.failedOrder = error.response.data.order;
            paymentError.code = "PAYMENT_FAILED";
            throw paymentError;
        }

        // Extract user-friendly error message
        const message =
            error.response?.data?.message ||
            error.message ||
            "Payment verification failed";

        const customError = new Error(message);
        customError.status = error.response?.status;
        throw customError;
    }
};

/**
 * Initialize Paystack payment (legacy support)
 * This function creates an order and returns the Paystack authorization URL
 * 
 * @param {Object} orderPayload - Order data to initialize payment
 * @returns {Promise<Object>} Paystack initialization response
 */
export const initializePayment = async (orderPayload) => {
    try {
        const result = await createOrderV2(orderPayload);

        // V2 API returns authorization_url in the response
        if (!result.authorization_url) {
            throw new Error("Payment initialization failed - no authorization URL");
        }

        return result;
    } catch (error) {
        console.error("Initialize Payment Error:", error);
        throw error;
    }
};
