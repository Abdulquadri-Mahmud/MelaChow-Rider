"use client";

import React from "react";

export default function SearchPageSkeleton() {
  const shimmer =
    "relative overflow-hidden bg-gray-200 rounded-lg before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent";

  return (
    <div className="p-3 space-y-6">
      {/* 🔍 Search bar */}
      <div className={`${shimmer} h-10 w-full rounded-xl`} />

      {/* 🔥 Trending section */}
      <div className="space-y-3">
        <div className={`${shimmer} h-6 w-40 rounded-md`} />
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`${shimmer} h-8 w-20 rounded-full`} />
          ))}
        </div>
      </div>

      {/* 🍽️ Category list */}
      <div className="flex overflow-x-auto gap-3 no-scrollbar pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center space-y-2 min-w-[85px]"
          >
            <div className={`${shimmer} w-12 h-12 rounded-full`} />
            <div className={`${shimmer} w-14 h-3 rounded-md`} />
          </div>
        ))}
      </div>

      {/* 🍱 Food cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className={`${shimmer} w-full h-36 rounded-xl`} />
            <div className={`${shimmer} w-3/4 h-4 rounded-md`} />
            <div className={`${shimmer} w-1/2 h-3 rounded-md`} />
            <div className={`${shimmer} w-2/3 h-3 rounded-md`} />
          </div>
        ))}
      </div>

      {/* 🔧 Shimmer animation keyframes */}
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
