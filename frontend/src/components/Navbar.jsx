"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { 
  ShoppingBag, 
  LogOut, 
  Store, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  ShieldCheck, 
  Banknote, 
  Tag, 
  Menu, 
  X,
  User
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount = getCartCount();
  const role = user?.role;
  const isAdmin = role === "admin";
  const isVendor = role === "vendor";
  const isCustomer = role !== "admin" && role !== "vendor";

  const closeMobile = () => setMobileMenuOpen(false);

  const isActive = (path) => pathname === path;
  const linkStyle = (path) =>
    `flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
      isActive(path)
        ? "bg-slate-900 text-white shadow-sm"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
    }`;

  return (
    <header className="sticky top-4 z-50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-3xl sm:rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.04)] px-5 py-3 flex items-center justify-between gap-4 transition-all">
        
        <Link 
          href={role === "admin" ? "/admin" : role === "vendor" ? "/vendor" : "/"} 
          className="flex items-center gap-2.5 group shrink-0"
          onClick={closeMobile}
        >
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg group-hover:scale-105 transition-transform shadow-md shadow-slate-900/20">
            S
          </div>
          <span className="font-black text-xl tracking-tight text-slate-900">
            Shop<span className="text-[#FF3B6B]">Craft</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-2">
          
          {isAdmin && (
            <nav className="flex items-center gap-1">
              <Link href="/admin" className={linkStyle("/admin")}>
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              <Link href="/admin/orders" className={linkStyle("/admin/orders")}>
                <ShoppingBag className="w-4 h-4" /> Orders
              </Link>
              <Link href="/admin/payouts" className={linkStyle("/admin/payouts")}>
                <Banknote className="w-4 h-4" /> Payouts
              </Link>
              <Link href="/admin/coupons" className={linkStyle("/admin/coupons")}>
                <Tag className="w-4 h-4" /> Coupons
              </Link>
              <Link href="/admin/categories" className={linkStyle("/admin/categories")}>
                <Tag className="w-4 h-4" /> Categories
              </Link>
            </nav>
          )}

          {role === "vendor" && (
            <nav className="flex items-center gap-1">
              <Link href="/vendor" className={linkStyle("/vendor")}>
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              <Link href="/vendor/products" className={linkStyle("/vendor/products")}>
                <Package className="w-4 h-4" /> Products
              </Link>
              <Link href="/vendor/orders" className={linkStyle("/vendor/orders")}>
                <ShoppingBag className="w-4 h-4" /> Orders
              </Link>
              <Link href="/vendor/earnings" className={linkStyle("/vendor/earnings")}>
                <Banknote className="w-4 h-4" /> Earnings
              </Link>
              <Link href="/vendor/coupons" className={linkStyle("/vendor/coupons")}>
                <Tag className="w-4 h-4" /> Coupons
              </Link>
            </nav>
          )}

          {role !== "admin" && role !== "vendor" && (
            <nav className="flex items-center gap-1">
              <Link href="/shop" className={linkStyle("/shop")}>
                <Store className="w-4 h-4" /> Shop
              </Link>
              {user && (
                <Link href="/orders" className={linkStyle("/orders")}>
                  <ShoppingBag className="w-4 h-4" /> My Orders
                </Link>
              )}
            </nav>
          )}

          {!isAdmin && !isVendor && (
            <Link
              href="/cart"
              className="p-2.5 rounded-full hover:bg-slate-100 text-slate-700 relative transition ml-1"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 min-w-4 h-4 px-1 bg-[#FF3B6B] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200 ml-1">
              <div className="flex flex-col text-right">
                <span className="text-xs font-black text-slate-900 leading-tight">{user.name}</span>
                <span className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md self-end mt-0.5 ${
                  role === "admin" ? "bg-purple-100 text-purple-700" :
                  role === "vendor" ? "bg-amber-100 text-amber-700" :
                  "bg-slate-100 text-slate-600"
                }`}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-2.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <Link
                href="/login"
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-full text-xs font-bold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {role !== "admin" && role !== "vendor" && (
            <Link href="/cart" className="p-2 rounded-full hover:bg-slate-100 text-slate-700 relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 min-w-4 h-4 px-1 bg-[#FF3B6B] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden mt-2 bg-white rounded-3xl border border-slate-200 p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          
          {user && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{user.name}</div>
                  <div className="text-[10px] text-slate-500 font-medium">{user.email}</div>
                </div>
              </div>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                role === "admin" ? "bg-purple-100 text-purple-700" :
                role === "vendor" ? "bg-amber-100 text-amber-700" :
                "bg-slate-200 text-slate-700"
              }`}>
                {user.role}
              </span>
            </div>
          )}

          <div className="space-y-1">
            {isAdmin && (
              <>
                <Link href="/admin" onClick={closeMobile} className={linkStyle("/admin")}>
                  <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                </Link>
                <Link href="/admin/orders" onClick={closeMobile} className={linkStyle("/admin/orders")}>
                  <ShoppingBag className="w-4 h-4" /> Platform Orders
                </Link>
                <Link href="/admin/payouts" onClick={closeMobile} className={linkStyle("/admin/payouts")}>
                  <Banknote className="w-4 h-4" /> Vendor Payouts
                </Link>
                <Link href="/admin/coupons" onClick={closeMobile} className={linkStyle("/admin/coupons")}>
                  <Tag className="w-4 h-4" /> System Coupons
                </Link>
                <Link href="/admin/categories" onClick={closeMobile} className={linkStyle("/admin/categories")}>
                  <Tag className="w-4 h-4" /> Product Categories
                </Link>
              </>
            )}

            {isVendor && (
              <>
                <Link href="/vendor" onClick={closeMobile} className={linkStyle("/vendor")}>
                  <LayoutDashboard className="w-4 h-4" /> Vendor Dashboard
                </Link>
                <Link href="/vendor/products" onClick={closeMobile} className={linkStyle("/vendor/products")}>
                  <Package className="w-4 h-4" /> Manage Products
                </Link>
                <Link href="/vendor/orders" onClick={closeMobile} className={linkStyle("/vendor/orders")}>
                  <ShoppingBag className="w-4 h-4" /> Vendor Orders
                </Link>
                <Link href="/vendor/earnings" onClick={closeMobile} className={linkStyle("/vendor/earnings")}>
                  <Banknote className="w-4 h-4" /> Earnings & Payouts
                </Link>
                <Link href="/vendor/coupons" onClick={closeMobile} className={linkStyle("/vendor/coupons")}>
                  <Tag className="w-4 h-4" /> Coupons
                </Link>
              </>
            )}

            {!isAdmin && !isVendor && (
              <>
                <Link href="/shop" onClick={closeMobile} className={linkStyle("/shop")}>
                  <Store className="w-4 h-4" /> Browse Shop
                </Link>
                {user && (
                  <Link href="/orders" onClick={closeMobile} className={linkStyle("/orders")}>
                    <ShoppingBag className="w-4 h-4" /> My Orders
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100">
            {user ? (
              <button
                onClick={() => { logout(); closeMobile(); }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl text-xs font-bold transition"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={closeMobile}
                  className="py-3 text-center bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={closeMobile}
                  className="py-3 text-center bg-slate-900 hover:bg-black text-white rounded-2xl text-xs font-bold shadow-md transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

        </div>
      )}
    </header>
  );
}