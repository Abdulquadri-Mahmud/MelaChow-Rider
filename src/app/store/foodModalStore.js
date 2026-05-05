import { create } from 'zustand';

export const useFoodModalStore = create((set) => ({
  isOpen: false,
  foodId: null,
  initialData: null,
  openFoodModal: (foodId, initialData = null) => set({ isOpen: true, foodId, initialData }),
  closeFoodModal: () => set({ isOpen: false, foodId: null, initialData: null }),
}));
