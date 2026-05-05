"use client";

import HomeFoodListSkeleton from "./HomeFoodListSkeleton";

export default function SearchFoodSkeleton({ items = 6 }) {
  // Use the refined HomeFoodListSkeleton for consistent search results look
  return <HomeFoodListSkeleton categories={2} itemsPerCategory={3} />;
}
