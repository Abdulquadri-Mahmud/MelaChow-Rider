"use client";

import { useQuery } from "@tanstack/react-query";
import { getMenuAxios } from "@/app/lib/menuApi";

// Fetch a single menu item by ID with its full details
// including portions and choice groups
const fetchFoodById = async (vendorId, foodId) => {
  const ax = getMenuAxios();
  const res = await ax.get(
    `/v1/vendors/${vendorId}/menu/items/${foodId}`
  );
  return res.data;
};

export const useFoodById = (foodId, vendorId) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["food-item", foodId],
    queryFn: () => fetchFoodById(vendorId, foodId),
    enabled: !!foodId && !!vendorId,
    staleTime: 1000 * 60 * 5,    // 5 minutes
    retry: 2,
  });

  return {
    food: data,          // full response object { success, item, portions, choice_groups }
    isLoading,
    isError,
    error,
  };
};
