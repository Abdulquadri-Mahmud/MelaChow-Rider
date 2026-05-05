"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bike, Navigation, MapPin, Package, CheckCircle2, AlertCircle,
    Wallet, Star, Phone, Loader2, Activity,
    ArrowUpRight, RefreshCcw
} from "lucide-react";
import { useRider } from "@/app/context/RiderContext";
import { getActiveRiderOrder, riderPickedUpOrder, requestDeliveryOTP, riderConfirmDelivery } from "@/app/lib/riderApi";
import toast from "react-hot-toast";
import socketService from "@/app/lib/socketService";
import { useSocket } from "@/app/context/SocketContext";
import { toggleRiderAvailability } from "@/app/lib/riderApi";

export default function RiderDashboard() {
    const { rider, isOnline, refreshProfile } = useRider();
    const { socket } = useSocket();
    const [activeOrder, setActiveOrder] = useState(null);
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

    const fetchActiveOrder = async () => {
        if (!riderId) return;
        try {
            const data = await getActiveRiderOrder(riderId);

            // console.log(data);

            const order = data?.data?.order || data?.order || (data?._id ? data : null);
            setActiveOrder(order);
            if (!order) {
                setLocalAssignmentStatus(null);
            }
        } catch (error) {
            if (error?.response?.status !== 404) {
                console.error("Failed to fetch active order:", error);
            }
            setActiveOrder(null);
        } finally {
            setLoading(false);
        }
    };

    // console.log(activeOrder);
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                fetchActiveOrder(),
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

        fetchActiveOrder();

        const handleNewAssignment = () => {
            setLocalAssignmentStatus(null);
            fetchActiveOrder();
            toast.success("New delivery assigned! 🛵", { duration: 8000 });
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
                Promise.allSettled([refreshProfile(), fetchActiveOrder()]);
            }

            if (action === "reject") {
                setLocalAssignmentStatus("rejected");
                setActiveOrder(null);
                Promise.allSettled([refreshProfile(), fetchActiveOrder()]);
            }
        };

        window.addEventListener("rider:new_assignment", handleNewAssignment);
        window.addEventListener("rider:assignment_action", handleAssignmentAction);
        return () => {
            window.removeEventListener("rider:new_assignment", handleNewAssignment);
            window.removeEventListener("rider:assignment_action", handleAssignmentAction);
        };
    }, [riderId, refreshProfile]);

    useEffect(() => {
        if (!socket) return;

        socket.on("order_assigned", (payload) => {
            console.log("🛵 Order assigned via dashboard listener:", payload);
            toast.success("New order assigned to you!");
            setLocalAssignmentStatus(null);
            fetchActiveOrder();
        });

        return () => {
            socket.off("order_assigned");
        };
    }, [socket]);

    useEffect(() => {
        if (activeOrder?._id) {
            socketService.subscribeToRiderOrder?.(activeOrder._id);
        }
    }, [activeOrder?._id]);

    const handleAction = async (action) => {
        if (!activeOrder || !riderId) return;
        const orderId = activeOrder._id;
        try {
            if (action === "pickup") {
                await riderPickedUpOrder(riderId, orderId);
                toast.success("Order picked up! Head to the customer.");
                fetchActiveOrder();
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
                if (!isPendingAssignment) {
                    toast("This delivery assignment is already in progress.");
                    await Promise.allSettled([refreshProfile(), fetchActiveOrder()]);
                    return;
                }
                setLocalAssignmentStatus("accepted");
                setActiveOrder(prev => prev ? ({
                    ...prev,
                    status: "rider_assigned",
                    orderStatus: "rider_assigned"
                }) : prev);
                await toggleRiderAvailability(riderId, "on_delivery");
                toast.success("Delivery Accepted! 🛵");
                await refreshProfile();
                fetchActiveOrder();
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
            fetchActiveOrder();
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

                {/* Quick Stats Skeleton */}
                <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(idx => (
                        <div key={idx} className="bg-gray-200 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl h-[120px]"></div>
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

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Link
                    href="/rider/wallet"
                    className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 rounded-xl md:p-5 p-3 cursor-pointer hover:border-orange-500/30 transition-all group block"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors">
                            <Wallet size={16} />
                        </div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Earnings</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white flex items-center justify-between">
                        ₦{Number(rider?.totalEarnings ?? 0).toLocaleString()}
                        <ArrowUpRight size={16} className="text-gray-600 group-hover:text-orange-500 transition-colors" />
                    </div>
                    <div className="text-[10px] text-gray-600 font-bold mt-1">lifetime total</div>
                </Link>

                <div className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 rounded-xl md:p-5 p-3">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 rounded-lg">
                            <Star size={16} />
                        </div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rating</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">
                        {rider?.rating ? Number(rider.rating).toFixed(1) : "New"}
                    </div>
                    <div className="text-[10px] text-gray-600 font-bold mt-1">
                        {rider?.ratingCount ? `${rider.ratingCount} reviews` : "No reviews yet"}
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 rounded-xl md:p-5 p-3">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-500 rounded-lg">
                            <Activity size={16} />
                        </div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Deliveries</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">
                        {rider?.totalDeliveries ?? 0}
                    </div>
                    <div className="text-[10px] text-gray-600 font-bold mt-1">lifetime</div>
                </div>

                <div className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 rounded-xl md:p-5 p-3">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${isOnline ? "bg-green-500/10 text-green-600 dark:text-green-500" : "bg-red-500/10 text-red-600 dark:text-red-500"}`}>
                            <Bike size={16} />
                        </div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</span>
                    </div>
                    <div className={`text-xl font-black ${isOnline ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                        {isOnline ? "Online" : "Offline"}
                    </div>
                    <div className="text-[10px] text-gray-600 font-bold mt-1">
                        {isOnline ? "Accepting orders" : "Not accepting orders"}
                    </div>
                </div>
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

                        <div className="relative z-10 md:p-6 p-3 md:p-8">
                            {/* Header Section */}
                            <div className="flex justify-between items-start mb-8">
                                <div className="space-y-1">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-white/20 backdrop-blur-md rounded-full border border-orange-200 dark:border-white/20 text-[10px] font-black uppercase tracking-widest text-orange-700 dark:text-white">
                                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping" />
                                        Live Job
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                                        {activeOrderTitle}
                                    </h2>
                                    <p className="text-gray-500 dark:text-white/70 text-xs font-bold uppercase tracking-tighter">
                                        Order #{String(activeOrder.orderId || activeOrder._id || "").toUpperCase().slice(-8)}
                                    </p>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-orange-600 dark:bg-white/10 backdrop-blur-md border border-orange-500 dark:border-white/10 flex items-center justify-center">
                                    <Bike size={32} className="text-white animate-pulse" />
                                </div>
                            </div>

                            {/* Route Visualization */}
                            <div className="relative space-y-8 mb-8">
                                {/* Vertical Path Line */}
                                <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-orange-200 dark:bg-white/20 border-dashed border-l" />

                                {/* Pickup */}
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 z-10 border border-orange-100 dark:border-white/20">
                                        <Package size={20} className="text-orange-600 dark:text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[10px] font-black text-orange-600/60 dark:text-white/50 uppercase tracking-widest mb-0.5">Pickup Point</div>
                                        <h4 className="text-gray-900 dark:text-white font-black text-base truncate">
                                            {activeOrder.restaurantName || activeOrder.restaurantId?.storeName || activeOrder.restaurantId?.name || "Restaurant"}
                                        </h4>
                                        <p className="text-gray-500 dark:text-white/70 text-xs font-medium truncate">
                                            {activeOrder.restaurantId?.fullAddress ||
                                                (activeOrder.restaurantId?.address ? `${activeOrder.restaurantId.address.street}, ${activeOrder.restaurantId.address.city}, ${activeOrder.restaurantId.address.state}` : "") ||
                                                activeOrder.restaurantName || "Restaurant Address"}
                                        </p>
                                    </div>
                                </div>

                                {/* Drop-off */}
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-orange-600 dark:bg-white flex items-center justify-center shrink-0 z-10">
                                        <MapPin size={20} className="text-white dark:text-orange-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[10px] font-black text-orange-600/60 dark:text-white/50 uppercase tracking-widest mb-0.5">Delivery Point</div>
                                        <h4 className="text-gray-900 dark:text-white font-black text-base truncate">
                                            {activeOrder.userName || (activeOrder.userId?.firstname ? `${activeOrder.userId.firstname} ${activeOrder.userId.lastname || ''}` : "Customer")}
                                        </h4>
                                        <p className="text-gray-500 dark:text-white/70 text-xs font-medium line-clamp-2">
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
                                <div className="bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-xl p-5 mb-8 border border-orange-100 dark:border-white/5">
                                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Package size={16} className="text-orange-600 dark:text-orange-400" />
                                        Order Summary
                                    </h3>
                                    <div className="space-y-4">
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
                                                <div key={idx} className="border-b border-gray-100 dark:border-white/5 last:border-0 pb-3 last:pb-0">
                                                    <div className="flex gap-3">
                                                        <div className="p-1.5 h-fit bg-slate-100 dark:bg-slate-800 rounded text-slate-500">
                                                            <Package size={12} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-snug">
                                                                {fullSentence}
                                                            </p>
                                                            {item.note && (
                                                                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 italic font-medium">
                                                                    Note: {item.note}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 flex justify-between items-center px-1">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Items</span>
                                        <span className="text-sm font-black text-gray-900 dark:text-white">
                                            {activeOrder.items.reduce((acc, item) => acc + (item.quantity || 1), 0)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* General Order Note */}
                            {activeOrder?.note && (
                                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-4 mb-8 border border-orange-100 dark:border-orange-500/20 flex gap-3 items-start">
                                    <AlertCircle size={18} className="text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 mb-1">Customer Note</h4>
                                        <p className="text-sm font-medium text-orange-900 dark:text-orange-100">{activeOrder.note}</p>
                                    </div>
                                </div>
                            )}

                            {/* Customer & Call Section */}
                            <div className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-8 flex items-center justify-between border border-orange-100 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
                                        <Star size={18} className="text-orange-600 dark:text-orange-300" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest leading-none mb-1">Customer</p>
                                        <p className="text-gray-900 dark:text-white font-bold text-sm leading-none">
                                            {activeOrder.userName || activeOrder.userId?.firstname || "Guest"}
                                        </p>
                                    </div>
                                </div>

                                <a
                                    href={`tel:${activeOrder.userPhone || activeOrder.userId?.phone || activeOrder.userOrderId?.phone || ''}`}
                                    className="h-10 px-4 rounded-xl bg-orange-600 dark:bg-white text-white dark:text-orange-700 flex items-center gap-2 font-black text-xs hover:bg-orange-700 dark:hover:bg-orange-50 transition-colors active:scale-95"
                                >
                                    <Phone size={14} />
                                    CALL
                                </a>
                            </div>

                            {/* Actions Zone */}
                            <div className="grid grid-cols-2 gap-4">
                                {isPendingAssignment ? (
                                    <>
                                        <button
                                            onClick={() => handleAction("reject")}
                                            className="h-16 rounded-2xl bg-gray-100 dark:bg-white/10 hover:bg-red-500/10 dark:hover:bg-red-500/20 text-gray-600 dark:text-white font-black text-sm transition-all border border-gray-200 dark:border-white/10"
                                        >
                                            REJECT
                                        </button>
                                        <button
                                            onClick={() => handleAction("accept")}
                                            className="h-16 rounded-2xl bg-orange-600 dark:bg-white text-white dark:text-orange-700 flex items-center justify-center font-black text-sm transition-all active:scale-95"
                                        >
                                            <CheckCircle2 size={20} className="mr-2" />
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
                                            className="h-16 rounded-2xl bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/20 text-gray-900 dark:text-white font-black text-sm flex items-center justify-center transition-all border border-gray-200 dark:border-white/10"
                                        >
                                            <Navigation size={20} className="mr-2 text-orange-600 dark:text-orange-300" />
                                            OPEN MAPS
                                        </button>
                                        {isHeadingToStore ? (
                                            <button
                                                onClick={() => handleAction("pickup")}
                                                className="h-16 rounded-2xl bg-orange-600 dark:bg-white text-white dark:text-orange-700 flex items-center justify-center font-black text-sm transition-all active:scale-95"
                                            >
                                                <Package size={20} className="mr-2" />
                                                PICKED UP
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleAction("deliver")}
                                                disabled={otpState.sending}
                                                className="h-16 rounded-2xl bg-orange-600 dark:bg-orange-400 text-white dark:text-orange-900 flex items-center justify-center font-black text-sm transition-all active:scale-95 disabled:opacity-60"
                                            >
                                                {otpState.sending
                                                    ? <Loader2 size={20} className="animate-spin" />
                                                    : <><CheckCircle2 size={20} className="mr-2" />DELIVERED</>}
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <p className="col-span-2 text-center text-gray-400 dark:text-white/60 text-xs font-bold py-4">Order status: {activeOrder.status}</p>
                                )}
                            </div>

                            {/* OTP Verification Modal */}
                            <AnimatePresence>
                                {otpState.step === "awaiting_otp" && (
                                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 bg-black/60 backdrop-blur-sm shadow-2xl"
                                        />
                                        <motion.div 
                                            initial={{ opacity: 0, y: 100, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 100, scale: 0.95 }}
                                            className="relative w-full max-w-sm bg-white dark:bg-[#1A1D23] rounded-xl p-6 shadow-2xl border border-gray-100 dark:border-white/10"
                                        >
                                            <div className="flex flex-col items-center text-center space-y-4">
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
                        className={`p-10 rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center text-center transition-all ${isOnline
                            ? "bg-orange-50 dark:bg-orange-600/5 border-orange-200 dark:border-orange-500/20"
                            : "bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20 opacity-60"
                            }`}
                    >
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
