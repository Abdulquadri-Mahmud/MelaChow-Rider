import axios from "axios";
import { TokenManager } from "./auth-token";
import { getPromoDeviceId } from "./promoDevice";

// Initialize token from storage
TokenManager.initialize();

// Add request interceptor to attach the correct token based on the route
axios.interceptors.request.use(
  (config) => {
    // Determine the role based on the URL path
    let role = 'user';
    if (config.url?.includes('/api/vendors/')) {
      role = 'vendor';
    } else if (config.url?.includes('/api/admin/')) {
      role = 'admin';
    } else if (config.url?.includes('/api/riders/') || config.url?.includes('/api/auth/rider/')) {
      role = 'rider';
    }

    // Attach the appropriate token
    const token = TokenManager.getToken(role);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper function for backward compatibility - calculates percentages from distribution
const calculatePercentagesFromDistribution = (distribution) => {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  const percentages = {};
  Object.keys(distribution).forEach(rating => {
    percentages[rating] = total > 0 ? Math.round((distribution[rating] / total) * 100) : 0;
  });
  return percentages;
};

// Helper to dispatch unauthorized event
const dispatchUserUnauthorized = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("user:unauthorized"));
  }
};

export const fetchUser = async () => {
  // No token arg needed; cookies are sent automatically

  const token = TokenManager.getToken('user');
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch("/api/user/auth/profile", {
    credentials: "include", // ✅ vital for cookies
    headers: headers
  });

  // console.log(res)

  if (res.status === 401) {
    // If 401, just return null (Guest). 
    // Do not force logout/redirect via event, as this might be the initial check.
    return null;
  }

  if (!res.ok) {
    throw new Error("Unauthorized or fetch failed!");
  }

  const data = await res.json();
  return data; // expected { user: ... }
};

/**
 * Create a new order
 * @param {Object} orderData - payload containing cart, address, etc.
 * @returns {Object} - created order response
 */

export const createOrder = async (orderData) => {
  // console.log('orderData: ', orderData)
  try {
    const res = await axios.post(
      "/api/orders/create",
      orderData,
      {
        withCredentials: true, // ✅ Send cookies
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return res.data; // order confirmation
  } catch (error) {
    console.error("Create Order Error:", error);

    // Only dispatch if it's a genuine 401 response (not a network/CORS error)
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


// ✅ Frontend helper to verify payment and create order
export const verifyPayment = async (reference, body = {}) => {

  try {
    const res = await axios.post(
      `/api/orders/verify/${reference}`,
      body, // send items, deliveryFee, deliveryAddress, phone here
      {
        withCredentials: true, // ✅ Send cookies
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return res.data; // contains order confirmation & Paystack data
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
 * Fetch the authenticated user's reviews
 * Uses secure cookie-based authentication
 * @returns {Object} - user's reviews data
 */
export const getUserReviews = async () => {
  try {
    const res = await axios.get(
      "/api/user/my-reviews",
      {
        withCredentials: true, // ✅ Send cookies
      }
    );
    console.log(res.data)
    return res.data;
  } catch (error) {
    console.error("Get User Reviews Error:", error);

    if (error.response && error.response.status === 401) {
      dispatchUserUnauthorized();
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch reviews";

    throw new Error(message);
  }
};

/**
 * Get User Wallet
 * @returns {Object} - wallet data { balance, transactions }
 */
export const getWallet = async () => {
  try {
    const res = await axios.get("/api/user/my-wallet", {
      withCredentials: true,
    });
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
 * Fund User Wallet
 * @param {Object} data - { amount, email }
 * @returns {Object} - { success, authorization_url, reference }
 */
export const fundWallet = async (data) => {
  try {
    const res = await axios.post("/api/user/wallet/fund", data, {
      withCredentials: true,
    });
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
 * Verify Wallet Transaction
 * @param {string} reference 
 * @returns {Object} - result
 */
export const verifyWalletTransaction = async (reference) => {
  try {
    const res = await axios.get(`/api/user/wallet/verify/${reference}`, {
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    console.error("Verify Wallet Error:", error);
    if (error.response && error.response.status === 401) {
      dispatchUserUnauthorized();
    }
    throw error;
  }
};

/**
 * Create a Review for Vendor/Food
 * @param {Object} data - { vendorId, foodId (optional), rating, comment }
 * @returns {Object}
 */
export const createReview = async (data) => {
  try {
    const res = await axios.post("/api/admin/user/reviews/create-reviews", data, {
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    // console.error("Create Review Error:", error);
    if (error.response && error.response.status === 401) {
      dispatchUserUnauthorized();
    }
    throw error;
  }
};

/**
 * Get Vendor Reviews (Legacy - keeping for backward compatibility)
 * @param {string} vendorId 
 * @returns {Object}
 */
export const getVendorReviews = async (vendorId) => {
  try {
    const res = await axios.get(`/api/admin/user/reviews/vendor-reviews?vendorId=${vendorId}`, {
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    console.error("Get Vendor Reviews Error:", error);
    // If 403/401, we might handle it gracefully in the UI or let it fail
    throw error;
  }
};

/**
 * PUBLIC REVIEWS API - New Implementation
 */

/**
 * Get Restaurant Reviews (Public API) - Enhanced with backward compatibility
 * @param {string} vendorId - Restaurant/vendor ID
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 10)
 * @param {number|null} rating - Filter by rating (1-5, null for all)
 * @returns {Object} - Reviews data with pagination and enhanced rating data
 */
export const getRestaurantReviews = async (vendorId, page = 1, limit = 10, rating = null) => {
  try {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (rating && rating !== 'all') {
      params.append('rating', rating.toString());
    }

    const res = await axios.get(
      `/api/public/reviews/vendor/${vendorId}?${params}`,
      {
        // No authentication required for public endpoints
      }
    );

    // Enhanced response with backward compatibility
    const data = res.data;
    if (data.success && data.data) {
      // Ensure backward compatibility for rating data
      if (data.data.restaurant) {
        data.data.restaurant.averageRating = data.data.restaurant.averageRating || data.data.restaurant.rating || 0;
        data.data.restaurant.totalReviews = data.data.restaurant.totalReviews || data.data.restaurant.reviewCount || 0;
      }

      // Add calculated percentages if not provided
      if (!data.data.ratingPercentages && data.data.ratingDistribution) {
        data.data.ratingPercentages = calculatePercentagesFromDistribution(data.data.ratingDistribution);
      }
    }

    return data;
  } catch (error) {
    console.error("Get Restaurant Reviews Error:", error);

    // Return safe fallback structure
    return {
      success: false,
      data: {
        restaurant: { averageRating: 0, totalReviews: 0 },
        reviews: [],
        pagination: { currentPage: page, totalPages: 0, totalReviews: 0 },
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        ratingPercentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      },
      error: error.message
    };
  }
};

/**
 * Get Restaurant Reviews Summary (Public API) - Enhanced with backward compatibility
 * @param {string} vendorId - Restaurant/vendor ID
 * @returns {Object} - Reviews summary with rating distribution and percentages
 */
export const getRestaurantReviewsSummary = async (vendorId) => {
  try {
    const res = await axios.get(
      `/api/public/reviews/vendor/${vendorId}/summary`,
      {
        // No authentication required for public endpoints
      }
    );

    // Enhanced response with backward compatibility
    const data = res.data;
    if (data.success && data.data) {
      // Ensure backward compatibility for rating data
      if (data.data.restaurant) {
        data.data.restaurant.averageRating = data.data.restaurant.averageRating || data.data.restaurant.rating || 0;
        data.data.restaurant.totalReviews = data.data.restaurant.totalReviews || data.data.restaurant.reviewCount || 0;
      }

      // Add calculated percentages if not provided
      if (!data.data.ratingPercentages && data.data.ratingDistribution) {
        data.data.ratingPercentages = calculatePercentagesFromDistribution(data.data.ratingDistribution);
      }
    }

    return data;
  } catch (error) {
    console.error("Get Restaurant Reviews Summary Error:", error);

    // Return safe fallback structure
    return {
      success: false,
      data: {
        restaurant: { averageRating: 0, totalReviews: 0 },
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        ratingPercentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      },
      error: error.message
    };
  }
};

/**
 * Get Food Reviews (Public API) - Enhanced with backward compatibility (Previously broken, now fixed!)
 * @param {string} foodId - Food item ID
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 10)
 * @param {number|null} rating - Filter by rating (1-5, null for all)
 * @returns {Object} - Food reviews data with pagination and enhanced rating data
 */
export const getFoodReviews = async (foodId, page = 1, limit = 10, rating = null) => {
  try {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (rating && rating !== 'all') {
      params.append('rating', rating.toString());
    }

    const res = await axios.get(
      `/api/public/reviews/food/${foodId}?${params}`,
      {
        // No authentication required for public endpoints
      }
    );

    // Enhanced response with backward compatibility
    const data = res.data;
    if (data.success && data.data) {
      // Ensure backward compatibility for food rating data
      if (data.data.food) {
        data.data.food.averageRating = data.data.food.averageRating || data.data.food.rating || 0;
        data.data.food.totalReviews = data.data.food.totalReviews || data.data.food.reviewCount || 0;
      }

      // Add calculated percentages if not provided
      if (!data.data.ratingPercentages && data.data.ratingDistribution) {
        data.data.ratingPercentages = calculatePercentagesFromDistribution(data.data.ratingDistribution);
      }
    }

    return data;
  } catch (error) {
    console.error("Get Food Reviews Error:", error);

    // Return safe fallback structure
    return {
      success: false,
      data: {
        food: { averageRating: 0, totalReviews: 0, name: 'Unknown Food' },
        reviews: [],
        pagination: { currentPage: page, totalPages: 0, totalReviews: 0 },
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        ratingPercentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      },
      error: error.message
    };
  }
};


/**
 * Get Personalized Smart Recommendations
 * @param {string} weather - Optional weather condition (e.g., "rainy", "sunny")
 * @returns {Object} - { success, meta, data: { timeOfDay, underrated, ... } }
 */
export const getRecommendations = async (weather = null) => {
  try {
    const params = new URLSearchParams();
    if (weather) params.append("weather", weather);

    const res = await axios.get(
      `/api/recommendations?${params}`,
      {
        withCredentials: true, // ✅ Vital for location detection via cookie
      }
    );
    return res.data;
  } catch (error) {
    console.error("Get Recommendations Error:", error);
    // Return empty structure to prevent UI breakage
    return {
      success: false,
      data: { timeOfDay: [], underrated: [], trendingNearby: [], budgetFriendly: [] },
      meta: { timeOfDayLabel: "Delicious Picks" }
    };
  }
};

/**
 * Verify a discount code
 * @param {Object} data - { code, subtotal, deliveryFee, vendorId, items }
 * @returns {Object} - { total, discountAmount, finalSubtotal, appliedDiscount }
 */
export const verifyDiscount = async (data) => {
  try {
    const deviceId = getPromoDeviceId();
    const res = await axios.post("/api/discounts/verify", { ...data, deviceId }, {
      withCredentials: true,
      headers: {
        ...(deviceId ? { "X-MelaChow-Device-Id": deviceId } : {}),
      },
    });
    return res.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      dispatchUserUnauthorized();
    }
    throw error;
  }
};

/**
 * Admin: Create a discount
 * @param {Object} data - Discount payload
 * @returns {Object}
 */
export const createDiscount = async (data) => {
  try {
    const res = await axios.post("/api/admin/discounts", data, {
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      dispatchUserUnauthorized();
    }
    throw error;
  }
};

/**
 * Admin: Get discounts
 * @returns {Object}
 */
export const getDiscounts = async () => {
  try {
    const res = await axios.get("/api/admin/discounts", {
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      dispatchUserUnauthorized();
    }
    throw error;
  }
};

/**
 * Get Vendor Details by ID
 * @param {string} vendorId
 * @returns {Object}
 */
export const getVendorById = async (vendorId) => {
  try {
    const deviceId = getPromoDeviceId();
    const res = await axios.get(`/api/user/vendors/${vendorId}`, {
      withCredentials: true,
      headers: {
        ...(deviceId ? { "X-MelaChow-Device-Id": deviceId } : {}),
      },
    });
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
 * Get Public Platform Configuration
 * @returns {Object} - Sanitized config { serviceFeeEnabled, serviceFeeType, ... }
 */
export const getPlatformConfig = async () => {
  const fetchConfig = async (path) => {
    const res = await fetch(path, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Failed to fetch platform config from ${path}`);
    return res.json();
  };

  try {
    return await fetchConfig('/api/public/platform-config');
  } catch (error) {
    return fetchConfig('/api/user/platform-config');
  }
};
