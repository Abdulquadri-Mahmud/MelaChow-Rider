// components/AddressSkeleton.jsx
"use client";

import { motion } from "framer-motion";

export default function AddressSkeleton({ count = 2 }) {
  const skeletons = Array.from({ length: count });

  return (
    <div className="space-y-3">
      {skeletons.map((_, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-4 flex justify-between gap-3 animate-pulse"
        >
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-gray-300 dark:bg-zinc-800 rounded"></div>
            <div className="h-3 w-1/2 bg-gray-200 dark:bg-zinc-800 rounded"></div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-6 w-6 bg-gray-300 dark:bg-zinc-800 rounded-full"></div>
            <div className="h-4 w-16 bg-gray-200 dark:bg-zinc-800 rounded"></div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
