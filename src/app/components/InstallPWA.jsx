"use client";

import React, { useState, useEffect } from "react";
import { usePWAInstall } from "@/app/hooks/usePWAInstall";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share, PlusSquare, Smartphone } from "lucide-react";
import { registerServiceWorker } from "@/app/lib/pwa-utils";

/**
 * Premium PWA Install Banner Component
 * Detects platform and shows either an Install button (Android/Chrome)
 * or an "Add to Home Screen" tutorial (iOS).
 */
const InstallPWA = () => {
  const { isInstallable, isInstalled, platform, installPWA } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [showIOSTutorial, setShowIOSTutorial] = useState(false);

  useEffect(() => {
    registerServiceWorker();

    // Show banner after 2 seconds if app is installable or is on iOS (and not installed)
    const timer = setTimeout(() => {
      if ((isInstallable || platform === 'ios') && !isInstalled) {
        // Check if user has dismissed it recently (session-based)
        const isDismissed = sessionStorage.getItem("pwa_dismissed");
        if (!isDismissed) {
          setIsVisible(true);
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, platform]);

  const handleInstallClick = async () => {
    if (platform === 'ios') {
      setShowIOSTutorial(true);
    } else {
      const success = await installPWA();
      if (success) setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("pwa_dismissed", "true");
  };

  if (isInstalled) return null;

  return (
    <>
      <AnimatePresence>
        {isVisible && !showIOSTutorial && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-28 left-4 right-4 md:bottom-10 md:left-auto md:right-6 md:w-96 z-[10001]"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-5 overflow-hidden relative">
              {/* Decorative Background Element */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
                  <Download className="text-white" size={24} />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                    Install MelaChow App
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    Get a faster, more reliable experience. Order your favorite meals directly from your home screen.
                  </p>
                  
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={handleInstallClick}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded-lg transition-all active:scale-95 shadow-md shadow-orange-600/10"
                    >
                      {platform === 'ios' ? 'How to Install' : 'Install Now'}
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="px-3 py-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Tutorial Modal */}
      <AnimatePresence>
        {showIOSTutorial && (
          <div className="fixed inset-0 z-[10000] flex items-end justify-center sm:items-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIOSTutorial(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-sm relative shadow-2xl overflow-hidden"
            >
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setShowIOSTutorial(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Smartphone className="text-orange-600" size={32} />
                </div>
                
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Install on iOS</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">To use MelaChow in full app mode, follow these steps:</p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-4 text-left p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm shrink-0">
                      <Share className="text-blue-500" size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">1. Tap the Share button in Safari</span>
                  </div>

                  <div className="flex items-center gap-4 text-left p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm shrink-0">
                      <PlusSquare className="text-slate-700 dark:text-slate-200" size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">2. Scroll down and tap Add to Home Screen</span>
                  </div>
                </div>

                <button 
                  onClick={() => setShowIOSTutorial(false)}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-[10px] tracking-widest py-4 rounded-2xl transition-all active:scale-95"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default InstallPWA;
