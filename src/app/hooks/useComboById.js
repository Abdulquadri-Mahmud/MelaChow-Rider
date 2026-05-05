import { useQuery } from '@tanstack/react-query';
import { getComboById } from '@/app/lib/menuApi';

/**
 * Fetch a single combo by ID.
 * Query key: ["combo", comboId]
 * Used for detail page and edit flow.
 * 
 * @param {string} comboId - The combo ID
 * @returns {Object} - { data: { combo }, isLoading, error, refetch, ... }
 */
export const useComboById = (comboId) => {
  return useQuery({
    queryKey: ['combo', comboId],
    queryFn: () => getComboById(comboId),
    enabled: !!comboId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
