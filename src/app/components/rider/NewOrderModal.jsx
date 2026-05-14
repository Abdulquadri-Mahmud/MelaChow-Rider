"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Package, MapPin, Bike, Navigation, Clock, X, CheckCircle2, Loader2, Volume2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRiderSpecificOrder, toggleRiderAvailability } from "@/app/lib/riderApi";
import toast from "react-hot-toast";

const ASSIGNMENT_RESPONSE_SECONDS = 90;

export default function NewOrderModal({ riderId, assignmentData, onClose, onRefresh, persistent = false }) {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [now, setNow] = useState(Date.now());
    const [fetchError, setFetchError] = useState(null);
    const timeoutHandledRef = useRef(false);
    const router = useRouter();
    
    const assignedTimestamp = new Date(assignmentData?.assignedAt || assignmentData?.createdAt || assignmentData?.receivedAt || Date.now()).getTime();
    const assignedAt = Number.isNaN(assignedTimestamp) ? Date.now() : assignedTimestamp;
    const elapsedSeconds = Math.max(0, Math.floor((now - assignedAt) / 1000));
    const assignmentMode = assignmentData?.assignmentMode || 
                           assignmentData?.metadata?.assignmentMode || 
                           (assignmentData?.order?.riderAssignment?.assignedBy ? "manual" : "automatic");
    const isManualAssignment = assignmentMode === "manual";
    const secondsLeft = Math.max(0, ASSIGNMENT_RESPONSE_SECONDS - elapsedSeconds);

    const notifyAssignmentAction = (action) => {
        if (typeof window === "undefined") return;
        window.dispatchEvent(new CustomEvent("rider:assignment_action", {
            detail: { 
                action, 
                orderId: assignmentData?.orderId,
                order
            }
        }));
    };

    useEffect(() => {
        const fetchOrder = async () => {
            if (!riderId || !assignmentData?.orderId) return;
            setLoading(true);
            setFetchError(null);
            try {
                const data = await getRiderSpecificOrder(riderId, assignmentData.orderId);
                setOrder(data.order || data.data || data);
            } catch (error) {
                console.error("Failed to fetch assigned order details:", error);
                setFetchError(error.response?.data?.message || "Order details are no longer available.");
                // ✅ FIX: Do NOT call onClose() here. Let the modal stay open with the error message
                // to prevent the flickering/retry loop in the dashboard.
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [riderId, assignmentData?.orderId]);

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleTimeout = async () => {
            if (!isManualAssignment || !persistent || timeoutHandledRef.current || secondsLeft > 0 || actionLoading || !riderId) return;

            timeoutHandledRef.current = true;
            try {
                setActionLoading(true);
                await toggleRiderAvailability(riderId, "available", "timeout");
                toast.error("Assignment timed out. Admin has been notified.", { duration: 7000 });
                notifyAssignmentAction("timeout");
                if (onRefresh) await onRefresh();
                onClose();
            } catch (error) {
                timeoutHandledRef.current = false;
                toast.error(error.response?.data?.message || "Failed to report assignment timeout");
            } finally {
                setActionLoading(false);
            }
        };

        handleTimeout();
    }, [actionLoading, isManualAssignment, onClose, onRefresh, persistent, riderId, secondsLeft]);

    const handleAccept = async () => {
        try {
            setActionLoading(true);
            await toggleRiderAvailability(riderId, "on_delivery");
            toast.success("Delivery Accepted! 🛵", { duration: 5000 });
            notifyAssignmentAction("accept");
            if (onRefresh) await onRefresh();
            onClose();
            router.push('/rider/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to accept order");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        try {
            setActionLoading(true);
            await toggleRiderAvailability(riderId, "available");
            toast.success("Order rejected");
            notifyAssignmentAction("reject");
            if (onRefresh) await onRefresh();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to reject order");
        } finally {
            setActionLoading(false);
        }
    };

    if (!assignmentData) return null;

    return (
        <div className="fixed inset-0 z-[100] flex bg-white dark:bg-[#1A1D23]">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={persistent ? undefined : onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                className="relative w-full min-h-screen bg-white dark:bg-[#1A1D23] overflow-y-auto"
            >
                {/* Header Gradient */}
                <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-6 text-white relative">
                    {!persistent && (
                        <button
                            onClick={onClose}
                            className="absolute right-6 top-6 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    )}
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
                            <Bike size={28} className="animate-bounce" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black leading-tight">New Order!</h2>
                            <p className="text-white/80 font-bold uppercase tracking-wider text-[10px]">Job Assigned Just Now</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-[1fr_auto] gap-3 rounded-3xl border border-orange-500/15 bg-orange-50 p-4 dark:bg-orange-500/10 dark:border-orange-500/20">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-xl bg-orange-600 p-2 text-white">
                                <Volume2 size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-300">
                                    Assignment Alert Active
                                </p>
                                <p className="mt-1 text-xs font-bold leading-relaxed text-orange-900 dark:text-orange-100">
                                    {isManualAssignment 
                                        ? "This alert keeps repeating until you accept, reject, or the timer expires." 
                                        : "This alert keeps repeating until you accept or reject the delivery."}
                                </p>
                            </div>
                        </div>
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-lg font-black tabular-nums text-orange-600 shadow-sm dark:bg-[#101216] dark:text-orange-300">
                            {isManualAssignment ? `${secondsLeft}s` : "Auto"}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 size={40} className="animate-spin text-orange-600" />
                            <p className="text-gray-500 font-bold animate-pulse">Loading order details...</p>
                        </div>
                    ) : fetchError ? (
                        <div className="bg-red-50 dark:bg-red-500/5 border border-red-500/10 rounded-3xl p-8 flex flex-col items-center text-center gap-4">
                            <X size={40} className="text-red-500" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Offer no longer valid</h3>
                                <p className="text-sm text-gray-500 mt-1">{fetchError}</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="px-6 py-2 bg-gray-200 dark:bg-white/10 rounded-xl font-bold text-xs"
                            >
                                CLOSE
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Earnings Potential */}
                            <div className="bg-green-500/5 border border-green-500/10 rounded-3xl p-5 flex flex-col items-center">
                                <span className="text-green-600 dark:text-green-500 text-[10px] font-black uppercase tracking-widest mb-1">Potential Earnings</span>
                                <h3 className="text-4xl font-black text-green-600 dark:text-green-500">
                                    ₦{(order?.deliveryShare || order?.total || 0).toLocaleString()}
                                </h3>
                            </div>

                            {/* Locations */}
                            <div className="space-y-4 relative">
                                <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-gray-200 dark:bg-white/5 border-dashed border-l" />
                                
                                <div className="flex gap-4 relative">
                                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center shrink-0 z-10">
                                        <Package size={20} className="text-orange-600 dark:text-orange-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Pickup From</p>
                                        <h4 className="font-bold text-gray-900 dark:text-white truncate">{order?.restaurantName || order?.restaurantId?.storeName || order?.restaurantId?.name || "Store"}</h4>
                                        <p className="text-xs text-gray-500 line-clamp-1">{order?.restaurantId?.fullAddress || order?.restaurantId?.address?.street || order?.vendorLocation?.address || "Restaurant Address"}</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 relative">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center shrink-0 z-10">
                                        <MapPin size={20} className="text-blue-600 dark:text-blue-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Deliver To</p>
                                        <h4 className="font-bold text-gray-900 dark:text-white truncate">{order?.userName || (order?.userId?.firstname ? `${order.userId.firstname} ${order.userId.lastname || ''}` : "Customer")}</h4>
                                        <p className="text-xs text-gray-500 line-clamp-1">
                                            {order?.deliveryFullAddress || 
                                             (order?.deliveryAddress?.addressLine 
                                                ? `${order.deliveryAddress.addressLine}, ${order.deliveryAddress.city || ''}, ${order.deliveryAddress.state || ''}`.replace(/,,/g, ',').trim() 
                                                : order?.deliveryAddress?.addressLine || "Customer Address")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={handleReject}
                                    disabled={actionLoading}
                                    className="h-16 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white font-bold hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-50"
                                >
                                    REJECT
                                </button>
                                <button
                                    onClick={handleAccept}
                                    disabled={actionLoading}
                                    className="h-16 rounded-2xl bg-orange-600 text-white font-black shadow-lg shadow-orange-600/20 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? <Loader2 className="animate-spin" /> : <>ACCEPT <CheckCircle2 size={20} /></>}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
