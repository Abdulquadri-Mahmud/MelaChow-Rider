"use client";

export default function CheckoutPageSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-28 animate-pulse">
      {/* Header Placeholder */}
      <div className="h-[72px] bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 shadow-sm"></div>

      <div className="max-w-xl mx-auto p-4 space-y-4 mt-2">
        {/* Notice skeleton */}
        <div className="h-10 bg-zinc-200 dark:bg-zinc-900 rounded-xl w-full"></div>

        {/* Address block */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
            <div className="h-3 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
          </div>
        </div>

        {/* Delivery info */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
            <div className="h-3 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
          </div>
        </div>

        {/* Items list */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-50 dark:border-zinc-800/50">
            <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
            <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
          </div>

          {[1, 2].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="w-14 h-14 bg-zinc-200 dark:bg-zinc-800 rounded-xl flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
                <div className="h-3 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
                <div className="h-3 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-zinc-900 dark:bg-zinc-800 p-6 rounded-2xl space-y-5 shadow-xl">
          <div className="flex justify-between">
            <div className="h-3 w-20 bg-white/10 rounded-md"></div>
            <div className="h-3 w-16 bg-white/10 rounded-md"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-3 w-24 bg-white/10 rounded-md"></div>
            <div className="h-3 w-20 bg-white/10 rounded-md"></div>
          </div>
          <div className="pt-4 border-t border-white/10 flex justify-between items-center">
            <div className="h-6 w-16 bg-white/10 rounded-md"></div>
            <div className="h-6 w-24 bg-white/20 rounded-md"></div>
          </div>
        </div>
      </div>

      {/* Bottom Fixed Checkout Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800 p-2 z-40">
        <div className="max-w-xl mx-auto w-full bg-zinc-200 dark:bg-zinc-800 h-[68px] rounded-2xl shadow-xl"></div>
      </div>
    </div>
  );
}
