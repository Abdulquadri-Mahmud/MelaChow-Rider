"use client";

import { useEffect, useState } from "react";
import { X, RefreshCw, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * PWA Update Manager
 * 
 * Handles service worker update lifecycle:
 * - Detects when a new service worker is available
 * - Shows non-blocking update banner
 * - Prevents forced updates during critical flows (checkout, payment, active orders)
 * - Allows user to update now or later
 */

// Critical routes where forced updates should be prevented
const CRITICAL_ROUTES = [
    "/checkout",
    "/payment",
    "/orders", // Active orders
    "/verify-payment",
];

export default function PWAUpdateManager() {
    const pathname = usePathname();
    const [showUpdateBanner, setShowUpdateBanner] = useState(false);
    const [waitingWorker, setWaitingWorker] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        // Only run in browser
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
            return;
        }

        // Listen for service worker updates
        const handleServiceWorkerUpdate = (registration) => {
            if (registration.waiting) {
                // New service worker is waiting to activate
                setWaitingWorker(registration.waiting);
                setShowUpdateBanner(true);
            }
        };

        // Check for updates on mount
        navigator.serviceWorker.ready.then((registration) => {
            // Check if there's already a waiting worker
            if (registration.waiting) {
                setWaitingWorker(registration.waiting);
                setShowUpdateBanner(true);
            }

            // Listen for new updates
            registration.addEventListener("updatefound", () => {
                const newWorker = registration.installing;

                if (newWorker) {
                    newWorker.addEventListener("statechange", () => {
                        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                            // New service worker installed and ready
                            setWaitingWorker(newWorker);
                            setShowUpdateBanner(true);
                        }
                    });
                }
            });
        });

        // Listen for controller change (service worker activated)
        navigator.serviceWorker.addEventListener("controllerchange", () => {
            // Service worker has been updated, reload the page
            if (!isUpdating) {
                window.location.reload();
            }
        });

        // Check for updates periodically (every 30 minutes)
        const updateInterval = setInterval(() => {
            navigator.serviceWorker.ready.then((registration) => {
                registration.update();
            });
        }, 30 * 60 * 1000); // 30 minutes

        return () => clearInterval(updateInterval);
    }, [isUpdating]);

    // Handle update action
    const handleUpdate = () => {
        if (!waitingWorker) return;

        setIsUpdating(true);

        // Tell the waiting service worker to skip waiting and activate
        waitingWorker.postMessage({ type: "SKIP_WAITING" });

        // The page will reload automatically via controllerchange event
    };

    // Handle dismiss action
    const handleDismiss = () => {
        setShowUpdateBanner(false);

        // Show again after 1 hour if user dismissed
        setTimeout(() => {
            if (waitingWorker) {
                setShowUpdateBanner(true);
            }
        }, 60 * 60 * 1000); // 1 hour
    };

    // Check if current route is critical
    const isOnCriticalRoute = CRITICAL_ROUTES.some(route =>
        pathname?.startsWith(route)
    );

    // Don't show banner on critical routes
    if (isOnCriticalRoute) {
        return null;
    }

    return (
        <AnimatePresence>
            {showUpdateBanner && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed top-0 left-0 right-0 z-[9998] pointer-events-none"
                >
                    <div className="max-w-2xl mx-auto p-4 pointer-events-auto">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-4">
                            {/* Icon */}
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                                    <RefreshCw size={20} className={isUpdating ? "animate-spin" : ""} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm md:text-base">
                                        {isUpdating ? "Updating MelaChow..." : "New Version Available"}
                                    </h3>
                                    <p className="text-xs md:text-sm text-white/90 mt-0.5">
                                        {isUpdating
                                            ? "Please wait while we update the app"
                                            : "A new version of MelaChow is ready to install"
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            {!isUpdating && (
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={handleUpdate}
                                        className="bg-white text-orange-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-orange-50 active:scale-95 transition-all shadow-lg"
                                    >
                                        Update Now
                                    </button>
                                    <button
                                        onClick={handleDismiss}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                        aria-label="Dismiss"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            )}

                            {isUpdating && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock size={16} className="animate-pulse" />
                                    <span className="hidden sm:inline">Updating...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

