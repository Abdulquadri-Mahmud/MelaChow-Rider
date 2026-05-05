import axios from "axios";
import { TokenManager } from "./auth-token";
import { getPromoDeviceId } from "./promoDevice";

// menuApi.js — change this one line
export const getMenuAxios = () => {
    const token = TokenManager.getToken('vendor');
    const deviceId = getPromoDeviceId();

    return axios.create({
        baseURL: "", // Hit the Next.js API proxy instead of absolute URL to fix 401s and CORS issues
        withCredentials: true,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(deviceId ? { "X-MelaChow-Device-Id": deviceId } : {}),
        },
    });
};

// ─────────────────────────────────────────────
// PLATFORM CATEGORIES (public, no auth needed)
// ─────────────────────────────────────────────

export const getPlatformCategories = async () => {
    const res = await getMenuAxios().get('/v1/menu/platform-categories');
    return res.data;
};

// ─────────────────────────────────────────────
// VENDOR SECTIONS
// ─────────────────────────────────────────────

export const getVendorSections = async (vendorId) => {
    const res = await getMenuAxios().get(`/v1/menu/${vendorId}/sections`);
    return res.data;
};

export const createVendorSection = async (vendorId, name) => {
    const res = await getMenuAxios().post(`/v1/menu/${vendorId}/sections`, { name });
    return res.data;
};

export const updateVendorSection = async (vendorId, sectionId, data) => {
    const res = await getMenuAxios().put(`/v1/menu/${vendorId}/sections/${sectionId}`, data);
    return res.data;
};

export const deleteVendorSection = async (vendorId, sectionId) => {
    const res = await getMenuAxios().delete(`/v1/menu/${vendorId}/sections/${sectionId}`);
    return res.data;
};

// ─────────────────────────────────────────────
// MENU ITEMS
// ─────────────────────────────────────────────

/**
 * Create a menu item (Step 1 of the sequential create flow).
 * Does NOT include price — price lives on portions.
 *
 * Payload shape:
 * {
 *   platform_category_id: string (required, must be leaf category)
 *   vendor_section_id: string | null
 *   name: string
 *   description: string | undefined
 *   image_url: string | undefined
 *   item_type: "FOOD" | "DRINK" | "SIDE" | "SOUP" | "SWALLOW" | "PROTEIN"
 *   prep_time_minutes: number
 *   tags: string[]
 * }
 *
 * Returns: { item: { _id, name, ... } }
 */
export const createMenuItem = async (vendorId, payload) => {
    const res = await getMenuAxios().post(`/v1/menu/${vendorId}/items`, payload);
    return res.data;
};

export const updateMenuItem = async (vendorId, itemId, payload) => {
    const res = await getMenuAxios().put(`/v1/menu/${vendorId}/items/${itemId}`, payload);
    return res.data;
};

/**
 * Hard delete a menu item and ALL its portions, choice groups, and options.
 * Guard: 400 if item is in active combos → err.response.data.combos contains combo names.
 */
export const deleteMenuItem = async (vendorId, itemId) => {
    const res = await getMenuAxios().delete(`/v1/menu/${vendorId}/items/${itemId}`);
    return res.data;
};

export const toggleMenuItemAvailability = async (vendorId, itemId) => {
    const res = await getMenuAxios().patch(
        `/v1/menu/${vendorId}/items/${itemId}/availability`
    );
    return res.data;
};

export const toggleMenuItemStock = async (vendorId, itemId, is_in_stock) => {
    const res = await getMenuAxios().patch(
        `/v1/menu/${vendorId}/items/${itemId}/stock`,
        { is_in_stock }
    );
    return res.data;
};

/**
 * Soft delete — sets is_archived: true.
 * The item is never destroyed in the database.
 * Do NOT use DELETE method for items.
 */
export const archiveMenuItem = async (vendorId, itemId, archived) => {
    const res = await getMenuAxios().patch(
        `/v1/menu/${vendorId}/items/${itemId}/archive`,
        { archived }    // true = archive, false = restore
    );
    return res.data;
};

export const moveItemToSection = async (vendorId, itemId, vendor_section_id) => {
    const res = await getMenuAxios().patch(
        `/v1/menu/${vendorId}/items/${itemId}/section`,
        { vendor_section_id }
    );
    return res.data;
};

// ─────────────────────────────────────────────
// PORTIONS
// ─────────────────────────────────────────────

/**
 * Add a portion to an existing menu item (Step 2 of sequential create).
 * PRICE IS IN KOBO. Convert from naira before calling: price_naira * 100
 *
 * Payload shape:
 * {
 *   label: string        e.g. "Small", "Medium", "1 Portion"
 *   price: number        IN KOBO — ₦500 = 50000
 *   is_default: boolean
 *   max_quantity: number | null
 *   sort_order: number
 * }
 */
export const addPortion = async (vendorId, itemId, payload) => {
    const res = await getMenuAxios().post(
        `/v1/menu/${vendorId}/items/${itemId}/portions`,
        payload
    );
    return res.data;
};

/**
 * Delete a single portion. Guard: 400 if it is the only remaining portion.
 */
export const deleteMenuItemPortion = async (vendorId, itemId, portionId) => {
    const res = await getMenuAxios().delete(
        `/v1/menu/${vendorId}/items/${itemId}/portions/${portionId}`
    );
    return res.data;
};

export const updatePortion = async (vendorId, itemId, portionId, payload) => {
    const res = await getMenuAxios().put(
        `/v1/menu/${vendorId}/items/${itemId}/portions/${portionId}`,
        payload
    );
    return res.data;
};

export const togglePortionStock = async (vendorId, itemId, portionId, is_in_stock) => {
    const res = await getMenuAxios().patch(
        `/v1/menu/${vendorId}/items/${itemId}/portions/${portionId}/stock`,
        { is_in_stock }
    );
    return res.data;
};

// Fetch full portions for a single menu item
// Used by combo builder to let vendor pick which portion
// is included in the combo
// Fetch full item detail including populated choice groups
// and options. Used by the combo builder to preview what
// choices a customer will make when ordering this item.
//
// IMPORTANT: Uses /vendors/ prefix — this is the customer-
// facing endpoint that runs buildFullItem with full population.
// The vendor /menu/ endpoint does NOT return choice group arrays.
export const getMenuItemDetail = async (vendorId, itemId) => {
    const ax = getMenuAxios();
    const res = await ax.get(
        `/v1/vendors/${vendorId}/menu/items/${itemId}`
    );

    // console.log(res);

    return res.data;
    // res.data.item.choice_groups is a fully populated array
};

// ─────────────────────────────────────────────
// CHOICE GROUPS & OPTIONS
// ─────────────────────────────────────────────

/**
 * Add a choice group to an item (Step 3 of sequential create).
 *
 * Payload shape:
 * {
 *   name: string           e.g. "Choose Protein"
 *   min_selections: number  0 = optional, 1+ = required
 *   max_selections: number
 *   is_required: boolean
 *   sort_order: number
 * }
 *
 * Returns: { choiceGroup: { _id, name, ... } }
 */
export const addChoiceGroup = async (vendorId, itemId, payload) => {
    const res = await getMenuAxios().post(
        `/v1/menu/${vendorId}/items/${itemId}/choice-groups`,
        payload
    );
    return res.data;
};

export const updateChoiceGroup = async (vendorId, itemId, groupId, payload) => {
    const res = await getMenuAxios().put(
        `/v1/menu/${vendorId}/items/${itemId}/choice-groups/${groupId}`,
        payload
    );
    return res.data;
};

export const deleteChoiceGroup = async (vendorId, itemId, groupId) => {
    const res = await getMenuAxios().delete(
        `/v1/menu/${vendorId}/items/${itemId}/choice-groups/${groupId}`
    );
    return res.data;
};

/**
 * Add an option to an existing choice group (Step 4 of sequential create).
 * PRICE MODIFIER IS IN KOBO. Convert before calling: price_modifier_naira * 100
 * Use 0 for free options.
 *
 * Payload shape:
 * {
 *   label: string              e.g. "Chicken Lap"
 *   price_modifier: number     IN KOBO — 0 = free, 50000 = +₦500
 *   is_available: boolean
 *   sort_order: number
 * }
 *
 * NOTE: groupId here is the real MongoDB _id returned by addChoiceGroup,
 * NOT a frontend tempId.
 */
export const addChoiceOption = async (groupId, payload) => {
    const res = await getMenuAxios().post(
        `/v1/menu/choice-groups/${groupId}/options`,
        payload
    );
    return res.data;
};

export const updateChoiceOption = async (groupId, optionId, payload) => {
    // Note: groupId is not needed for the endpoint, but kept in signature so existing calls don't break
    const res = await getMenuAxios().patch(
        `/v1/menu/choice-options/${optionId}`,
        payload
    );
    return res.data;
};

export const deleteChoiceOption = async (groupId, optionId) => {
    const res = await getMenuAxios().delete(
        `/v1/menu/choice-groups/${groupId}/options/${optionId}`
    );
    return res.data;
};

// ─────────────────────────────────────────────
// CUSTOMER MENU (reading the full menu)
// ─────────────────────────────────────────────

export const getFullVendorMenu = async (vendorId) => {
    const res = await getMenuAxios().get(`/v1/vendors/${vendorId}/menu`);
    return res.data;
};

export const getVendorStorefront = async (vendorId) => {
    const res = await getMenuAxios().get(
        `/v1/vendors/${vendorId}/menu`
    );
    return res.data;
};

// ─────────────────────────────────────────────
// COMBOS & VARIANTS
// ─────────────────────────────────────────────

/**
 * Get all vendor menu items with filtering and pagination
 */
export const getVendorMenuItems = async (vendorId, params = {}) => {
    const res = await getMenuAxios().get(`/v1/menu/${vendorId}/items`, { params });
    return res.data;
};

/**
 * Create combo variant
 */
export const createVariant = async (vendorId, data) => {
    const res = await getMenuAxios().post(`/v1/menu/${vendorId}/variants`, data);
    return res.data;
};

/**
 * Add component to variant
 */
export const addVariantComponent = async (vendorId, variantId, data) => {
    const res = await getMenuAxios().post(
        `/v1/menu/${vendorId}/variants/${variantId}/components`,
        data
    );
    return res.data;
};

/**
 * Remove a component from a combo variant.
 * Guard: 400 if combo would drop below 2 FIXED items.
 * TODO: Add remove button per component once combo edit page is built.
 */
export const deleteVariantComponent = async (vendorId, variantId, componentId) => {
    const res = await getMenuAxios().delete(
        `/v1/menu/${vendorId}/variants/${variantId}/components/${componentId}`
    );
    return res.data;
};

/**
 * Add choice group to variant (for swaps)
 */
export const addVariantChoiceGroup = async (vendorId, variantId, data) => {
    const res = await getMenuAxios().post(
        `/v1/menu/${vendorId}/variants/${variantId}/choice-groups`,
        data
    );
    return res.data;
};

// Create a swap group for a combo variant
export const addVariantSwapGroup = async (vendorId, variantId, data) => {
    const res = await getMenuAxios().post(
        `/v1/menu/${vendorId}/variants/${variantId}/choice-groups`,
        data
    );
    return res.data;
};

/**
 * Add a swap option to a choice group
 */
export const addVariantChoiceOption = async (groupId, data) => {
    const res = await getMenuAxios().post(
        `/v1/menu/variant-choice-groups/${groupId}/options`,
        data
    );
    return res.data;
};

// Add an option to an existing variant swap group
export const addVariantSwapOption = async (groupId, data) => {
    const res = await getMenuAxios().post(
        `/v1/menu/variant-choice-groups/${groupId}/options`,
        data
    );
    return res.data;
};

/**
 * Make the combo available/unavailable
 */
export const toggleVariantAvailability = async (vendorId, variantId, is_available) => {
    const res = await getMenuAxios().patch(
        `/v1/menu/${vendorId}/variants/${variantId}/availability`,
        { is_available }
    );
    return res.data;
};

/**
 * Update combo basics (name, price, description, image).
 * Price sent as naira — backend converts to kobo.
 *
 * Payload shape:
 * {
 *   name?: string
 *   description?: string
 *   image_url?: string
 *   price_naira?: number   ← naira, NOT kobo
 *   prep_time_minutes?: number
 *   tags?: string[]
 * }
 */
export const updateVariant = async (vendorId, variantId, payload) => {
    const res = await getMenuAxios().put(
        `/v1/menu/${vendorId}/variants/${variantId}`,
        payload
    );
    return res.data;
};

/**
 * Fetch full public food detail for the food details page.
 * Uses the /v1/ base — NOT the /api/ base from ApiContext.
 *
 * @param {string} foodId — MenuItem _id
 * @returns {Promise<{ food: Object }>}
 */
export const getPublicFoodDetail = async (foodId) => {
  const res = await getMenuAxios().get(
    `/v1/vendors/foods/${foodId}`
  );
  return res.data;
};

// ─────────────────────────────────────────────
// COMBO ITEMS (NEW SYSTEM)
// ─────────────────────────────────────────────

/**
 * Create a combo item.
 * Price sent as naira — backend converts to kobo internally.
 * 
 * Payload shape:
 * {
 *   name: string (required)
 *   description?: string
 *   image_url: string (required)
 *   price_naira: number (required, > 0)
 *   dietary_type: string (required, e.g., "veg", "vegan", "non-veg", "halal", "kosher", "mixed")
 *   prep_time_minutes?: number (default 15)
 *   tags?: string[] (max 6)
 *   contents?: string[] (what's included, e.g., ["Rice", "Plantain", "Chicken"])
 *   platform_category_id: string (required)
 *   vendor_section_id?: string (optional)
 *   choice_groups?: array (optional, for add-ons like protein choice, sauce level, etc.)
 * }
 * 
 * Returns: { comboItem: { _id, name, price, ... } }
 */
export const createComboItem = async (vendorId, payload) => {
    const res = await getMenuAxios().post(`/v1/menu/combos`, payload);
    return res.data;
};

/**
 * Get all combos for a vendor with optional filtering.
 * 
 * Query params:
 * - is_available?: boolean
 * - search?: string (searches name and description)
 * 
 * Returns: { combos: [...], total: number }
 */
export const getVendorCombos = async (vendorId, params = {}) => {
    const res = await getMenuAxios().get(`/v1/menu/combos/vendor/${vendorId}`, { params });
    return res.data;
};

/**
 * Get a single combo by ID.
 * Returns: { combo: { _id, name, choice_groups: [...], ... } }
 */
export const getComboById = async (comboId) => {
    const res = await getMenuAxios().get(`/v1/menu/combos/${comboId}`);
    return res.data;
};

/**
 * Fetch full public combo detail for the storefront customization modal.
 * Uses the customer-facing /vendors/ prefix endpoint.
 *
 * @param {string} vendorId - Vendor _id
 * @param {string} comboId - ComboItem _id
 * @returns {Promise<{ combo: Object }>}
 */
export const getStorefrontComboDetail = async (vendorId, comboId) => {
    const res = await getMenuAxios().get(
        `/v1/vendors/${vendorId}/menu/combos/${comboId}`
    );
    return res.data;
};

/**
 * Update a combo item.
 * Same field shape as create — only include fields to update.
 * Price sent as price_naira (naira) — backend converts to kobo.
 */
export const updateComboItem = async (comboId, payload) => {
    const res = await getMenuAxios().patch(`/v1/menu/combos/${comboId}`, payload);
    return res.data;
};

/**
 * Toggle combo availability (make it visible/hidden to customers).
 * Body: { is_available: boolean }
 */
export const toggleComboAvailability = async (comboId, is_available) => {
    const res = await getMenuAxios().patch(
        `/v1/menu/combos/${comboId}/availability`,
        { is_available }
    );
    return res.data;
};

/**
 * Soft delete a combo (archive).
 * Sets is_archived: true and is_available: false
 */
export const archiveComboItem = async (comboId, is_archived) => {
    const res = await getMenuAxios().patch(
        `/v1/menu/combos/${comboId}/archive`,
        { is_archived }
    );
    return res.data;
};
