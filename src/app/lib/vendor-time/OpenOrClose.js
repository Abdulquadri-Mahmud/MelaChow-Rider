
// utils/vendorTime.js
import { getVendorOpenStatus } from "./vendorTime";

export function getVendorOpenAndCloseStatus(openingHours) {
  return getVendorOpenStatus(openingHours);
}
