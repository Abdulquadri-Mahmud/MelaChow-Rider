"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Clock, CheckCircle2, XCircle, ChevronRight, Search, Filter, Loader2, Bike } from "lucide-react";
import { useRider } from "@/app/context/RiderContext";
import API from "@/app/lib/riderApi";

const STATUS_TABS = [
    { id: "all", label: "All" },
    { id: "delivered", label: "Delivered" },
    { id: "picked_up", label: "In Transit" },
    { id: "cancelled", label: "Cancelled" },
];

const getStatusStyle = (status) => {
    switch (status) {
        case "delivered": return { bg: "bg-green-500/10", text: "text-green-400", dot: "bg-green-500", label: "Delivered" };
        case "picked_up": return { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-500", label: "In Transit" };
        case "assigned": return { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-500", label: "Assigned" };
        case "cancelled": return { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500", label: "Cancelled" };
        default: return { bg: "bg-gray-500/10", text: "text-gray-400", dot: "bg-gray-500", label: status };
    }
};

export default function RiderOrdersPage() {
    const { rider } = useRider();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const riderId = rider?._id || rider?.id;
        if (!riderId) return;

        setLoading(true);
        API.get(`/riders/${riderId}/orders`)
            .then(res => {
                const data = res.data;
                const ordersArray = Array.isArray(data?.orders) ? data.orders : Array.isArray(data) ? data : [];
                setOrders(ordersArray);
            })
            .catch(err => console.error("Failed to fetch rider orders:", err))
            .finally(() => setLoading(false));
    }, [rider?._id, rider?.id]);

    const filtered = orders.filter(order => {
        const matchesTab = activeTab === "all" || order.status === activeTab || order.orderStatus === activeTab;
        const restaurantNameForSearch =
            order.items?.[0]?.restaurantId?.storeName ||
            order.items?.[0]?.storeName || "";

        const matchesSearch = !search ||
            (order._id || "").toLowerCase().includes(search.toLowerCase()) ||
            (order.orderId || "").toLowerCase().includes(search.toLowerCase()) ||
            restaurantNameForSearch.toLowerCase().includes(search.toLowerCase());
        return matchesTab && matchesSearch;
    });

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-1">Order History</h1>
                <p className="text-gray-500 font-medium">All your past and active deliveries</p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                    type="text"
                    placeholder="Search by order ID..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-white dark:bg-[#1A1D23] border border-gray-200 dark:border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all shadow-sm dark:shadow-none"
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {STATUS_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                            ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20"
                            : "bg-white dark:bg-[#1A1D23] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/5 hover:border-orange-500/20 shadow-sm dark:shadow-none"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Orders List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-orange-500" size={36} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#1A1D23] rounded-[32px] border-2 border-dashed border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none">
                    <div className="w-20 h-20 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-5">
                        <Bike size={36} className="text-gray-400 dark:text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No orders yet</h3>
                    <p className="text-gray-500 text-sm">Your delivery history will appear here once you start accepting jobs.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {filtered.map((order, i) => {
                            const status = getStatusStyle(order.status || order.orderStatus);
                            const orderId = (order._id || "").toString().slice(-6).toUpperCase();
                            const date = new Date(order.updatedAt || order.createdAt);
                            const dateStr = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
                            const timeStr = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

                            // Resolve restaurant name from populated items array
                            const restaurantName =
                                order.items?.[0]?.restaurantId?.storeName ||
                                order.items?.[0]?.storeName ||
                                null;

                            // Resolve delivery area — addressLine first, fall back to city
                            const deliveryArea =
                                order.deliveryAddress?.addressLine ||
                                order.deliveryAddress?.address ||
                                order.deliveryAddress?.cityName ||
                                order.deliveryAddress?.city ||
                                null;

                            // Rider's actual earnings — never the customer delivery fee.
                            // riderEarnings is written at delivery time in markDelivered.
                            // Fallback to 0 for orders that predate this field.
                            const earnings = order.riderEarnings ?? 0;

                            return (
                                <motion.div
                                    key={order._id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none rounded-2xl p-4 flex items-center gap-4 hover:border-orange-500/20 transition-all cursor-pointer group"
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${status.bg}`}>
                                        <Package size={20} className={status.text} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-bold text-gray-900 dark:text-white text-sm">Order #{orderId}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${status.bg} ${status.text}`}>
                                                {status.label}
                                            </span>
                                        </div>

                                        {/* Restaurant name — most recognisable job identifier for rider */}
                                        {restaurantName && (
                                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate mt-0.5">
                                                {restaurantName}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mt-0.5">
                                            <Clock size={11} />
                                            <span>{dateStr} at {timeStr}</span>
                                        </div>

                                        {/* Delivery area — helps rider identify which job this was */}
                                        {deliveryArea && (
                                            <p className="text-[11px] text-gray-400 dark:text-gray-600 truncate mt-0.5">
                                                To: {deliveryArea}
                                            </p>
                                        )}
                                    </div>

                                    <div className="text-right shrink-0">
                                        <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">
                                            Your earnings
                                        </div>
                                        <div className="font-black text-gray-900 dark:text-white text-sm">
                                            ₦{earnings.toLocaleString()}
                                        </div>
                                        <ChevronRight size={16} className="text-gray-400 dark:text-gray-600 group-hover:text-orange-500 transition-colors ml-auto mt-1" />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
