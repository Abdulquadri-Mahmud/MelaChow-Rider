import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const isVendorOpen = (openingHours) => {
  if (!openingHours) return false;
  const now      = new Date();
  const dayName  = now.toLocaleDateString("en-US",
    { weekday: "long" }).toLowerCase();
  const hours    = openingHours[dayName];
  if (!hours?.open || !hours?.close) return false;
  const [oH, oM]  = hours.open.split(":").map(Number);
  const [cH, cM]  = hours.close.split(":").map(Number);
  const nowMins   = now.getHours() * 60 + now.getMinutes();
  const openMins  = oH * 60 + oM;
  const closeMins = cH * 60 + cM;
  return nowMins >= openMins && nowMins < closeMins;
};

/**
 * Generates a full descriptive sentence of the order items.
 * @param {Object} order - The order object
 * @param {Object} options - Formatting options
 * @param {boolean} options.includeCustomerName - Whether to start with "This customer (Name) ordered for..."
 * @param {string} options.prefix - Custom prefix (e.g. "You ordered for")
 * @returns {string}
 */
export function generateOrderItemsStatement(order, { includeCustomerName = false, prefix = "" } = {}) {
  const items = order.items || order.userOrderId?.items || [];
  if (items.length === 0) return "No items recorded in this order.";

  const itemStatements = items.map((item) => {
    const quantity = Number(item.quantity) || 1;
    const portionLabel = item.portion_label || item.metadata?.portion_label || "";
    const portionQuantity = Number(item.portion_quantity) || 1;
    const itemName = item.name || item.variant?.name || "item";
    const options = item.selected_options || item.metadata?.selected_options || [];
    const totalPortions = portionQuantity * quantity;

    const cleanPortionLabel = (portionLabel || "").trim();
    const portionText = cleanPortionLabel || (totalPortions > 1 ? "servings" : "serving");

    let statement = `${quantity} ${quantity > 1 ? "packs" : "pack"} of ${itemName}`;
    if (portionQuantity > 0) {
      statement += `, making ${totalPortions} ${portionText}`;
    }

    if (options.length > 0) {
      const optionsTextList = options.map((opt) => `${opt.quantity || 1} ${opt.label}`);
      const optionsSentence = optionsTextList.length === 1 
        ? optionsTextList[0] 
        : optionsTextList.length === 2 
          ? optionsTextList.join(" and ") 
          : optionsTextList.slice(0, -1).join(", ") + ", and " + optionsTextList.slice(-1);
      
      statement += `, with ${optionsSentence}`;
    }
    return statement;
  });

  const fullList = itemStatements.length === 1 
    ? itemStatements[0] 
    : itemStatements.length === 2 
      ? itemStatements.join(" and ") 
      : itemStatements.slice(0, -1).join(", ") + ", and " + itemStatements.slice(-1);

  if (includeCustomerName) {
    const user = order.userId || order.userOrderId?.userId;
    const name = user ? `${user.firstname || ""} ${user.lastname || ""}`.trim() : "";
    return `${name || "This customer"} ordered ${fullList}.`;
  }

  if (prefix) {
    return `${prefix} ${fullList}.`;
  }

  return `${fullList}.`;
}
