"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { verifyPaymentV2 } from "../lib/orderService";
import toast from "react-hot-toast";
import Header2 from "./App_Header/Header2";
import { motion } from "framer-motion";
import { Check, XCircle, Loader2, MapPin, Receipt, ArrowRight, Home, AlertTriangle, RefreshCw } from "lucide-react";

export default function VerifyPayment() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const [order, setOrder] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const router = useRouter();

  const reference = searchParams.get("reference");
  const didVerify = useRef(false);
  const formatMoney = (value) => `₦${Number(value || 0).toLocaleString()}`;
  const promoWaivedDelivery =
    Number(order?.deliveryFee || 0) === 0 &&
    Number(order?.freeDeliveryPromo?.originalDeliveryFee || order?.vendorDeliveryPromo?.originalDeliveryFee || 0) > 0;

  useEffect(() => {
    // Prevent double verification
    if (!reference || didVerify.current) return;
    didVerify.current = true;

    const verifyPayment = async () => {
      try {
        // Use V2 API with cookie-based authentication
        const res = await verifyPaymentV2(reference);
        console.log("V2 Payment Verification Response:", res);

        // Check if order was created successfully
        if (!res.order) {
          setStatus("failed");
          setErrorMessage("Payment verified but order was not created.");
          toast.error("Payment verified but order was not created.");
          return;
        }

        // Set order data and success status
        setOrder(res.order);
        setStatus("success");
        toast.success(res.message || "Payment verified successfully!");

        // Mark that user has placed an order for contextual push notifications
        localStorage.setItem('has_placed_order', 'true');

        // Clear pending order ID from session storage if it exists
        sessionStorage.removeItem("pendingOrderId");
      } catch (error) {
        if (error.status !== 401) {
          console.error("Verification error:", error);
        }
        setStatus("failed");

        let msg = "Something went wrong while verifying your payment.";

        // Handle specific Business Logic Failures
        if (error.status === 401) {
          msg = "Session expired. Please log in to complete verification.";
        } else if (error.code === "PAYMENT_FAILED") {
          msg = error.message;
        } else if (error.message) {
          msg = error.message;
        }

        setErrorMessage(msg);
        toast.error(msg);
      }
    };

    verifyPayment();
  }, [reference]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  // 1. Verifying State
  if (status === "verifying") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col transition-colors duration-300">
        <Header2 />
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-xl border border-slate-100 dark:border-zinc-800"
          >
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-orange-100 dark:border-orange-500/10 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-orange-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-500" size={24} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-2 font-display italic uppercase tracking-tight">Verifying Payment</h2>
            <p className="text-slate-500 dark:text-zinc-400 font-medium">
              Please wait while we confirm your secure transaction...
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // 2. Failed State
  if (status === "failed") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col transition-colors duration-300">
        <Header2 />
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-red-50 dark:border-red-500/10"
          >
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center shadow-inner">
                <XCircle size={40} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-2 font-display italic uppercase tracking-tight">Payment Failed</h2>
            <div className="bg-red-50 dark:bg-red-500/5 p-4 rounded-xl mb-6">
              <p className="text-red-700 dark:text-red-400 font-medium text-sm">
                {errorMessage || "We couldn't verify your payment. Please try again."}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3.5 rounded-xl bg-slate-900 dark:bg-zinc-100 dark:text-zinc-900 text-white font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} /> Retry Verification
              </button>
              <button
                onClick={() => router.push("/checkout")}
                className="w-full py-3.5 rounded-xl bg-slate-100 dark:bg-zinc-800 dark:text-zinc-300 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
              >
                Return to Checkout
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // 3. Success State
  if (status === "success" && order) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col pb-20 transition-colors duration-300">
        <Header2 />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="w-full max-w-lg"
          >
            {/* Celebration Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20"
              >
                <Check size={48} strokeWidth={3} />
              </motion.div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-zinc-100 mb-2 font-display italic uppercase tracking-tighter">Order Confirmed!</h1>
              <p className="text-slate-500 dark:text-zinc-400 font-medium">Thank you for your purchase.</p>
            </div>

            {/* Receipt Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-zinc-800 mb-8 relative">
              {/* Receipt Top Pattern */}
              <div className="h-2 bg-gradient-to-r from-orange-400 to-orange-600" />

              <div className="p-6 md:p-8">
                {/* Header Info */}
                <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100 dark:border-zinc-800">
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Order ID</p>
                    <p className="font-mono text-lg font-bold text-slate-900 dark:text-zinc-200">#{order.orderId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Status</p>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-bold rounded-full border border-green-100 dark:border-green-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      {order.paymentStatus === 'success' ? 'Paid' : order.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-center py-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl mb-6 border border-slate-100 dark:border-zinc-800">
                  <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-1">Total Amount Paid</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-zinc-100">{formatMoney(order.total)}</p>
                </div>

                {/* Details List */}
                <div className="space-y-4">
                  {/* Delivery Info */}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center shrink-0 text-orange-500">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-zinc-200 text-sm">Delivery Address</p>
                      <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed">
                        {order.deliveryAddress.addressLine}
                      </p>
                      <p className="text-slate-500 dark:text-zinc-400 text-sm">
                        {order.deliveryAddress.city}, {order.deliveryAddress.state}
                      </p>
                      <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 mt-1 uppercase tracking-wider">{order.deliveryAddress.label}</p>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-500">
                      <Receipt size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-zinc-200 text-sm">Payment Details</p>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-slate-500 dark:text-zinc-400">Subtotal</span>
                        <span className="font-medium text-slate-900 dark:text-zinc-200">{formatMoney(order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-0.5">
                        <span className="text-slate-500 dark:text-zinc-400">Delivery Fee</span>
                        <span className={`font-medium ${Number(order.deliveryFee || 0) === 0 ? "text-green-600 dark:text-green-400" : "text-slate-900 dark:text-zinc-200"}`}>
                          {Number(order.deliveryFee || 0) === 0 ? (promoWaivedDelivery ? "Free (promo)" : "Free") : formatMoney(order.deliveryFee)}
                        </span>
                      </div>
                      
                      {/* Promo Rejection Note */}
                      {Number(order.deliveryFee || 0) > 0 && order.freeDeliveryPromo?.reason && (
                        <div className="mt-1 p-2 bg-amber-50 dark:bg-amber-500/5 rounded-lg border border-amber-100 dark:border-amber-500/10">
                          <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                            <span className="font-bold uppercase mr-1">Note:</span>
                            {order.freeDeliveryPromo.reason === 'ip_threshold_exceeded' 
                              ? "Free delivery promo limit reached for this network/device." 
                              : order.freeDeliveryPromo.reason === 'not_first_order'
                              ? "This promo is only for your first order."
                              : "Delivery promo could not be applied."}
                          </p>
                        </div>
                      )}

                      {Number(order.freeDeliveryPromo?.originalDeliveryFee || order.vendorDeliveryPromo?.originalDeliveryFee || 0) > 0 && Number(order.deliveryFee || 0) === 0 && (
                        <div className="flex justify-between text-sm mt-0.5">
                          <span className="text-green-600 dark:text-green-400">Delivery Promo Saved</span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            -{formatMoney(order.freeDeliveryPromo?.originalDeliveryFee || order.vendorDeliveryPromo?.originalDeliveryFee)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm mt-0.5">
                        <span className="text-slate-500 dark:text-zinc-400">Service Fee</span>
                        <span className="font-medium text-slate-900 dark:text-zinc-200">{formatMoney(order.serviceFee)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                        <span className="font-bold text-slate-900 dark:text-zinc-200">Total Paid</span>
                        <span className="font-bold text-slate-900 dark:text-zinc-100">{formatMoney(order.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => router.push(`/track-orders/${order.orderId}`)}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Track Order <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 font-bold hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Home size={18} /> Continue Shopping
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-slate-400 dark:text-zinc-500">
              A confirmation email has been sent to your registered email address.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
}
