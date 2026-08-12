"use client";

import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

function readStoredCart() {
  if (typeof window === "undefined") return [];

  try {
    const savedCart = window.localStorage.getItem("shopcraft_cart");
    if (!savedCart) return [];
    const parsed = JSON.parse(savedCart);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to parse cart data", err);
    return [];
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    setCart(readStoredCart());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("shopcraft_cart", JSON.stringify(cart));
    }
  }, [cart]);

  const isInCart = (productId) => {
    if (!productId) return false;
    return cart.some((item) => item.product && item.product._id === productId);
  };

  const getCartItemQty = (productId) => {
    if (!productId) return 0;
    const item = cart.find((it) => it.product && it.product._id === productId);
    return item ? item.quantity : 0;
  };

  const addToCart = (product, quantity = 1) => {
    if (!product || !product._id) {
      return { success: false, message: "Invalid product" };
    }

    const qty = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
    const itemQty = getCartItemQty(product._id);
    const stock = Number(product.stock);

    if (Number.isFinite(stock) && itemQty + qty > stock) {
      return {
        success: false,
        message: `Only ${stock} item(s) available in stock`,
        alreadyInCart: itemQty > 0,
      };
    }

    
    
    const existingIndex = cart.findIndex((item) => item.product?._id === product._id);
    const addedNew = existingIndex === -1;

    setCart((prevCart) => {
      const idx = prevCart.findIndex((item) => item.product?._id === product._id);
      if (idx > -1) {
        const updated = [...prevCart];
        updated[idx] = {
          ...updated[idx],
          quantity: (updated[idx].quantity || 0) + qty,
        };
        return updated;
      }

      return [
        ...prevCart,
        {
          product,
          quantity: qty,
          vendorId: product.vendor?._id || product.vendor,
        },
      ];
    });

    return {
      success: true,
      alreadyInCart: !addedNew,
      message: addedNew ? "Added to cart" : "Quantity updated",
    };
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product && item.product._id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const item = cart.find((it) => it.product && it.product._id === productId);
    const stock = Number(item?.product?.stock);
    const nextQuantity = Number.isFinite(stock) && newQuantity > stock ? stock : newQuantity;

    setCart((prevCart) =>
      prevCart.map((item) => (item.product && item.product._id === productId ? { ...item, quantity: nextQuantity } : item))
    );
  };

  const clearCart = () => setCart([]);

  const getCartTotal = () =>
    cart.reduce((total, item) => {
      const price = Number(item?.product?.price);
      if (!Number.isFinite(price)) return total;
      return total + price * (item.quantity || 1);
    }, 0);

  const getCartCount = () => cart.reduce((count, item) => count + (item.quantity || 0), 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount, isInCart, getCartItemQty }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
export default CartProvider;
