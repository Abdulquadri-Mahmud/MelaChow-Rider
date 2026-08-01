"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bike, Navigation, MapPin, Package, CheckCircle2, AlertCircle,
    Wallet, Star, Phone, Loader2, Activity, RefreshCcw, AlertTriangle, Bell
} from "lucide-react";
import { useRider } from "@/app/context/RiderContext";
import { getActiveRiderOrder, getPendingOffers, riderPickedUpOrder, requestDeliveryOTP, riderConfirmDelivery, acceptOffer, toggleRiderAvailability } from "@/app/lib/riderApi";
import toast from "react-hot-toast";
import socketService from "@/app/lib/socketService";
import { useSocket } from "@/app/context/SocketContext";

import { getRiderAlertSettings, playRiderAlert, saveRiderAlertSettings } from "@/app/lib/riderAlertSettings";

export default function RiderDashboard() {
    const router = useRouter();
    const { rider, isOnline, refreshProfile } = useRider();
    const { isConnected: wsConnected } = useSocket();
    const [activeOrder, setActiveOrder] = useState(null);
    const [pendingOffers, setPendingOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [localAssignmentStatus, setLocalAssignmentStatus] = useState(null);
    const [alertSettings, setAlertSettings] = useState(() => getRiderAlertSettings());
    const offerAlarmRef = useRef(null);
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

    useEffect(() => {
        const syncAlertSettings = (event) => setAlertSettings(event.detail || getRiderAlertSettings());
        window.addEventListener("rider:alert-settings", syncAlertSettings);
        return () => window.removeEventListener("rider:alert-settings", syncAlertSettings);
    }, []);

    useEffect(() => {
        const hasPendingOffer = alertSettings.alarmEnabled && isOnline && pendingOffers.length > 0 && !activeOrder;
        if (!hasPendingOffer) {
            if (offerAlarmRef.current) window.clearInterval(offerAlarmRef.current);
            offerAlarmRef.current = null;
            return;
        }

        const ring = () => playRiderAlert({ vibrationEnabled: alertSettings.vibrationEnabled });
        ring();
        offerAlarmRef.current = window.setInterval(ring, alertSettings.intervalSeconds * 1000);
        return () => {
            if (offerAlarmRef.current) window.clearInterval(offerAlarmRef.current);
            offerAlarmRef.current = null;
        };
    }, [activeOrder, alertSettings, isOnline, pendingOffers]);
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
        // Socket events are the primary delivery channel. Only reconcile while
        // the rider is online and realtime is unavailable.
        refetchInterval: isOnline && !wsConnected ? 120000 : false,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: isOnline,
        refetchOnReconnect: true,
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
        const riderHasActiveAssignment = Boolean(
            rider?.currentOrderId ||
            rider?.status === "pending_assignment" ||
            rider?.status === "on_delivery" ||
            localAssignmentStatus === "accepted"
        );

        if (activeOrder && riderHasActiveAssignment && !loading) {
            router.replace("/rider/ongoing-delivery");
        }
    }, [activeOrder, loading, localAssignmentStatus, rider?.currentOrderId, rider?.status, router]);

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
                        <div className="h-9 w-48 bg-gray-200 dark:bg-white/10 rounded-[8px]"></div>
                        <div className="h-4 w-64 bg-gray-200 dark:bg-white/5 rounded-[8px] mt-3"></div>
                    </div>
                    <div className="w-10 h-10 bg-gray-200 dark:bg-white/10 rounded-[8px]"></div>
                </div>

                {/* Compact Stats Skeleton */}
                <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map(idx => (
                        <div key={idx} className="bg-gray-200 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-[8px] h-[76px]"></div>
                    ))}
                </div>

                {/* Active Order Skeleton */}
                <div className="w-full h-[400px] bg-gray-200 dark:bg-white/5 rounded-[20px]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 composite-stable">

            {/* ── Suspension Banner (prompt §7) ── */}
            {rider?.isSuspended && new Date(rider?.suspendedUntil) > new Date() && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 rounded p-3">
                    <p className="font-black text-sm text-red-800 dark:text-red-400 uppercase tracking-tight">Account Suspended</p>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1 font-bold">
                        Your account is suspended until{" "}
                        {new Date(rider.suspendedUntil).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}.
                    </p>
                    <p className="text-[10px] text-red-500 mt-1 font-bold">
                        Reason: order terminated after food was already collected. Contact support if you believe this is an error.
                    </p>
                </div>
            )}

            {/* ── Strike Warning (prompt §7) — shown when ≥1 strike but not yet suspended ── */}
            {(rider?.terminationStrikes ?? 0) >= 1 && !rider?.isSuspended && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-400 dark:border-amber-500/40 rounded p-2">
                    <p className="text-sm font-black text-amber-800 dark:text-amber-300">
                        ⚠️ Strike Warning: {rider.terminationStrikes} of 2
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1 font-bold">
                        A second termination after food pickup will suspend your account for the platform-configured penalty period.
                    </p>
                </div>
            )}


            {/* Compact Stats */}
            <div className="relative">
                <div className="grid grid-cols-3 gap-2">
                <Link
                    href="/rider/wallet"
                    className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 rounded-[8px] p-3 cursor-pointer hover:border-orange-500/30 transition-all group block min-w-0"
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
                    className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 rounded-[8px] p-3 cursor-pointer hover:border-orange-500/30 transition-all group block min-w-0"
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
                    className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 rounded-[8px] p-3 cursor-pointer hover:border-orange-500/30 transition-all group block min-w-0"
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
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    aria-label="Refresh dashboard"
                    className={`absolute -right-2 -top-3 w-10 h-10 rounded-full bg-orange-600 text-white shadow-lg shadow-orange-600/30 border-4 border-[#F9FAFB] dark:border-[#121419] flex items-center justify-center transition-all ${isRefreshing ? "opacity-60 cursor-not-allowed" : "hover:bg-orange-700 active:scale-95"}`}
                >
                    <RefreshCcw size={17} className={isRefreshing ? "animate-spin" : ""} />
                </button>
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
                        className="relative min-h-[calc(100dvh-255px)] sm:min-h-[520px] overflow-hidden group cursor-pointer rounded-[30px] border border-cyan-300/20 bg-[#071523] p-5 text-white shadow-2xl shadow-cyan-950/30 active:scale-[0.99] transition-all" style={{ backgroundImage: "radial-gradient(circle at 18% 26%, rgba(45, 105, 87, .85) 0 12%, transparent 13%), radial-gradient(circle at 77% 68%, rgba(75, 83, 55, .72) 0 13%, transparent 14%), linear-gradient(125deg, #081a28 0%, #12313a 45%, #0a1a23 100%)" }}
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-[8px] bg-white/20 flex items-center justify-center shrink-0 border border-white/20">
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
                        <div className="absolute inset-0 pointer-events-none opacity-35" style={{ backgroundImage: "linear-gradient(28deg, transparent 42%, rgba(205,148,69,.55) 43% 48%, transparent 49%), linear-gradient(121deg, transparent 46%, rgba(35,208,238,.38) 47% 48%, transparent 49%), linear-gradient(rgba(104,179,213,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(104,179,213,.14) 1px, transparent 1px)", backgroundSize: "auto, auto, 38px 38px, 38px 38px" }} />
                        <div className="absolute z-10 bottom-5 left-5 right-5 space-y-2">
                            <div className="rounded-2xl border border-white/15 bg-slate-950/80 p-3 backdrop-blur-md"><p className="text-[9px] font-black uppercase tracking-widest text-orange-200">Pickup · restaurant</p><p className="mt-1 text-xs font-bold text-white">{activeOrder.restaurantAddress || activeOrder.restaurantName || "Restaurant location"}</p></div>
                            <div className="rounded-2xl border border-white/15 bg-slate-950/80 p-3 backdrop-blur-md"><p className="text-[9px] font-black uppercase tracking-widest text-cyan-200">Drop-off · customer</p><p className="mt-1 text-xs font-bold text-white">{activeOrder.deliveryFullAddress || activeOrder.deliveryAddress || activeOrder.userName || "Customer location"}</p></div>
                            <div className="rounded-xl bg-orange-600 py-3 text-center text-xs font-black uppercase tracking-widest text-white">{isPendingAssignment ? "View & accept order" : "Open delivery"}</div>
                        </div>                    </motion.div>
                )}
            </AnimatePresence>

            {/* Available Deliveries or Idle State */}
            {(!activeOrder || (isOnline && pendingOffers.length > 0)) && (
                <motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-5 mt-5"
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
                            <div className={`relative min-h-[calc(100dvh-255px)] overflow-hidden rounded-[30px] border border-cyan-300/20 bg-[#071523] p-3 shadow-2xl shadow-cyan-950/30 ${pendingOffers.length > 1 ? "pb-5" : ""}`} style={{ backgroundImage: "radial-gradient(circle at 17% 22%, rgba(50, 111, 83, .78) 0 13%, transparent 14%), radial-gradient(circle at 88% 71%, rgba(94, 92, 48, .75) 0 14%, transparent 15%), linear-gradient(122deg, #071723, #143a3a 48%, #081820)" }}>
                                <div className="pointer-events-none absolute inset-0 opacity-35" style={{ backgroundImage: "linear-gradient(27deg, transparent 42%, rgba(211,151,61,.55) 43% 48%, transparent 49%), linear-gradient(121deg, transparent 43%, rgba(40, 209, 238, .45) 44% 45%, transparent 46%), linear-gradient(rgba(121,181,177,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(121,181,177,.14) 1px, transparent 1px)", backgroundSize: "auto, auto, 38px 38px, 38px 38px" }} />
                                <div className="relative z-10 space-y-3">
                                {pendingOffers.slice(0, 5).map((offer) => (
                                    <div key={offer._id} className="composite-stable rounded-2xl border border-white/15 bg-slate-950/80 p-4 shadow-xl backdrop-blur-md transition-all hover:border-orange-400/60">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="min-w-0 flex-1 pr-3">
                                                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-500/20 rounded-full mb-2">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                    <span className="text-[9px] font-black text-green-700 dark:text-green-400 uppercase tracking-widest">New Offer</span>
                                                </div>
                                                <h4 className="text-sm font-black text-white truncate">
                                                    {offer.restaurantName}
                                                </h4>
                                                <div className="space-y-1.5 mt-2">
                                                    <div className="p-2 rounded-[8px] bg-orange-50/50 dark:bg-white/5 border border-orange-100/50 dark:border-white/5 flex items-start gap-1.5">
                                                        <Package size={14} className="text-orange-600 shrink-0 mt-0.5" />
                                                        <p className="text-xs text-white/85 font-bold leading-snug break-words">
                                                            Pickup: {offer.restaurantAddress || offer.restaurantId?.fullAddress || "Restaurant Location"}
                                                        </p>
                                                    </div>
                                                    <div className="p-2 rounded-[8px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-start gap-1.5">
                                                        <MapPin size={14} className="text-orange-500 shrink-0 mt-0.5" />
                                                        <p className="text-xs text-white/85 font-bold leading-snug break-words">
                                                            Deliver: {offer.deliveryFullAddress || "Customer Address"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-base font-black text-white">
                                                    {offer.deliveryFee != null ? `₦${Number(offer.deliveryFee).toLocaleString()}` : "₦—"}
                                                </div>
                                                <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Payout</div>
                                            </div>
                                        </div>

                                        {/* ── Previous Rider Warning Banner (prompt §3) ── */}
                                        {offer.hasPreviousRider && offer.previousRider && (
                                            <div className="mt-3 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-500/10 p-2 rounded-r">
                                                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                                                    ⚠️ Previously assigned to {offer.previousRider.name}
                                                </p>
                                                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                                    📞{" "}
                                                    <a
                                                        href={`tel:${offer.previousRider.phone}`}
                                                        className="underline font-medium ml-1"
                                                    >
                                                        {offer.previousRider.phone}
                                                    </a>
                                                </p>
                                                {offer.previousRider.foodPickedUp ? (
                                                    <p className="text-sm text-red-700 dark:text-red-400 font-semibold mt-2">
                                                        🍔 Food already collected — call the previous rider to receive the food before heading to the customer.
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-green-700 dark:text-green-400 mt-2">
                                                        ✅ Food is still at the restaurant — pick up as normal.
                                                    </p>
                                                )}
                                            </div>
                                        )}

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
                                                className="flex-1 h-9 bg-orange-600 text-white rounded-[8px] font-black text-xs flex items-center justify-center transition-all active:scale-95"
                                            >
                                                ACCEPT JOB
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        </div>
                    ) : !activeOrder ? (
                        <div className={`relative min-h-[calc(100dvh-255px)] sm:min-h-[520px] overflow-hidden rounded-[30px] border shadow-2xl ${isOnline
                            ? "bg-[#071523] border-cyan-400/20 shadow-cyan-950/30"
                            : "bg-[#17141a] border-white/10 shadow-black/30"
                            }`}>
                            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(28deg, transparent 42%, rgba(205, 148, 69, .55) 43% 48%, transparent 49%), linear-gradient(121deg, transparent 46%, rgba(35, 208, 238, .38) 47% 48%, transparent 49%), linear-gradient(rgba(104, 179, 213, .16) 1px, transparent 1px), linear-gradient(90deg, rgba(104, 179, 213, .16) 1px, transparent 1px)", backgroundSize: "38px 38px" }} />
                            <div className="absolute -left-14 top-16 h-48 w-[135%] rotate-[19deg] rounded-full border-[18px] border-cyan-300/10" />
                            <div className="absolute -right-24 -top-20 h-72 w-72 rounded-full border-[22px] border-orange-400/10" />
                            <div className="absolute left-[14%] top-[28%] h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_18px_7px_rgba(103,232,249,.18)]" />
                            <div className="absolute right-[19%] bottom-[26%] h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_16px_6px_rgba(251,146,60,.2)]" />
                            <svg className="absolute inset-0 h-full w-full opacity-80" viewBox="0 0 600 315" preserveAspectRatio="none" aria-hidden="true">
                                <path d="M-30 238 C90 145, 128 292, 237 204 S384 59, 493 151 S611 116, 648 31" fill="none" stroke="rgba(34,211,238,.62)" strokeWidth="3" strokeDasharray="8 10" />
                                <path d="M-20 82 C89 147, 139 58, 229 100 S365 233, 466 185 S554 138, 638 209" fill="none" stroke="rgba(251,146,60,.40)" strokeWidth="2" strokeDasharray="5 12" />
                            </svg>
                            <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/65 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100 backdrop-blur-md">
                                <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                                Live dispatch map
                            </div>
                            <button onClick={() => setAlertSettings(saveRiderAlertSettings({ ...alertSettings, alarmEnabled: !alertSettings.alarmEnabled }))} className={`absolute right-5 top-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wide backdrop-blur-md transition-all ${alertSettings.alarmEnabled ? "border-orange-300/30 bg-orange-500/20 text-orange-100" : "border-white/10 bg-slate-950/60 text-slate-300"}`}>
                                <Bell size={13} /> Alert {alertSettings.alarmEnabled ? "on" : "off"}
                            </button>
                            <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                                <div className={`relative mb-5 flex h-24 w-24 items-center justify-center rounded-full border ${isOnline ? "border-cyan-200/40 bg-cyan-300/10 text-cyan-100" : "border-slate-500/30 bg-slate-500/10 text-slate-300"}`}>
                                    {isOnline && <><span className="absolute inset-[-13px] rounded-full border border-cyan-300/25 animate-ping" /><span className="absolute inset-[-28px] rounded-full border border-cyan-300/10 animate-pulse" /></>}
                                    <Bike size={38} strokeWidth={1.7} />
                                </div>
                                <h3 className="text-xl font-black tracking-tight text-white">{isOnline ? "Waiting for incoming orders" : "Dispatch is paused"}</h3>
                                <p className="mt-2 max-w-[290px] text-sm font-medium leading-relaxed text-slate-300">
                                    {isOnline ? "Your delivery zone is being monitored. New requests will appear here immediately." : "Go online when you are ready to receive delivery requests."}
                                </p>
                            </div>
                            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-left backdrop-blur-md">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-200"><MapPin size={15} className="text-orange-400" /> Your active delivery zone</div>
                                <Navigation size={16} className="text-cyan-300" />
                            </div>
                        </div>
                    ) : null}
                </motion.div>
            )}

            {/* Offline reminder */}
            {!isOnline && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-5 flex items-start gap-4">
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                    <div className="text-sm text-red-500 leading-relaxed">
                        <span className="font-bold text-red-400">Notice:</span> You will not
                        receive any delivery requests while offline. Switch online whenever
                        you are ready to earn.
                    </div>
                </div>
            )}

        </div>
    );
}
