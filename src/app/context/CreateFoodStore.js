"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useCreateFoodStore = create(
    persist(
        (set, get) => ({
            // ─── Step 1 ────────────────────────────────────────────────────────
            name: "",
            description: "",
            image_url: null,
            item_type: "FOOD",
            dietary_type: "mixed",
            prep_time_minutes: 20,
            tags: [],

            // ─── Step 2 ────────────────────────────────────────────────────────
            platform_category_id: null,
            platform_category_label: null,
            vendor_section_id: null,
            vendor_section_label: null,

            // ─── Step 3 ────────────────────────────────────────────────────────
            portions: [],

            // ─── Step 4 ────────────────────────────────────────────────────────
            choice_groups: [],

            // ─── Meta ──────────────────────────────────────────────────────────
            currentStep: 1,
            isSubmitting: false,
            isDirty: false,
            createdItemId: null,
            _id: null,

            // ─── Actions ───────────────────────────────────────────────────────
            setField: (field, value) =>
                set((state) => ({ ...state, [field]: value, isDirty: true })),

            setStep: (step) => set({ currentStep: step }),

            // ... (other actions)
            addTag: (tag) => {
                const t = tag.trim().toLowerCase();
                if (t && get().tags.length < 6 && !get().tags.includes(t)) {
                    set((state) => ({ tags: [...state.tags, t], isDirty: true }));
                }
            },
            removeTag: (tag) =>
                set((state) => ({
                    tags: state.tags.filter((t) => t !== tag),
                    isDirty: true,
                })),

            // Portions
            addPortion: (portion) =>
                set((state) => ({
                    portions: [...state.portions, portion],
                    isDirty: true,
                })),
            updatePortion: (tempId, updates) =>
                set((state) => ({
                    portions: state.portions.map((p) =>
                        p.tempId === tempId ? { ...p, ...updates } : p
                    ),
                    isDirty: true,
                })),
            removePortion: (tempId) =>
                set((state) => ({
                    portions: state.portions.filter((p) => p.tempId !== tempId),
                    isDirty: true,
                })),
            setDefaultPortion: (tempId) =>
                set((state) => ({
                    portions: state.portions.map((p) => ({
                        ...p,
                        is_default: p.tempId === tempId,
                    })),
                    isDirty: true,
                })),

            // Choice Groups
            addChoiceGroup: (group) =>
                set((state) => ({
                    choice_groups: [...state.choice_groups, group],
                    isDirty: true,
                })),
            updateChoiceGroup: (tempId, updates) =>
                set((state) => ({
                    choice_groups: state.choice_groups.map((g) =>
                        g.tempId === tempId ? { ...g, ...updates } : g
                    ),
                    isDirty: true,
                })),
            removeChoiceGroup: (tempId) =>
                set((state) => ({
                    choice_groups: state.choice_groups.filter((g) => g.tempId !== tempId),
                    isDirty: true,
                })),

            // Choice Options
            addChoiceOption: (groupId, option) =>
                set((state) => ({
                    choice_groups: state.choice_groups.map((g) =>
                        g.tempId === groupId
                            ? { ...g, options: [...g.options, option] }
                            : g
                    ),
                    isDirty: true,
                })),
            updateChoiceOption: (groupId, optionId, updates) =>
                set((state) => ({
                    choice_groups: state.choice_groups.map((g) =>
                        g.tempId === groupId
                            ? {
                                ...g,
                                options: g.options.map((o) =>
                                    o.tempId === optionId ? { ...o, ...updates } : o
                                ),
                            }
                            : g
                    ),
                    isDirty: true,
                })),
            removeChoiceOption: (groupId, optionId) =>
                set((state) => ({
                    choice_groups: state.choice_groups.map((g) =>
                        g.tempId === groupId
                            ? {
                                ...g,
                                options: g.options.filter((o) => o.tempId !== optionId),
                            }
                            : g
                    ),
                    isDirty: true,
                })),

            initFromFood: (food) => set({
                // Preserve the original item ID for update calls
                _id: food._id || null,

                // Step 1 — Basic Info
                name: food.name || "",
                description: food.description || "",
                image_url: food.image_url || null,
                item_type: food.item_type || "FOOD",
                dietary_type: food.dietary_type || "mixed",
                prep_time_minutes: food.prep_time_minutes || null,
                tags: food.tags || [],

                // Step 2 — Categories
                platform_category_id: food.platform_category_id || null,
                platform_category_label: food.platform_category
                    ? `${food.platform_category?.parent?.name
                        ? food.platform_category.parent.name + " → "
                        : ""}${food.platform_category.name}`
                    : null,
                vendor_section_id: food.vendor_section_id || null,
                vendor_section_label: food.vendor_section?.name || null,

                // Step 3 — Portions
                // Convert kobo → naira for display
                // Assign tempId using the real _id from the DB
                portions: (food.portions || []).map(p => ({
                    tempId: p._id?.toString() || Date.now().toString(),
                    label: p.label,
                    price_naira: p.price / 100,    // kobo → naira
                    is_default: p.is_default,
                    max_quantity: p.max_quantity || null,
                    sort_order: p.sort_order || 0,
                })),

                // Step 4 — Choice Groups
                choice_groups: (food.choice_groups || []).map(g => ({
                    tempId: g._id?.toString() || Date.now().toString(),
                    name: g.name,
                    is_required: g.is_required,
                    min_selections: g.min_selections,
                    max_selections: g.max_selections,
                    options: (g.options || []).map(o => ({
                        tempId: o._id?.toString() || Date.now().toString(),
                        label: o.label,
                        price_modifier_naira: o.price_modifier / 100,  // kobo → naira
                        image_url: o.image_url || null,
                        is_available: o.is_available,
                        sort_order: o.sort_order || 0,
                    })),
                })),

                // Meta — reset wizard state for edit mode
                currentStep: 1,
                isSubmitting: false,
                isDirty: false,
                createdItemId: food._id || null,
            }),

            resetForm: () =>
                set({
                    name: "",
                    description: "",
                    image_url: null,
                    item_type: "FOOD",
                    dietary_type: "mixed",
                    prep_time_minutes: 20,
                    tags: [],
                    platform_category_id: null,
                    platform_category_label: null,
                    vendor_section_id: null,
                    vendor_section_label: null,
                    portions: [],
                    choice_groups: [],
                    currentStep: 1,
                    isSubmitting: false,
                    isDirty: false,
                    createdItemId: null,
                    _id: null,
                }),
        }),
        {
            name: "gd_create_food_wizard", // unique key in sessionStorage
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);
