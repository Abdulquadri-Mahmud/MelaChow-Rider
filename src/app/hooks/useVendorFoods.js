"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getVendorMenuItems } from "@/app/lib/menuApi";

export const useVendorFoods = (vendorId, filters = {}) => {
    return useQuery({
        queryKey: ["vendor-foods", vendorId, filters],
        queryFn: () => getVendorMenuItems(vendorId, filters),
        enabled: !!vendorId,
        staleTime: 1000 * 60 * 2,
        placeholderData: keepPreviousData,
    });
};
