'use client';

import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationManager } from '@/app/hooks/useNotificationManager';

export default function NotificationBell({ restaurantId, role, href = '/notifications' }) {
    const router = useRouter();
    const { unreadCount, isRealtimeConnected } = useNotificationManager({ restaurantId, role });

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(href)}
            className="relative p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-orange-500/30 transition-all group"
            aria-label="Notifications"
            title={isRealtimeConnected ? 'Real-time updates active' : 'Using fallback polling'}
        >
            <Bell
                size={20}
                className={`transition-all duration-300 ${unreadCount > 0
                    ? 'text-orange-500 scale-110'
                    : 'text-slate-500 dark:text-slate-400 group-hover:text-orange-500'
                    }`}
            />

            <AnimatePresence>
                {unreadCount > 0 && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -top-1 -right-1 flex"
                    >
                        <span className="relative flex h-5 w-5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-5 w-5 bg-orange-600 text-white text-[10px] items-center justify-center font-black shadow-lg shadow-orange-500/30 border-2 border-white dark:border-slate-900">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Premium Connection indicator */}
            <div className="absolute -bottom-0.5 -right-0.5">
                <div className={`w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm transition-colors duration-500 ${isRealtimeConnected ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`} />
                {isRealtimeConnected && (
                    <div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping opacity-30" />
                )}
            </div>
        </motion.button>
    );
}
