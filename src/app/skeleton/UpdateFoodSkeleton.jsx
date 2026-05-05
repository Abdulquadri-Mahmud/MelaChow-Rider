"use client";
import { motion } from "framer-motion";
import { RefreshCcw, Utensils } from "lucide-react";
import React from "react";

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

export default function UpdateFoodSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 transition-colors">
      {/* TOP BAR */}
      <div className="max-w-5xl mx-auto mb-3 animate-pulse">
        <div className="relative bg-white rounded-xl p-3 mb-3 shadow">
          <div className="flex items-center flex-col gap-4">
            <div className="bg-orange-500/20 p-3 rounded-full">
              <Utensils className="text-gray-400" />
            </div>
            <div className="space-y-2 text-center">
              <div className="h-6 bg-gray-200 rounded w-48 mx-auto"></div>
              <div className="h-3 bg-gray-200 rounded w-64 mx-auto"></div>
            </div>
          </div>

          <button className="absolute top-2 left-2 px-4 py-2 bg-orange-200 text-white rounded-md flex items-center gap-2 cursor-not-allowed">
            <RefreshCcw className="animate-spin text-orange-500" />
          </button>

          <div className="flex items-center gap-3">
            <div className="absolute top-2 right-2 h-8 w-20 bg-orange-200 rounded-tl-2xl rounded-br-2xl"></div>
          </div>
        </div>
      </div>

      {/* MAIN FORM SKELETON */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={shimmer}
        className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-4 sm:p-6 space-y-8"
      >
        {/* Basic Info */}
        <div className="space-y-3">
          <div className="h-5 w-40 bg-gray-200 rounded"></div>
          <div className="h-10 w-full bg-gray-200 rounded"></div>
          <div className="h-20 w-full bg-gray-200 rounded"></div>
        </div>

        {/* Pricing */}
        <div className="space-y-3">
          <div className="h-5 w-48 bg-gray-200 rounded"></div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="h-10 w-full bg-gray-200 rounded"></div>
        </div>

        {/* Tags */}
        <div className="space-y-3">
          <div className="h-5 w-40 bg-gray-200 rounded"></div>
          <div className="h-10 w-full bg-gray-200 rounded"></div>
          <div className="flex gap-2 flex-wrap">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-6 w-16 bg-gray-200 rounded-full"></div>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="space-y-3">
          <div className="h-5 w-36 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="h-24 bg-gray-200 rounded-lg"></div>
            <div className="col-span-2 flex flex-wrap gap-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-28 h-28 bg-gray-200 rounded-lg"
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="space-y-3">
          <div className="h-5 w-32 bg-gray-200 rounded"></div>
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-gray-200 rounded-lg border-dashed border-2 border-gray-300"
              ></div>
            ))}
          </div>
          <div className="h-6 w-56 bg-gray-200 rounded"></div>
        </div>

        {/* Meta Row */}
        <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-4">
          <div className="h-10 w-24 bg-gray-200 rounded"></div>
          <div className="h-10 w-24 bg-gray-200 rounded"></div>
          <div className="h-10 w-32 bg-gray-200 rounded"></div>
        </div>
      </motion.div>
    </div>
  );
}
