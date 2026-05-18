"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    const router = useRouter();
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
                if (isOnline) {
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

    useEffect(() => {
        if (activeOrder && !loading) {
            router.push("/rider/ongoing-delivery");
        }
    }, [activeOrder, loading]);

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

            {/* Active Order Pulsing Alert Banner */}
            <AnimatePresence mode="wait">
                {activeOrder && (
                    <motion.div
                        key="active-banner"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={() => router.push("/rider/ongoing-delivery")}
                        className="relative overflow-hidden group cursor-pointer bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-2xl p-4 shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all border border-orange-400"
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 border border-white/20">
                                <Bike size={20} className="text-white animate-bounce" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white/20 rounded-full text-[8px] font-black uppercase tracking-wider mb-1">
                                    <span className="w-1 h-1 bg-white rounded-full animate-ping" />
                                    Active Job Underway
                                </span>
                                <h3 className="font-black text-sm tracking-tight leading-tight">
                                    {activeOrder.restaurantName || "Ongoing Delivery"} ➔ {activeOrder.userName || "Customer"}
                                </h3>
                                <p className="text-[10px] text-orange-100 font-bold uppercase mt-0.5">
                                    Order #{String(activeOrder.orderId || activeOrder._id || "").toUpperCase().slice(-8)} • Tap to view route details & complete status
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Available Deliveries or Idle State */}
            {(!activeOrder || (isOnline && pendingOffers.length > 0)) && (
                <motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 mt-6"
                >
                    {isOnline && pendingOffers.length > 0 ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                    <Package size={20} className="text-orange-600" />
                                    Available Deliveries ({pendingOffers.length})
                                </h3>
                                {pendingOffers.length > 5 && (
                                    <Link 
                                        href="/rider/deliveries" 
                                        className="text-xs font-black text-orange-600 dark:text-orange-500 hover:underline uppercase tracking-wider bg-orange-50 dark:bg-orange-500/10 px-3 py-1 rounded-full flex items-center gap-1 active:scale-95 transition-all"
                                    >
                                        SEE ALL
                                    </Link>
                                )}
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {pendingOffers.slice(0, 5).map((offer) => (
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
                                                <div className="space-y-1.5 mt-2">
                                                    <div className="p-2 rounded-xl bg-orange-50/50 dark:bg-white/5 border border-orange-100/50 dark:border-white/5 flex items-start gap-1.5">
                                                        <Package size={14} className="text-orange-600 shrink-0 mt-0.5" />
                                                        <p className="text-xs text-gray-700 dark:text-white/80 font-bold leading-snug break-words">
                                                            Pickup: {offer.restaurantAddress || offer.restaurantId?.fullAddress || "Restaurant Location"}
                                                        </p>
                                                    </div>
                                                    <div className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-start gap-1.5">
                                                        <MapPin size={14} className="text-orange-500 shrink-0 mt-0.5" />
                                                        <p className="text-xs text-gray-700 dark:text-white/80 font-bold leading-snug break-words">
                                                            Deliver: {offer.deliveryFullAddress || "Customer Address"}
                                                        </p>
                                                    </div>
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
                    ) : !activeOrder ? (
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
                    ) : null}
                </motion.div>
            )}

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
