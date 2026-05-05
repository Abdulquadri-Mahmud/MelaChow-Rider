import { useQuery } from '@tanstack/react-query';
import { getVendorCombos } from '@/app/lib/menuApi';

/**
 * Fetch all combos for a vendor with optional filters.
 * Query key: ["vendor-combos", vendorId, params]
 * 
 * @param {string} vendorId - The vendor ID
 * @param {Object} params - Optional query params (is_available, search)
 * @returns {Object} - { data, isLoading, error, refetch, ... }
 */
export const useVendorCombos = (vendorId, params = {}) => {
  return useQuery({
    queryKey: ['vendor-combos', vendorId, params],
    queryFn: () => getVendorCombos(vendorId, params),
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
