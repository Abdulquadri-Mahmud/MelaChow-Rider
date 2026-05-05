"use client";

import { motion } from "framer-motion";

export default function VendorCardSkeleton() {
  const shimmer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        repeat: Infinity,
        repeatType: "reverse",
      },
    },
  };

  return (
    <motion.div
      variants={shimmer}
      initial="hidden"
      animate="visible"
      className="bg-white rounded-xl shadow-sm p-4 w-full max-w-md border border-gray-100"
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-gray-200 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />

        {/* Vendor Info */}
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-2/3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
          <div className="h-3 bg-gray-200 rounded w-1/2 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
        </div>
      </div>

      {/* Details */}
      <div className="mt-4 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
        <div className="h-3 bg-gray-200 rounded w-5/6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
        <div className="h-3 bg-gray-200 rounded w-4/6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
      </div>

      {/* Button */}
      <div className="mt-4 h-9 bg-gray-200 rounded-lg w-1/3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
    </motion.div>
  );
}
