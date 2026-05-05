"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

/**
 * Custom hook to fetch categories with long-term caching
 * Settings:
 * - staleTime: 1 hour (data stays fresh for a session)
 * - gcTime: Infinity (data is kept in cache indefinitely)
 * - Various automatic refetch settings disabled for performance
 */
export const useCategories = () => {
    return useQuery({
        queryKey: ["categories_public"],
        queryFn: async () => {
            const res = await axios.get("/api/categories/public", {
                withCredentials: true,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 10000,
            });

            if (!res.data || !res.data.success) {
                throw new Error("Failed to fetch categories");
            }

            return res.data.data || [];
        },
        retry: 1,
        staleTime: 1000 * 60 * 60, // 1 hour
        gcTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    });
};
