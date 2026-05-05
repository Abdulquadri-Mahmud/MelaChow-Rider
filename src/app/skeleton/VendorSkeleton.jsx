"use client";

export default function VendorSkeleton() {
  return (
    <div className="px-3 pb-24 space-y-6 animate-pulse">
      {/* 🏪 Vendor Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 shimmer" />

          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 shimmer" />
            <div className="h-3 w-28 rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 shimmer" />
            <div className="h-3 w-20 rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 shimmer" />
          </div>
        </div>
      </div>

      {/* 🍽️ Foods */}
      <div className="space-y-3">
        <div className="h-4 w-32 rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 shimmer" />

        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-xl p-2 space-y-2"
            >
              {/* Image */}
              <div className="w-full h-28 rounded-lg bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 shimmer" />

              {/* Food name */}
              <div className="h-3 w-3/4 rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 shimmer" />

              {/* Price */}
              <div className="h-3 w-1/3 rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
