"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useActivePromos } from "./useActivePromos";
import { getPromoDeviceId } from "../lib/promoDevice";

const fetchFreeDeliveryEligibility = async (originalDeliveryFee) => {
  const deviceId = getPromoDeviceId();
  const res = await axios.post(
    "/api/orders/v2/free-delivery-eligibility",
    { originalDeliveryFee, deviceId },
    {
      withCredentials: true,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        ...(deviceId ? { "X-MelaChow-Device-Id": deviceId } : {}),
      },
    }
  );

  return res.data;
};

/**
 * Backend-backed platform free delivery check.
 * Checkout must not decide promo eligibility by itself because Paystack uses
 * the backend-created order total.
 */
export const usePromoEligibility = (originalDeliveryFee = 0) => {
  const { platformPromo, isLoading: promoLoading } = useActivePromos();
  const fee = Number(originalDeliveryFee || 0);

  const { data, isLoading: eligibilityLoading } = useQuery({
    queryKey: ["free-delivery-eligibility", fee, platformPromo?.slotsRemaining],
    queryFn: () => fetchFreeDeliveryEligibility(fee),
    enabled: fee > 0,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: false,
  });

  const eligible =
    fee > 0 &&
    !!data?.eligible &&
    (!platformPromo || (platformPromo.slotsRemaining || 0) > 0);

  return {
    eligible,
    reason: data?.reason || null,
    platformPromo,
    isLoading: promoLoading || (fee > 0 && eligibilityLoading),
  };
};
