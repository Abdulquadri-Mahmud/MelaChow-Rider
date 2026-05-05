// /context-api/CartContext.js
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import showAnimatedToast from "../components/toast/showAnimatedToast";

const CartContext = createContext({
  cart: [],
  addToCart: () => {},
  addComboToCart: () => {},
  increaseQuantity: () => {},
  decreaseQuantity: () => {},
  removeFromCart: () => {},
  removeRestaurantFromCart: () => {},
  updateCartItem: () => {},
  clearCart: () => {},
});

const proceedToCartAction = {
  label: "Proceed to cart / checkout",
  href: "/orders?activeTab=cart",
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    return {
      cart: [],
      addToCart: () => {},
      addComboToCart: () => {},
      increaseQuantity: () => {},
      decreaseQuantity: () => {},
      removeFromCart: () => {},
      removeRestaurantFromCart: () => {},
      updateCartItem: () => {},
      clearCart: () => {},
    };
  }
  return context;
};

// Helper to compare if two items are functionally identical
const isSameItem = (a, b) => {
  if (!a || !b) return false;
  if (a.type !== b.type) return false;
  
  if (a.type === "combo") {
    return (a.comboId || a.variantId) === (b.comboId || b.variantId);
  }

  if (a.foodId !== b.foodId || a.portionId !== b.portionId) return false;

  const optA = a.selected_options || [];
  const optB = b.selected_options || [];
  if (optA.length !== optB.length) return false;

  // Compare options (order doesn't matter, so we sort or check existence)
  const sortedA = [...optA].sort((x, y) => (x.option_id || "").localeCompare(y.option_id || ""));
  const sortedB = [...optB].sort((x, y) => (x.option_id || "").localeCompare(y.option_id || ""));

  for (let i = 0; i < sortedA.length; i++) {
    if (sortedA[i].option_id !== sortedB[i].option_id) return false;
    if (sortedA[i].quantity !== sortedB[i].quantity) return false;
  }

  return true;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    if (typeof window === "undefined") return [];

    const stored = localStorage.getItem("melachowCart");
    if (!stored) return [];

    try {
      const parsed = JSON.parse(stored);
      return parsed.map(item => ({
        ...item,
        cartId: item.cartId || `${Date.now()}-${Math.random()}`
      }));
    } catch {
      return [];
    }
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Store cart to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("melachowCart", JSON.stringify(cart));
    }
  }, [cart]);

  // Add item
  const addToCart = (item) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(c => isSameItem(c, item));

      if (existingIndex > -1) {
        const newCart = [...prev];
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newCart[existingIndex].quantity + (item.quantity || 1)
        };
        showAnimatedToast("success", "Item quantity updated", "cart-qty-inc", proceedToCartAction);
        return newCart;
      }

      showAnimatedToast("success", "Item added to cart", "cart-add", proceedToCartAction);
      return [...prev, { ...item, cartId: `${Date.now()}-${Math.random()}` }];
    });
  };

  // Add Combo
  const addComboToCart = (comboItem) => {
    const newItem = {
        ...comboItem,
        type:     "combo",
        quantity: comboItem.quantity || 1,
        cartId:   `${Date.now()}-${Math.random()}`
    };
    setCart(prev => [...prev, newItem]);
    showAnimatedToast("success", `${comboItem.name} added to cart`, "cart-add-combo", proceedToCartAction);
  };

  // Increase Quantity
  const increaseQuantity = (foodId, portionId, comboId, cartId) => {
    setCart((prev) =>
      prev.map((item) => {
        const isMatch = cartId 
          ? item.cartId === cartId 
          : item.type === "combo"
            ? (item.comboId === comboId || item.variantId === comboId)
            : item.foodId === foodId && item.portionId === portionId;

        return isMatch ? { ...item, quantity: item.quantity + 1 } : item;
      })
    );
    showAnimatedToast("success", "Quantity increased", "cart-qty-inc");
  };

  // Decrease Quantity
  const decreaseQuantity = (foodId, portionId, comboId, cartId) => {
    setCart((prev) => {
      const itemToUpdate = prev.find(item => 
        cartId 
          ? item.cartId === cartId 
          : item.type === "combo"
            ? (item.comboId === comboId || item.variantId === comboId)
            : item.foodId === foodId && item.portionId === portionId
      );

      if (!itemToUpdate) return prev;

      if (itemToUpdate.quantity > 1) {
        showAnimatedToast("success", "Quantity decreased", "cart-qty-dec");
        return prev.map(item => 
          item.cartId === itemToUpdate.cartId 
            ? { ...item, quantity: item.quantity - 1 } 
            : item
        );
      } else {
        showAnimatedToast("error", "Item removed from cart", "cart-remove");
        return prev.filter(item => item.cartId !== itemToUpdate.cartId);
      }
    });
  };

  // Remove item
  const removeFromCart = (foodId, portionId, comboId, cartId) => {
    setCart((prev) =>
      prev.filter((item) => {
        const isMatch = cartId 
          ? item.cartId === cartId
          : item.type === "combo"
            ? (item.comboId === comboId || item.variantId === comboId)
            : item.foodId === foodId && item.portionId === portionId;
        return !isMatch;
      })
    );
    showAnimatedToast("error", "Item removed from cart", "cart-remove");
  };

  const removeRestaurantFromCart = (restaurantId) => {
    setCart((prev) =>
      prev.filter((item) => (item.vendorId || item.restaurantId) !== restaurantId)
    );
  };

  // Update item (for editing options)
  const updateCartItem = (foodId, portionId, updatedItem, cartId) => {
    setCart((prev) => {
      // 1. Remove the old item by its unique cartId
      const filtered = prev.filter(c => c.cartId !== cartId);

      // 2. Check if the updated item (with its new options) already exists elsewhere in the cart
      const existingIndex = filtered.findIndex(c => isSameItem(c, updatedItem));

      if (existingIndex > -1) {
        // Merge quantities if an identical item exists
        const newCart = [...filtered];
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newCart[existingIndex].quantity + (updatedItem.quantity || 1)
        };
        return newCart;
      } else {
        // Otherwise add the updated item as a new entry (reusing the same cartId is fine)
        return [...filtered, { ...updatedItem, cartId: cartId || `${Date.now()}-${Math.random()}` }];
      }
    });
    showAnimatedToast("success", "Cart updated", "cart-update");
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    showAnimatedToast("success", "Cart cleared", "cart-clear");
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isModalOpen,
        setIsModalOpen,
        addToCart,
        addComboToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        removeRestaurantFromCart,
        updateCartItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};



