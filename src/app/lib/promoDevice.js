"use client";

const PROMO_DEVICE_KEY = "melachow_promo_device_id";

const createFallbackId = () => {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const getPromoDeviceId = () => {
  if (typeof window === "undefined") return "";

  try {
    let deviceId = window.localStorage.getItem(PROMO_DEVICE_KEY);
    if (!deviceId) {
      deviceId =
        window.crypto?.randomUUID?.() ||
        createFallbackId();
      window.localStorage.setItem(PROMO_DEVICE_KEY, deviceId);
    }
    return deviceId;
  } catch {
    return "";
  }
};
