import axios from "axios";
import { TokenManager } from "@/app/lib/auth-token";

const BASE_URL = "/api/vendors";
// const BASE_URL = "https://grubdash-api.onrender.com/api/vendors";

// Create axios instance
// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // ✅ Send cookies
  timeout: 15000,
});

// Add request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = TokenManager.getToken('vendor');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Use metadata for reliable suppression of unauthorized events across axios versions
      if (!error.config?.metadata?.suppressUnauthorized && typeof window !== "undefined") {
        window.dispatchEvent(new Event("vendor:unauthorized"));
      }
    }
    return Promise.reject(error);
  }
);

// Helper to get vendor ID from payload (kept for ID retrieval, but token logic removed)
// const getVendorData = () => {
//   if (typeof window !== "undefined") {
//     const stored = localStorage.getItem("vendorPayload");
//     try {
//       return stored ? JSON.parse(stored) : null;
//     } catch (error) {
//       console.error("Error parsing vendor data:", error);
//       return null;
//     }
//   }
//   return null;
// };

// const vendorData = getVendorData();
// const getVendorId = vendorData?.vendor?.id;

// ✅ CRUD Functions
export const getVendors = async () => {
  // ✅ Force Token Initialization if missing (Fix for refresh race condition)
  if (!TokenManager.getToken('vendor')) {
    TokenManager.initialize();
  }

  try {
    const res = await api.get(`/get-vendor`, {
      headers: {
        "Content-Type": "application/json",
      },
      metadata: { suppressUnauthorized: true }, // ✅ Prevent loop for auto-fetches
    });
    return res.data.data || res.data;
  } catch (error) {
    throw error;
  }
};

// This function seems to duplicate getVendors but with an argument. 
// Since backend relies on cookie for identity, we remove the ID param.
export const getVendorById = async (id) => {
  try {
    const res = await api.get(`/get-vendor`, {
      headers: {
        "Content-Type": "application/json",
      },
      metadata: { suppressUnauthorized: true },
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

// ✅ API call (pure function) for PUBLIC display
export const fetchVendorForUserDisplay = async (id) => {
  const res = await api.get(`/vendor?id=${id}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return res.data; // returns { success, data: { vendor, foods } }
};

export const createVendor = async (data) => {
  const res = await api.post("/create", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return res.data;
};

export const updateVendor = async ({ data }) => {
  console.log(data);
  const res = await api.patch(`/update-vendor`, data, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  console.log(res.data);
  return res.data;
};

export const deleteVendor = async () => {
  const res = await api.delete(`/delete-vendor`, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return res.data;
};


