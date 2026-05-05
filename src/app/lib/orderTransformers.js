/**
 * Order Transformation Utilities for V2 API
 * 
 * This module provides functions to transform cart data into the format
 * required by the Order Creation V2 API.
 */

/**
 * Group cart items by restaurant
 * 
 * @param {Array<Object>} cartItems - Array of cart items
 * @returns {Object} Items grouped by restaurant ID with delivery fees
 * 
 * @example
 * const grouped = groupItemsByRestaurant(cartItems);
 * // { "restaurantId1": { items: [...], deliveryFee: 700 } }
 */
const groupItemsByRestaurant = (cartItems) => {
    return cartItems.reduce((acc, item) => {
        const vendorId = item.vendorId || item.restaurantId;

        if (!acc[vendorId]) {
            acc[vendorId] = {
                items: [],
                deliveryFee: Number(item.deliveryFee || 0),
                restaurantName: item.storeName || "Unknown Store"
            };
        }

        acc[vendorId].items.push(item);
        return acc;
    }, {});
};

/**
 * Transform cart items to V2 order format
 * 
 * This function converts the frontend cart structure into the payload
 * format required by the Order Creation V2 API. It handles:
 * - Item transformation with variants and metadata
 * - Delivery fee calculation per vendor
 * - Address formatting
 * - Notes and customizations
 * 
 * @param {Array<Object>} cartItems - Items from cart state
 * @param {Object} deliveryAddress - User's delivery address
 * @param {string} deliveryAddress.addressLine - Full address line
 * @param {string} deliveryAddress.city - City name
 * @param {string} deliveryAddress.state - State name
 * @param {string} deliveryAddress.phone - Address phone number
 * @param {string} deliveryAddress.label - Address label (e.g., "Home", "Work")
 * @param {string} phone - User's primary phone number
 * @param {Object} notes - Optional notes per restaurant (keyed by storeName)
 * @returns {Object} V2 order payload ready for API submission
 * 
 * @example
 * const payload = transformCartToOrderV2(
 *   cartItems,
 *   { 
 *     addressLine: "123 Main St",
 *     city: "Lagos", 
 *     state: "Lagos",
 *     phone: "+2348012345678",
 *     label: "Home"
 *   },
 *   "+2348012345678",
 *   { "Restaurant A": "Extra spicy please" }
 * );
 */
/**
 * Transform a cart line item into the backend V2 contract shape.
 * Backend contract reference:
 *   - type:         "item" | "combo"  (required, explicit string)
 *   - foodId:       MenuItem._id
 *   - portionId:    MenuItemPortion._id   (camelCase, NOT portion_id)
 *   - restaurantId: Vendor._id           (NOT vendorId)
 *   - variantId:    MenuVariant._id      (for combos only)
 */
export const transformCartItemToV2 = (cartItem) => {
  const isCombo =
    cartItem.type === "combo" ||
    ((cartItem.comboId || cartItem.variantId) && !cartItem.foodId);


  if (isCombo) {
    return {
      type:         "combo",                    // ← explicit literal
      comboId:      cartItem.comboId || cartItem.variantId,
      variantId:    cartItem.comboId || cartItem.variantId, // Keep for backward compatibility

      restaurantId: cartItem.vendorId           // ← rename vendorId → restaurantId
                 || cartItem.restaurantId,
      quantity:     Number(cartItem.quantity),
      note:         cartItem.note || "",

      selected_options: (cartItem.selected_options || []).map(opt => ({
        group_id:             opt.group_id,
        option_id:            opt.option_id,
        label:                opt.label,
        price_modifier_naira: opt.price_modifier_naira || 0,
        quantity:             opt.quantity || 1,
      })),

      selected_swaps: (cartItem.selected_swaps || []).map(swap => ({
        group_id:             swap.group_id,
        option_id:            swap.option_id,
        label:                swap.label,
        price_modifier_naira: swap.price_modifier_naira || 0,
      })),

      component_choices: (cartItem.component_choices || []).map(cc => ({
        componentId: cc.componentId                // ← camelCase
                  || cc.component_id,              //   fallback from snake_case
        groupId:     cc.groupId                    // ← camelCase
                  || cc.group_id,
        optionId:    cc.optionId                   // ← camelCase
                  || cc.option_id,
        label:       cc.label
                  || cc.option_label               //   fallback
                  || "",
        price_modifier_naira: cc.price_modifier_naira || 0,
      })),
    };

  }

  // Regular food item
  return {
    type:             "item",                         // ← explicit literal
    foodId:           cartItem.foodId,
    portionId:        cartItem.portionId              // ← camelCase, NOT portion_id
                   || cartItem.portion_id,            //   fallback from old key
    restaurantId:     cartItem.vendorId               // ← rename vendorId → restaurantId
                   || cartItem.restaurantId,
    quantity:         Number(cartItem.quantity),
    portion_quantity: Number(cartItem.portion_quantity) || 1,
    portion_label:    cartItem.portion_label || "",
    storeName:        cartItem.storeName     || "",
    name:             cartItem.name          || "",
    image_url:        cartItem.image_url     || "",
    note:             cartItem.note          || "",

    selected_options: (cartItem.selected_options || []).map(opt => ({
      group_id:             opt.group_id,
      option_id:            opt.option_id,
      label:                opt.label,
      price_modifier_naira: opt.price_modifier_naira || 0,
      quantity:             opt.quantity || 1,
    })),
  };
};

/**
 * Helper to build vendor delivery fees from cart items
 */
const buildVendorDeliveryFees = (cartItems) => {
    const restaurantDeliveryMap = {};
    cartItems.forEach(item => {
        const vId = item.vendorId || item.restaurantId;
        if (!restaurantDeliveryMap[vId]) {
            restaurantDeliveryMap[vId] = Number(item.deliveryFee || 0);
        }
    });

    return Object.entries(restaurantDeliveryMap).map(([vendorId, fee]) => ({
        vendorId,
        deliveryFee: fee
    }));
};

/**
 * Transform cart items to V2 order format
 */
export const transformCartToOrderV2 = (cart, deliveryInfo, phone, email, userData = {}) => {
  return {
    // Items — each transformed to V2 contract
    items: cart.map(transformCartItemToV2),

    // Delivery fees — rename vendorId → restaurantId
    vendorDeliveryFees: buildVendorDeliveryFees(cart).map(fee => ({
      restaurantId: fee.vendorId      // ← rename
                 || fee.restaurantId,
      deliveryFee:  fee.deliveryFee,  // already in naira
    })),

    // Address — fix key names to match backend contract
    deliveryAddress: {
      addressLine:  deliveryInfo.addressLine
                 || deliveryInfo.address || "",
      cityName:     deliveryInfo.city              // ← rename city → cityName
                 || deliveryInfo.cityName || "",
      stateName:    deliveryInfo.state             // ← rename state → stateName
                 || deliveryInfo.stateName || "",
      name:         deliveryInfo.name              // ← ADD: contact person name
                 || (userData?.firstname
                    ? `${userData.firstname} ${userData.lastname || ""}`.trim()
                    : "Customer"),
      phone:        deliveryInfo.phone
                 || phone || userData?.phone || "",
      coordinates:  deliveryInfo.coordinates       // ← ADD: lat/lng if available
                 || null,
    },

    // Top-level fields
    phone: phone || userData?.phone || deliveryInfo?.phone || "",
    email: email || userData?.email || "",
  };
};

/**
 * Validate cart items before checkout
 * 
 * Checks for common issues that would prevent order creation:
 * - Empty cart
 * - Missing required fields
 * - Invalid quantities
 * 
 * @param {Array<Object>} cartItems - Cart items to validate
 * @returns {Object} Validation result with isValid flag and errors array
 * 
 * @example
 * const validation = validateCartItems(cartItems);
 * if (!validation.isValid) {
 *   console.error(validation.errors);
 * }
 */
export const validateCartItems = (cartItems) => {
    const errors = [];

    // Check if cart is empty
    if (!cartItems || cartItems.length === 0) {
        errors.push({
            type: "empty_cart",
            message: "Your cart is empty"
        });
        return { isValid: false, errors };
    }

    // Validate each item
    cartItems.forEach((item, index) => {
        const itemName = item.name || "Unknown item";

        // Check required fields
        if (!item.foodId) {
            errors.push({
                type: "missing_field",
                itemIndex: index,
                itemName,
                message: `${itemName}: Missing food ID`
            });
        }

        if (!item.vendorId && !item.restaurantId) {
            errors.push({
                type: "missing_field",
                itemIndex: index,
                itemName,
                message: `${itemName}: Missing vendor ID`
            });
        }

        // Check quantity
        if (!item.quantity || item.quantity < 1) {
            errors.push({
                type: "invalid_quantity",
                itemIndex: index,
                itemName,
                message: `${itemName}: Quantity must be at least 1`
            });
        }

        // Check price
        if (!(item.price_naira || item.price) || (item.price_naira || item.price) <= 0) {
            errors.push({
                type: "invalid_price",
                itemIndex: index,
                itemName,
                message: `${itemName}: Invalid price`
            });
        }

        // ✅ Check main item stock - null, undefined, or 0 means out of stock
        if (!item.stock || Number(item.stock) <= 0) {
            errors.push({
                type: "out_of_stock",
                itemIndex: index,
                itemName,
                message: `${itemName} is out of stock`
            });
        } else if (item.quantity > item.stock) {
            errors.push({
                type: "insufficient_stock",
                itemIndex: index,
                itemName,
                message: `${itemName}: Only ${item.stock} available (you requested ${item.quantity})`
            });
        }

        // ✅ Check variant stock - null, undefined, or 0 means out of stock
        if (item.variant) {
            if (!item.variant.stock || Number(item.variant.stock) <= 0) {
                errors.push({
                    type: "variant_out_of_stock",
                    itemIndex: index,
                    itemName,
                    variantName: item.variant.name,
                    message: `${itemName} (${item.variant.name}): This variant is out of stock`
                });
            } else if (item.quantity > item.variant.stock) {
                errors.push({
                    type: "variant_insufficient_stock",
                    itemIndex: index,
                    itemName,
                    variantName: item.variant.name,
                    message: `${itemName} (${item.variant.name}): Only ${item.variant.stock} available`
                });
            }
        }

        // ✅ Check choice group options stock - null, undefined, or 0 means out of stock
        if (item.selectedChoices && Array.isArray(item.selectedChoices)) {
            item.selectedChoices.forEach((choice) => {
                if (!choice.stock || Number(choice.stock) <= 0) {
                    errors.push({
                        type: "choice_out_of_stock",
                        itemIndex: index,
                        itemName,
                        choiceName: choice.name,
                        message: `${itemName}: Choice "${choice.name}" is out of stock`
                    });
                } else if (choice.quantity && choice.quantity > choice.stock) {
                    errors.push({
                        type: "choice_insufficient_stock",
                        itemIndex: index,
                        itemName,
                        choiceName: choice.name,
                        message: `${itemName}: Choice "${choice.name}" - Only ${choice.stock} available`
                    });
                }
            });
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Calculate order totals from cart items
 * 
 * @param {Array<Object>} cartItems - Cart items
 * @returns {Object} Calculated totals (subtotal, deliveryFee, total)
 * 
 * @example
 * const totals = calculateOrderTotals(cartItems);
 * console.log(totals.total); // 7700
 */
export const calculateOrderTotals = (cartItems) => {
    // Calculate subtotal
    const subtotal = cartItems.reduce((sum, item) => {
        return sum + (Number(item.price_naira || item.price || 0) * Number(item.quantity));
    }, 0);

    // Calculate delivery fees (one per restaurant)
    const restaurantDeliveryMap = {};
    cartItems.forEach(item => {
        const vId = item.vendorId || item.restaurantId;
        if (!restaurantDeliveryMap[vId]) {
            restaurantDeliveryMap[vId] = Number(item.deliveryFee || 0);
        }
    });

    const deliveryFee = Object.values(restaurantDeliveryMap).reduce(
        (sum, fee) => sum + fee,
        0
    );

    const total = subtotal + deliveryFee;

    return {
        subtotal,
        deliveryFee,
        total,
        restaurantCount: Object.keys(restaurantDeliveryMap).length
    };
};
