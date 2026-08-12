"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { motion } from "framer-motion";
import { API_URL } from "@/lib/api";
import { Package, ShoppingBag, ArrowRight, Layers, Store, TrendingUp, Loader2, BadgeCheck, Wallet, BarChart3, Clock } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function VendorDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
    } else if (user.role !== "vendor" && user.role !== "admin") {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || (user.role !== "vendor" && user.role !== "admin")) return;
    const fetchStats = async () => {
      try {
        const [prodRes, orderRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/products`, { credentials: "include" }),
          fetch(`${API_URL}/api/v1/orders/vendor-orders`, { credentials: "include" }),
        ]);
        const prodData = await prodRes.json();
        const orderData = await orderRes.json();
        if (prodData.success) setProductCount(prodData.count || 0);
        if (orderData.success) {
          const allOrders = orderData.orders || [];
          setOrderCount(allOrders.length);
          setPendingCount(allOrders.filter((o) => o.status === "Pending").length);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [user]);

  if (authLoading || (loading && !productCount)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-400 font-bold">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading dashboard...
      </div>
    );
  }

  const stats = [
    { icon: Package, label: "Total Products", value: productCount, color: "bg-slate-900 text-white", link: "/vendor/products" },
    { icon: ShoppingBag, label: "Total Orders", value: orderCount, color: "bg-[#FF3B6B] text-white", link: "/vendor/orders" },
    { icon: TrendingUp, label: "Active Listings", value: productCount, color: "bg-emerald-500 text-white", link: "/vendor/products" },
{ icon: Wallet, label: "Pending Orders", value: pendingCount, color: "bg-amber-500 text-white", link: "/vendor/orders" },
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-20 -right-20 w-96 h-96 bg-[#FF3B6B]/10 blur-[100px] rounded-full" />
      <div className="pointer-events-none absolute bottom-0 -left-20 w-96 h-96 bg-emerald-200/20 blur-[100px] rounded-full" />

      <div className="relative max-w-6xl mx-auto space-y-8 p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/80 backdrop-blur-md rounded-4xl p-6 sm:p-8 border border-slate-200/60 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-linear-to-br from-slate-900 to-slate-700 text-white rounded-2xl flex items-center justify-center shadow-lg">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Vendor Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Welcome back, {user?.name}
                </p>
              </div>
            </div>
            {user?.isApproved === false ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 w-fit">
                <Clock className="w-3.5 h-3.5" /> Pending Approval
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100 w-fit">
                <BadgeCheck className="w-3.5 h-3.5" /> Verified Store
              </div>
            )}
          </div>
        </motion.div>

        {user?.isApproved === false && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800">
            <Clock className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold leading-relaxed">
              Your store is awaiting admin approval. You can view your dashboard, but you cannot create or edit
              products until an admin approves your account.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6, scale: 1.02 }}
            >
              <Link
                href={s.link}
                className="block bg-white/80 backdrop-blur-md rounded-4xl p-6 border border-slate-200/60 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${s.color} shadow-md`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition" />
                </div>
                <div className="text-3xl font-black text-slate-900">{s.value}</div>
                <div className="text-xs font-bold text-slate-500 mt-1">{s.label}</div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          initial="hidden"
          animate="show"
          className="bg-white/80 backdrop-blur-md rounded-4xl p-6 border border-slate-200/60 shadow-sm"
        >
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-5">
            <Layers className="w-5 h-5 text-slate-700" /> Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div variants={fadeUp}>
              <Link
                href="/vendor/products"
                className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-xl text-slate-700 shadow-sm">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">Manage Products</div>
                    <div className="text-[10px] text-slate-400 font-medium">Add, edit, or remove listings</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-slate-900 transition" />
              </Link>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Link
                href="/vendor/orders"
                className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-xl text-slate-700 shadow-sm">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">Fulfill Orders</div>
                    <div className="text-[10px] text-slate-400 font-medium">Update shipping status</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-slate-900 transition" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
