"use client";

import { RiderProvider } from "@/app/context/RiderContext";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bike, LayoutDashboard, History, Settings, Bell, Power, Loader2, Wallet } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRider } from "@/app/context/RiderContext";
import NewOrderModal from "@/app/components/rider/NewOrderModal";
import PushNotificationPrompt from "@/app/components/notifications/PushNotificationPrompt";
import PWAUpdateManager from "@/app/components/PWA/PWAUpdateManager";
import PWAInstallPrompt from "@/app/components/PWA/PWAInstallPrompt";
import { registerServiceWorker } from "@/app/lib/pwa-utils";
import { getActiveRiderOrder } from "@/app/lib/riderApi";
import toast from "react-hot-toast";

const ASSIGNMENT_STATUSES = ["assigned", "pending_assignment", "rider_assigned"];

function getOrderId(order) {
    return order?._id?.$oid || order?._id || order?.orderId || order?.id || "";
}

function isPendingAssignmentOrder(order) {
    const status = order?.orderStatus || order?.status;
    return ASSIGNMENT_STATUSES.includes(status);
}

function speakRiderAssignment(message) {
    if (typeof window === "undefined") return;

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            const context = new AudioContext();
            const gain = context.createGain();
            gain.gain.value = 0.045;
            gain.connect(context.destination);

            [0, 0.16, 0.32, 0.52].forEach((offset, index) => {
                const oscillator = context.createOscillator();
                oscillator.type = "sine";
                oscillator.frequency.value = index % 2 === 0 ? 880 : 660;
                oscillator.connect(gain);
                oscillator.start(context.currentTime + offset);
                oscillator.stop(context.currentTime + offset + 0.1);
            });

            window.setTimeout(() => context.close().catch(() => { }), 1200);
        }
    } catch { }

    try {
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.rate = 0.95;
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
        }
    } catch { }
}

function RiderHeader({ isOnline, toggleAvailability, isToggling }) {
    const { rider, logout } = useRider();
    const [scrolled, setScrolled] = useState(false);

    // console.log(rider)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur-lg border-b border-gray-200 dark:border-white/5 py-3' : 'bg-transparent py-5'
            }`}>
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/20">
                        <Bike size={20} />
                    </div>
                    <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight hidden sm:block">MelaChow <span className="text-orange-600">Rider</span></span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Status Toggle */}
                    <button
                        onClick={toggleAvailability}
                        disabled={isToggling}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all border ${isOnline
                            ? 'bg-green-500/10 border-green-500/20 text-green-500'
                            : 'bg-red-500/10 border-red-500/20 text-red-500'
                            } ${isToggling ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                    >
                        {isToggling ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </button>

                    {/* Profile */}
                    <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-white/10">
                        <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden border-2 border-orange-500/20">
                            {rider?.avatar ? <img src={rider.avatar} alt="Rider" className="w-full h-full object-cover" /> : <Bike size={18} className="text-orange-600" />}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

function RiderLayoutInner({ children }) {
    const { isOnline, toggleAvailability, loading, rider, isToggling, refreshProfile } = useRider();
    const pathname = usePathname();
    const [assignmentModal, setAssignmentModal] = useState(null);
    const assignmentIdRef = useRef("");
    const alertTimerRef = useRef(null);
    const riderId = rider?._id || rider?.id;

    useEffect(() => {
        registerServiceWorker();
    }, []);

    const showAssignment = useCallback((payload, source = "live") => {
        const orderId = payload?.orderId || getOrderId(payload?.order);
        if (!orderId) return;
        if (assignmentIdRef.current === orderId) return;

        assignmentIdRef.current = orderId;
        setAssignmentModal({
            ...payload,
            orderId,
            receivedAt: payload?.receivedAt || new Date().toISOString(),
            source
        });
    }, []);

    const clearAssignment = useCallback(() => {
        assignmentIdRef.current = "";
        setAssignmentModal(null);
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
    }, []);

    const checkPendingAssignment = useCallback(async (showToast = false) => {
        if (!riderId || !isOnline) return;

        try {
            const data = await getActiveRiderOrder(riderId);
            const order = data?.data?.order || data?.order || (data?._id ? data : null);
            const orderId = getOrderId(order);

            if (orderId && isPendingAssignmentOrder(order)) {
                if (assignmentIdRef.current !== orderId) {
                    showAssignment({ orderId, order, recovered: true }, "polling");
                    if (showToast) {
                        toast.success("Delivery assignment found. Please respond now.", { duration: 8000 });
                    }
                }
                return;
            }

            if (assignmentIdRef.current && assignmentIdRef.current === orderId && !isPendingAssignmentOrder(order)) {
                clearAssignment();
            }
        } catch (error) {
            if (error?.response?.status !== 404) {
                console.error("Failed to check rider assignment:", error);
            }
        }
    }, [clearAssignment, isOnline, riderId, showAssignment]);

    useEffect(() => {
        const handleNewAssignment = (e) => {
            showAssignment(e.detail, "socket");
        };

        const handleAssignmentAction = () => {
            clearAssignment();
        };

        window.addEventListener('rider:new_assignment', handleNewAssignment);
        window.addEventListener('rider:assignment_action', handleAssignmentAction);
        return () => {
            window.removeEventListener('rider:new_assignment', handleNewAssignment);
            window.removeEventListener('rider:assignment_action', handleAssignmentAction);
        };
    }, [clearAssignment, showAssignment]);

    useEffect(() => {
        checkPendingAssignment(false);

        const poll = () => checkPendingAssignment(false);
        const interval = window.setInterval(poll, document.hidden ? 15000 : 6000);
        const handleFocus = () => checkPendingAssignment(true);
        const handleVisibility = () => {
            if (!document.hidden) checkPendingAssignment(true);
        };

        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            window.clearInterval(interval);
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [checkPendingAssignment]);

    useEffect(() => {
        if (!assignmentModal?.orderId) {
            if (alertTimerRef.current) {
                window.clearInterval(alertTimerRef.current);
                alertTimerRef.current = null;
            }
            return;
        }

        const message = "New delivery assigned. Please accept or reject this order now.";
        speakRiderAssignment(message);
        alertTimerRef.current = window.setInterval(() => {
            speakRiderAssignment(message);
        }, 12000);

        return () => {
            if (alertTimerRef.current) {
                window.clearInterval(alertTimerRef.current);
                alertTimerRef.current = null;
            }
        };
    }, [assignmentModal?.orderId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0F1115] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-orange-600/20 border-t-orange-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!rider && !pathname.includes('/auth')) {
        // Redirect logic handled in Context or Page usually, but for safety:
        return null;
    }

    return (
        <div className="min-h-screen bg-white dark:bg-[#0F1115] text-gray-900 dark:text-white transition-colors duration-300">
            <RiderHeader isOnline={isOnline} toggleAvailability={toggleAvailability} isToggling={isToggling} />
            <main className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
                {children}
            </main>

            {/* Bottom Navigation for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
                <nav className="bg-white/80 dark:bg-black/80 backdrop-blur-2xl border border-gray-200 dark:border-white/10 py-3 px-4 rounded-t-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center justify-between relative overflow-hidden">

                    <Link href="/rider/dashboard" className="relative flex flex-col items-center gap-1 group py-1 min-w-[44px]">
                        <motion.div
                            className={`flex flex-col items-center gap-0.5 transition-colors ${pathname === '/rider/dashboard' ? 'text-orange-600 dark:text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}
                            whileTap={{ scale: 0.9 }}
                        >
                            <LayoutDashboard size={20} className={pathname === '/rider/dashboard' ? 'fill-orange-600/10 dark:fill-orange-500/10' : ''} />
                            <span className="text-[9px] font-black uppercase tracking-tighter">Home</span>
                        </motion.div>
                        {pathname === '/rider/dashboard' && (
                            <motion.div layoutId="navIndicator" className="absolute -bottom-1 w-1 h-1 bg-orange-600 dark:bg-orange-500 rounded-full" />
                        )}
                    </Link>

                    <Link href="/rider/orders" className="relative flex flex-col items-center gap-1 group py-1 min-w-[44px]">
                        <motion.div
                            className={`flex flex-col items-center gap-0.5 transition-colors ${pathname === '/rider/orders' ? 'text-orange-600 dark:text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}
                            whileTap={{ scale: 0.9 }}
                        >
                            <History size={20} className={pathname === '/rider/orders' ? 'fill-orange-600/10 dark:fill-orange-500/10' : ''} />
                            <span className="text-[9px] font-black uppercase tracking-tighter">Orders</span>
                        </motion.div>
                        {pathname === '/rider/orders' && (
                            <motion.div layoutId="navIndicator" className="absolute -bottom-1 w-1 h-1 bg-orange-600 dark:bg-orange-500 rounded-full" />
                        )}
                    </Link>

                    {/* Enhanced Center Toggle */}
                    <div className="relative -mt-10 mb-2">
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleAvailability(); }}
                            disabled={isToggling}
                            className="relative"
                        >
                            <motion.div
                                className={`w-10 h-10 mt-5 rounded-full flex items-center justify-center border-[1px] border-gray-50 dark:border-[#0F1115] shadow-xl text-white transition-all
                                    ${isOnline ? 'bg-green-500 shadow-green-500/40' : 'bg-orange-600 shadow-orange-600/40'}
                                    ${isToggling ? 'opacity-50' : ''}`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                {isToggling ? (
                                    <Loader2 size={24} className="animate-spin" />
                                ) : (
                                    <motion.div
                                        initial={false}
                                        animate={{ rotate: isOnline ? 0 : 180 }}
                                    >
                                        <Power size={24} />
                                    </motion.div>
                                )}
                            </motion.div>

                            <motion.span
                                className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${isOnline ? 'text-green-600 dark:text-green-500' : 'text-orange-600 dark:text-orange-500'}`}
                                animate={{ opacity: isToggling ? 0.5 : 1 }}
                            >
                                {isOnline ? 'ONLINE' : 'OFFLINE'}
                            </motion.span>
                        </button>
                    </div>

                    <Link href="/rider/wallet" className="relative flex flex-col items-center gap-1 group py-1 min-w-[44px]">
                        <motion.div
                            className={`flex flex-col items-center gap-0.5 transition-colors ${pathname === '/rider/wallet' ? 'text-orange-600 dark:text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Wallet size={20} className={pathname === '/rider/wallet' ? 'fill-orange-600/10 dark:fill-orange-500/10' : ''} />
                            <span className="text-[9px] font-black uppercase tracking-tighter">Wallet</span>
                        </motion.div>
                        {pathname === '/rider/wallet' && (
                            <motion.div layoutId="navIndicator" className="absolute -bottom-1 w-1 h-1 bg-orange-600 dark:bg-orange-500 rounded-full" />
                        )}
                    </Link>

                    <Link href="/rider/notifications" className="relative flex flex-col items-center gap-1 group py-1 min-w-[44px]">
                        <motion.div
                            className={`flex flex-col items-center gap-0.5 transition-colors ${pathname === '/rider/notifications' ? 'text-orange-600 dark:text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Bell size={20} className={pathname === '/rider/notifications' ? 'fill-orange-600/10 dark:fill-orange-500/10' : ''} />
                            <span className="text-[9px] font-black uppercase tracking-tighter">Alerts</span>
                        </motion.div>
                        {pathname === '/rider/notifications' && (
                            <motion.div layoutId="navIndicator" className="absolute -bottom-1 w-1 h-1 bg-orange-600 dark:bg-orange-500 rounded-full" />
                        )}
                    </Link>

                    <Link href="/rider/settings" className="relative flex flex-col items-center gap-1 group py-1 min-w-[44px]">
                        <motion.div
                            className={`flex flex-col items-center gap-0.5 transition-colors ${pathname === '/rider/settings' ? 'text-orange-600 dark:text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Settings size={20} className={pathname === '/rider/settings' ? 'fill-orange-600/10 dark:fill-orange-500/10' : ''} />
                            <span className="text-[9px] font-black uppercase tracking-tighter">Me</span>
                        </motion.div>
                        {pathname === '/rider/settings' && (
                            <motion.div layoutId="navIndicator" className="absolute -bottom-1 w-1 h-1 bg-orange-600 dark:bg-orange-500 rounded-full" />
                        )}
                    </Link>
                </nav>
            </div>

            <AnimatePresence>
                {assignmentModal && (
                    <NewOrderModal
                        riderId={rider?._id || rider?.id}
                        assignmentData={assignmentModal}
                        onClose={clearAssignment}
                        onRefresh={refreshProfile}
                        persistent
                    />
                )}
            </AnimatePresence>
            <PWAUpdateManager />
            <PWAInstallPrompt />
            <PushNotificationPrompt />
        </div>
    );
}

export default function RiderLayout({ children }) {
    return (
        <RiderProvider>
            <RiderLayoutInner>
                {children}
            </RiderLayoutInner>
        </RiderProvider>
    );
}

