"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { API_URL } from "@/lib/api";
import { formatPrice } from "@/lib/formatPrice";
import { ArrowLeft, ShoppingBag, RefreshCw, Package, CheckCircle2, Circle } from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/orders`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.message || "Unable to load orders");
      }
    } catch (err) {
      setError("Network error while loading platform orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders();
  }, []);

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Platform Orders</h1>
            <p className="text-xs text-slate-500 font-medium">Monitor customer orders across the marketplace</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 text-slate-700">
              <ShoppingBag className="w-4 h-4" />
              <span className="text-sm font-extrabold">All marketplace orders</span>
            </div>
            <button
              onClick={() => void fetchOrders()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">Loading orders...</div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
              <Package className="mb-2 w-8 h-8 text-slate-300" />
              No orders have been placed yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider">
                    <th className="px-3 py-3">Order</th>
                    <th className="px-3 py-3">Customer</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Payment</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-slate-50">
                      <td className="px-3 py-3 font-bold text-slate-900">#{(order._id || "").slice(-6).toUpperCase()}</td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-slate-800">{order.customer?.name || "Guest"}</div>
                        <div className="text-[11px] text-slate-500">{order.customer?.email || ""}</div>
                      </td>
                      <td className="px-3 py-3 font-black text-slate-900">{formatPrice(order.totalAmount || 0)}</td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-700">
                          {order.paymentMethod || "COD"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                          order.overallStatus === "Completed" || order.paymentStatus === "Paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : order.overallStatus === "Cancelled"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                        }`}>
                          {order.overallStatus || order.paymentStatus || "Pending"}
                          {(order.overallStatus === "Completed" || order.paymentStatus === "Paid") ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
