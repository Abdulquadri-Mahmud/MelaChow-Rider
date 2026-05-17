"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bike, Navigation, MapPin, Package, CheckCircle2, AlertCircle,
    Wallet, Star, Phone, Loader2, Activity, RefreshCcw
} from "lucide-react";
import { useRider } from "@/app/context/RiderContext";
import { getActiveRiderOrder, getPendingOffers, riderPickedUpOrder, requestDeliveryOTP, riderConfirmDelivery, acceptOffer, toggleRiderAvailability } from "@/app/lib/riderApi";
import toast from "react-hot-toast";
import socketService from "@/app/lib/socketService";

export default function RiderDashboard() {
    const { rider, isOnline, refreshProfile } = useRider();
    const [activeOrder, setActiveOrder] = useState(null);
    const [pendingOffers, setPendingOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [localAssignmentStatus, setLocalAssignmentStatus] = useState(null);
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

    // Persist OTP state
    useEffect(() => {
        if (otpState.step === "awaiting_otp") {
            localStorage.setItem("pending_delivery_otp", JSON.stringify(otpState));
        } else if (otpState.step === "idle") {
            localStorage.removeItem("pending_delivery_otp");
        }
    }, [otpState]);

    // Safety: Clear stale OTP state if active order is gone
    useEffect(() => {
        if (!loading && !activeOrder && otpState.step !== "idle") {
            setOtpState({ step: "idle", otp: "", sending: false, confirming: false, method: "", message: "" });
        }
    }, [loading, activeOrder, otpState.step]);

    const riderId = rider?._id || rider?.id;
    const effectiveRiderStatus = localAssignmentStatus === "accepted"
        ? "on_delivery"
        : localAssignmentStatus === "rejected"
            ? "available"
            : rider?.status;
    const orderLifecycleStatus = activeOrder?.orderStatus || activeOrder?.status;
    const isPendingAssignment =
        effectiveRiderStatus === "pending_assignment" &&
        ["assigned", "pending_assignment", "rider_assigned"].includes(orderLifecycleStatus);
    const isOnDelivery = effectiveRiderStatus === "on_delivery";
    const isHeadingToStore = isOnDelivery && ["assigned", "rider_assigned"].includes(orderLifecycleStatus);
    const isDeliveringToCustomer = isOnDelivery && ["out_for_delivery", "picked_up"].includes(orderLifecycleStatus);
    const activeOrderTitle = isPendingAssignment
        ? "New Request"
        : isHeadingToStore
            ? "Head to Store"
            : "Out for Delivery";

    const { data: queryData, refetch: refetchDashboardQuery } = useQuery({
        queryKey: ["riderDashboardData", riderId, isOnline],
        queryFn: async () => {
            if (!riderId) return { activeOrder: null, pendingOffers: [] };
            
            try {
                const data = await getActiveRiderOrder(riderId);
                const order = data?.data?.order || data?.order || (data?._id ? data : null);
                
                let offers = [];
                if (!order && isOnline) {
                    const offersData = await getPendingOffers(riderId);
                    offers = offersData?.data?.offers || offersData?.offers || [];
                }
                return { activeOrder: order, pendingOffers: offers };
            } catch (error) {
                if (error?.response?.status !== 404) {
                    console.error("Failed to fetch dashboard data:", error);
                }
                return { activeOrder: null, pendingOffers: [] };
            }
        },
        enabled: !!riderId,
        refetchInterval: 10000, // Background refresh every 10 seconds!
        refetchOnWindowFocus: true, // Refresh on tab focus!
    });

    useEffect(() => {
        if (queryData) {
            setActiveOrder(queryData.activeOrder);
            setPendingOffers(queryData.pendingOffers);
            if (!queryData.activeOrder) {
                setLocalAssignmentStatus(null);
            }
            setLoading(false);
        }
    }, [queryData]);

    const fetchDashboardData = async () => {
        refetchDashboardQuery();
    };

    // console.log(activeOrder);
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                fetchDashboardData(),
                refreshProfile()
            ]);
            toast.success("Dashboard refreshed");
        } catch (error) {
            console.error("Refresh failed:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (!riderId) {
            setLoading(false);
            return;
        }

        fetchDashboardData();

        const handleNewAssignment = () => {
            setLocalAssignmentStatus(null);
            fetchDashboardData();
            toast.success("New delivery available! 🛵", { duration: 8000 });
        };

        const handleAssignmentAction = (event) => {
            const action = event.detail?.action;

            if (action === "accept") {
                setLocalAssignmentStatus("accepted");
                setActiveOrder(prev => prev ? ({
                    ...prev,
                    status: "rider_assigned",
                    orderStatus: "rider_assigned"
                }) : event.detail?.order || prev);
                Promise.allSettled([refreshProfile(), fetchDashboardData()]);
            }

            if (action === "reject" || action === "timeout") {
                setLocalAssignmentStatus("rejected");
                setActiveOrder(null);
                Promise.allSettled([refreshProfile(), fetchDashboardData()]);
            }
        };

        window.addEventListener("rider:new_assignment", handleNewAssignment);
        window.addEventListener("rider:assignment_action", handleAssignmentAction);
        return () => {
            window.removeEventListener("rider:new_assignment", handleNewAssignment);
            window.removeEventListener("rider:assignment_action", handleAssignmentAction);
        };
    }, [riderId, refreshProfile, isOnline]);

    useEffect(() => {
        if (activeOrder?._id) {
            socketService.subscribeToRiderOrder?.(activeOrder._id);
            
            // Listen for status updates (specifically for OTP generation)
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
                await riderPickedUpOrder(riderId, orderId);
                toast.success("Order picked up! Head to the customer.");
                fetchDashboardData();
            } else if (action === "deliver") {
                // Step 1: request OTP
                setOtpState(prev => ({ ...prev, sending: true }));
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
            } else if (action === "accept") {
                // For bulletin board, action accept comes from the offer card directly
            } else if (action === "reject") {
                if (!isPendingAssignment) {
                    toast("This delivery assignment has already been handled.");
                    await Promise.allSettled([refreshProfile(), fetchActiveOrder()]);
                    return;
                }
                await toggleRiderAvailability(riderId, "available");
                toast.success("Order rejected");
                setLocalAssignmentStatus("rejected");
                setActiveOrder(null);
                await refreshProfile();
            }
        } catch (error) {
            setOtpState(prev => ({ ...prev, sending: false }));
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
            fetchDashboardData();
            // Refresh profile to update earnings automatically
            await refreshProfile();
        } catch (error) {
            setOtpState(prev => ({ ...prev, confirming: false }));
            toast.error(error?.response?.data?.message || "Incorrect OTP. Ask the customer to check again.");
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                {/* Greeting Skeleton */}
                <div className="flex justify-between items-start">
                    <div>
                        <div className="h-9 w-48 bg-gray-200 dark:bg-white/10 rounded-xl"></div>
                        <div className="h-4 w-64 bg-gray-200 dark:bg-white/5 rounded-lg mt-3"></div>
                    </div>
                    <div className="w-10 h-10 bg-gray-200 dark:bg-white/10 rounded-xl"></div>
                </div>

                {/* Compact Stats Skeleton */}
                <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map(idx => (
                        <div key={idx} className="bg-gray-200 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl h-[76px]"></div>
                    ))}
                </div>

                {/* Active Order Skeleton */}
                <div className="w-full h-[400px] bg-gray-200 dark:bg-white/5 rounded-[20px]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Greeting */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                        Hey, {rider?.name?.split(" ")[0] || "Rider"} 👋
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">
                        {isOnline ? "You're online. Ready for deliveries!" : "Switch online to start earning."}
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={`p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-gray-600 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-all ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                >
                    <RefreshCcw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Compact Stats */}
            <div className="grid grid-cols-3 gap-2">
                <Link
                    href="/rider/wallet"
                    className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 rounded-xl p-3 cursor-pointer hover:border-orange-500/30 transition-all group block min-w-0"
                >
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <Wallet size={13} className="text-orange-500 shrink-0" />
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-wide truncate">Earnings</span>
                    </div>
                    <div className="text-sm sm:text-base font-black text-gray-900 dark:text-white truncate">
                        ₦{Number(rider?.totalEarnings ?? 0).toLocaleString()}
                    </div>
                    <div className="text-[8px] text-gray-500 font-bold uppercase mt-0.5">lifetime</div>
                </Link>

                <Link
                    href="/rider/stats"
                    className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 rounded-xl p-3 cursor-pointer hover:border-orange-500/30 transition-all group block min-w-0"
                >
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <Star size={13} className="text-yellow-600 dark:text-yellow-500 shrink-0" />
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-wide truncate">Rating</span>
                    </div>
                    <div className="text-sm sm:text-base font-black text-gray-900 dark:text-white truncate">
                        {rider?.rating ? Number(rider.rating).toFixed(1) : "New"}
                    </div>
                    <div className="text-[8px] text-gray-500 font-bold uppercase mt-0.5 truncate">
                        {rider?.ratingCount ? `${rider.ratingCount} reviews` : "No reviews"}
                    </div>
                </Link>

                <Link
                    href="/rider/stats"
                    className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 rounded-xl p-3 cursor-pointer hover:border-orange-500/30 transition-all group block min-w-0"
                >
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <Activity size={13} className="text-blue-600 dark:text-blue-500 shrink-0" />
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-wide truncate">Deliveries</span>
                    </div>
                    <div className="text-sm sm:text-base font-black text-gray-900 dark:text-white truncate">
                        {rider?.totalDeliveries ?? 0}
                    </div>
                    <div className={`text-[8px] font-bold uppercase mt-0.5 truncate ${isOnline ? "text-green-500" : "text-red-500"}`}>
                        {isOnline ? "Online" : "Offline"}
                    </div>
                </Link>
            </div>

            {/* Active Order */}
            <AnimatePresence mode="wait">
                {activeOrder ? (
                    <motion.div
                        key="active"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative overflow-hidden group"
                    >
                        {/* Premium Background with Glow */}
                        <div className="absolute inset-0 bg-orange-50/50 dark:bg-gradient-to-br dark:from-orange-800 dark:to-orange-950 rounded-[20px] border border-orange-100 dark:border-white/5 transition-all" />
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-orange-200/20 dark:bg-white/10 rounded-full blur-3xl opacity-50 transition-all" />
                        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-orange-100/20 dark:bg-orange-300/10 rounded-full blur-3xl opacity-30 transition-all" />

                        <div className="relative z-10 p-4 md:p-5">
                            {/* Header Section */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-0.5">
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-orange-100 dark:bg-white/20 backdrop-blur-md rounded-full border border-orange-200 dark:border-white/20 text-[9px] font-black uppercase tracking-widest text-orange-700 dark:text-white">
                                        <span className="w-1 h-1 bg-orange-500 rounded-full animate-ping" />
                                        Live Job
                                    </div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                                        {activeOrderTitle}
                                    </h2>
                                    <p className="text-gray-400 dark:text-white/50 text-[10px] font-bold uppercase tracking-tight">
                                        Order #{String(activeOrder.orderId || activeOrder._id || "").toUpperCase().slice(-8)}
                                    </p>
                                </div>
                                <div className="w-11 h-11 rounded-xl bg-orange-600 dark:bg-white/10 backdrop-blur-md border border-orange-500 dark:border-white/10 flex items-center justify-center">
                                    <Bike size={24} className="text-white animate-pulse" />
                                </div>
                            </div>

                            {/* Route Visualization */}
                            <div className="relative space-y-4 mb-4">
                                {/* Vertical Path Line */}
                                <div className="absolute left-[15px] top-5 bottom-5 w-0.5 bg-orange-200 dark:bg-white/20 border-dashed border-l" />

                                {/* Pickup */}
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 z-10 border border-orange-100 dark:border-white/20">
                                        <Package size={16} className="text-orange-600 dark:text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[9px] font-black text-orange-600/60 dark:text-white/50 uppercase tracking-widest mb-0.5">Pickup Point</div>
                                        <h4 className="text-gray-900 dark:text-white font-black text-sm truncate">
                                            {activeOrder.restaurantName || activeOrder.restaurantId?.storeName || activeOrder.restaurantId?.name || "Restaurant"}
                                        </h4>
                                        <p className="text-gray-500 dark:text-white/70 text-[11px] font-medium truncate">
                                            {activeOrder.restaurantId?.fullAddress ||
                                                (activeOrder.restaurantId?.address ? `${activeOrder.restaurantId.address.street}, ${activeOrder.restaurantId.address.city}, ${activeOrder.restaurantId.address.state}` : "") ||
                                                activeOrder.restaurantName || "Restaurant Address"}
                                        </p>
                                    </div>
                                </div>

                                {/* Drop-off */}
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-orange-600 dark:bg-white flex items-center justify-center shrink-0 z-10">
                                        <MapPin size={16} className="text-white dark:text-orange-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[9px] font-black text-orange-600/60 dark:text-white/50 uppercase tracking-widest mb-0.5">Delivery Point</div>
                                        <h4 className="text-gray-900 dark:text-white font-black text-sm truncate">
                                            {activeOrder.userName || (activeOrder.userId?.firstname ? `${activeOrder.userId.firstname} ${activeOrder.userId.lastname || ''}` : "Customer")}
                                        </h4>
                                        <p className="text-gray-500 dark:text-white/70 text-[11px] font-medium line-clamp-2">
                                            {activeOrder.deliveryFullAddress ||
                                                (activeOrder.deliveryAddress?.addressLine
                                                    ? `${activeOrder.deliveryAddress.addressLine}, ${activeOrder.deliveryAddress.city || ''}, ${activeOrder.deliveryAddress.state || ''}`.replace(/,,/g, ',').trim()
                                                    : activeOrder.deliveryAddress?.address ||
                                                    activeOrder.userOrderId?.deliveryAddress?.addressLine ||
                                                    "Customer Address")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Summary */}
                            {activeOrder?.items && activeOrder.items.length > 0 && (
                                <div className="bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-xl p-3.5 mb-4 border border-orange-100 dark:border-white/5">
                                    <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                        <Package size={14} className="text-orange-600 dark:text-orange-400" />
                                        Order Summary
                                    </h3>
                                    <div className="space-y-2.5">
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
                                                <div key={idx} className="border-b border-gray-100 dark:border-white/5 last:border-0 pb-2 last:pb-0">
                                                    <div className="flex gap-2">
                                                        <div className="p-1 h-fit bg-slate-100 dark:bg-slate-800 rounded text-slate-500">
                                                            <Package size={10} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-snug">
                                                                {fullSentence}
                                                            </p>
                                                            {item.note && (
                                                                <p className="text-[10px] text-orange-600 dark:text-orange-400 mt-0.5 italic font-medium">
                                                                    Note: {item.note}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-white/10 flex justify-between items-center px-1">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Items</span>
                                        <span className="text-xs font-black text-gray-900 dark:text-white">
                                            {activeOrder.items.reduce((acc, item) => acc + (item.quantity || 1), 0)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* General Order Note */}
                            {activeOrder?.note && (
                                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 mb-4 border border-orange-100 dark:border-orange-500/20 flex gap-2.5 items-start">
                                    <AlertCircle size={16} className="text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-[9px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 mb-0.5">Customer Note</h4>
                                        <p className="text-xs font-medium text-orange-900 dark:text-orange-100">{activeOrder.note}</p>
                                    </div>
                                </div>
                            )}

                            {/* Customer & Call Section */}
                            <div className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-xl p-3 mb-4 flex items-center justify-between border border-orange-100 dark:border-white/5">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
                                        <Star size={14} className="text-orange-600 dark:text-orange-300" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest leading-none mb-1">Customer</p>
                                        <p className="text-gray-900 dark:text-white font-bold text-xs leading-none">
                                            {activeOrder.userName || activeOrder.userId?.firstname || "Guest"}
                                        </p>
                                    </div>
                                </div>

                                <a
                                    href={`tel:${activeOrder.userPhone || activeOrder.userId?.phone || activeOrder.userOrderId?.phone || ''}`}
                                    className="h-8 px-3 rounded-lg bg-orange-600 dark:bg-white text-white dark:text-orange-700 flex items-center gap-1.5 font-black text-[10px] hover:bg-orange-700 dark:hover:bg-orange-50 transition-colors active:scale-95"
                                >
                                    <Phone size={12} />
                                    CALL
                                </a>
                            </div>

                            {/* 🔐 NEW: Code Sent Notice */}
                            {activeOrder?.deliveryOtp && (
                                <div className="bg-zinc-900 dark:bg-white rounded-xl p-3 mb-4 flex items-center gap-3 border border-zinc-800 dark:border-zinc-200 shadow-xl shadow-black/10">
                                    <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center shrink-0">
                                        <CheckCircle2 size={16} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest leading-none mb-1">Confirmation Ready</p>
                                        <p className="text-white dark:text-zinc-900 font-bold text-[11px]">
                                            Delivery code has been sent to the customer's portal.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Actions Zone */}
                            <div className="grid grid-cols-2 gap-3">
                                {isPendingAssignment ? (
                                    <>
                                        <button
                                            onClick={() => handleAction("reject")}
                                            className="h-11 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-red-500/10 dark:hover:bg-red-500/20 text-gray-600 dark:text-white font-black text-xs transition-all border border-gray-200 dark:border-white/10"
                                        >
                                            REJECT
                                        </button>
                                        <button
                                            onClick={() => handleAction("accept")}
                                            className="h-11 rounded-xl bg-orange-600 dark:bg-white text-white dark:text-orange-700 flex items-center justify-center font-black text-xs transition-all active:scale-95"
                                        >
                                            <CheckCircle2 size={16} className="mr-1.5" />
                                            ACCEPT
                                        </button>
                                    </>
                                ) : isOnDelivery || isDeliveringToCustomer ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                let targetAddr = "";

                                                if (isHeadingToStore) {
                                                    // Resolve restaurant address
                                                    const restAddr = activeOrder.restaurantId?.address;
                                                    targetAddr = activeOrder.restaurantId?.fullAddress ||
                                                        (restAddr ? `${restAddr.street || ''}, ${restAddr.city || ''}, ${restAddr.state || ''}`.replace(/^[ ,]+|[ ,]+$/g, '').replace(/, ,/g, ',') : '') ||
                                                        activeOrder.restaurantName || "";
                                                } else {
                                                    // Resolve customer address
                                                    targetAddr = activeOrder.deliveryFullAddress ||
                                                        (activeOrder.deliveryAddress?.addressLine
                                                            ? `${activeOrder.deliveryAddress.addressLine}, ${activeOrder.deliveryAddress.city || ''}, ${activeOrder.deliveryAddress.state || ''}`.replace(/,,/g, ',').trim()
                                                            : activeOrder.deliveryAddress?.address || activeOrder.userOrderId?.deliveryAddress?.addressLine || "");
                                                }

                                                if (!targetAddr || targetAddr.trim() === "") {
                                                    toast.error("Location address not found");
                                                    return;
                                                }

                                                window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(targetAddr)}`);
                                            }}
                                            className="h-11 rounded-xl bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/20 text-gray-900 dark:text-white font-black text-xs flex items-center justify-center transition-all border border-gray-200 dark:border-white/10"
                                        >
                                            <Navigation size={16} className="mr-1.5 text-orange-600 dark:text-orange-300" />
                                            OPEN MAPS
                                        </button>
                                        {isHeadingToStore ? (
                                            <button
                                                onClick={() => handleAction("pickup")}
                                                className="h-11 rounded-xl bg-orange-600 dark:bg-white text-white dark:text-orange-700 flex items-center justify-center font-black text-xs transition-all active:scale-95"
                                            >
                                                <Package size={16} className="mr-1.5" />
                                                PICKED UP
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleAction("deliver")}
                                                disabled={otpState.sending}
                                                className="h-11 rounded-xl bg-orange-600 dark:bg-orange-400 text-white dark:text-orange-900 flex items-center justify-center font-black text-xs transition-all active:scale-95 disabled:opacity-60"
                                            >
                                                {otpState.sending
                                                    ? <Loader2 size={16} className="animate-spin" />
                                                    : <><CheckCircle2 size={16} className="mr-1.5" />DELIVERED</>}
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <p className="col-span-2 text-center text-gray-400 dark:text-white/60 text-[10px] font-bold py-2">Order status: {activeOrder.status}</p>
                                )}
                            </div>

                            {/* OTP Verification Modal */}
                            <AnimatePresence>
                                {otpState.step === "awaiting_otp" && (
                                    <div className="fixed inset-0 z-50 flex bg-white dark:bg-[#1A1D23]">
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 bg-black/60 backdrop-blur-sm shadow-2xl"
                                        />
                                        <motion.div 
                                            initial={{ opacity: 0, y: 100 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 100 }}
                                            className="relative w-full min-h-screen bg-white dark:bg-[#1A1D23] p-6 overflow-y-auto flex items-center justify-center"
                                        >
                                            <div className="flex w-full max-w-sm flex-col items-center text-center space-y-4">
                                                <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center">
                                                    <AlertCircle size={32} className="text-orange-600 dark:text-orange-500" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Verify Delivery</h3>
                                                    <p className="text-[11px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-300 mt-1">
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
                                                    <div className="py-2 text-[10px] text-zinc-400 font-black uppercase tracking-widest">
                                                        Code verification required
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                    >
                        {isOnline && pendingOffers.length > 0 ? (
                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                    <Package size={20} className="text-orange-600" />
                                    Available Deliveries ({pendingOffers.length})
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {pendingOffers.map((offer) => (
                                        <div key={offer._id} className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-4 shadow-sm hover:border-orange-500/30 transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="min-w-0 flex-1 pr-3">
                                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-500/20 rounded-full mb-2">
                                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                        <span className="text-[9px] font-black text-green-700 dark:text-green-400 uppercase tracking-widest">New Offer</span>
                                                    </div>
                                                    <h4 className="text-sm font-black text-gray-900 dark:text-white truncate">
                                                        {offer.restaurantName}
                                                    </h4>
                                                    <div className="mt-2 p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-start gap-1.5">
                                                        <MapPin size={14} className="text-orange-500 shrink-0 mt-0.5" />
                                                        <p className="text-xs text-gray-700 dark:text-white/80 font-black leading-snug break-words">
                                                            To: {offer.deliveryFullAddress || "Customer Address"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-base font-black text-gray-900 dark:text-white">
                                                        ₦{Number(offer.deliveryFee || 600).toLocaleString()}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Payout</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-4 mt-3">
                                                <button
                                                    onClick={async () => {
                                                        const id = toast.loading("Accepting...");
                                                        try {
                                                            await acceptOffer(riderId, offer._id);
                                                            toast.success("Delivery Accepted! 🛵", { id });
                                                            await Promise.allSettled([fetchDashboardData(), refreshProfile()]);
                                                        } catch (e) {
                                                            toast.error(e?.response?.data?.message || "Failed to accept offer", { id });
                                                        }
                                                    }}
                                                    className="flex-1 h-9 bg-orange-600 text-white rounded-xl font-black text-xs flex items-center justify-center transition-all active:scale-95"
                                                >
                                                    ACCEPT JOB
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className={`p-10 rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center text-center transition-all ${isOnline
                                ? "bg-orange-50 dark:bg-orange-600/5 border-orange-200 dark:border-orange-500/20"
                                : "bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20 opacity-60"
                                }`}>
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isOnline ? "bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500" : "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500"
                                    }`}>
                                    <Bike size={40} className={isOnline ? "animate-bounce" : ""} />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                                    {isOnline ? "Waiting for Orders..." : "You are Offline"}
                                </h3>
                                <p className="text-gray-500 text-sm font-medium max-w-[220px]">
                                    {isOnline
                                        ? "Stay active in the area for faster assignments."
                                        : "Hit the power button in the header to start receiving jobs."}
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Offline reminder */}
            {!isOnline && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-5 flex items-start gap-4">
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                    <div className="text-sm text-red-500 leading-relaxed">
                        <span className="font-bold text-red-400">Notice:</span> You won't
                        receive any delivery requests while offline. Switch online whenever
                        you're ready to earn.
                    </div>
                </div>
            )}

        </div>
    );
}
