"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Package, MapPin, Loader2, Bike, RefreshCcw } from "lucide-react";
import { useRider } from "@/app/context/RiderContext";
import { getPendingOffers, acceptOffer } from "@/app/lib/riderApi";
import toast from "react-hot-toast";

export default function AvailableDeliveriesPage() {
    const router = useRouter();
    const { rider, isOnline, refreshProfile } = useRider();
    const [pendingOffers, setPendingOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const riderId = rider?._id || rider?.id;

    const fetchOffers = async (showToast = false) => {
        if (!riderId) return;
        try {
            if (showToast) setIsRefreshing(true);
            let offers = [];
            if (isOnline) {
                const offersData = await getPendingOffers(riderId);
                offers = offersData?.data?.offers || offersData?.offers || [];
            }
            setPendingOffers(offers);
            if (showToast) toast.success("Available jobs updated");
        } catch (error) {
            console.error("Failed to fetch available deliveries:", error);
            if (showToast) toast.error("Failed to refresh deliveries");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOffers();
        // Poll every 10 seconds to keep list updated
        const interval = setInterval(() => fetchOffers(), 10000);
        return () => clearInterval(interval);
    }, [riderId, isOnline]);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24 text-zinc-900 dark:text-zinc-100">
            {/* Elegant Header with Back Button */}
            <div className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-zinc-900/80 border-b border-zinc-100 dark:border-zinc-800/50 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-black tracking-tight uppercase">Available Deliveries</h1>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                            {isOnline ? "Live Broadcast Pool" : "Offline"}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => fetchOffers(true)}
                    disabled={isRefreshing || !isOnline}
                    className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all active:scale-95 disabled:opacity-50"
                >
                    <RefreshCcw size={16} className={isRefreshing ? "animate-spin" : ""} />
                </button>
            </div>

            <div className="max-w-md mx-auto px-4 mt-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Loader2 size={36} className="text-orange-600 animate-spin mb-4" />
                        <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Loading job pool...</p>
                    </div>
                ) : !isOnline ? (
                    <div className="p-10 rounded-[32px] border-2 border-dashed border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 flex items-center justify-center mb-6">
                            <Bike size={32} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">You are Offline</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium max-w-[240px]">
                            Go online from the dashboard header to start viewing and accepting broadcasted jobs.
                        </p>
                    </div>
                ) : pendingOffers.length === 0 ? (
                    <div className="p-10 rounded-[32px] border-2 border-dashed border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-600/5 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 flex items-center justify-center mb-6 animate-pulse">
                            <Package size={32} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Waiting for Jobs</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium max-w-[240px]">
                            There are currently no active deliveries broadcasted in your city. Stay tuned!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">
                            Showing all ({pendingOffers.length}) available offers
                        </div>
                        <AnimatePresence mode="popLayout">
                            {pendingOffers.map((offer, index) => (
                                <motion.div
                                    key={offer._id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                    className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl p-4 shadow-sm hover:border-orange-500/30 transition-all flex flex-col gap-3"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0 flex-1 pr-3">
                                            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-500/20 rounded-full mb-2">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                <span className="text-[9px] font-black text-green-700 dark:text-green-400 uppercase tracking-widest">Available Job</span>
                                            </div>
                                            <h4 className="text-sm font-black text-zinc-900 dark:text-white truncate">
                                                {offer.restaurantName}
                                            </h4>
                                            
                                            {/* Restaurant pickup address */}
                                            <div className="mt-2 p-2 rounded-xl bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100/50 dark:border-orange-900/10 flex items-start gap-1.5">
                                                <Bike size={14} className="text-orange-600 shrink-0 mt-0.5" />
                                                <p className="text-xs text-zinc-700 dark:text-zinc-300 font-bold leading-tight break-words">
                                                    Pickup: {offer.restaurantAddress || "Restaurant Location"}
                                                </p>
                                            </div>

                                            {/* Customer destination address */}
                                            <div className="mt-1.5 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/40 flex items-start gap-1.5">
                                                <MapPin size={14} className="text-zinc-500 shrink-0 mt-0.5" />
                                                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-bold leading-tight break-words">
                                                    Deliver To: {offer.deliveryFullAddress || "Customer Address"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-base font-black text-zinc-950 dark:text-white">
                                                ₦{Number(offer.deliveryFee || 600).toLocaleString()}
                                            </div>
                                            <div className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">Payout</div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={async () => {
                                            const id = toast.loading("Accepting...");
                                            try {
                                                await acceptOffer(riderId, offer._id);
                                                toast.success("Delivery Accepted! 🛵", { id });
                                                // Refresh local list and head back
                                                await Promise.allSettled([fetchOffers(), refreshProfile()]);
                                                router.push("/rider/dashboard");
                                            } catch (e) {
                                                toast.error(e?.response?.data?.message || "Failed to accept offer", { id });
                                            }
                                        }}
                                        className="w-full h-10 bg-orange-600 text-white rounded-xl font-black text-xs flex items-center justify-center transition-all active:scale-95 shadow-md shadow-orange-600/10 hover:bg-orange-700"
                                    >
                                        ACCEPT JOB
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
