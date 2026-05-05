"use client";

import { motion } from "framer-motion";

const FoodDetailsSkeleton = () => {
  return (
    <div className="animate-pulse space-y-6">

      {/* 🧾 Main Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-[40px] border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm"
      >
        {/* 🖼️ Image Section Placeholder */}
        <div className="p-2">
          <div className="w-full h-[250px] bg-zinc-200 dark:bg-zinc-800 rounded-[32px] relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
            <div className="absolute top-3 left-3 flex gap-2 w-full pr-6">
              <div className="h-6 bg-zinc-300 dark:bg-zinc-700 rounded-full w-24" />
              <div className="h-6 bg-zinc-300 dark:bg-zinc-700 rounded-full w-28 ml-auto" />
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="p-5 space-y-5">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-2/3" />
          <div className="space-y-2">
            <div className="h-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-md w-full" />
            <div className="h-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-md w-5/6" />
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4 py-6 border-y border-zinc-50 dark:border-zinc-800/50">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-2xl">
                <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-2 bg-zinc-300 dark:bg-zinc-600 rounded w-1/2" />
                  <div className="h-3 bg-zinc-400 dark:bg-zinc-500 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded-full w-16" />
            ))}
          </div>
        </div>
      </motion.div>

      {/*  Bento Variants / Options */}
      <div className="space-y-4 px-1">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-6 bg-zinc-900 dark:bg-zinc-100 rounded-full" />
          <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-40" />
        </div>

        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[32px] p-3 shadow-sm"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-[24px]" />
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded-md w-1/3" />
                <div className="h-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-md w-1/2" />
                <div className="h-4 bg-orange-100 dark:bg-orange-500/10 rounded-md w-20 mt-2" />
              </div>
            </div>
            <div className="w-12 h-12 bg-zinc-900 dark:bg-zinc-800 rounded-[20px]" />
          </div>
        ))}
      </div>

      {/* Shimmer effect keyframes */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -468px 0; }
          100% { background-position: 468px 0; }
        }
        .animate-shimmer {
          background: linear-gradient(to right, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%);
          background-size: 800px 104px;
          animation: shimmer 2s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default FoodDetailsSkeleton;
