"use client";

import { useState, useEffect } from "react";
import { Bell, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import toast from "react-hot-toast";

export default function NotificationPromptBanner() {
    const {
        isSupported,
        subscribe,
        shouldShowPrompt,
    } = usePushNotifications();

    const [isVisible, setIsVisible] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);

    useEffect(() => {
        if (!isSupported) return;

        if (shouldShowPrompt()) {
            // Enhanced delay for premium entrance
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 4000); // 4 second delay to wait for initial page load animations

            return () => clearTimeout(timer);
        }
    }, [isSupported, shouldShowPrompt]);

    const handleEnableNow = async () => {
        setIsSubscribing(true);
        try {
            const success = await subscribe();
            if (success) {
                toast.success("🔔 Real-time updates enabled!", {
                    style: {
                        borderRadius: "20px",
                        background: "#f97316",
                        color: "#fff",
                        fontWeight: "bold",
                    },
                });
                setIsVisible(false);
            } else {
                toast.error("Notifications were not enabled. Please try again.");
            }
        } catch (error) {
            console.error("Notification permission error:", error);
            toast.error("Could not enable notifications");
        } finally {
            setIsSubscribing(false);
        }
    };

    if (!isSupported) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 100, opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed bottom-24 left-4 right-4 z-[9999] md:left-auto md:right-8 md:w-[400px]"
                >
                    {/* Shadow Glow Effect */}
                    <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-[32px] -z-10 animate-pulse" />

                    <div className="relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/50 dark:border-slate-800/50 rounded-[32px] shadow-2xl p-6 group">

                        {/* Interactive Background Elements */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-12 -right-12 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl"
                        />
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-orange-600 to-orange-400" />

                        {/* Top Section */}
                        <div className="flex items-start justify-between mb-5">
                            <div className="flex items-center gap-4">
                                <motion.div
                                    whileHover={{ rotate: [0, -10, 10, 0] }}
                                    className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30"
                                >
                                    <Bell className="text-white" size={28} />
                                </motion.div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                                        Stay in the Loop
                                    </h3>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <ShieldCheck size={12} className="text-green-500" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure & Real-time</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                            Join 5,000+ users getting instant updates on their <span className="text-orange-600 dark:text-orange-500 font-bold">order status</span> and <span className="text-orange-600 dark:text-orange-500 font-bold">exclusive weekend deals</span>. 🎁
                        </p>

                        {/* Benefits Mini-Grid */}
                        <div className="grid grid-cols-2 gap-2 mb-6">
                            <BenefitPill icon={Zap} label="Instant Tracking" />
                            <BenefitPill icon={Sparkles} label="Secret Coupons" />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleEnableNow}
                                disabled={isSubscribing}
                                className="w-full py-4 px-4 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20 active:scale-95 disabled:opacity-70"
                            >
                                {isSubscribing ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Sparkles size={16} />
                                )}
                                Enable Alerts
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function BenefitPill({ icon: Icon, label }) {
    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <Icon size={12} className="text-orange-500" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
        </div>
    );
}
