// Fetch all vendor delivery promos (admin only)
export const fetchVendorDeliveryPromos = async () => {
  const res = await fetch("/api/admin/promos/vendor-delivery", {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch promos");
  return res.json();
};

// Create a vendor delivery promo (admin only)
export const createVendorDeliveryPromo = async (payload) => {
  const res = await fetch("/api/admin/promos/vendor-delivery", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create promo");
  return data;
};

// Deactivate a vendor delivery promo (admin only)
export const deactivateVendorDeliveryPromo = async (promoId) => {
  const res = await fetch(
    `/api/admin/promos/vendor-delivery/${promoId}/deactivate`,
    { method: "PATCH", credentials: "include" }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to deactivate");
  return data;
};

// Vendor reads their own promo status
export const fetchVendorOwnPromoStatus = async () => {
  const res = await fetch("/api/vendor/promo/delivery-status", {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch promo status");
  return res.json();
};

// Fetch all platform delivery promos (admin only)
export const fetchPlatformDeliveryPromos = async () => {
  const res = await fetch("/api/admin/promos/platform-delivery", {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch promos");
  return res.json();
};

// Create a platform delivery promo (admin only)
export const createPlatformDeliveryPromo = async (payload) => {
  const res = await fetch("/api/admin/promos/platform-delivery", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create promo");
  return data;
};

// Deactivate a platform delivery promo (admin only)
export const deactivatePlatformDeliveryPromo = async (promoId) => {
  const res = await fetch(
    `/api/admin/promos/platform-delivery/${promoId}/deactivate`,
    { method: "PATCH", credentials: "include" }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to deactivate");
  return data;
};
