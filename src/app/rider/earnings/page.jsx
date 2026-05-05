"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, Package, Star, ArrowUpRight, Calendar, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRider } from "@/app/context/RiderContext";
import API from "@/app/lib/riderApi";

const StatCard = ({ icon: Icon, label, value, sub, color = "orange", delay = 0 }) => {
    const colorMap = {
        orange: { bg: "bg-orange-500/10", text: "text-orange-500" },
        green: { bg: "bg-green-500/10", text: "text-green-500" },
        yellow: { bg: "bg-yellow-500/10", text: "text-yellow-500" },
        blue: { bg: "bg-blue-500/10", text: "text-blue-500" },
    };
    const c = colorMap[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-white dark:bg-[#1A1D23] shadow-sm dark:shadow-none border border-gray-100 dark:border-white/5 rounded-3xl p-5 transition-colors"
        >
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg}`}>
                    <Icon size={18} className={c.text} />
                </div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white mb-1">{value}</div>
            {sub && <div className="text-[11px] text-gray-500 font-medium">{sub}</div>}
        </motion.div>
    );
};

export default function RiderEarningsPage() {
    const router = useRouter();
    const { rider } = useRider();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const riderId = rider?._id || rider?.id;
        if (!riderId) return;

        // Use the rider profile data we already have, supplemented by any stats endpoint
        setLoading(false);
        setStats({
            totalEarnings: rider?.totalEarnings || 0,
            totalDeliveries: rider?.totalDeliveries || 0,
            rating: rider?.rating || 0,
            ratingCount: rider?.ratingCount || 0,
        });
    }, [rider]);

    // Mock weekly breakdown for visual appeal
    const weeklyData = [
        { day: "Mon", amount: 3200 },
        { day: "Tue", amount: 4800 },
        { day: "Wed", amount: 2100 },
        { day: "Thu", amount: 5600 },
        { day: "Fri", amount: 7200 },
        { day: "Sat", amount: 9100 },
        { day: "Sun", amount: 6400 },
    ];
    const maxAmount = Math.max(...weeklyData.map(d => d.amount));

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-1">Earnings</h1>
                <p className="text-gray-500 font-medium">Your performance & payment overview</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-orange-500" size={36} />
                </div>
            ) : (
                <>
                    {/* Hero Total */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-orange-600 to-red-600 rounded-[32px] p-8 relative overflow-hidden shadow-2xl shadow-orange-600/20"
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-bl-[80px]" />
                        <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Wallet size={20} className="text-white/80" />
                                    <span className="text-white/80 text-sm font-bold uppercase tracking-wider">Total Earned</span>
                                </div>
                                <div className="text-5xl font-black text-white mb-4">
                                    ₦{(stats?.totalEarnings || 0).toLocaleString()}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-green-300 text-sm font-bold">
                                    <ArrowUpRight size={16} />
                                    <span>Lifetime earnings</span>
                                </div>
                                <button
                                    onClick={() => router.push("/rider/wallet")}
                                    className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all"
                                >
                                    View Wallet
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard
                            icon={Package}
                            label="Total Deliveries"
                            value={stats?.totalDeliveries || 0}
                            sub="lifetime"
                            color="blue"
                            delay={0.1}
                        />
                        <StatCard
                            icon={Star}
                            label="Rating"
                            value={stats?.rating ? stats.rating.toFixed(1) : "New"}
                            sub={stats?.ratingCount ? `${stats.ratingCount} reviews` : "No reviews yet"}
                            color="yellow"
                            delay={0.15}
                        />
                    </div>

                    {/* Weekly Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="bg-white dark:bg-[#1A1D23] shadow-sm dark:shadow-none border border-gray-100 dark:border-white/5 rounded-3xl p-6 transition-colors"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-black text-gray-900 dark:text-white">This Week</h3>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">Daily earnings breakdown</p>
                            </div>
                            <div className="flex items-center gap-1.5 bg-green-500/10 px-3 py-1.5 rounded-full">
                                <TrendingUp size={14} className="text-green-400" />
                                <span className="text-[11px] font-black text-green-400">+24%</span>
                            </div>
                        </div>

                        <div className="flex items-end gap-2 h-32">
                            {weeklyData.map((d, i) => (
                                <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${(d.amount / maxAmount) * 100}%` }}
                                        transition={{ delay: 0.3 + i * 0.06, type: "spring", stiffness: 200 }}
                                        className={`w-full rounded-t-lg ${i === 5 || i === 6 ? "bg-orange-600 dark:bg-orange-500" : "bg-gray-200 dark:bg-white/10"
                                            }`}
                                    />
                                    <span className="text-[10px] font-bold text-gray-500">{d.day}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Payout Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white dark:bg-[#1A1D23] shadow-sm dark:shadow-none border border-gray-100 dark:border-white/5 rounded-3xl p-6 transition-colors"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Calendar size={18} className="text-orange-600 dark:text-orange-500" />
                            <h3 className="font-black text-gray-900 dark:text-white">Payout Schedule</h3>
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: "Next payout", value: "Feb 28, 2026", highlight: true },
                                { label: "Payout method", value: "Bank Transfer" },
                                { label: "Frequency", value: "Every Monday" },
                            ].map(item => (
                                <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/5 last:border-0">
                                    <span className="text-sm text-gray-500 font-medium">{item.label}</span>
                                    <span className={`text-sm font-bold ${item.highlight ? "text-orange-600 dark:text-orange-500" : "text-gray-900 dark:text-white"}`}>
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </div>
    );
}
