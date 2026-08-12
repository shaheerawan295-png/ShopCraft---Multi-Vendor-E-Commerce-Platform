"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { formatPrice } from "@/lib/formatPrice";
import {
  Banknote,
  Users,
  Store,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Tag,
  ShieldCheck,
  Package,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    platformCommission: 0,
    totalVendors: 0,
    pendingVendorsCount: 0,
    totalOrders: 0,
    totalCustomers: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [pendingVendors, setPendingVendors] = useState([]);

  const [approvingId, setApprovingId] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/dashboard`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setStats((prev) => data.stats || prev);
        setRecentOrders(data.recentOrders || []);
        setPendingVendors(data.pendingVendors || []);
      }
    } catch (error) {
      console.error("Failed to fetch admin dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVendorApproval = async (vendorId, approve) => {
    setApprovingId(vendorId);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/vendors/${vendorId}/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isApproved: approve }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || "Failed to update vendor status");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setPendingVendors((prev) => prev.filter((v) => v._id !== vendorId));
        setStats((prev) => ({
          ...prev,
          pendingVendorsCount: Math.max(0, (prev.pendingVendorsCount || 0) - 1),
        }));
      } else {
        alert(data.message || "Failed to update vendor status");
      }
    } catch (err) {
      console.error("Vendor approval error:", err);
      alert("Failed to update vendor status. Check your connection.");
    } finally {
      setApprovingId(null);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-600 mb-1">
              <ShieldCheck className="w-4 h-4" /> Admin Operations Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Platform Overview
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Monitor vendor activities, revenue growth, and system performance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link
              href="/admin/payouts"
              className="px-5 py-3 bg-slate-900 hover:bg-black text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-slate-900/10 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <Banknote className="w-4 h-4 text-emerald-400" /> Process Payouts
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Total Marketplace Volume
              </span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Banknote className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {formatPrice(stats.totalRevenue)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" /> Gross merchandise value
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Platform Earnings (Commission)
              </span>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {formatPrice(stats.platformCommission)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-purple-600">
              <ArrowUpRight className="w-3.5 h-3.5" /> Net platform commission
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Registered Vendors
              </span>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Store className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.totalVendors || 0}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-amber-600">
              <Clock className="w-3.5 h-3.5" /> {stats.pendingVendorsCount || 0} pending approvals
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Total Platform Orders
              </span>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.totalOrders || 0}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-blue-600">
              <Package className="w-3.5 h-3.5" /> Across all vendors
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Recent Platform Orders</h2>
                  <p className="text-xs text-slate-500 font-medium">Real-time marketplace customer orders</p>
                </div>
                <Link
                  href="/admin/orders"
                  className="text-xs font-bold text-slate-900 hover:text-purple-600 flex items-center gap-1 transition"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">No orders recorded yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase font-extrabold tracking-wider">
                        <th className="pb-3">Order ID</th>
                        <th className="pb-3">Customer</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {recentOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 font-bold text-slate-900">#{(order._id || "").slice(-6)}</td>
                          <td className="py-3.5">{order.customer?.name || "Guest Customer"}</td>
                          <td className="py-3.5 font-black text-slate-900">{formatPrice(order.totalAmount || 0)}</td>
                          <td className="py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              order.overallStatus === "Completed" ? "bg-emerald-100 text-emerald-700" :
                              order.overallStatus === "Cancelled" ? "bg-rose-100 text-rose-700" :
                              order.overallStatus === "Processing" ? "bg-blue-100 text-blue-700" :
                              "bg-amber-100 text-amber-700"
                            }`}>
                              {order.overallStatus || "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Pending Vendor Approvals</h2>
                  <p className="text-xs text-slate-500 font-medium">Review and verify new merchant applications</p>
                </div>
                <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-full text-xs font-extrabold">
                  {pendingVendors.length} Pending
                </span>
              </div>

              {pendingVendors.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">All vendor accounts are up to date!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingVendors.map((vendor) => (
                    <div
                      key={vendor._id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/60 hover:bg-white hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-xs">
                          {vendor.name?.[0] || "V"}
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-slate-900">{vendor.name}</div>
                          <div className="text-[11px] text-slate-500 font-medium">{vendor.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVendorApproval(vendor._id, true)}
                          disabled={approvingId === vendor._id}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleVendorApproval(vendor._id, false)}
                          disabled={approvingId === vendor._id}
                          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          <div className="space-y-8">
            
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-lg font-black text-slate-900 tracking-tight mb-2">Platform Controls</h2>
              
              <Link
                href="/admin/payouts"
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200/60 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">Vendor Payouts</div>
                    <div className="text-[10px] text-slate-500">Approve pending balance withdrawals</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition" />
              </Link>

              <Link
                href="/admin/coupons"
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200/60 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">System Coupons</div>
                    <div className="text-[10px] text-slate-500">Manage site-wide promotional discounts</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
              </Link>

              <Link
                href="/admin/categories"
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-200/60 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">Product Categories</div>
                    <div className="text-[10px] text-slate-500">Add or reorder store product taxonomies</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />
              </Link>
            </div>

            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Status</span>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Operational
                </span>
              </div>

              <div>
                <h3 className="text-base font-black">ShopCraft Gateway Active</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Authentication service, payment processors, and database operations running optimally.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Database Sync</span>
                <span className="font-mono text-white font-bold">Connected</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </ProtectedRoute>
  );
}