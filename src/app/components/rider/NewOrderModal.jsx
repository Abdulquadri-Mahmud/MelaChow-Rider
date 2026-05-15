"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Package, MapPin, Bike, Navigation, Clock, X, CheckCircle2, Loader2, Volume2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRiderSpecificOrder, toggleRiderAvailability } from "@/app/lib/riderApi";
import toast from "react-hot-toast";

const ASSIGNMENT_RESPONSE_SECONDS = 90;
// Version: 2026-05-14T15:42 (Bust PWA Cache)

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
            const message = error.response?.data?.message || "Failed to accept order";
            toast.error(message);
            // If the order was already taken (409), close the modal so the rider isn't stuck
            if (error.response?.status === 409) {
                onClose();
            }
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
                    {/* Alert Sound is active, but we removed the redundant text box per request */}
                    
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
                                    ₦{(order?.riderEarnings || order?.deliveryShare || 0).toLocaleString()}
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
                                        <h4 className="font-bold text-gray-900 dark:text-white truncate">{order?.restaurantName || order?.restaurantId?.storeName || "Store"}</h4>
                                        <p className="text-xs text-gray-500 line-clamp-1">{order?.restaurantAddress || order?.restaurantId?.fullAddress || "Restaurant Address"}</p>
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

                            {/* Order Manifest - Human Readable Version */}
                            <div className="bg-gray-50 dark:bg-white/5 rounded-3xl p-3 space-y-4 border border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-2 border-b border-gray-200 dark:border-white/10 pb-3">
                                    <span className="text-xl">📋</span>
                                    <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-sm">Items to Pick Up</h3>
                                </div>
                                
                                <div className="space-y-6">
                                    {(order?.items || []).map((item, idx) => {
                                        const addOns = (item.selected_options || [])
                                            .map(opt => `${opt.quantity || 1}x ${opt.label}`)
                                            .join(", ");

                                        return (
                                            <div key={idx} className="relative pl-4 border-l-2 border-orange-500/30">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-0.5 rounded-lg bg-orange-600 text-white text-[11px] font-black uppercase">
                                                            {item.quantity} UNIT{item.quantity > 1 ? 'S' : ''}
                                                        </span>
                                                        <span className="text-base font-black text-gray-900 dark:text-white">
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    
                                                    {item.portion_label && (
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="font-bold text-gray-400 uppercase text-[9px]">Size:</span>
                                                            <span className="font-bold text-gray-600 dark:text-gray-300">
                                                                {item.portion_quantity > 1 ? `${item.portion_quantity}x ` : ''}{item.portion_label}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {addOns && (
                                                        <div className="mt-2 p-3 rounded-2xl bg-white dark:bg-black/20 border border-gray-100 dark:border-white/5">
                                                            <p className="text-[9px] font-black uppercase text-gray-400 mb-1 tracking-widest">Extra Details / Add-ons:</p>
                                                            <p className="text-xs font-bold text-gray-700 dark:text-gray-200 leading-relaxed">
                                                                {addOns}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
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
