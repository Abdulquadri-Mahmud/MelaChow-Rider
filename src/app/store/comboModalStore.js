import { create } from 'zustand';

export const useComboModalStore = create((set) => ({
  isOpen: false,
  comboId: null,
  initialData: null,
  openComboModal: (comboId, initialData = null) => set({ isOpen: true, comboId, initialData }),
  closeComboModal: () => set({ isOpen: false, comboId: null, initialData: null }),
}));
