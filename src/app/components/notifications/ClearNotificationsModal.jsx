"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X, AlertOctagon } from "lucide-react";

export default function ClearNotificationsModal({ isOpen, onClose, onConfirm, title, message }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[40px] overflow-hidden shadow-2xl border border-zinc-100 dark:border-zinc-800"
                >
                    <div className="p-8">
                        {/* Status Icon */}
                        <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-[32px] flex items-center justify-center mx-auto mb-6 relative">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute inset-0 bg-red-500/10 rounded-[32px] blur-xl"
                            />
                            <Trash2 size={40} className="text-red-500 relative z-10" />
                        </div>

                        {/* Text Content */}
                        <div className="text-center space-y-2 mb-8">
                            <h3 className="text-2xl font-black text-zinc-900 dark:text-white leading-tight uppercase italic tracking-tight">
                                {title || "Clear All?"}
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                                {message || "Are you sure you want to delete all notifications? This action cannot be reversed."}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={onClose}
                                className="h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-black text-xs uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className="h-14 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-500/20"
                            >
                                Delete All
                            </button>
                        </div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
