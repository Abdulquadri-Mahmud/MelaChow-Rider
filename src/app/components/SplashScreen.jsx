"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image"; // Optimization 1: Use next/image

export default function SplashScreen({ user, vendorDetails }) {
    // Determine if user is authenticated
    const isAuthenticated = !!user || !!vendorDetails;

    const [loadingText, setLoadingText] = useState("Initializing experience...");
    const [showNextStep, setShowNextStep] = useState(false);

    // Cycle through realistic product-driven statuses
    useEffect(() => {
        const statuses = [
            "Locating nearby tastes...",
            "Curating local menus...",
            "Preparing your dashboard...",
        ];

        let index = 0;
        setLoadingText(statuses[0]);

        const interval = setInterval(() => {
            index = (index + 1) % statuses.length;
            setLoadingText(statuses[index]);
        }, 1800);

        // Show "Next Step" cue after a delay for engagement
        const nextStepTimer = setTimeout(() => {
            setShowNextStep(true);
        }, 2500);

        return () => {
            clearInterval(interval);
            clearTimeout(nextStepTimer);
        };
    }, []);

    // Update text based on auth status
    useEffect(() => {
        if (isAuthenticated) {
            setLoadingText("Welcome back!");
        } else {
            setLoadingText("Discover food around you");
        }
    }, [isAuthenticated]);

    // OPTIMIZATION: Motion variants kept identical to preserve animation feel
    const dotVariants = {
        initial: { y: 0, opacity: 0.4 },
        animate: {
            y: [0, -12, 0],
            opacity: [0.4, 1, 0.4],
            transition: {
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
            },
        },
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.4
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 120, damping: 14 }
        },
    };

    return (
        <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-white overflow-hidden">
            {/* Background Layer: Dynamic Mesh Gradient */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[20%] -right-[10%] w-[100%] h-[100%] bg-orange-500/20 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        rotate: [0, -90, 0],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[20%] -left-[10%] w-[100%] h-[100%] bg-orange-600/10 rounded-full blur-[100px]"
                />
            </div>

            {/* Subtle Noise Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

            {/* Main Branding Container */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 flex flex-col items-center"
            >
                {/* Logo Frame: Liquid Style */}
                <motion.div
                    variants={itemVariants}
                    className="relative mb-12"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-tr from-orange-500 to-orange-400 rounded-[40px] blur-2xl opacity-20 scale-110"
                    />
                    <div className="relative w-32 h-32 bg-white rounded-[38px] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden p-6 group">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
                        >
                            <Image
                                src="/logo.png"
                                alt="MelaChow"
                                width={120}
                                height={120}
                                className="object-contain"
                                priority
                            />
                        </motion.div>
                    </div>
                </motion.div>

                {/* Typography: Modern & Refined */}
                <motion.div variants={itemVariants} className="text-center space-y-4">
                    <h1 className="text-6xl font-black italic uppercase tracking-tighter text-zinc-900 leading-none">
                        Mela<span className="text-orange-500">Chow</span>
                    </h1>
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-[1px] w-6 bg-orange-500/20" />
                        <p className="text-[11px] font-black uppercase tracking-[0.5em] text-orange-500 text-center">
                            Premium Food Experience
                        </p>
                        <div className="h-[1px] w-6 bg-orange-500/20" />
                    </div>
                </motion.div>

                {/* Loader Section */}
                <motion.div variants={itemVariants} className="mt-20 flex flex-col items-center gap-8 w-[280px]">
                    {/* Minimalist Progress Bar */}
                    <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden relative">
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: "100%" }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-orange-500 to-transparent"
                        />
                    </div>

                    <div className="space-y-3 flex flex-col items-center">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={loadingText}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.1 }}
                                className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400 text-center block"
                            >
                                {loadingText}
                            </motion.span>
                        </AnimatePresence>

                        <div className="flex gap-1.5 justify-center">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        scale: [1, 1.5, 1],
                                        opacity: [0.3, 1, 0.3]
                                    }}
                                    transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                        delay: i * 0.2
                                    }}
                                    className="w-1 h-1 bg-orange-500 rounded-full"
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Bottom Safe Area Branding (iOS style) */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="absolute bottom-12 flex flex-col items-center gap-1"
            >
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-400">
                    Premium Quality First
                </p>
                <div className="w-8 h-1 bg-orange-500/10 rounded-full" />
            </motion.div>
        </div>
    );
}

