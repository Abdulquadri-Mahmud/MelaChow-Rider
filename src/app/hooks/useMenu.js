"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
    createMenuItem,
    addPortion,
    addChoiceGroup,
    addChoiceOption,
    updateMenuItem,
    toggleMenuItemAvailability,
    toggleMenuItemStock,
    archiveMenuItem,
    getFullVendorMenu,
    getPlatformCategories,
    getVendorSections,
    createVendorSection,
} from "../lib/menuApi";

// ─────────────────────────────────────────────
// READ HOOKS
// ─────────────────────────────────────────────

export const useVendorMenu = (vendorId) => {
    return useQuery({
        queryKey: ["vendor-menu", vendorId],
        queryFn: () => getFullVendorMenu(vendorId),
        enabled: !!vendorId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const usePlatformCategories = () => {
    return useQuery({
        queryKey: ["platform-categories"],
        queryFn: getPlatformCategories,
        staleTime: 1000 * 60 * 30, // 30 min — categories rarely change
    });
};

export const useVendorSections = (vendorId) => {
    return useQuery({
        queryKey: ["vendor-sections", vendorId],
        queryFn: () => getVendorSections(vendorId),
        enabled: !!vendorId,
    });
};

// ─────────────────────────────────────────────
// CREATE FOOD — SEQUENTIAL ORCHESTRATION
// ─────────────────────────────────────────────

/**
 * useCreateMenuItem — orchestrates the full 4-step creation sequence:
 *
 * 1. POST /v1/menu/:vendorId/items              → get itemId
 * 2. POST .../items/:itemId/portions            → one call per portion
 * 3. POST .../items/:itemId/choice-groups       → one call per group → get groupId
 * 4. POST .../choice-groups/:groupId/options    → one call per option
 *
 * The mutationFn receives:
 * {
 *   vendorId: string,
 *   item: { name, description, image_url, item_type, prep_time_minutes, tags,
 *            platform_category_id, vendor_section_id }
 *   portions: [{ label, price_naira, is_default, max_quantity, sort_order }]
 *   choice_groups: [{
 *     name, min_selections, max_selections, is_required, sort_order,
 *     options: [{ label, price_modifier_naira, is_available, sort_order }]
 *   }]
 * }
 *
 * CRITICAL KOBO CONVERSIONS — done INSIDE this hook, NOT in the component:
 *   portion.price_naira * 100          → portion.price (kobo)
 *   option.price_modifier_naira * 100  → option.price_modifier (kobo)
 *
 * Returns the created item's _id on success.
 */
export const useCreateMenuItem = (vendorId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ item, portions, choice_groups }) => {
            // ── Step 1: Create the base item ──────────────────────────────
            const itemPayload = {
                platform_category_id: item.platform_category_id,
                vendor_section_id: item.vendor_section_id || null,
                name: item.name.trim(),
                description: item.description?.trim() || undefined,
                image_url: item.image_url || undefined,
                item_type: item.item_type,
                dietary_type: item.dietary_type || "mixed",
                prep_time_minutes: item.prep_time_minutes,
                tags: item.tags,
            };

            const itemRes = await createMenuItem(vendorId, itemPayload);
            // Handle both { item: { _id } } and { data: { _id } } response shapes
            const itemId = itemRes?.item?._id
                || itemRes?.data?._id
                || itemRes?._id;

            if (!itemId) {
                throw new Error("Food was created but ID was not returned. Check API response shape.");
            }

            // ── Step 2: Add portions sequentially ────────────────────────
            // Each call is awaited individually — order matters for sort_order
            for (const p of portions) {
                await addPortion(vendorId, itemId, {
                    label: p.label,
                    price: p.price_naira * 100,  // ← KOBO CONVERSION
                    is_default: p.is_default,
                    max_quantity: p.max_quantity || null,
                    sort_order: p.sort_order,
                });
            }

            // ── Steps 3 & 4: Add choice groups and their options ──────────
            for (const g of choice_groups) {
                // Step 3: create the group, capture the REAL _id
                const groupRes = await addChoiceGroup(vendorId, itemId, {
                    name: g.name,
                    min_selections: g.min_selections,
                    max_selections: g.max_selections,
                    is_required: g.is_required,
                    sort_order: g.sort_order,
                });

                // Handle various response shapes to extract the real MongoDB _id
                // Backend typically returns { success: true, group: { _id, ... } }
                const realGroupId = groupRes?.group?._id
                    || groupRes?.choiceGroup?._id
                    || groupRes?.data?._id
                    || groupRes?._id;

                if (!realGroupId) {
                    console.error("[publish] Choice group created but _id not found in response:", groupRes);
                    continue; // Skip options for this group rather than crashing
                }

                // Step 4: create each option using the real group _id
                for (let i = 0; i < g.options.length; i++) {
                    const o = g.options[i];
                    const optionPayload = {
                        label: o.label,
                        price_modifier: Math.round((Number(o.price_modifier_naira) || 0) * 100), // kobo
                        price_modifier_naira: Number(o.price_modifier_naira) || 0, // naira
                        image_url: o.image_url || null,
                        image: o.image_url || null, // alternative key
                        is_available: o.is_available ?? true,
                        sort_order: i,
                    };

                    console.log(`[publish] AddOption to ${realGroupId}:`, optionPayload);

                    try {
                        await addChoiceOption(realGroupId, optionPayload);
                    } catch (optionErr) {
                        // Surface the error — don't swallow it completely
                        console.error(
                            `[publish] Failed to save option "${o.label}" in group "${g.name}":`,
                            optionErr?.response?.data || optionErr.message
                        );
                        // We continue saving other options even if one fails
                    }
                }
            }

            return itemId;
        },

        onSuccess: () => {
            toast.success("Food is live on your menu! 🎉");
            // Invalidate so vendor menu lists re-fetch with the new item
            queryClient.invalidateQueries({ queryKey: ["vendor-menu", vendorId] });
            queryClient.invalidateQueries({ queryKey: ["vendor-foods", vendorId] });
        },

        onError: (error) => {
            const message = error?.response?.data?.message || error?.message;
            console.error("[useCreateMenuItem] Error:", error);
            // Do NOT reset form on error — user must be able to retry
            toast.error(message || "Something went wrong. Your progress is saved — please try again.");
        },
    });
};

// ─────────────────────────────────────────────
// UPDATE & TOGGLE HOOKS
// ─────────────────────────────────────────────

export const useUpdateMenuItem = (vendorId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ itemId, payload }) => updateMenuItem(vendorId, itemId, payload),
        onSuccess: () => {
            toast.success("Food updated");
            queryClient.invalidateQueries({ queryKey: ["vendor-menu", vendorId] });
        },
        onError: () => toast.error("Failed to update food"),
    });
};

export const useToggleAvailability = (vendorId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ itemId, is_available }) =>
            toggleMenuItemAvailability(vendorId, itemId, is_available),
        onSuccess: (_, { is_available }) => {
            toast.success(is_available ? "Food is now available" : "Food hidden from customers");
            queryClient.invalidateQueries({ queryKey: ["vendor-menu", vendorId] });
        },
        onError: () => toast.error("Failed to update availability"),
    });
};

export const useToggleStock = (vendorId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ itemId, is_in_stock }) =>
            toggleMenuItemStock(vendorId, itemId, is_in_stock),
        onSuccess: (_, { is_in_stock }) => {
            toast.success(is_in_stock ? "Marked as in stock" : "Marked as sold out");
            queryClient.invalidateQueries({ queryKey: ["vendor-menu", vendorId] });
        },
        onError: () => toast.error("Failed to update stock status"),
    });
};

/**
 * Soft delete — sets is_archived: true.
 * NEVER uses HTTP DELETE for food items.
 * The item disappears from the menu but remains in the database.
 */
export const useArchiveMenuItem = (vendorId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (itemId) => archiveMenuItem(vendorId, itemId),
        onSuccess: () => {
            toast.success("Food removed from menu");
            queryClient.invalidateQueries({ queryKey: ["vendor-menu", vendorId] });
        },
        onError: () => toast.error("Failed to remove food"),
    });
};

// ─────────────────────────────────────────────
// SECTION HOOKS
// ─────────────────────────────────────────────

export const useCreateSection = (vendorId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (name) => createVendorSection(vendorId, name),
        onSuccess: () => {
            toast.success("Section created");
            queryClient.invalidateQueries({ queryKey: ["vendor-sections", vendorId] });
        },
        onError: () => toast.error("Failed to create section"),
    });
};
