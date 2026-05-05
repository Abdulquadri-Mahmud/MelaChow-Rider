"use client";

export function OrderCardSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl md:p-5 p-3 animate-pulse space-y-3 border border-zinc-100 dark:border-zinc-800">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-zinc-300 dark:bg-zinc-800 rounded-full"></div>
          <div className="w-32 h-5 bg-zinc-300 dark:bg-zinc-800 rounded"></div>
        </div>
        <div className="flex gap-2">
          <div className="w-16 h-4 bg-zinc-300 dark:bg-zinc-800 rounded-full"></div>
          <div className="w-12 h-4 bg-zinc-300 dark:bg-zinc-800 rounded-full"></div>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="w-24 h-4 bg-zinc-300 dark:bg-zinc-800 rounded"></div>
        <div className="w-20 h-4 bg-zinc-300 dark:bg-zinc-800 rounded"></div>
      </div>
      <div className="flex justify-between items-center mt-2">
        <div className="w-32 h-3 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
        <div className="w-16 h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
      </div>
    </div>
  );
}
