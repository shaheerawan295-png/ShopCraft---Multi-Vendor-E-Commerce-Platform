"use client";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { Trash2, Plus, Minus, ArrowRight, ShoppingCart } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { formatPrice } from "@/lib/formatPrice";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  if (cart.length === 0) {
    return (
     
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4">
        <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-4 text-slate-400">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6 font-medium">
          Looks like you haven&apos;t added any products to your shopping cart yet.
        </p>
        <Link
          href="/shop"
          className="px-6 py-3.5 bg-black text-white text-xs font-extrabold rounded-2xl shadow-md hover:bg-slate-800 transition"
        >
          Explore Marketplace
        </Link>
      </div>
    );
  }

  return (
     <ProtectedRoute allowedRoles = {["customer"]}>
        <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shopping Cart</h1>
        <button
          onClick={clearCart}
          className="w-fit text-xs font-bold text-rose-500 hover:underline"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-6 lg:gap-8">
        <div className="space-y-4">
          {cart.map((item) => (
            <div
              key={item.product._id}
              className="bg-white/90 backdrop-blur-md rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center"
            >
              <img
                src={item.product.images?.[0] || "/placeholder.png"}
                alt={item.product.title}
                className="w-20 h-20 rounded-2xl object-cover bg-slate-50 shrink-0"
              />

              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-extrabold text-[#FF3B6B] uppercase tracking-wider block">
                  Vendor: {item.product.vendor?.name || "Merchant"}
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm truncate">
                  {item.product.title}
                </h3>
                <span className="text-sm font-black text-slate-900 block mt-1">
                  {formatPrice(item.product.price)}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl self-start sm:self-auto">
                <button
                  onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                  className="p-1 hover:bg-white rounded-lg transition text-slate-600"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                  className="p-1 hover:bg-white rounded-lg transition text-slate-600"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => removeFromCart(item.product._id)}
                className="p-2 text-slate-400 hover:text-rose-500 rounded-xl transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-4xl p-6 border border-slate-100 shadow-sm h-fit space-y-4 lg:sticky lg:top-24">
          <h2 className="text-lg font-black text-slate-900">Order Summary</h2>

          <div className="space-y-2 text-xs font-medium text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">{formatPrice(getCartTotal())}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="text-emerald-600 font-bold">Free</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
            <span className="text-sm font-black text-slate-900">Total</span>
            <span className="text-xl font-black text-slate-900">
              {formatPrice(getCartTotal())}
            </span>
          </div>

          <Link
            href="/checkout"
            className="w-full py-3.5 bg-black hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition"
          >
            Proceed to Checkout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
      </ProtectedRoute>
    
  );
}