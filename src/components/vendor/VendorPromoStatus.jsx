"use client";
import { useState, useEffect } from "react";
import { fetchVendorOwnPromoStatus } from "@/lib/api/promos";

export default function VendorPromoStatus() {
  const [status, setStatus]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendorOwnPromoStatus()
      .then(d => setStatus(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !status?.hasPromo) return null;

  const { promo } = status;
  const remaining =
    promo.maxOrders != null
      ? Math.max(0, promo.maxOrders - promo.usedOrders)
      : null;

  const endsAt = new Date(promo.endsAt).toLocaleDateString("en-NG", {
    dateStyle: "medium",
  });

  return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-green-600 text-lg">🏪</span>
        <p className="font-semibold text-green-800 text-sm">
          Free Delivery Promo Active
        </p>
      </div>
      <p className="text-xs text-green-700">
        Your customers get free delivery until{" "}
        <span className="font-medium">{endsAt}</span>.
      </p>
      {remaining != null && (
        <p className="text-xs text-green-700 mt-1">
          Orders remaining:{" "}
          <span className="font-medium">{remaining}</span> of {promo.maxOrders}
        </p>
      )}
      {remaining === 0 && (
        <p className="text-xs text-red-600 mt-1 font-medium">
          Promo cap reached — contact MelaChow to extend.
        </p>
      )}
    </div>
  );
}
