"use client";

import { motion } from "framer-motion";

const shimmer = {
  hidden: { opacity: 0.5 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      repeat: Infinity,
      repeatType: "reverse",
    },
  },
};

export default function VendorProfileSkeleton() {
  return (
    <div className="max-w-7xl mx-auto min-h-screen space-y-6 relative pb-20">
      {/* Header Skeleton */}
      <motion.div
        className="bg-white p-3 rounded-2xl flex flex-col sm:flex-row items-start md:items-center gap-6"
        variants={shimmer}
        initial="hidden"
        animate="visible"
      >
        <div className="w-24 h-24 rounded-full bg-gray-300" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-1/2 bg-gray-300 rounded" />
          <div className="h-4 w-1/3 bg-gray-300 rounded" />
          <div className="h-4 w-full bg-gray-300 rounded" />
        </div>
        <div className="h-6 w-20 bg-gray-300 rounded" />
      </motion.div>

      {/* Card Skeletons */}
      {["Basic Info", "Address", "Cuisine Types", "Opening Hours", "Payout & Delivery", "Tags", "KYC Documents"].map((section) => (
        <motion.div
          key={section}
          className="bg-white p-4 rounded-2xl space-y-4"
          variants={shimmer}
          initial="hidden"
          animate="visible"
        >
          <div className="h-6 w-1/3 bg-gray-300 rounded" /> {/* Card header */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-300 rounded" />
            <div className="h-4 w-full bg-gray-300 rounded" />
            <div className="h-4 w-3/4 bg-gray-300 rounded" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
