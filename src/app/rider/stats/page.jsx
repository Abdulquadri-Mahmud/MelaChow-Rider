"use client";

import { Activity, Bike, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useRider } from "@/app/context/RiderContext";

const StatCard = ({ icon: Icon, label, value, sub, tone = "orange", delay = 0 }) => {
    const tones = {
        orange: "bg-orange-500/10 text-orange-600 dark:text-orange-500",
        yellow: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500",
        blue: "bg-blue-500/10 text-blue-600 dark:text-blue-500",
        green: "bg-green-500/10 text-green-600 dark:text-green-500",
        red: "bg-red-500/10 text-red-600 dark:text-red-500",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm dark:shadow-none"
        >
            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-xl ${tones[tone]}`}>
                    <Icon size={18} />
                </div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white">{value}</div>
            <div className="text-[11px] text-gray-500 font-bold mt-1">{sub}</div>
        </motion.div>
    );
};

export default function RiderStatsPage() {
    const { rider, isOnline } = useRider();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white">Rider Stats</h1>
                <p className="text-gray-500 font-medium mt-1">Your rating, deliveries, and current availability.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    icon={Star}
                    label="Rating"
                    value={rider?.rating ? Number(rider.rating).toFixed(1) : "New"}
                    sub={rider?.ratingCount ? `${rider.ratingCount} reviews` : "No reviews yet"}
                    tone="yellow"
                    delay={0.05}
                />
                <StatCard
                    icon={Activity}
                    label="Deliveries"
                    value={rider?.totalDeliveries ?? 0}
                    sub="lifetime"
                    tone="blue"
                    delay={0.1}
                />
                <StatCard
                    icon={Bike}
                    label="Status"
                    value={isOnline ? "Online" : "Offline"}
                    sub={isOnline ? "Accepting orders" : "Not accepting orders"}
                    tone={isOnline ? "green" : "red"}
                    delay={0.15}
                />
            </div>
        </div>
    );
}
