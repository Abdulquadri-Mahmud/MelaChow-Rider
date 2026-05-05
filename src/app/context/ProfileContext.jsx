"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useApi } from "./ApiContext";
import { TokenManager } from "../lib/auth-token";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";

const ProfileContext = createContext(undefined);

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/auth/signin",
  "/auth/login",
  "/auth/signup",
  "/auth/register",
  "/auth/verify-account",
  "/auth/verify-registration",
  "/auth/set-password",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/",
  "/faqs",
  "/get-help",
];

export const ProfileProvider = ({ children }) => {
  const { baseUrl } = useApi();
  const pathname = usePathname();

  const fetchProfile = async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ProfileContext] 🔍 fetchProfile START', {
        baseUrl,
        currentPath: pathname,
        hasToken: !!TokenManager.getToken(),
        timestamp: new Date().toISOString(),
      });
    }

    const token = TokenManager.getToken();

    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${baseUrl}/user/auth/profile`, {
        credentials: "include",
        headers: headers,
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('[ProfileContext] 📥 Response:', {
          status: res.status,
          ok: res.ok,
        });
      }

      if (res.status === 401) {
        // Always clear stale cache on 401 — prevents it from surfacing as
        // placeholder data the next time the app opens.
        TokenManager.clearToken();
        localStorage.removeItem("melachow_user_cache");

        const isPublicRoute = PUBLIC_ROUTES.some(route =>
          pathname?.startsWith(route) || pathname === route
        );
        const isRestaurantRoute = pathname?.startsWith("/restaurants/");
        const isFoodDetailsRoute = pathname?.startsWith("/food-details/");

        if (!isPublicRoute && !isRestaurantRoute && !isFoodDetailsRoute) {
          throw new Error("Session expired");
        }

        return null;
      }

      if (!res.ok) {
        let errorMessage = "Failed to fetch profile";
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Not JSON
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      return data.user || data;

    } catch (error) {
      console.error('[ProfileContext] fetchProfile error:', error);
      throw error;
    }
  };

  const { data, isLoading, error, refetch, status, fetchStatus } = useQuery({
    queryKey: ["userProfile"],
    queryFn: fetchProfile,

    placeholderData: () => {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem("melachow_user_cache");
        try {
          return cached ? JSON.parse(cached) : undefined;
        } catch (e) { return undefined; }
      }
    },

    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: Infinity,

    retry: (failureCount, error) => {
      if (error?.message?.includes("Session expired")) return false;
      if (failureCount >= 2) return false;
      if (error?.message?.includes("Failed to fetch")) return true;
      return false;
    },

    retryDelay: (attemptIndex) => Math.min(100 * Math.pow(2, attemptIndex), 500),

    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // ✅ Track if the VERY FIRST check has completed
  const [hasInitialCheckDone, setHasInitialCheckDone] = React.useState(false);

  useEffect(() => {
    // Only set to true once, never reset to false
    if (!hasInitialCheckDone && fetchStatus === 'idle' && (status === 'success' || status === 'error')) {
      setHasInitialCheckDone(true);
    }
  }, [fetchStatus, status, hasInitialCheckDone]);

  const hasCheckedSession = hasInitialCheckDone;

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ProfileContext] 🔍 User Auth State:', {
        hasUserData: !!data,
        isLoading,
        hasCheckedSession,
        status,
        fetchStatus,
        currentPath: pathname,
      });
    }
  }, [data, isLoading, hasCheckedSession, pathname, status, fetchStatus]);

  useEffect(() => {
    if (data && typeof window !== 'undefined') {
      localStorage.setItem("melachow_user_cache", JSON.stringify(data));
    }
  }, [data]);

  return (
    <ProfileContext.Provider
      value={{
        userProfile: data,
        isLoading,
        hasCheckedSession,
        error: error ? error.message : null,
        refetchProfile: refetch,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};

