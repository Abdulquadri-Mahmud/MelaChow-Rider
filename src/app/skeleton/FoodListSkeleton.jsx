"use client";
import { motion } from "framer-motion";

export default function FoodListSkeleton() {
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

  // Simulate multiple cards
  const skeletonArray = Array(6).fill(null);

  return (
    <div className="space-y-3">

      {/* Stats Skeleton */}
      <div className="grid grid-cols-3 gap-2 mb-8 scroll">
        {Array(3)
          .fill(null)
          .map((_, i) => (
            <motion.div
              key={i}
              variants={shimmer}
              initial="hidden"
              animate="visible"
              className="bg-gray-100 p-4 rounded-2xl shadow-sm"
            >
              <div className="h-4 w-16 bg-gray-200 rounded-md mb-2 animate-pulse" />
              <div className="h-6 w-10 bg-gray-300 rounded-md animate-pulse" />
            </motion.div>
          ))}
      </div>

      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-6 w-40 bg-gray-200 rounded-md animate-pulse" />
        <div className="h-8 w-32 bg-gray-200 rounded-md animate-pulse" />
      </div>

      {/* Food Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 scroll gap-6">
        {skeletonArray.map((_, index) => (
          <motion.div
            key={index}
            variants={shimmer}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-2xl scroll shadow-md overflow-hidden"
          >
            {/* Image Skeleton */}
            <div className="relative">
              <div className="w-full h-48 bg-gray-200 animate-pulse" />
            </div>

            {/* Content Skeleton */}
            <div className="p-4">
              <div className="h-4 w-2/3 bg-gray-200 rounded-md mb-2 animate-pulse" />
              <div className="h-3 w-full bg-gray-200 rounded-md mb-3 animate-pulse" />
              <div className="flex justify-between items-center mb-3">
                <div className="h-4 w-16 bg-gray-200 rounded-md animate-pulse" />
                <div className="h-4 w-10 bg-gray-200 rounded-md animate-pulse" />
              </div>

              <div className="flex justify-between items-center mb-4">
                <div className="h-3 w-20 bg-gray-200 rounded-md animate-pulse" />
                <div className="h-3 w-14 bg-gray-200 rounded-md animate-pulse" />
              </div>

              {/* Tags */}
              <div className="flex gap-2 mb-4">
                <div className="h-5 w-10 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-5 w-12 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-5 w-8 bg-gray-200 rounded-full animate-pulse" />
              </div>

              {/* Button */}
              <div className="h-8 w-full bg-gray-300 rounded-md animate-pulse" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
