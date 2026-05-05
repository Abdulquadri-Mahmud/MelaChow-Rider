// Function to get vendor data safely
export const getVendorData = () => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("vendorPayload") || localStorage.getItem("VendorPayload");
    try {
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Error parsing vendor data:", error);
      return null;
    }
  }
  return null;
};

// Function to get vendorId safely
export const getVendorId = () => {
  const vendorData = getVendorData();
  // Check both _id (MongoDB default) and id (common virtual)
  return vendorData?.vendor?._id || vendorData?.vendor?.id || null;
};
