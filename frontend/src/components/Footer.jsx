"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Footer() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isVendor = user?.role === "vendor";
  const isCustomer = !user || user?.role === "customer";

  return (
    <footer className="mt-16 border-t border-slate-200/60 bg-white/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black">
                S
              </div>
              <span className="font-extrabold text-lg text-slate-900">
                Shop<span className="text-[#FF3B6B]">Craft</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium max-w-sm leading-relaxed">
              A premium multi-vendor marketplace connecting shoppers with verified independent
              craftsmen and merchants across Pakistan.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-3">
              Marketplace
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-500">
              <li><Link href="/shop" className="hover:text-slate-900 transition">Shop Products</Link></li>
              {isCustomer && <li><Link href="/cart" className="hover:text-slate-900 transition">My Cart</Link></li>}
              {user && isCustomer && <li><Link href="/orders" className="hover:text-slate-900 transition">My Orders</Link></li>}
              {isAdmin && <li><Link href="/admin" className="hover:text-slate-900 transition">Admin Dashboard</Link></li>}
              {isVendor && <li><Link href="/vendor" className="hover:text-slate-900 transition">Vendor Dashboard</Link></li>}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-3">
              Account
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-500">
              {user ? (
                <li>
                  <Link href={isAdmin ? "/admin" : isVendor ? "/vendor" : "/orders"} className="hover:text-slate-900 transition">
                    Welcome, {user.name}
                  </Link>
                </li>
              ) : (
                <>
                  <li><Link href="/login" className="hover:text-slate-900 transition">Sign In</Link></li>
                  <li><Link href="/register" className="hover:text-slate-900 transition">Create Account</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] font-semibold text-slate-400">
          <span>© {new Date().getFullYear()} ShopCraft Marketplace. All rights reserved.</span>
          <span>Handcrafted with care for verified vendors.</span>
        </div>
      </div>
    </footer>
  );
}
