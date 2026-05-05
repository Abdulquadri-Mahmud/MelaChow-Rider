"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useApi } from "./ApiContext";
import { TokenManager } from "../lib/auth-token";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";

const VendorProfileContext = createContext(undefined);

const VENDOR_PUBLIC_ROUTES = [
    "/vendors/auth/login",
    "/vendors/auth/register",
    "/vendors/auth/verify-account",
];

export const VendorProfileProvider = ({ children }) => {
    const { baseUrl } = useApi();
    const pathname = usePathname();

    const fetchVendorProfile = async () => {
        const token = TokenManager.getToken('vendor');

        if (process.env.NODE_ENV === 'development') {
            console.log('[VendorProfileContext] fetchVendorProfile START', {
                baseUrl,
                currentPath: pathname,
                hasToken: !!token,
            });
        }

        const headers = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const res = await fetch(`${baseUrl}/vendors/get-vendor`, {
                credentials: "include",
                headers: headers,
            });

            if (process.env.NODE_ENV === 'development') {
                console.log('[VendorProfileContext] Response:', {
                    status: res.status,
                    ok: res.ok,
                });
            }

            if (res.status === 401) {
                const isPublicRoute = VENDOR_PUBLIC_ROUTES.some(route =>
                    pathname?.startsWith(route)
                );

                if (!isPublicRoute) {
                    TokenManager.clearToken('vendor');
                    localStorage.removeItem("melachow_vendor_cache");
                    throw new Error("Vendor session expired");
                }

                return null;
            }

            if (res.status === 403) {
                // Vendor is suspended, inactive, or deleted — identity confirmed but access denied.
                // Clear session so they land on login. Return a shaped object so
                // VendorBootstrapper can surface a reason if needed in future.
                console.warn("[VendorProfileContext] 403 — vendor access denied. Clearing session.");
                TokenManager.clearToken('vendor');
                localStorage.removeItem("melachow_vendor_cache");
                return null;
            }

            if (res.status >= 500) {
                // Server/infrastructure error — do NOT clear the session.
                // Let TanStack Query retry logic handle transient failures.
                let serverError = "Server error. Please try again shortly.";
                try {
                    const errorData = await res.json();
                    serverError = errorData.message || serverError;
                } catch {
                    // Not JSON
                }
                throw new Error(serverError);
            }

            if (!res.ok) {
                // Any other non-OK status (400, 404, etc.) — throw with server message.
                let errorMessage = "Failed to fetch vendor profile";
                try {
                    const errorData = await res.json();
                    errorMessage = errorData.message || errorMessage;
                } catch {
                    // Not JSON
                }
                throw new Error(errorMessage);
            }

            const data = await res.json();
            const vendorData = data.data || data.vendor || data;

            if (process.env.NODE_ENV === 'development') {
                console.log('[VendorProfileContext] Vendor loaded:', {
                    hasVendor: !!vendorData,
                    vendorId: vendorData?._id || vendorData?.id,
                });
            }

            return vendorData;

        } catch (error) {
            console.error('[VendorProfileContext] fetchVendorProfile error:', error);
            throw error;
        }
    };

    const { data, isLoading, error, refetch, status, fetchStatus } = useQuery({
        queryKey: ["vendors"],
        queryFn: fetchVendorProfile,

        placeholderData: () => {
            if (typeof window !== 'undefined') {
                const cached = localStorage.getItem("melachow_vendor_cache");
                try {
                    return cached ? JSON.parse(cached) : undefined;
                } catch (e) {
                    return undefined;
                }
            }
        },

        staleTime: 1000 * 60 * 10, // 10 minutes
        gcTime: Infinity,

        retry: (failureCount, error) => {
            if (error?.message?.includes("Vendor session expired")) return false;
            if (failureCount >= 2) return false;
            if (error?.message?.includes("Failed to fetch")) return true;
            return false;
        },

        retryDelay: (attemptIndex) => Math.min(100 * Math.pow(2, attemptIndex), 500),

        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
    });

    // Simple: query completed = not fetching + has result
    const hasCheckedSession = fetchStatus === 'idle' && (status === 'success' || status === 'error');

    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('[VendorProfileContext] Vendor Auth State:', {
                hasVendorData: !!data,
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
            // Guard: only write to cache when the object contains
            // the auth fields that VendorBootstrapper depends on.
            // If isApproved is missing, clear the cache instead of
            // storing a broken object that causes redirect loops.
            if (data.isApproved !== undefined) {
                localStorage.setItem("melachow_vendor_cache", JSON.stringify(data));
            } else {
                localStorage.removeItem("melachow_vendor_cache");
                if (process.env.NODE_ENV === 'development') {
                    console.warn('[VendorProfileContext] âš ï¸ isApproved missing from vendor data â€” cache cleared to prevent auth loop');
                }
            }
        }
    }, [data]);

    // Smart loading: only true if we are loading and have no data (including cache/placeholder)
    const isActuallyLoading = isLoading && !data;

    return (
        <VendorProfileContext.Provider
            value={{
                vendorProfile: data,
                isLoading: isActuallyLoading,
                isRefetching: fetchStatus === "fetching",
                hasCheckedSession: hasCheckedSession,
                error: error ? error.message : null,
                refetchVendorProfile: refetch,
            }}
        >
            {children}
        </VendorProfileContext.Provider>
    );
};

export const useVendorProfile = () => {
    const context = useContext(VendorProfileContext);
    if (!context) {
        throw new Error("useVendorProfile must be used within a VendorProfileProvider");
    }
    return context;
};

