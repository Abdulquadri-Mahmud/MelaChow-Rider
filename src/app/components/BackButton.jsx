"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function BackButton({
    label = "Back",
    href = null,
    className = ""
}) {
    const router = useRouter();

    const handleClick = () => {
        if (href) {
            router.push(href);
        } else {
            router.back();
        }
    };

    return (
        <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={handleClick}
            className={`flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-[#FF6B00] dark:hover:text-[#FF6B00] transition-colors font-medium ${className}`}
        >
            <ArrowLeft size={20} />
            <span>{label}</span>
        </motion.button>
    );
}
