import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * CreateComboStore
 * Manages state for combo creation and editing (4-step wizard)
 * All prices stored as NAIRA (kobo conversion happens in API call)
 */
export const useCreateComboStore = create(
  persist(
    (set, get) => ({
      // ══════════════════════════════════════════════════════════════════════
      // STEP 1: Basic Information
      // ══════════════════════════════════════════════════════════════════════
      name: '',
      description: '', // e.g., "Rice + Plantain + Chicken Lap"
      image_url: null,
      dietary_type: 'mixed', // veg | non-veg | vegan | halal | kosher | mixed
      prep_time_minutes: null,
      tags: [], // max 6
      contents: [], // e.g., ["Rice", "Plantain", "Chicken Lap"]

      // ══════════════════════════════════════════════════════════════════════
      // STEP 2: Categorization
      // ══════════════════════════════════════════════════════════════════════
      platform_category_id: null,
      platform_category_label: null,
      vendor_section_id: null,
      vendor_section_label: null,

      // ══════════════════════════════════════════════════════════════════════
      // STEP 3: Pricing (single price, no portions)
      // ══════════════════════════════════════════════════════════════════════
      price_naira: '',

      // ══════════════════════════════════════════════════════════════════════
      // STEP 4: Choice Groups (Add-ons/Customizations)
      // ══════════════════════════════════════════════════════════════════════
      choice_groups: [],

      // ══════════════════════════════════════════════════════════════════════
      // Metadata
      // ══════════════════════════════════════════════════════════════════════
      currentStep: 1,
      isSubmitting: false,
      isDirty: false,
      createdComboId: null,
      _id: null, // For edit mode

      // ══════════════════════════════════════════════════════════════════════
      // ACTIONS: Field Management
      // ══════════════════════════════════════════════════════════════════════
      setField: (field, value) => {
        set((state) => ({
          [field]: value,
          isDirty: true,
        }));
      },

      // ══════════════════════════════════════════════════════════════════════
      // ACTIONS: Step Navigation
      // ══════════════════════════════════════════════════════════════════════
      nextStep: () => {
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, 5),
        }));
      },

      prevStep: () => {
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 1),
        }));
      },

      goToStep: (step) => {
        if (step >= 1 && step <= 5) {
          set({ currentStep: step });
        }
      },

      // ══════════════════════════════════════════════════════════════════════
      // ACTIONS: Tags
      // ══════════════════════════════════════════════════════════════════════
      addTag: (tag) => {
        set((state) => {
          if (!state.tags.includes(tag) && state.tags.length < 6) {
            return {
              tags: [...state.tags, tag],
              isDirty: true,
            };
          }
          return state;
        });
      },

      removeTag: (tag) => {
        set((state) => ({
          tags: state.tags.filter((t) => t !== tag),
          isDirty: true,
        }));
      },

      // ══════════════════════════════════════════════════════════════════════
      // ACTIONS: Contents
      // ══════════════════════════════════════════════════════════════════════
      addContent: (item) => {
        set((state) => {
          if (!state.contents.includes(item)) {
            return {
              contents: [...state.contents, item],
              isDirty: true,
            };
          }
          return state;
        });
      },

      removeContent: (item) => {
        set((state) => ({
          contents: state.contents.filter((c) => c !== item),
          isDirty: true,
        }));
      },

      // ══════════════════════════════════════════════════════════════════════
      // ACTIONS: Choice Groups
      // ══════════════════════════════════════════════════════════════════════
      addChoiceGroup: (group) => {
        const groupWithId = {
          ...group,
          tempId: group.tempId || Date.now().toString(),
          options: group.options || [],
        };
        set((state) => ({
          choice_groups: [...state.choice_groups, groupWithId],
          isDirty: true,
        }));
      },

      removeChoiceGroup: (groupId) => {
        set((state) => ({
          choice_groups: state.choice_groups.filter((g) => g.tempId !== groupId),
          isDirty: true,
        }));
      },

      updateChoiceGroup: (groupId, updates) => {
        set((state) => ({
          choice_groups: state.choice_groups.map((g) =>
            g.tempId === groupId ? { ...g, ...updates } : g
          ),
          isDirty: true,
        }));
      },

      // ══════════════════════════════════════════════════════════════════════
      // ACTIONS: Choice Options (within groups)
      // ══════════════════════════════════════════════════════════════════════
      addChoiceOption: (groupId, option) => {
        const optionWithId = {
          ...option,
          tempId: option.tempId || Date.now().toString(),
        };
        set((state) => ({
          choice_groups: state.choice_groups.map((g) => {
            if (g.tempId === groupId) {
              return {
                ...g,
                options: [...(g.options || []), optionWithId],
              };
            }
            return g;
          }),
          isDirty: true,
        }));
      },

      removeChoiceOption: (groupId, optionId) => {
        set((state) => ({
          choice_groups: state.choice_groups.map((g) => {
            if (g.tempId === groupId) {
              return {
                ...g,
                options: g.options.filter((o) => o.tempId !== optionId),
              };
            }
            return g;
          }),
          isDirty: true,
        }));
      },

      updateChoiceOption: (groupId, optionId, updates) => {
        set((state) => ({
          choice_groups: state.choice_groups.map((g) => {
            if (g.tempId === groupId) {
              return {
                ...g,
                options: g.options.map((o) =>
                  o.tempId === optionId ? { ...o, ...updates } : o
                ),
              };
            }
            return g;
          }),
          isDirty: true,
        }));
      },

      // ══════════════════════════════════════════════════════════════════════
      // ACTIONS: Form Lifecycle
      // ══════════════════════════════════════════════════════════════════════
      initFromCombo: (comboData) => {
        set({
          _id: comboData._id,
          name: comboData.name || '',
          description: comboData.description || '',
          image_url: comboData.image_url || null,
          dietary_type: comboData.dietary_type || 'mixed',
          prep_time_minutes: comboData.prep_time_minutes || null,
          tags: comboData.tags || [],
          contents: comboData.contents || [],
          platform_category_id: comboData.platform_category_id || null,
          platform_category_label: comboData.platform_category_label || null,
          vendor_section_id: comboData.vendor_section_id || null,
          vendor_section_label: comboData.vendor_section_label || null,
          price_naira: String(comboData.price ? comboData.price / 100 : ''),
          choice_groups: (comboData.choice_groups || []).map((group) => ({
            ...group,
            tempId: group._id,
            options: (group.options || []).map((opt) => ({
              ...opt,
              tempId: opt._id,
              price_modifier_naira: opt.price_modifier
                ? Math.round(opt.price_modifier / 100)
                : 0,
            })),
          })),
          currentStep: 1,
          isDirty: false,
        });
      },

      resetStore: () => {
        set({
          name: '',
          description: '',
          image_url: null,
          dietary_type: 'mixed',
          prep_time_minutes: null,
          tags: [],
          contents: [],
          platform_category_id: null,
          platform_category_label: null,
          vendor_section_id: null,
          vendor_section_label: null,
          price_naira: '',
          choice_groups: [],
          currentStep: 1,
          isSubmitting: false,
          isDirty: false,
          createdComboId: null,
          _id: null,
        });
      },

      setSubmitting: (isSubmitting) => {
        set({ isSubmitting });
      },
    }),
    {
      name: 'melachow-create-combo',
      partialize: (state) => ({
        name: state.name,
        description: state.description,
        image_url: state.image_url,
        dietary_type: state.dietary_type,
        prep_time_minutes: state.prep_time_minutes,
        tags: state.tags,
        contents: state.contents,
        platform_category_id: state.platform_category_id,
        platform_category_label: state.platform_category_label,
        vendor_section_id: state.vendor_section_id,
        vendor_section_label: state.vendor_section_label,
        price_naira: state.price_naira,
        choice_groups: state.choice_groups,
        currentStep: state.currentStep,
        isDirty: state.isDirty,
        _id: state._id,
      }),
    }
  )
);

export default useCreateComboStore;

