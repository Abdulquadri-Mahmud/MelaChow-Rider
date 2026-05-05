import { useApi } from "../context/ApiContext";
import { useVendorProfile } from "../context/VendorProfileContext";
import { useQueryClient } from "@tanstack/react-query";
import { TokenManager } from "../lib/auth-token";
import { useMemo } from "react";

/**
 * Hook for managing Vendor data via VendorProfileContext.
 * Matches the useUserStorage pattern.
 */
export const useVendorStorage = () => {
  const { baseUrl } = useApi();
  const { vendorProfile, isLoading, refetchVendorProfile, hasCheckedSession } = useVendorProfile();
  const queryClient = useQueryClient();

  // Save vendor data
  const saveVendor = (payload) => {
    const data = payload?.vendor || payload;

    // ✅ Cache for refresh resilience
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("melachow_vendor_cache", JSON.stringify(data));
      }
    } catch (e) {
      console.warn("Failed to cache vendor", e);
    }

    queryClient.setQueryData(["vendors"], data);
  };

  // Update fields
  const updateVendor = (updates) => {
    queryClient.setQueryData(["vendors"], (prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  };

  // Logout
  const logout = async () => {
    console.log('[useVendorStorage] Vendor logout initiated');

    try {
      const response = await fetch(`${baseUrl}/vendor/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      console.log('[useVendorStorage] Logout response:', {
        status: response.status,
        ok: response.ok,
      });
    } catch (error) {
      console.error('[useVendorStorage] Logout failed:', error);
    }

    // Clear state
    queryClient.setQueryData(["vendors"], null);
    sessionStorage.removeItem("splashShown");
    localStorage.removeItem("melachow_vendor_cache");
    TokenManager.clearToken('vendor');
    queryClient.invalidateQueries(["vendors"]);

    console.log('[useVendorStorage] ✅ Logout complete');

    // Redirect
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = '/vendors/auth/login';
      }, 100);
    }
  };

  // Clear vendor
  const clearVendor = () => {
    queryClient.setQueryData(["vendors"], null);
  };

  // ✅ Memoize to prevent unstable object references causing infinite re-renders
  const vendorDetails = useMemo(
    () => (vendorProfile ? { vendor: vendorProfile } : null),
    [vendorProfile]
  );

  return {
    vendorDetails,
    isLoading,
    hasCheckedSession,
    saveVendor,
    updateVendor,
    clearVendor,
    logout,
  };
};

