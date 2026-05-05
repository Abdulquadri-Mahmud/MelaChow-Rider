"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bike, Navigation, ArrowLeft, Fuel, MapPin } from "lucide-react";

export default function RiderNotFound() {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
            {/* Pulsing Signal Animation */}
            <div className="relative mb-12">
                <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-blue-400 dark:bg-blue-500 rounded-full blur-2xl"
                />
                <motion.div
                    initial={{ rotate: 15 }}
                    animate={{ rotate: 0 }}
                    transition={{ type: "spring", stiffness: 100 }}
                    className="relative w-28 h-28 bg-slate-900 dark:bg-white rounded-3xl flex items-center justify-center text-white dark:text-slate-900 shadow-2xl z-10"
                >
                    <Bike size={48} className="text-blue-400 dark:text-blue-600" />
                </motion.div>
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-rose-500 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center text-white z-20">
                    <Fuel size={18} />
                </div>
            </div>

            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 italic tracking-tight">Signal Lost!</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm font-medium mb-12 leading-relaxed">
                The route or delivery task you're looking for is currently unreachable. You might have strayed out of the coverage zone.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
                <Link
                    href="/rider/dashboard"
                    className="w-full h-15 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-2xl shadow-blue-500/10"
                >
                    <Navigation size={18} />
                    Rider Station
                </Link>
                <button
                    onClick={() => window.history.back()}
                    className="w-full h-15 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-gray-200 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                >
                    <ArrowLeft size={18} />
                    Previous Turn
                </button>
            </div>

            {/* Quick Map Markers */}
            <div className="mt-20 grid grid-cols-2 gap-8 opacity-40">
                <div className="flex flex-col items-center">
                    <MapPin size={24} className="mb-2 text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Active Gigs</span>
                </div>
                <div className="flex flex-col items-center">
                    <MapPin size={24} className="mb-2 text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Payout History</span>
                </div>
            </div>
        </div>
    );
}
