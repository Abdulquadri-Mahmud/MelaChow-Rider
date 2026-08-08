"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, Bike, Loader2, AlertCircle, ChevronRight, ChevronLeft, Moon, Sun, KeyRound, CheckCircle2 } from "lucide-react";
import { riderForgotPassword } from "@/app/lib/riderApi";
import toast from "react-hot-toast";
import { useTheme } from "@/app/context/ThemeContext";

export default function RiderForgotPasswordPage() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [identifier, setIdentifier] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmed = identifier.trim();
        if (!trimmed) {
            setError("Please enter your registered phone number or email.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const data = await riderForgotPassword(trimmed);
            if (data.success) {
                setSuccessMessage("Verification code generated! Redirecting to verification...");
                toast.success("Reset code sent! Check your phone/email.");
                
                setTimeout(() => {
                    router.push(`/auth/rider/reset-password?target=${encodeURIComponent(trimmed)}`);
                }, 1200);
            } else {
                setError(data.message || "Failed to process password reset request.");
            }
        } catch (err) {
            console.error("Rider Forgot Password Error:", err);
            const message = err.response?.data?.message || err.message || "Unable to send reset code. Please try again.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0F1115] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-600/10 dark:bg-orange-600/15 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[100px]" />

            {/* Back Button */}
            <div className="absolute top-6 left-6 z-50">
                <button
                    onClick={() => router.push("/auth/rider/login")}
                    className="w-12 h-12 bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-white transition-all hover:scale-105 active:scale-95"
                >
                    <ChevronLeft size={20} />
                </button>
            </div>

            {/* Theme Toggle */}
            <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
                <button
                    onClick={toggleTheme}
                    className="w-12 h-12 bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-amber-400 transition-all hover:scale-105 active:scale-95"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo & Header */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0.8, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-orange-600 text-white mb-6 shadow-2xl shadow-orange-600/30 ring-4 ring-white dark:ring-white/5"
                    >
                        <KeyRound size={36} strokeWidth={2.5} />
                    </motion.div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter">
                        Password <span className="text-orange-600 uppercase italic text-3xl">Recovery</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                        Enter your rider account details to receive OTP
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl border border-white dark:border-white/10 rounded-[40px] md:p-6 p-4 shadow-2xl dark:shadow-none ring-1 ring-black/5 dark:ring-white/5 overflow-hidden transition-all duration-500">
                    {/* Error Banner */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="mb-6 bg-rose-500/10 border border-rose-500/20 rounded-[24px] p-5 flex items-start gap-4"
                            >
                                <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
                                <p className="text-rose-500 text-xs font-black tracking-tight leading-relaxed uppercase">{error}</p>
                            </motion.div>
                        )}

                        {successMessage && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[24px] p-5 flex items-start gap-4"
                            >
                                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                                <p className="text-emerald-600 dark:text-emerald-400 text-xs font-black tracking-tight leading-relaxed uppercase">{successMessage}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Identifier Input */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Phone Number or Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                    <Phone size={20} className="text-slate-400 dark:text-slate-500 group-focus-within:text-orange-600 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="08012345678 or rider@melachow.com"
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-3xl py-5 pl-16 pr-6 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/30 transition-all font-black text-sm"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !!successMessage}
                            className="w-full h-16 bg-slate-900 dark:bg-orange-600 hover:bg-black dark:hover:bg-orange-700 disabled:opacity-50 text-white rounded-3xl font-black transition-all shadow-xl shadow-slate-200 dark:shadow-orange-900/40 flex items-center justify-center gap-3 group active:scale-[0.96] uppercase tracking-[0.2em] text-xs"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} strokeWidth={3} />
                                    <span>Generating OTP...</span>
                                </>
                            ) : (
                                <>
                                    <span>Send Reset Code</span>
                                    <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Links */}
                <div className="mt-12 text-center">
                    <div className="p-4 bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-white/50 dark:border-white/5 inline-block px-10">
                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                            Remember your password?{" "}
                            <Link href="/auth/rider/login" className="text-orange-600 hover:underline">
                                Log In
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
