"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";


import toast from "react-hot-toast";
import { deleteVendor, fetchVendorForUserDisplay, getVendorById, getVendors, updateVendor } from "../lib/vendorProfileApi";

// âœ… Custom hook for managing vendor profiles
export const useVendors = () => {
  const queryClient = useQueryClient();

  // ðŸ”¹ Fetch all vendors (background refresh & smooth UI)
  const {
    data: vendors,
    isLoading,
    isError,
    refetch,
    isFetched,
  } = useQuery({
    queryKey: ["vendors"],
    queryFn: getVendors,
    // âœ… Load from Cache immediately
    initialData: () => {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem("melachow_vendor_cache");
        try {
          return cached ? JSON.parse(cached) : undefined;
        } catch (e) { return undefined; }
      }
    },
    // âœ… Retry logic for race conditions
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false;
      // Network error
      if (error?.message?.includes("Failed to fetch")) return true;
      // 401 error - retry for race conditions
      if (error?.response?.status === 401) return true;
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(100 * Math.pow(2, attemptIndex), 1000),
    staleTime: 5000, // 5 seconds (fast refresh for settings)
    gcTime: Infinity,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // âœ… Use isFetched directly for session check check
  const hasCheckedSession = isFetched;

  // âœ… Sync cache
  useEffect(() => {
    if (vendors && typeof window !== 'undefined') {
      localStorage.setItem("melachow_vendor_cache", JSON.stringify(vendors));
    }
  }, [vendors]);

  // ðŸ”¹ Optimistic update mutation for vendor profile
  const updateMutation = useMutation({
    mutationFn: ({ data }) => updateVendor({ data }),

    // âš™ï¸ Optimistic update
    onMutate: async ({ data }) => {
      await queryClient.cancelQueries(["vendors"]);

      const previousVendors = queryClient.getQueryData(["vendors"]);

      // Update cached vendor data immediately
      // Assuming 'vendors' is an array or object. If array:
      if (Array.isArray(previousVendors)) {
        queryClient.setQueryData(["vendors"], (old) =>
          old?.map((vendor) => ({ ...vendor, ...data }))
        );
      } else {
        // If single object
        queryClient.setQueryData(["vendors"], (old) => ({ ...old, ...data }));
      }

      return { previousVendors };
    },

    // âœ… On success: confirm and refresh in background
    onSuccess: () => {
      toast.success("âœ… Vendor updated successfully!");
      queryClient.invalidateQueries(["vendors"]);
    },

    // âŒ On error: rollback UI to previous data
    onError: (error, _, context) => {
      toast.error("âŒ Failed to update vendor.");
      if (context?.previousVendors) {
        queryClient.setQueryData(["vendors"], context.previousVendors);
      }
    },

    // ðŸ§¹ Always refetch in background to ensure sync
    onSettled: () => {
      queryClient.invalidateQueries(["vendors"]);
    },
  });

  // ðŸ”¹ Delete vendor profile
  const deleteMutation = useMutation({
    mutationFn: () => deleteVendor(),
    onSuccess: () => {
      toast.success("ðŸ—‘ï¸ Vendor deleted successfully!");
      queryClient.invalidateQueries(["vendors"]);
    },
    onError: () => toast.error("âŒ Failed to delete vendor."),
  });

  return {
    vendors,
    isLoading,
    isError,
    hasCheckedSession, // âœ… Expose session check
    refetch,
    updateVendor: updateMutation.mutate,
    deleteVendor: deleteMutation.mutate,
  };
};

// âœ… Optional: Hook for fetching a single vendor by ID
export const useVendorById = (id) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["vendor", id],
    queryFn: () => getVendorById(id),
    enabled: !!id,
    // staleTime: 1000 * 60 * 2,
    keepPreviousData: true,
  });

  return { vendor: data?.data, isLoading, isError };
};

// âœ… Custom hook using React Query
export const useVendorForUserDisplay = (id) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["vendorDisplay", id],
    queryFn: () => fetchVendorForUserDisplay(id),
    enabled: !!id, // only fetch if id exists
    staleTime: 1000 * 60 * 2, // 2 minutes cache
    keepPreviousData: true,
  });

  return {
    vendor: data?.data?.vendor || null,
    foods: data?.data?.foods || [],
    isLoading,
    isError,
  };
};

