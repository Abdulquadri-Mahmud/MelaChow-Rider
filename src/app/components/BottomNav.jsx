"use client";

import { motion } from "framer-motion";
import { Home, Search, ShoppingCart, Headset, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useUserStorage } from "../hooks/useUserStorage";
import { useFoodModalStore } from "../store/foodModalStore";
import { useComboModalStore } from "../store/comboModalStore";

const navItems = [
  { name: "Home", href: "/home", icon: Home },
  { name: "Search", href: "/search", icon: Search },
  { name: "Order", href: "/orders", icon: ShoppingCart },
  { name: "Support", href: "/support", icon: Headset },
  { name: "Profile", href: "/profile", icon: User },
];

export default function BottomBar() {
  const pathname = usePathname();
  const { cart, isModalOpen } = useCart();
  const { user, isLoading } = useUserStorage();
  const { isOpen: isFoodModalOpen } = useFoodModalStore();
  const { isOpen: isComboModalOpen } = useComboModalStore();

  // Hide the bottom nav when the customization modal is open,
  // or on specific pages (Restaurant Storefront, Food/Combo Details, Checkout)
  const isFoodDetailsPage = pathname.startsWith("/food-details/");
  const isComboDetailsPage = pathname.startsWith("/combo-details/");
  const isCheckoutPage = pathname === "/checkout";
  
  // Also hide if logged in but no addresses (mandatory address modal state)
  const isNoAddress = !isLoading && user && user?.addresses?.length === 0;

  if (
    isModalOpen ||
    isFoodModalOpen ||
    isComboModalOpen ||
    isFoodDetailsPage ||
    isComboDetailsPage ||
    isCheckoutPage ||
    isNoAddress
  ) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 px-0 md:max-w-md md:mx-auto z-[9999]">
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative bg-white dark:bg-zinc-900/80 backdrop-blur-2xl border border-gray-200/50 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-t-[32px] px-2 py-3"
      >
        <div className="flex justify-between items-center relative">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const isOrder = item.name === "Order";

            return (
              <Link
                key={item.name}
                href={item.href}
                className="relative flex-1 group"
              >
                <div className="flex flex-col items-center justify-center py-1">
                  <motion.div
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ scale: 1.05 }}
                    className="relative z-10"
                  >
                    {/* Active Background Pill (Subtle) */}
                    {isActive && !isOrder && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 -m-2 rounded-2xl"
                        transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                      />
                    )}

                    <div className={`flex flex-col items-center gap-1 transition-all duration-300 ${isOrder
                        ? "-mt-10"
                        : isActive
                          ? "text-orange-500"
                          : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                      }`}>
                      {isOrder ? (
                        <div className="relative">
                          {/* Animated ring for Order button */}
                          <motion.div
                            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.2, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute rounded-full"
                          />
                          <div className="bg-gradient-to-tr from-orange-400 to-orange-600 p-3 rounded-full shadow-[0_8px_20px_rgba(249,115,22,0.4)] text-white relative z-20 hover:rotate-[10deg] transition-transform">
                            <Icon size={24} strokeWidth={2.5} />
                          </div>
                        </div>
                      ) : (
                        <Icon
                          size={22}
                          strokeWidth={isActive ? 2.5 : 2}
                          className="transition-all"
                        />
                      )}

                      <span className={`text-[10px] font-black uppercase tracking-widest leading-none mt-1 transition-all ${isOrder
                          ? "text-orange-600 translate-y-2 opacity-100"
                          : isActive
                            ? "opacity-100 translate-y-0"
                            : "opacity-40 group-hover:opacity-70"
                        }`}>
                        {item.name}
                      </span>
                    </div>

                    {/* Active Dot Selector */}
                    {isActive && !isOrder && (
                      <motion.div
                        layoutId="activeDot"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                      />
                    )}
                  </motion.div>

                  {/* Cart Badge - Refined */}
                  {isOrder && cart.length > 0 && (
                    <motion.div
                      key={cart.length}
                      initial={{ scale: 0, y: 10 }}
                      animate={{ scale: 1, y: 0 }}
                      className="absolute -top-10 right-[22%] z-30"
                    >
                      <div className="bg-white dark:bg-slate-900 text-orange-600 text-[10px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full shadow-lg ring-2 ring-orange-500/20 border border-orange-100 dark:border-orange-500/30 px-1">
                        {cart.length}
                      </div>
                    </motion.div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </motion.nav>
    </div>
  );
}
