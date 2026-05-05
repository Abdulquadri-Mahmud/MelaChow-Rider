"use client";

import React, { useState } from "react";
import { usePWAInstall } from "@/app/hooks/usePWAInstall";
import { Download, Share, PlusSquare, Smartphone, CheckCircle2, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * A permanent, standalone install button for Profile pages.
 * Works for all user roles: Admin, Vendor, Customer.
 *
 * Platform logic:
 *  - iOS Safari     → always shows step-by-step Share guide
 *  - Android/Chrome → native prompt when available; browser-menu guide as fallback
 *  - Already installed → green "App Installed" badge
 */
const PermanentInstallButton = () => {
  const { isInstallable, isInstalled, platform, installPWA } = usePWAInstall();
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // ── Already installed ──────────────────────────────────────────────────────
  if (isInstalled) {
    return (
      <div className="flex items-center gap-3 p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20">
          <CheckCircle2 size={24} />
        </div>
        <div>
          <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-wider">App Installed</h4>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-500/80 font-bold uppercase tracking-widest mt-0.5">
            MelaChow is active on your home screen
          </p>
        </div>
      </div>
    );
  }

  // ── Click handler (platform-aware) ─────────────────────────────────────────
  const handleInstallClick = async () => {
    if (platform === "ios") {
      setShowIOSGuide(true);
    } else if (isInstallable) {
      // Android/Chrome with active prompt
      await installPWA();
    } else {
      // Android/Chrome — prompt was dismissed or throttled by browser
      setShowAndroidGuide(true);
    }
  };

  const description = isInstallable
    ? "Tap to install directly on this device"
    : platform === "ios"
    ? "Tap to see how to add to your home screen"
    : "Tap to see how to install via browser menu";

  // ── Shared modal wrapper ───────────────────────────────────────────────────
  const Modal = ({ show, onClose, children }) => (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[10002] flex items-end justify-center sm:items-center p-2">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-sm relative shadow-2xl"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* ── Install button ────────────────────────────────────────────────── */}
      <button
        onClick={handleInstallClick}
        className="group relative w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 text-left active:scale-[0.98]"
      >
        <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-300">
          <Download size={24} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Install MelaChow App
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{description}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors duration-300">
          <Download size={16} />
        </div>
      </button>

      {/* ── Android fallback guide ────────────────────────────────────────── */}
      <Modal show={showAndroidGuide} onClose={() => setShowAndroidGuide(false)}>
        <div className="text-center space-y-5">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto">
            <MoreVertical className="text-orange-600" size={32} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">Install on Android</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Follow these steps in Chrome:</p>
          </div>
          <div className="space-y-3 pt-2">
            {[
              { icon: <MoreVertical size={16} className="text-slate-600 dark:text-slate-300" />, text: "1. Tap the 3-dot menu (⋮) in Chrome" },
              { icon: <PlusSquare size={16} className="text-slate-600 dark:text-slate-300" />, text: '2. Select "Add to Home Screen"' },
              { icon: <CheckCircle2 size={16} className="text-emerald-500" />, text: '3. Tap "Add" to confirm' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-4 text-left p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm shrink-0">{icon}</div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{text}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setShowAndroidGuide(false)} className="w-full bg-orange-600 text-white font-black uppercase text-[10px] tracking-widest py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-600/20">
            Got it
          </button>
        </div>
      </Modal>

      {/* ── iOS guide ─────────────────────────────────────────────────────── */}
      <Modal show={showIOSGuide} onClose={() => setShowIOSGuide(false)}>
        <div className="text-center space-y-5">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto">
            <Smartphone className="text-orange-600" size={32} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">Install on iOS</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Follow these steps in Safari:</p>
          </div>
          <div className="space-y-3 pt-2">
            {[
              { icon: <Share size={16} className="text-blue-500" />, text: "1. Tap the Share button in Safari" },
              { icon: <PlusSquare size={16} className="text-slate-600 dark:text-slate-300" />, text: '2. Scroll down and tap "Add to Home Screen"' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-4 text-left p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm shrink-0">{icon}</div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{text}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setShowIOSGuide(false)} className="w-full bg-orange-600 text-white font-black uppercase text-[10px] tracking-widest py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-600/20">
            Got it
          </button>
        </div>
      </Modal>
    </>
  );
};

export default PermanentInstallButton;
