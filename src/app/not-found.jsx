"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search, Map, Compass } from "lucide-react";

export default function GlobalNotFound() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-100 rounded-full blur-[120px] opacity-50" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-50" />

            <div className="max-w-2xl w-full text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Animated Icon */}
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <motion.div
                                animate={{ 
                                    rotate: [0, 10, -10, 0],
                                    y: [0, -10, 0, -10, 0]
                                }}
                                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                                className="w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl shadow-orange-200 flex items-center justify-center border border-orange-50"
                            >
                                <Compass size={64} className="text-orange-500" strokeWidth={1.5} />
                            </motion.div>
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.4, type: "spring" }}
                                className="absolute -bottom-2 -right-2 w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-300"
                            >
                                <Search size={24} />
                            </motion.div>
                        </div>
                    </div>

                    <h1 className="text-8xl font-black text-slate-900 mb-4 tracking-tighter">404</h1>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Lost in Transit?</h2>
                    <p className="text-slate-500 text-lg mb-10 max-w-md mx-auto leading-relaxed font-medium">
                        The page you're looking for seems to have taken a wrong turn or hasn't been prepared yet. Let's get you back on track.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/"
                            className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-200 hover:bg-black hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group"
                        >
                            <Home size={18} />
                            Go to Home
                        </Link>
                        <button
                            onClick={() => window.history.back()}
                            className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-slate-100 hover:bg-slate-50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={18} />
                            Go Back
                        </button>
                    </div>
                </motion.div>

                {/* Footer Link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-16 flex items-center justify-center gap-6"
                >
                    <Link href="/help" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Help Center</Link>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <Link href="/contact" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Contact Support</Link>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <Link href="/status" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">System Status</Link>
                </motion.div>
            </div>
        </div>
    );
}
