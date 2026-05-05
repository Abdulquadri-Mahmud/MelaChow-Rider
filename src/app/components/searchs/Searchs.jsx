"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  Flame, 
  MapPin, 
  Search, 
  SlidersHorizontal, 
  Store, 
  Truck, 
  ArrowLeft, 
  Star, 
  Plus,
  Heart,
  Globe,
  Bike,
  Sparkles
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApi } from "@/app/context/ApiContext";
import Link from "next/link";
import NoFoodsFound from "../NoFoodsFound";
import SearchFoodSkeleton from "@/app/skeleton/SearchFoodSkeleton";
import { isVendorOpen } from "@/app/lib/utils";
import { useCategories } from "@/app/hooks/useCategories";
import { useFoodModalStore } from "@/app/store/foodModalStore";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";

export const dynamic = "force-dynamic";

const DIETARY_COLORS = {
  veg: "bg-green-500 text-white shadow-lg shadow-green-500/20",
  vegan: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
  halal: "bg-teal-500 text-white shadow-lg shadow-teal-500/20",
  kosher: "bg-blue-500 text-white shadow-lg shadow-blue-500/20",
  "non-veg": "bg-red-500 text-white shadow-lg shadow-red-500/20",
};

const FoodItemRow = ({ food }) => {
    // Explicitly handle undefined/null as true for availability to prevent false 'Sold Out' states
    const isAvailable = food.is_available !== false;
    const isInStock = food.is_in_stock !== false;
    const isUnavailable = !isAvailable || !isInStock;

    const vendor = food.restaurant || food.vendor;
    const price = food.portions?.min_price_naira || food.portions?.default_price_naira || food.price || 0;
    const oldPrice = food.old_price || (price * 1.2);
    const openFoodModal = useFoodModalStore(state => state.openFoodModal);

    console.log('Food Item Data:', { name: food.name, is_available: food.is_available, is_in_stock: food.is_in_stock, isUnavailable });

    return (
        <div 
            onClick={() => !isUnavailable && openFoodModal(food._id, { food })}
            className={`group flex items-center gap-4 py-4 border-b border-zinc-100 dark:border-zinc-800/70 last:border-0 cursor-pointer active:scale-[0.99] transition-all duration-200 ${isUnavailable ? 'opacity-50 grayscale pointer-events-none' : ''}`}
        >
            {/* Text Content */}
            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-extrabold text-zinc-900 dark:text-white tracking-tight truncate group-hover:text-orange-600 transition-colors duration-200 uppercase italic">
                        {food.name}
                    </h3>
                    {food.is_popular && <Flame size={13} className="text-orange-500 shrink-0 animate-pulse" />}
                </div>

                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest truncate mb-1">
                    {vendor?.storeName} • {vendor?.city || vendor?.address?.city || "Nearby"}
                </p>

                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed font-medium">
                    {food?.description || "Freshly prepared with premium ingredients."}
                </p>

                <div className="flex items-center gap-3 pt-1">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-black text-orange-600">₦{price.toLocaleString()}</span>
                        {oldPrice > price && (
                            <span className="text-[11px] text-zinc-400 line-through font-medium">₦{Math.round(oldPrice).toLocaleString()}</span>
                        )}
                    </div>
                    <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-800" />
                    <div className="flex items-center gap-1">
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        <span className="text-[11px] font-black text-zinc-600 dark:text-zinc-400">
                            {Number(food.rating || vendor?.rating || 0).toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Image + Add Button */}
            <div className="relative w-[100px] h-[100px] rounded-2xl overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800 shadow-md group-hover:shadow-orange-200 dark:group-hover:shadow-orange-900/30 transition-shadow duration-300">
                <img 
                    src={food.image || "/placeholder.jpg"} 
                    alt={food.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = '/placeholder.jpg'; e.target.onerror = null; }}
                />

                {/* Add Button */}
                {!isUnavailable && (
                    <div className="absolute bottom-1.5 right-1.5">
                        <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/40 group-active:scale-90 transition-transform">
                            <Plus size={16} strokeWidth={3} />
                        </div>
                    </div>
                )}

                {isUnavailable && (
                    <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="bg-white/95 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest text-zinc-800">
                            Sold Out
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function FoodSearchMobile() {
  const { baseUrl } = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [foods, setFoods] = useState([]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState(null);
  const [trending, setTrending] = useState([]);
  const [autocomplete, setAutocomplete] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const selectedCategory = searchParams.get("category");

  const { data: categories = [] } = useCategories();

  // Hydration
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Fetch trending searches
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await axios.get(`${baseUrl}/search/food/trending`, {
          params: { limit: 8 },
          withCredentials: true,
        });
        setTrending(res.data.trending || []);
      } catch (err) {
        console.error("Trending Error:", err);
      }
    };
    fetchTrending();
  }, [baseUrl]);

  // Fetch foods based on category or query
  useEffect(() => {
    if (!hydrated) return;

    const fetchFoods = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simple params — category filtering is done on the frontend
        const params = query.trim() ? { q: query } : { q: '' };

        const res = await axios.get(`${baseUrl}/search/food/search`, {
          params,
          withCredentials: true,
        });
        setFoods(res.data.data || []);
      } catch (err) {
        console.error("Fetch Foods Error:", err?.response?.data || err.message || err);
        setError("Failed to load foods. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFoods();
  }, [baseUrl, hydrated, query]);

  // Autocomplete
  useEffect(() => {
    const fetchSearch = async () => {
      const sanitizedQuery = (query || "").trim();

      if (sanitizedQuery.length < 2) {
        setAutocomplete([]);
        setShowDropdown(false);
        return;
      }

      try {
        const res = await axios.get(`${baseUrl}/search/food/autocomplete`, {
          params: { q: sanitizedQuery },
          withCredentials: true,
        });

        setAutocomplete(res.data?.suggestions || []);
        setShowDropdown(true);
      } catch (err) {
        console.error("Autocomplete Error:", err);
        setAutocomplete([]);
        setShowDropdown(false);
      }
    };

    const timeout = setTimeout(fetchSearch, 300);
    return () => clearTimeout(timeout);
  }, [query, baseUrl]);

  // Click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Category grouping — always use all foods, filtered client-side by selectedCategory
  const displayedFoods = useMemo(() => {
    if (!selectedCategory || !foods.length) return foods;
    const lower = selectedCategory.toLowerCase();
    return foods.filter(food => {
      const childName = food.platform_category?.name?.toLowerCase() || '';
      const parentName = food.platform_category?.parent?.name?.toLowerCase() || '';
      return childName === lower || parentName === lower;
    });
  }, [foods, selectedCategory]);

  const foodsByCategory = useMemo(() => {
    if (!Array.isArray(displayedFoods) || displayedFoods.length === 0) return {};
    return displayedFoods.reduce((acc, food) => {
      const primaryCategory = food.platform_category?.parent?.name 
        || food.platform_category?.name
        || (Array.isArray(food.categories) && food.categories[0])
        || food.category
        || "Others";
      if (!acc[primaryCategory]) acc[primaryCategory] = [];
      acc[primaryCategory].push(food);
      return acc;
    }, {});
  }, [displayedFoods]);

  // Category click — just updates the URL; filtering is handled by displayedFoods memo
  const handleCategoryClick = async (category) => {
    if (activeCategory === category) {
      setActiveCategory("");
      router.push("?");
      return;
    }
    setActiveCategory(category);
    setQuery("");
    router.push(`?category=${encodeURIComponent(category)}`);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Search submit
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // Dropdown selection
  const handleDropdownSelect = async (value, type) => {
    setQuery(value);
    setShowDropdown(false);

    if (type === "category") {
      handleCategoryClick(value);
    }
    
    // Keep focus
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20 selection:bg-orange-500/30">
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* 🎭 Premium Floating Search Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-b border-zinc-200/50 dark:border-zinc-800/50 transition-all duration-300">
        <div className="max-w-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => router.back()}
              className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-800 transition-colors hover:text-orange-500"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </motion.button>

            <div className="flex flex-col items-center">
                <span className="text-[9px] font-black uppercase text-orange-500 tracking-[0.2em] italic opacity-70 leading-none mb-1">Explore</span>
                <h1 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase italic tracking-tighter leading-none">Cravings</h1>
            </div>

            <motion.button 
                whileHover={{ rotate: 180 }}
                className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-zinc-400 border border-zinc-200/50 dark:border-zinc-800"
            >
                <Sparkles size={20} />
            </motion.button>
          </div>

          {/* 🔍 Elite Search Bar */}
          <div className="relative">
            <form onSubmit={handleSearchSubmit} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-3xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
              
              <div className="relative flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 h-14 px-4 rounded-2xl transition-all duration-300 group-focus-within:border-orange-500/50 group-focus-within:shadow-2xl group-focus-within:shadow-orange-500/10">
                <Search size={20} className="text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="What's your mood today?"
                  className="flex-1 outline-none bg-transparent text-sm font-bold text-zinc-800 dark:text-zinc-100 placeholder-zinc-400/70"
                  value={query || ""}
                  onChange={(e) => {
                    setQuery(e.target.value || "");
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  autoFocus
                />

                <div className="flex items-center gap-2">
                    <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
                    <button type="button" className="p-2 text-zinc-400 hover:text-orange-500">
                        <SlidersHorizontal size={18} strokeWidth={2.5} />
                    </button>
                </div>
              </div>

              {/* 💧 Dropdown */}
              <AnimatePresence>
                {showDropdown && (autocomplete.length > 0 || trending.length > 0) && (
                  <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 w-full bg-white/95 dark:bg-zinc-950/95 backdrop-blur-3xl border border-zinc-200 dark:border-zinc-800/80 mt-4 rounded-3xl z-[60] shadow-2xl shadow-black/20 overflow-hidden"
                  >
                    <div className="p-3">
                        {autocomplete.length > 0 && (
                        <div className="mb-4">
                            <div className="px-4 py-2 flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 italic">Matching Now</span>
                            </div>
                            <div className="space-y-1">
                            {autocomplete.map((item, idx) => (
                                <motion.div
                                    key={`auto-${idx}`}
                                    whileHover={{ x: 4 }}
                                    onClick={() => handleDropdownSelect(item.name, "autocomplete")}
                                    className="px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl cursor-pointer text-zinc-800 dark:text-zinc-200 text-sm flex items-center gap-3 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 ">
                                        <Search size={14} />
                                    </div>
                                    <span className="font-bold">{item.name}</span>
                                </motion.div>
                            ))}
                            </div>
                        </div>
                        )}

                        {trending.length > 0 && (
                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/50">
                            <div className="px-4 py-2 flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">🔥 Buzzing Searches</span>
                            </div>
                            <div className="flex flex-wrap gap-2 px-3 pb-2">
                            {trending.map((trend) => (
                                <motion.div
                                    key={`trend-${trend._id}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDropdownSelect(trend.keyword, "trending")}
                                    className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:border-orange-500/40 hover:text-orange-600 cursor-pointer text-[11px] font-black uppercase tracking-tight flex items-center gap-2 transition-all"
                                >
                                    <Flame size={12} className="text-orange-500" />
                                    <span>{trend.keyword}</span>
                                </motion.div>
                            ))}
                            </div>
                        </div>
                        )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>

        {/* 🚀 Category Pill Navigation (Horizontal Segmented Style) */}
        <div className="max-w-xl mx-auto border-t border-zinc-100 dark:border-zinc-900">
          <div className="flex scroll overflow-x-auto no-scrollbar gap-2 py-4 px-2 items-center">
            {categories.map((category) => (
              <motion.button
                key={category._id}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleCategoryClick(category.name)}
                className={`relative px-6 py-2.5 rounded-2xl whitespace-nowrap transition-all duration-500 text-[11px] font-black uppercase tracking-wider
                  ${activeCategory === category.name
                    ? "text-white"
                    : "text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900/50 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  }
                `}
              >
                {activeCategory === category.name && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-orange-600 rounded-2xl shadow-lg shadow-orange-500/30"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{category.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* 📊 Refinement Toolbar / Result Counter */}
      <div className="max-w-xl mx-auto px-2 pt-6">
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-end justify-between border-b border-zinc-200/50 dark:border-zinc-800 pb-3"
          >
              <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest leading-none mb-1">
                      {query ? `Results for "${query}"` : 'Discovery Feed'}
                  </span>
                  <p className="text-sm font-black text-zinc-900 dark:text-white italic tracking-tighter">
                      <span className="text-orange-500">{displayedFoods.length}</span> exquisite items found
                  </p>
              </div>

              <div className="flex items-center gap-1 text-[10px] font-black text-zinc-400 uppercase tracking-widest px-3 py-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                  Sort: <span className="text-zinc-900 dark:text-zinc-200">Relevance</span>
              </div>
          </motion.div>
      </div>

      {/* 🍱 Results Feed */}
      <div className="max-w-xl mx-auto mt-6">
        {loading ? (
          <div className="px-2">
            <SearchFoodSkeleton items={6} />
          </div>
        ) : displayedFoods.length === 0 ? (
          <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
            <NoFoodsFound />
          </div>
        ) : (
          <div className="space-y-4 pb-24 px-4 overflow-hidden">
            <AnimatePresence mode="popLayout">
                {Object.entries(foodsByCategory).map(([category, categoryFoods], sectionIdx) => (
                <motion.div 
                    key={category} 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: sectionIdx * 0.1 }}
                    className="relative"
                >
                    {/* Floating Glow in Background */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex flex-col">
                           <h2 className="text-2xl font-black text-zinc-950 dark:text-zinc-50 tracking-tighter uppercase italic leading-none">
                                {category}
                            </h2>
                        </div>
                    </div>

                    <div className="flex flex-col">
                    {categoryFoods.map((food, foodIdx) => (
                        <motion.div 
                            key={food._id} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: (sectionIdx * 0.1) + (foodIdx * 0.05) }}
                        >
                            <FoodItemRow food={food} />
                        </motion.div>
                    ))}
                    </div>
                </motion.div>
                ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="fixed bottom-18 right-6 z-50">
        <button 
           onClick={() => router.push('/home')}
           className="bg-orange-500 text-white rounded-full p-4 hover:bg-orange-600 transition-all hover:scale-110 active:scale-95 shadow-2xl shadow-orange-500/40"
        >
          <Store size={24} />
        </button>
      </div>
    </div>
  );
}
