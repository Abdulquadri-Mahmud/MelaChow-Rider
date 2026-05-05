"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Bike, MapPin, AlertCircle, CheckCircle2, Info, Clock, Loader2 } from "lucide-react";
import { useRider } from "@/app/context/RiderContext";
import { markNotificationAsRead } from "@/app/lib/riderApi";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

const colorMap = {
    order_assigned: { bg: "bg-orange-500/10", text: "text-orange-500", icon: Bike },
    info: { bg: "bg-blue-500/10", text: "text-blue-400", icon: Info },
    success: { bg: "bg-green-500/10", text: "text-green-400", icon: CheckCircle2 },
    warning: { bg: "bg-yellow-500/10", text: "text-yellow-400", icon: AlertCircle },
};

export default function RiderNotificationsPage() {
    const { notifications, setNotifications, setUnreadCount, unreadCount, loading: contextLoading } = useRider();
    const router = useRouter();
    const [isMarking, setIsMarking] = useState(null);

    const handleNotificationClick = async (notif) => {
        if (!notif.read && !isMarking) {
            setIsMarking(notif._id);
            try {
                await markNotificationAsRead(notif._id);
                setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                console.error("Failed to mark notification as read", error);
            } finally {
                setIsMarking(null);
            }
        }

        if (notif.type === "order_assigned" || notif.orderId) {
            router.push(`/rider/notifications/${notif._id}`);
        }
    };

    if (contextLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-orange-500" size={36} />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-1">Alerts</h1>
                    <p className="text-gray-500 font-medium">
                        {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? "s" : ""}` : "You're all caught up!"}
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                <AnimatePresence>
                    {notifications.map((notif, i) => {
                        const style = colorMap[notif.type] || colorMap.info;
                        const Icon = style.icon;
                        const isUnread = !notif.read;

                        return (
                            <motion.div
                                key={notif._id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => handleNotificationClick(notif)}
                                className={`relative bg-white dark:bg-[#1A1D23] shadow-sm dark:shadow-none border rounded-2xl p-4 flex items-start gap-4 cursor-pointer transition-all hover:border-orange-500/40 
                                    ${isUnread ? "border-orange-500/20" : "border-gray-100 dark:border-white/5 opacity-70 hover:opacity-100"}
                                `}
                            >
                                {isUnread && (
                                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                )}
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${style.bg} ${isUnread ? "shadow-inner" : ""}`}>
                                    <Icon size={22} className={style.text} />
                                </div>
                                <div className="flex-1 pr-4 min-w-0">
                                    <p className={`font-bold text-sm mb-0.5 truncate ${isUnread ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                                        {notif.title}
                                    </p>
                                    <p className={`text-xs leading-relaxed line-clamp-2 ${isUnread ? "text-gray-800 dark:text-gray-300" : "text-gray-500"}`}>
                                        {notif.body}
                                    </p>
                                    <div className="flex items-center gap-1 mt-3 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                                        <Clock size={12} className="text-gray-500" />
                                        <span>
                                            {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : "Just now"}
                                        </span>
                                    </div>
                                </div>
                                {isMarking === notif._id && (
                                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
                                        <Loader2 className="animate-spin text-orange-500" size={24} />
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <Bell size={32} className="text-gray-400 dark:text-white/20" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">No alerts yet</h3>
                    <p className="text-gray-500 text-sm max-w-[200px]">
                        When you get assigned to orders, they will appear here.
                    </p>
                </div>
            )}
        </div>
    );
}
