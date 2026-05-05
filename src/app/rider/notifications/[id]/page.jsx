"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft, MapPin, Navigation, Package, CheckCircle2,
    X, Wallet, Phone, Loader2, Bike
} from "lucide-react";
import { useRider } from "@/app/context/RiderContext";
import {
    getSingleNotification,
    getRiderSpecificOrder,
    toggleRiderAvailability,
    riderPickedUpOrder,
    requestDeliveryOTP,
    riderConfirmDelivery
} from "@/app/lib/riderApi";
import toast from "react-hot-toast";

export default function NotificationOrderDetails() {
    const { id } = useParams();
    const router = useRouter();
    const { rider, notifications, refreshProfile } = useRider();

    const [order, setOrder] = useState(null);
    const [notification, setNotification] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [otpState, setOtpState] = useState({ step: "idle", otp: "", sending: false, confirming: false });

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id || !rider?._id) return;
            try {
                // 1. Get Notification to find OrderId
                let notif = notifications.find(n => n._id === id);
                if (!notif) {
                    const res = await getSingleNotification(id);
                    notif = res.notification || res.data;
                }
                setNotification(notif);

                if (!notif?.orderId) {
                    toast.error("Invalid notification format.");
                    setLoading(false);
                    return;
                }

                // 2. Fetch specific order details
                const orderRes = await getRiderSpecificOrder(rider._id, notif.orderId);
                setOrder(orderRes.data || orderRes.order || orderRes);
            } catch (error) {
                console.error("Failed to fetch order details", error);
                const msg = error.response?.data?.message || "Failed to load order details";
                toast.error(msg);
                if (error.response?.status === 403) {
                    router.push('/rider/notifications');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id, rider?._id]);

    const handleAccept = async () => {
        try {
            setActionLoading(true);
            await toggleRiderAvailability(rider._id, "on_delivery");
            toast.success("Delivery Accepted! Proceed to store 🛵", { duration: 5000 });
            await refreshProfile();
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
            await toggleRiderAvailability(rider._id, "available");
            toast.success("Order rejected");
            await refreshProfile();
            router.push('/rider/notifications');
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to reject order");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAction = async (actionType) => {
        if (!order?._id || !rider?._id) return;
        try {
            setActionLoading(true);
            if (actionType === "pickup") {
                await riderPickedUpOrder(rider._id, order._id);
                toast.success("Order picked up! Head to customer.");
                // Refresh order
                const orderRes = await getRiderSpecificOrder(rider._id, order._id);
                setOrder(orderRes.data || orderRes.order || orderRes);
            } else if (actionType === "deliver") {
                setOtpState(prev => ({ ...prev, sending: true }));
                await requestDeliveryOTP(rider._id, order._id);
                setOtpState({ step: "awaiting_otp", otp: "", sending: false, confirming: false });
                toast.success("OTP sent to customer's phone!");
            }
        } catch (error) {
            setOtpState(prev => ({ ...prev, sending: false }));
            toast.error(error?.response?.data?.message || `Failed to ${actionType} order`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmOTP = async () => {
        if (!otpState.otp.trim() || !order?._id || !rider?._id) return;
        setOtpState(prev => ({ ...prev, confirming: true }));
        try {
            await riderConfirmDelivery(rider._id, order._id, otpState.otp.trim());
            toast.success("Order delivered! Well done. 🎉");
            setOtpState({ step: "idle", otp: "", sending: false, confirming: false });
            // Refresh order
            const orderRes = await getRiderSpecificOrder(rider._id, order._id);
            setOrder(orderRes.data || orderRes.order || orderRes);
        } catch (error) {
            setOtpState(prev => ({ ...prev, confirming: false }));
            toast.error(error?.response?.data?.message || "Incorrect OTP. Ask the customer to check again.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-32 bg-gray-50 dark:bg-[#0F1115] min-h-screen transition-colors">
                <Loader2 className="animate-spin text-orange-500" size={48} />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center p-3 text-center pt-24 min-h-screen bg-gray-50 dark:bg-[#0F1115] transition-colors">
                <Package size={64} className="text-gray-400 dark:text-gray-600 mb-6" />
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">Order Unavaliable</h1>
                <p className="text-gray-500 max-w-sm mt-3 font-medium">
                    This order may have been reassigned, cancelled, or doesn't exist.
                </p>
                <button
                    onClick={() => router.back()}
                    className="mt-8 px-6 py-3 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors rounded-full font-bold text-gray-900 dark:text-white shadow-xl flex gap-2 items-center"
                >
                    <ChevronLeft size={20} /> Go Back
                </button>
            </div>
        );
    }

    // Resolve details safely regardless of population levels
    // Resolve restaurant address robustly
    const restaurant = order.restaurantId;
    const restAddr = restaurant?.address;
    const vendorAddress = restaurant?.fullAddress ||
        (restAddr ? `${restAddr.street || ''}, ${restAddr.city || ''}, ${restAddr.state || ''}`.replace(/^[ ,]+|[ ,]+$/g, '').replace(/, ,/g, ',') : '') ||
        restaurant?.storeName ||
        "Vendor Address";

    const customerName = order.userId?.firstname ? `${order.userId.firstname} ${order.userId.lastname || ''}` : "Customer";
    const customerPhone = order.deliveryAddress?.phone || order.userId?.phone;

    // Resolve customer address robustly
    const customerAddress = order.deliveryFullAddress ||
        (order.deliveryAddress?.addressLine
            ? `${order.deliveryAddress.addressLine}, ${order.deliveryAddress.city || ''}, ${order.deliveryAddress.state || ''}`.replace(/,,/g, ',').trim()
            : order.deliveryAddress?.address || "Customer Address");
    const isPending = rider?.status === "pending_assignment" || order.orderStatus === "rider_assigned";
    const isOnDelivery = rider?.status === "on_delivery" || (order.orderStatus === "out_for_delivery");

    const payout = order.deliveryShare || order.total || 0;

    return (
        <div className="min-h-screen pb-32 max-w-full mx-auto relative text-gray-900 dark:text-white transition-colors bg-gray-50 dark:bg-transparent">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 sticky top-0 bg-gray-50/90 dark:bg-[#0F1115]/90 backdrop-blur-xl z-10 py-2 border-b border-gray-200 dark:border-white/5 transition-colors">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center active:scale-90 transition-transform text-gray-700 dark:text-white"
                >
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <h1 className="font-black text-xl leading-none mb-1 text-gray-900 dark:text-white">Assignment Info</h1>
                    <p className="text-xs font-bold text-orange-600 dark:text-orange-500 uppercase tracking-wider">#{String(order._id).slice(-6)}</p>
                </div>
            </div>

            <div className="px-4 space-y-4 relative z-0">
                {/* Earnings Highlight */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-green-500/10 border-2 border-green-500/20 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden"
                >
                    <div className="absolute -right-6 -top-3 text-green-500/10">
                        <Wallet size={120} />
                    </div>
                    <p className="text-green-500 text-xs font-black uppercase tracking-widest mb-1 relative z-10">Estimated Payout</p>
                    <h2 className="text-5xl font-black text-green-400 relative z-10">₦{Number(payout).toLocaleString()}</h2>
                </motion.div>

                {/* Routing Flow Cards */}
                <div className="relative pl-6 py-2">
                    <div className="absolute left-9 top-10 bottom-10 w-1 rounded-full bg-gradient-to-b from-orange-500 to-blue-500 opacity-20" />

                    {/* Pickup */}
                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="relative mb-6">
                        <div className="absolute -left-[22px] top-3 w-8 h-8 rounded-full bg-white dark:bg-[#1A1D23] border-[3px] border-orange-500 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.5)] z-10">
                            <Bike size={14} className="text-orange-500" />
                        </div>
                        <div className="bg-white dark:bg-[#1A1D23] rounded-xl p-3 border border-gray-100 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-2xl ml-4 transition-colors">
                            <p className="text-[10px] uppercase font-black tracking-widest text-orange-600 dark:text-orange-500 mb-1">Pickup From</p>
                            <h3 className="font-black text-lg mb-1 text-gray-900 dark:text-white">{restaurant?.name || "MelaChow Vendor"}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 leading-relaxed">{vendorAddress}</p>
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vendorAddress)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-bold text-xs text-gray-800 dark:text-white transition-colors"
                            >
                                <Navigation size={14} className="text-orange-600 dark:text-orange-500" />
                                Get Directions
                            </a>
                        </div>
                    </motion.div>

                    {/* Dropoff */}
                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="relative">
                        <div className="absolute -left-[22px] top-3 w-8 h-8 rounded-full bg-white dark:bg-[#1A1D23] border-[3px] border-blue-500 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10">
                            <MapPin size={14} className="text-blue-500" />
                        </div>
                        <div className="bg-white dark:bg-[#1A1D23] rounded-xl p-3 border border-gray-100 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-2xl ml-4 transition-colors">
                            <p className="text-[10px] uppercase font-black tracking-widest text-blue-600 dark:text-blue-500 mb-1">Deliver To</p>
                            <h3 className="font-black text-lg mb-1 text-gray-900 dark:text-white">{customerName}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 leading-relaxed line-clamp-2">{customerAddress}</p>

                            <div className="flex gap-2">
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customerAddress)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-bold text-xs text-gray-800 dark:text-white transition-colors"
                                >
                                    <Navigation size={14} className="text-blue-600 dark:text-blue-500" />
                                    Maps
                                </a>
                                {customerPhone && (
                                    <a
                                        href={`tel:${customerPhone}`}
                                        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-blue-500/10 hover:bg-blue-500/20"
                                    >
                                        <Phone size={14} className="text-blue-500" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Order Items */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-[#1A1D23] rounded-xl p-3 mt-4 border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none transition-colors">
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                        <Package size={14} /> Item Summary
                    </p>
                    <ul className="space-y-3">
                        {order.items?.map((item, idx) => {
                            const itemName = item.name || item.variant?.name || item.foodName || "Order Item";
                            const quantity = Number(item.quantity) || 1;
                            const options = item.selected_options || [];
                            const portionLabel = item.portion_label || item.portion || "";
                            
                            const hasPortionWord = portionLabel.toLowerCase().includes('portion');
                            let portionText = "";
                            if (!portionLabel) {
                                portionText = quantity > 1 ? "portions" : "portion";
                            } else if (hasPortionWord) {
                                portionText = portionLabel;
                            } else {
                                portionText = `${portionLabel} ${quantity > 1 ? "portions" : "portion"}`;
                            }

                            let fullSentence = `Deliver ${quantity} ${portionText} of ${itemName}`;
                            if (options.length > 0) {
                                const optionsTextList = options.map((opt) => `${Number(opt.quantity) > 0 ? (Number(opt.quantity) * quantity) + 'x ' : ''}${opt.label || opt.name}`);
                                fullSentence += `, with ${optionsTextList.length === 1 ? optionsTextList[0] : optionsTextList.length === 2 ? optionsTextList.join(' and ') : optionsTextList.slice(0, -1).join(', ') + ', and ' + optionsTextList.slice(-1)}`;
                            }
                            fullSentence += ".";

                            return (
                                <li key={idx} className="border-b border-gray-100 dark:border-white/5 last:border-0 pb-3 last:pb-0">
                                    <div className="flex gap-3">
                                        <div className="p-1.5 h-fit bg-slate-100 dark:bg-[#0F1115] rounded text-slate-500">
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
                                </li>
                            );
                        })}
                    </ul>
                </motion.div>

            </div>

            {/* Sticky Action Drawer */}
            <div className="fixed bottom-20 sm:bottom-0 left-0 right-0 bg-white/90 dark:bg-[#0F1115]/90 backdrop-blur-2xl border-t border-gray-200 dark:border-white/10 p-4 z-40 sm:rounded-t-[40px] rounded-3xl sm:-mb-0 mb-2 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] max-w-md mx-auto transition-colors">
                <AnimatePresence mode="popLayout">
                    {isPending ? (
                        <motion.div
                            key="pending-actions"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                            className="grid grid-cols-2 gap-3"
                        >
                            <button
                                onClick={handleReject}
                                disabled={actionLoading}
                                className="h-16 rounded-xl bg-red-500/10 hover:bg-red-500/20 border-2 border-red-500/20 text-red-500 font-black flex items-center justify-center shadow-lg transition-all active:scale-95 disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="animate-spin" size={24} /> : (
                                    <><X size={20} className="mr-2" /> Reject</>
                                )}
                            </button>
                            <button
                                onClick={handleAccept}
                                disabled={actionLoading}
                                className="h-16 rounded-xl bg-green-500 hover:bg-green-600 text-white font-black flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all active:scale-95 disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="animate-spin" size={24} /> : (
                                    <><CheckCircle2 size={20} className="mr-2" /> ACCEPT</>
                                )}
                            </button>
                        </motion.div>
                    ) : isOnDelivery ? (
                        <motion.div
                            key="delivery-actions"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        >
                            {order.orderStatus === "rider_assigned" ? (
                                <button
                                    onClick={() => handleAction("pickup")}
                                    disabled={actionLoading}
                                    className="w-full h-16 rounded-xl bg-gray-900 dark:bg-white text-orange-500 dark:text-orange-600 font-black tracking-wide flex items-center justify-center shadow-xl transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="animate-spin" size={24} /> : (
                                        <><Package size={20} className="mr-2" /> Mark Picked Up</>
                                    )}
                                </button>
                            ) : (
                                <div>
                                    <button
                                        onClick={() => handleAction("deliver")}
                                        disabled={actionLoading || otpState.sending}
                                        className="w-full h-16 rounded-xl bg-blue-500 text-white font-black tracking-wide flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {actionLoading || otpState.sending ? <Loader2 className="animate-spin" size={24} /> : (
                                            <><CheckCircle2 size={20} className="mr-2" /> Mark Delivered</>
                                        )}
                                    </button>
                                    
                                    {/* OTP input */}
                                    {otpState.step === "awaiting_otp" && (
                                        <div className="mt-4 bg-white dark:bg-white/10 border border-blue-200 dark:border-blue-500/30 rounded-[24px] p-4 space-y-3">
                                            <p className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Ask customer for OTP</p>
                                            <div className="flex gap-3">
                                                <input
                                                    type="number"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    maxLength={6}
                                                    value={otpState.otp}
                                                    onChange={e => setOtpState(prev => ({ ...prev, otp: e.target.value }))}
                                                    placeholder="Enter OTP"
                                                    className="flex-1 h-14 rounded-xl bg-zinc-50 dark:bg-white/10 border border-zinc-200 dark:border-white/10 px-4 text-lg font-black text-center tracking-widest text-zinc-900 dark:text-white outline-none focus:border-blue-500"
                                                />
                                                <button
                                                    onClick={handleConfirmOTP}
                                                    disabled={!otpState.otp.trim() || otpState.confirming}
                                                    className="h-14 px-5 rounded-xl bg-blue-600 text-white font-black text-sm disabled:opacity-50 active:scale-95 transition-all"
                                                >
                                                    {otpState.confirming ? <Loader2 size={18} className="animate-spin" /> : "CONFIRM"}
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => setOtpState({ step: "idle", otp: "", sending: false, confirming: false })}
                                                className="block w-full text-center mt-2 text-xs text-zinc-400 font-bold uppercase tracking-wider"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.p
                            className="text-center font-bold text-gray-500 py-3"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        >
                            Order is no longer active.
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
