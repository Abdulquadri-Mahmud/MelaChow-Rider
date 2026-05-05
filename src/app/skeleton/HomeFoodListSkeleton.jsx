"use client";

// Skeleton with shimmer
const Skeleton = ({ width = "100%", height = 24, className = "" }) => (
  <div
    className={`relative overflow-hidden bg-zinc-200 dark:bg-zinc-800 rounded ${className}`}
    style={{ width, height }}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 animate-shimmer"></div>
  </div>
);

export default function HomeFoodListSkeleton({ categories = 2, itemsPerCategory = 3 }) {
  return (
    <div className="space-y-8 flex-1 bg-zinc-50 dark:bg-zinc-950">
      {Array.from({ length: categories }).map((_, catIdx) => (
        <div key={catIdx} className="px-0">
          {/* Header Skeleton */}
          <div className="flex items-center gap-2 px-4 mb-4">
             <Skeleton width={4} height={20} className="rounded-full bg-orange-500" />
             <Skeleton width={catIdx % 2 === 0 ? 120 : 80} height={20} className="rounded-md" />
          </div>

          <div className="flex gap-4 scroll overflow-x-auto px-4 pb-4 no-scrollbar">
            {Array.from({ length: itemsPerCategory }).map((_, itemIdx) => (
              <div
                key={itemIdx}
                className="flex-shrink-0 bg-white dark:bg-zinc-900 rounded-[16px] overflow-hidden border border-zinc-100 dark:border-zinc-800"
                style={{ width: "72vw", maxWidth: "280px" }}
              >
                <div className="relative">
                  <Skeleton height={130} />
                </div>
                <div className="px-3 pt-2.5 pb-3 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <Skeleton width="70%" height={16} className="rounded-md" />
                    <Skeleton width={20} height={20} className="rounded-full" />
                  </div>
                  <Skeleton width={itemIdx % 3 === 0 ? "40%" : itemIdx % 3 === 1 ? "55%" : "30%"} height={12} className="rounded-md" />
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-zinc-50 dark:border-zinc-800">
                    <Skeleton width={20} height={12} className="rounded-sm" />
                    <Skeleton width={40} height={12} className="rounded-sm" />
                    <Skeleton width={30} height={12} className="rounded-sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
