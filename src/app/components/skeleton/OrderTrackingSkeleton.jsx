"use client";

import React from "react";

export default function OrderTrackingSkeleton() {
  return (
    <div className="md:p-4 p-2 max-w-md w-full mx-auto bg-white dark:bg-zinc-900 rounded-xl shadow-md space-y-6 animate-pulse border border-zinc-100 dark:border-zinc-800">
      {/* Top Progress Bar */}
      <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>

      {/* Order ID */}
      <div className="h-6 w-3/5 bg-zinc-200 dark:bg-zinc-800 rounded"></div>

      {/* Items */}
      <div className="space-y-2 border-t border-zinc-50 dark:border-zinc-800 pt-4">
        <div className="h-4 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded mb-2"></div>
        {[1, 2].map((_, idx) => (
          <div key={idx} className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-lg">
            <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
              <div className="h-3 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery Address */}
      <div className="space-y-2 border-t border-zinc-50 dark:border-zinc-800 pt-4">
        <div className="h-4 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
        <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded"></div>
        <div className="h-3 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
        <div className="h-3 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
      </div>

      {/* Payment Summary */}
      <div className="space-y-2 border-t border-zinc-50 dark:border-zinc-800 pt-4">
        <div className="h-4 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
        <div className="h-4 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
        <div className="h-5 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
      </div>

      {/* Status Timeline */}
      <div className="border-t border-zinc-50 dark:border-zinc-800 pt-4">
        <div className="h-4 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded mb-4"></div>
        <div className="flex justify-between items-center">
          {[1, 2, 3, 4].map((_, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 mb-2" />
              <div className="h-3 w-10 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
