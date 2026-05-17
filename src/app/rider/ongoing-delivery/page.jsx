"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bike, MapPin, Package, CheckCircle2, AlertCircle,
    Phone, Loader2, Navigation, ArrowLeft
} from "lucide-react";
import { useRider } from "@/app/context/RiderContext";
import { getActiveRiderOrder, riderPickedUpOrder, requestDeliveryOTP, riderConfirmDelivery } from "@/app/lib/riderApi";
import toast from "react-hot-toast";
import socketService from "@/app/lib/socketService";

export default function OngoingDeliveryPage() {
    const router = useRouter();
    const { rider, refreshProfile } = useRider();
    const [activeOrder, setActiveOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPickingUp, setIsPickingUp] = useState(false);
    const [otpState, setOtpState] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("pending_delivery_otp");
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    return { ...parsed, confirming: false, sending: false };
                } catch (e) {
                    console.error("Failed to parse saved OTP state", e);
                }
            }
        }
        return { step: "idle", otp: "", sending: false, confirming: false, method: "", message: "" };
    });

    const riderId = rider?._id || rider?.id;

    // Persist OTP state
    useEffect(() => {
        if (otpState.step === "awaiting_otp") {
            localStorage.setItem("pending_delivery_otp", JSON.stringify(otpState));
        } else if (otpState.step === "idle") {
            localStorage.removeItem("pending_delivery_otp");
        }
    }, [otpState]);

    const fetchActiveOrder = async () => {
        if (!riderId) return;
        try {
            const data = await getActiveRiderOrder(riderId);
            const order = data?.data?.order || data?.order || (data?._id ? data : null);
            setActiveOrder(order);
            if (!order && !loading) {
                // If order is completed or gone, go back to dashboard
                router.replace("/rider/dashboard");
            }
        } catch (error) {
            if (error?.response?.status === 404) {
                router.replace("/rider/dashboard");
            } else {
                console.error("Failed to fetch active order:", error);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveOrder();
        const interval = setInterval(() => fetchActiveOrder(), 5000); // Quick sync for ongoing orders
        return () => clearInterval(interval);
    }, [riderId]);

    // Safety: Clear stale OTP state if active order is gone
    useEffect(() => {
        if (!loading && !activeOrder && otpState.step !== "idle") {
            setOtpState({ step: "idle", otp: "", sending: false, confirming: false, method: "", message: "" });
        }
    }, [loading, activeOrder, otpState.step]);

    useEffect(() => {
        if (activeOrder?._id) {
            socketService.subscribeToRiderOrder?.(activeOrder._id);
            socketService.onOrderStatusUpdate((data) => {
                if (data.orderId === activeOrder._id && data.deliveryOtp) {
                    setActiveOrder(prev => prev ? { ...prev, deliveryOtp: data.deliveryOtp } : prev);
                }
            });
        }
    }, [activeOrder?._id]);

    const handleAction = async (action) => {
        if (!activeOrder || !riderId) return;
        const orderId = activeOrder._id;
        try {
            if (action === "pickup") {
                setIsPickingUp(true);
                try {
                    await riderPickedUpOrder(riderId, orderId);
                    toast.success("Order picked up! Head to the customer.");
                    await fetchActiveOrder();
                } finally {
                    setIsPickingUp(false);
                }
            } else if (action === "deliver") {
                setOtpState(prev => ({ ...prev, sending: true }));
                try {
                    const res = await requestDeliveryOTP(riderId, orderId);
                    setOtpState({
                        step: "awaiting_otp",
                        otp: "",
                        sending: false,
                        confirming: false,
                        method: res.method || "",
                        message: res.message || "OTP sent to customer"
                    });
                    toast.success(res.message || "OTP requested!");
                } catch (err) {
                    setOtpState(prev => ({ ...prev, sending: false }));
                    throw err;
                }
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || `Failed to ${action} order`);
        }
    };

    const handleConfirmOTP = async () => {
        if (!otpState.otp.trim() || !activeOrder || !riderId) return;
        setOtpState(prev => ({ ...prev, confirming: true }));
        try {
            await riderConfirmDelivery(riderId, activeOrder._id, otpState.otp.trim());
            toast.success("Order delivered! Well done. 🎉");
            setOtpState({ step: "idle", otp: "", sending: false, confirming: false, method: "", message: "" });
            await refreshProfile();
            router.replace("/rider/dashboard");
        } catch (error) {
            setOtpState(prev => ({ ...prev, confirming: false }));
            toast.error(error?.response?.data?.message || "Incorrect OTP. Ask the customer to check again.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
                <Loader2 size={36} className="text-orange-600 animate-spin mb-4" />
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Loading Active Delivery...</p>
            </div>
        );
    }

    if (!activeOrder) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mb-6">
                    <Bike size={32} />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">No Active Order</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium max-w-[240px] mb-6">
                    You do not have any ongoing deliveries at the moment.
                </p>
                <button
                    onClick={() => router.replace("/rider/dashboard")}
                    className="h-10 px-6 bg-orange-600 text-white rounded-xl font-black text-xs transition-all active:scale-95 shadow-md shadow-orange-600/10 hover:bg-orange-700"
                >
                    RETURN TO DASHBOARD
                </button>
            </div>
        );
    }

    const orderLifecycleStatus = activeOrder.orderStatus || activeOrder.status;
    const isHeadingToStore = ["assigned", "rider_assigned"].includes(orderLifecycleStatus);
    const activeOrderTitle = isHeadingToStore ? "Head to Store" : "Out for Delivery";

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24 text-zinc-900 dark:text-zinc-100">
            {/* Header */}
            <div className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-zinc-900/80 border-b border-zinc-100 dark:border-zinc-800/50 px-4 py-4 flex items-center gap-3">
                <button
                    onClick={() => router.replace("/rider/dashboard")}
                    className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all active:scale-95"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-lg font-black tracking-tight uppercase">Ongoing Delivery</h1>
                    <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest">
                        Order #{String(activeOrder.orderId || activeOrder._id || "").toUpperCase().slice(-8)}
                    </p>
                </div>
            </div>

            <div className="max-w-md mx-auto mt-6">
                <div className="relative overflow-hidden bg-white dark:bg-[#1A1D23] rounded-[24px] border border-zinc-100 dark:border-zinc-800 shadow-sm p-5">
                    {/* Header Badge */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-orange-100 dark:bg-orange-500/20 rounded-full text-[9px] font-black uppercase tracking-widest text-orange-700 dark:text-orange-400">
                                <span className="w-1 h-1 bg-orange-500 rounded-full animate-ping" />
                                Active Delivery
                            </div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                                {activeOrderTitle}
                            </h2>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center">
                            <Bike size={24} className="animate-pulse" />
                        </div>
                    </div>

                    {/* Stepper Route */}
                    <div className="relative space-y-5 mb-6">
                        <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-zinc-200 dark:bg-zinc-800 border-dashed border-l" />

                        {/* Pickup address */}
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 z-10 border border-zinc-200 dark:border-zinc-700">
                                <Package size={16} className="text-orange-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-0.5">Pickup Point</div>
                                <h4 className="text-gray-900 dark:text-white font-black text-sm truncate">
                                    {activeOrder.restaurantName || "Partner Merchant"}
                                </h4>
                                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold truncate mt-0.5">
                                    {activeOrder.restaurantAddress || "Restaurant Location"}
                                </p>
                            </div>
                        </div>

                        {/* Customer Drop-off */}
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0 z-10">
                                <MapPin size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-0.5">Delivery Point</div>
                                <h4 className="text-gray-900 dark:text-white font-black text-sm truncate">
                                    {activeOrder.userName || "Customer"}
                                </h4>
                                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold line-clamp-2 mt-0.5">
                                    {activeOrder.deliveryFullAddress || "Customer Address"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    {activeOrder.items && activeOrder.items.length > 0 && (
                        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 mb-6 border border-zinc-100 dark:border-zinc-800">
                            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                <Package size={14} className="text-orange-600" />
                                Order Details
                            </h3>
                            <div className="space-y-3">
                                {activeOrder.items.map((item, idx) => {
                                    const itemName = item.name || item.variant?.name || item.foodName || "Item";
                                    const quantity = Number(item.quantity) || 1;
                                    const options = item.selected_options || [];
                                    const portionLabel = item.portion_label || item.portion || "";
                                    
                                    let portionText = portionLabel || (quantity > 1 ? "portions" : "portion");

                                    let fullSentence = `Deliver ${quantity} ${portionText} of ${itemName}`;
                                    if (options.length > 0) {
                                        const optionsTextList = options.map((opt) => `${Number(opt.quantity) > 0 ? (Number(opt.quantity) * quantity) + 'x ' : ''}${opt.label || opt.name}`);
                                        fullSentence += `, with ${optionsTextList.length === 1 ? optionsTextList[0] : optionsTextList.length === 2 ? optionsTextList.join(' and ') : optionsTextList.slice(0, -1).join(', ') + ', and ' + optionsTextList.slice(-1)}`;
                                    }
                                    fullSentence += ".";

                                    return (
                                        <div key={idx} className="flex gap-2.5">
                                            <div className="p-1 h-fit bg-zinc-200 dark:bg-zinc-800 rounded text-zinc-500 shrink-0">
                                                <Package size={10} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-snug">
                                                    {fullSentence}
                                                </p>
                                                {item.note && (
                                                    <p className="text-[10px] text-orange-600 dark:text-orange-400 mt-1 italic font-medium">
                                                        Note: {item.note}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Customer Call bar */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-3 mb-6 flex items-center justify-between border border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                                <Phone size={14} className="text-orange-600" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Customer Contact</p>
                                <p className="text-zinc-900 dark:text-white font-black text-xs leading-none">
                                    {activeOrder.userName || "Customer"}
                                </p>
                            </div>
                        </div>

                        <a
                            href={`tel:${activeOrder.userPhone || ""}`}
                            className="h-8 px-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1.5 font-black text-[10px] transition-all active:scale-95"
                        >
                            <Phone size={12} />
                            CALL
                        </a>
                    </div>

                    {/* Live delivery code status notice */}
                    {activeOrder.deliveryOtp && (
                        <div className="bg-zinc-900 dark:bg-zinc-800 rounded-2xl p-3 mb-6 flex items-center gap-3 shadow-md">
                            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center shrink-0">
                                <CheckCircle2 size={16} className="text-white" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest leading-none mb-1">Confirmation Ready</p>
                                <p className="text-white font-bold text-[11px]">
                                    Delivery code has been sent to the customer's portal.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Dynamic Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => {
                                let targetAddr = "";
                                if (isHeadingToStore) {
                                    targetAddr = activeOrder.restaurantAddress || "";
                                } else {
                                    targetAddr = activeOrder.deliveryFullAddress || "";
                                }

                                if (!targetAddr || targetAddr.trim() === "") {
                                    toast.error("Location address not found");
                                    return;
                                }

                                window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(targetAddr)}`);
                            }}
                            className="h-12 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-black text-xs flex items-center justify-center transition-all border border-zinc-200 dark:border-zinc-700 active:scale-95"
                        >
                            <Navigation size={16} className="mr-1.5 text-orange-600" />
                            OPEN MAPS
                        </button>

                        {isHeadingToStore ? (
                            <button
                                onClick={() => handleAction("pickup")}
                                disabled={isPickingUp}
                                className="h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center font-black text-xs transition-all active:scale-95 disabled:opacity-60"
                            >
                                {isPickingUp ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <>
                                        <Package size={16} className="mr-1.5" />
                                        PICKED UP
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={() => handleAction("deliver")}
                                disabled={otpState.sending}
                                className="h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center font-black text-xs transition-all active:scale-95 disabled:opacity-60"
                            >
                                {otpState.sending ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle2 size={16} className="mr-1.5" />
                                        DELIVERED
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Full Screen OTP Verification Modal */}
            <AnimatePresence>
                {otpState.step === "awaiting_otp" && (
                    <div className="fixed inset-0 z-50 flex bg-white dark:bg-[#1A1D23]">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            className="relative w-full min-h-screen bg-white dark:bg-[#1A1D23] p-6 overflow-y-auto flex items-center justify-center"
                        >
                            <div className="flex w-full max-w-sm flex-col items-center text-center space-y-6">
                                <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center">
                                    <AlertCircle size={32} className="text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Verify Delivery</h3>
                                    <p className="text-[11px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 mt-1">
                                        {otpState.message || "Ask the customer for the code sent to them"}
                                    </p>
                                </div>

                                <div className="w-full space-y-4">
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        autoFocus
                                        maxLength={6}
                                        value={otpState.otp}
                                        onChange={e => {
                                            if (e.target.value.length > 6) return;
                                            setOtpState(prev => ({ ...prev, otp: e.target.value }));
                                        }}
                                        placeholder="0 0 0 0 0 0"
                                        className="w-full h-16 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 px-4 text-3xl font-black text-center tracking-[0.5em] text-zinc-900 dark:text-white outline-none focus:border-orange-500 caret-orange-500"
                                    />
                                    <button
                                        onClick={handleConfirmOTP}
                                        disabled={otpState.otp.trim().length !== 6 || otpState.confirming}
                                        className="w-full h-14 rounded-2xl bg-orange-600 text-white font-black text-sm disabled:opacity-50 active:scale-95 transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
                                    >
                                        {otpState.confirming ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle2 size={18} /> CONFIRM DELIVERY</>}
                                    </button>
                                    <button
                                        onClick={() => setOtpState(prev => ({ ...prev, step: "idle" }))}
                                        className="text-xs font-black text-zinc-400 hover:text-zinc-500 uppercase tracking-widest py-2"
                                    >
                                        Cancel / Go Back
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
