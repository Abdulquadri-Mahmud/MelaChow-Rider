import axios from "axios";
import { TokenManager } from "./auth-token";

const BASE_URL = "/api";

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // ✅ Important: Send cookies with every request
});

// Add request interceptor to attach vendor token
API.interceptors.request.use(
  (config) => {
    const token = TokenManager.getToken('vendor');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle 401 Unauthorized globally
// Interceptor to handle 401 Unauthorized globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Dispatch event for client-side handling (logout, redirect)
      // Check metadata for intentional suppression of unauthorized events
      if (!error.config?.metadata?.suppressUnauthorized && typeof window !== "undefined") {
        window.dispatchEvent(new Event("vendor:unauthorized"));
      }
    }
    return Promise.reject(error);
  }
);

export const getVendorDetails = async () => {
  try {
    const response = await API.get(`/vendors/get-vendor`, {
      metadata: { suppressUnauthorized: true },
    });

    console.log(response);
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) return null;
    throw error;
  }
};

export const getVendorWallet = async () => {
    const response = await API.get(`/vendors/get-wallet`);
    return response.data;
};

// --- PAYOUT & BANK MANAGEMENT ---
export const getBankList = async () => {
    const response = await API.get('/wallet/banks');
    return response.data;
};

export const resolveBankAccount = async (account_number, bank_code) => {
    const response = await API.get(`/wallet/resolve-account?account_number=${account_number}&bank_code=${bank_code}`);
    return response.data;
};

export const saveVendorBankAccount = async (data) => {
    const response = await API.post('/wallet/bank-account', data);
    return response.data;
};

export const removeVendorBankAccount = async () => {
    const response = await API.delete('/wallet/bank-account');
    return response.data;
};

export const initiateWithdrawal = async (amount) => {
    const response = await API.post('/wallet/withdraw', { amount });
    return response.data;
};

export const getVendorPayoutDetails = async () => {
    const response = await API.get('/vendors/payout-details');
    return response.data; // Returns { success: true, payoutDetails: {...} | null }
};

export const getWithdrawalHistory = async () => {
    const response = await API.get('/wallet/withdrawals');
    return response.data;
};

export const getVendorOrders = async () => {
  const response = await API.get(`/orders/orders`);
  return response.data;
};

export const getVendorOrderById = async (orderId) => {
  const response = await API.get(`/vendors/orders/${orderId}`);
  return response.data;
};

export const updateOrderStatus = async (vendorOrderId, status) => {
  // ✅ Validate vendorOrderId format (MongoDB ObjectId = 24 hex characters)
  if (!vendorOrderId || !vendorOrderId.match(/^[0-9a-fA-F]{24}$/)) {
    console.error('❌ Invalid vendorOrderId format:', vendorOrderId);
    throw new Error('Invalid order ID format. Please refresh the page and try again.');
  }

  console.log(`🔄 API: Updating order status`, {
    vendorOrderId,
    status,
    url: `/vendors/orders/${vendorOrderId}/update`
  });

  try {
    const response = await API.patch(`/vendors/orders/${vendorOrderId}/update`, { 
      status,
      notify: false // 🔕 Suppress push notification to user
    });
    console.log(`✅ API: Status update successful`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ API: Status update failed`, {
      vendorOrderId,
      status,
      error: error.response?.data || error.message
    });
    throw error;
  }
};

export const completeOrder = async (vendorOrderId) => {
  // ✅ Validate vendorOrderId format
  if (!vendorOrderId || !vendorOrderId.match(/^[0-9a-fA-F]{24}$/)) {
    console.error('❌ Invalid vendorOrderId format for completion:', vendorOrderId);
    throw new Error('Invalid order ID format.');
  }

  console.log(`🔄 API: Completing order`, {
    vendorOrderId,
    url: `/vendors/orders/${vendorOrderId}/complete`
  });

  try {
    const response = await API.patch(`/vendors/orders/${vendorOrderId}/complete`, {
      notify: false // 🔕 Suppress push notification to user
    });
    console.log(`✅ API: Order completion successful`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ API: Order completion failed`, {
      vendorOrderId,
      error: error.response?.data || error.message
    });
    throw error;
  }
};

export const getVendorReviews = async () => {
  const response = await API.get('/vendors/reviews');
  return response.data;
};

// Rider Management
export const getVendorRiders = async (vendorId) => {
  const response = await API.get(`/vendors/${vendorId}/riders`);
  // console.log(response);
  return response.data;
};

export const createVendorRider = async (vendorId, riderData) => {
  const response = await API.post(`/vendors/${vendorId}/riders`, riderData);
  console.log(response);

  return response.data;
};

export const getAvailableRiders = async (vendorId) => {
  const response = await API.get(`/vendors/${vendorId}/riders/available`);
  return response.data;
};

export const assignRiderToOrder = async (vendorId, orderId, riderId) => {
  const response = await API.post(`/vendors/${vendorId}/orders/${orderId}/assign-rider`, { 
    riderId,
    notify: false // 🔕 Suppress push notification to user
  });
  console.log(response.data);
  
  return response.data;
};

export const updateVendorRider = async (vendorId, riderId, riderData) => {
  const response = await API.patch(`/vendors/${vendorId}/riders/${riderId}`, riderData);
  return response.data;
};

export const deactivateVendorRider = async (vendorId, riderId) => {
  const response = await API.delete(`/vendors/${vendorId}/riders/${riderId}`);
  return response.data;
};

export default API;
