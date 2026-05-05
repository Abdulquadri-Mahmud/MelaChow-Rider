"use client";

import { useEffect, useState } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * PWA Install Prompt
 * 
 * Detects when the app is installable and shows a custom install prompt.
 * - Respects user dismissal (stored in localStorage)
 * - Detects if app is already installed
 * - Works on both Android and iOS (with different UX)
 * - Non-blocking, dismissible banner
 */

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);

    useEffect(() => {
        // Check if already dismissed
        const dismissed = localStorage.getItem("pwa_install_dismissed");
        console.log("[PWA] Install Prompt Check - Dismissed:", dismissed);

        if (dismissed === "true") {
            console.log("[PWA] Install prompt previously dismissed");
            return;
        }

        // Check if already installed
        if (window.matchMedia("(display-mode: standalone)").matches) {
            console.log("[PWA] App is already running in standalone mode");
            setIsInstalled(true);
            return;
        }

        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(isIOSDevice);

        // For iOS, show instructions after a delay
        if (isIOSDevice) {
            const timer = setTimeout(() => {
                const dismissed = localStorage.getItem("pwa_install_dismissed");
                if (dismissed !== "true") {
                    setShowPrompt(true);
                }
            }, 10000); // Show after 10 seconds

            return () => clearTimeout(timer);
        }

        // For Android/Desktop, listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
            console.log("[PWA] 'beforeinstallprompt' event fired");
            // Prevent the mini-infobar from appearing
            e.preventDefault();

            // Save the event for later use
            setDeferredPrompt(e);

            // Show custom install prompt after a delay
            setTimeout(() => {
                console.log("[PWA] Showing custom install prompt");
                setShowPrompt(true);
            }, 5000); // Show after 5 seconds
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        // Listen for app installed event
        window.addEventListener("appinstalled", () => {
            setIsInstalled(true);
            setShowPrompt(false);
            localStorage.setItem("pwa_install_dismissed", "true");
        });

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) {
            // For iOS, show instructions
            if (isIOS) {
                setShowIOSInstructions(true);
            }
            return;
        }

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            console.log("User accepted the install prompt");
        } else {
            console.log("User dismissed the install prompt");
        }

        // Clear the deferred prompt
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        setShowIOSInstructions(false);
        localStorage.setItem("pwa_install_dismissed", "true");
    };

    // Don't show if already installed
    if (isInstalled) {
        return null;
    }

    return (
        <>
            {/* Install Prompt Banner */}
            <AnimatePresence>
                {showPrompt && !showIOSInstructions && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed bottom-20 left-0 right-0 z-[9997] pointer-events-none md:bottom-4"
                    >
                        <div className="max-w-2xl mx-auto p-4 pointer-events-auto">
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-4">
                                {/* Icon & Text */}
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center shrink-0">
                                        <Smartphone size={24} className="text-orange-600" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-sm md:text-base text-gray-900">
                                            Install MelaChow
                                        </h3>
                                        <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                                            {isIOS
                                                ? "Add to your home screen for quick access"
                                                : "Install our app for a better experience"
                                            }
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={handleInstall}
                                        className="bg-orange-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-orange-700 active:scale-95 transition-all shadow-lg flex items-center gap-2"
                                    >
                                        <Download size={16} />
                                        <span className="hidden sm:inline">Install</span>
                                    </button>
                                    <button
                                        onClick={handleDismiss}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                                        aria-label="Dismiss"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* iOS Installation Instructions Modal */}
            <AnimatePresence>
                {showIOSInstructions && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleDismiss}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-md bg-white rounded-[32px] shadow-2xl z-[9999] overflow-hidden"
                        >
                            {/* Header */}
                            <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 p-6">
                                <button
                                    onClick={handleDismiss}
                                    className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <X size={18} className="text-white" />
                                </button>

                                <div className="flex items-center gap-3">
                                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                                        <Smartphone size={32} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white">Install MelaChow</h3>
                                        <p className="text-white/80 text-sm mt-1">Add to Home Screen</p>
                                    </div>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="p-6 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center shrink-0 font-bold text-orange-600 text-sm">
                                            1
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-900 font-semibold">Tap the Share button</p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                Look for the <span className="font-mono bg-gray-100 px-1 rounded">⬆️</span> icon at the bottom of Safari
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center shrink-0 font-bold text-orange-600 text-sm">
                                            2
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-900 font-semibold">Select "Add to Home Screen"</p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                Scroll down and tap the option with a <span className="font-mono bg-gray-100 px-1 rounded">➕</span> icon
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center shrink-0 font-bold text-orange-600 text-sm">
                                            3
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-900 font-semibold">Tap "Add"</p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                Confirm to add MelaChow to your home screen
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleDismiss}
                                    className="w-full py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-colors mt-4"
                                >
                                    Got it!
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

