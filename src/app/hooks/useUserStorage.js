import { useApi } from "../context/ApiContext";
import { useProfile } from "../context/ProfileContext";
import { useQueryClient } from "@tanstack/react-query";
import { TokenManager } from "../lib/auth-token";

/**
 * Hook for managing user data via ProfileContext (Server-Sourced Identity).
 * Replaces legacy localStorage implementation.
 */
export const useUserStorage = () => {
  const { baseUrl } = useApi();
  const { userProfile, isLoading, refetchProfile, hasCheckedSession } = useProfile();
  const queryClient = useQueryClient();

  // Legacy compatibility: saveUser now optimistically updates the cache
  const saveUser = (payload) => {
    // Normalize payload: if it contains 'user' property, unwrap it (e.g. from VerifyAccount)
    const data = payload?.user || payload;

    // âœ… Cache user data for refresh resilience
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("melachow_user_cache", JSON.stringify(data));
      }
    } catch (e) {
      console.warn("Failed to cache user", e);
    }

    queryClient.setQueryData(["userProfile"], data);
  };

  // Update specific fields of the stored user (Optimistic)
  const updateUser = (updates) => {
    queryClient.setQueryData(["userProfile"], (prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  };

  // Full logout: clear user + optional data
  const logout = async () => {
    // âœ… ADD DEBUG LOG
    console.log('[useUserStorage] Logout initiated');

    try {
      // âœ… Call backend logout endpoint
      const response = await fetch(`${baseUrl}/user/auth/logout`, {
        method: "POST",
        credentials: "include", // âœ… Send cookie so backend can clear it
      });

      // âœ… ADD DEBUG LOG
      console.log('[useUserStorage] Logout response:', {
        status: response.status,
        ok: response.ok,
      });

    } catch (error) {
      console.error('[useUserStorage] Logout request failed:', error);
      // âœ… Continue with client-side cleanup even if backend fails
    }

    // âœ… Clear ALL client-side state
    queryClient.setQueryData(["userProfile"], null);
    sessionStorage.removeItem("splashShown");
    localStorage.removeItem("melachow_user_cache"); // âœ… Clear cache
    localStorage.removeItem("cart");        // optional, keep client preferences
    localStorage.removeItem("addresses");   // optional
    TokenManager.clearToken(); // âœ… Clear fallback token

    // âœ… Invalidate queries to force refetch
    queryClient.invalidateQueries(["userProfile"]);

    // âœ… ADD DEBUG LOG
    console.log('[useUserStorage] âœ… Logout cleanup complete');

    // âœ… ADD: Redirect to signin after cleanup (IMPORTANT!)
    if (typeof window !== 'undefined') {
      // Small delay to ensure cleanup completes
      setTimeout(() => {
        window.location.href = '/auth/signin';
      }, 100);
    }
  };

  // Clear only user payload (client-side only clearance)
  const clearUser = () => {
    queryClient.setQueryData(["userProfile"], null);
  };

  return {
    user: userProfile,
    isLoading,
    hasCheckedSession, // âœ… Expose session check status
    saveUser,
    updateUser,
    clearUser,
    logout,
  };
};

