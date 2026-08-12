"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";
import { formatPrice } from "@/lib/formatPrice";
import {
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  XCircle,
  X,
  ShoppingBag,
  RefreshCw,
  CreditCard,
  MapPin,
  Truck,
} from "lucide-react";

const API_BASE = API_URL;
const POLL_INTERVAL = 5000;

function deriveOverallStatus(vendorOrders = []) {
  if (vendorOrders.length === 0) return "Pending";
  const statuses = vendorOrders.map((vo) => vo.status);
  if (statuses.every((s) => s === "Delivered")) return "Delivered";
  if (statuses.every((s) => s === "Cancelled")) return "Cancelled";
  if (statuses.some((s) => s === "Shipped")) return "Shipped";
  if (statuses.some((s) => s === "Processing")) return "Processing";
  return "Pending";
}

const STATUS_STEPS = ["Pending", "Processing", "Shipped", "Delivered"];

const STATUS_STYLES = {
  Pending: { badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  Processing: { badge: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  Shipped: { badge: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" },
  Delivered: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  Cancelled: { badge: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" },
};

export default function CustomerOrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [live, setLive] = useState(false);
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [deleteModalOrder, setDeleteModalOrder] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const lastUpdatedRef = useRef(null);


  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
    } else if (user.role === "vendor" || user.role === "admin") {
      router.replace("/vendor");
    }
  }, [authLoading, user, router]);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setError("");
      const res = await fetch(`${API_BASE}/api/v1/orders/my-orders`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        lastUpdatedRef.current = new Date();
        setLive(true);
      } else {
        if (!silent) setError(data.message || "Unable to load orders.");
      }
    } catch (err) {
      console.error("Failed to fetch my orders:", err);
      if (!silent) setError("Unable to load orders. Please try again later.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  
  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role === "vendor" || user.role === "admin") return;

    const timeout = window.setTimeout(() => {
      void fetchOrders();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [authLoading, user, fetchOrders]);

  
  useEffect(() => {
    if (authLoading || !user || user.role === "vendor" || user.role === "admin") return;
    const interval = setInterval(() => fetchOrders(true), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [authLoading, user, fetchOrders]);

  
  useEffect(() => {
    if (!live) return;
    const t = setTimeout(() => setLive(false), 2000);
    return () => clearTimeout(t);
  }, [live]);

  const stats = useMemo(() => {
    return orders.reduce(
      (acc, o) => {
        const st = deriveOverallStatus(o.vendorOrders);
        acc.active = acc.active + (st === "Pending" || st === "Processing" || st === "Shipped" ? 1 : 0);
        acc.delivered += st === "Delivered" ? 1 : 0;
        acc.cancelled += st === "Cancelled" ? 1 : 0;
        acc.total += Number(o.totalAmount) || 0;
        return acc;
      },
      { active: 0, delivered: 0, cancelled: 0, total: 0 }
    );
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (activeTab === "All") return orders;
    return orders.filter((o) => deriveOverallStatus(o.vendorOrders) === activeTab);
  }, [orders, activeTab]);

  const requestCancellation = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/orders/${orderId}/request-cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ cancellationReason: cancelReason }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Cancellation request failed.");
      }
      setCancelModalOrder(null);
      setCancelReason("");
      await fetchOrders();
      alert("Cancellation request submitted. Vendor has been notified.");
    } catch (err) {
      console.error("Cancellation request error:", err);
      alert(err.message || "Unable to submit cancellation request.");
    }
  };

  const deleteOrder = async () => {
    if (!deleteModalOrder) return;
    setDeletingId(deleteModalOrder._id);
    try {
      const res = await fetch(`${API_BASE}/api/v1/orders/${deleteModalOrder._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Delete request failed.");
      }
      setDeleteModalOrder(null);
      await fetchOrders();
    } catch (err) {
      console.error("Delete order error:", err);
      alert(err.message || "Unable to delete order.");
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading) {
    return <div className="text-center py-20 font-bold text-slate-400">Loading...</div>;
  }

  if (loading) {
    return <div className="text-center py-20 font-bold text-slate-400">Loading your orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-4xl p-12 text-center border border-slate-100 max-w-xl mx-auto my-12">
        <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-700">No Orders Placed Yet</h3>
        <p className="text-xs text-slate-400 mt-1">When you buy products, your orders will appear here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
      <div className="bg-white/90 backdrop-blur-md rounded-4xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            My Orders
            {live && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> LIVE
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Orders update automatically every few seconds
          </p>
        </div>
        <button
          onClick={() => fetchOrders()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Clock className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Active</p>
            <h3 className="text-lg font-black text-slate-900">{stats.active}</h3>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Delivered</p>
            <h3 className="text-lg font-black text-slate-900">{stats.delivered}</h3>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><XCircle className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Cancelled</p>
            <h3 className="text-lg font-black text-slate-900">{stats.cancelled}</h3>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 text-white rounded-xl"><LayoutGrid className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total</p>
            <h3 className="text-lg font-black text-slate-900">{formatPrice(stats.total)}</h3>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
              activeTab === tab
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white/80 text-slate-500 hover:bg-slate-100 border border-slate-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && (
        <div className="py-8 text-center space-y-3 bg-rose-50/50 rounded-2xl border border-rose-100">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs font-bold text-rose-600">{error}</p>
          <button
            onClick={() => fetchOrders()}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-extrabold"
          >
            Retry
          </button>
        </div>
      )}

      {!error && filteredOrders.length === 0 && (
        <div className="py-16 text-center space-y-2">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No {activeTab !== "All" ? activeTab.toLowerCase() : ""} orders found</p>
        </div>
      )}

      <div className="space-y-6">
        {filteredOrders.map((order) => {
          const overall = deriveOverallStatus(order.vendorOrders);
          const overallStyle = STATUS_STYLES[overall] || STATUS_STYLES.Pending;
          const orderCode = order.orderNumber || `#${order._id.slice(-6).toUpperCase()}`;

          return (
            <div
              key={order._id}
              className="bg-white/90 backdrop-blur-md rounded-4xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-900">{orderCode}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${overallStyle.badge}`}>
                  {overall}
                </span>
              </div>

              <div className="p-6 space-y-5">
                {overall !== "Cancelled" && (
                  <div className="flex items-center w-full">
                    {STATUS_STEPS.map((step, idx) => {
                      const currentIdx = STATUS_STEPS.indexOf(overall);
                      const reached = idx <= currentIdx;
                      const isCurrent = idx === Math.max(currentIdx, 0);
                      return (
                        <div key={step} className="flex items-center flex-1 last:flex-none">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition ${
                                reached
                                  ? "bg-slate-900 border-slate-900 text-white"
                                  : "bg-white border-slate-200 text-slate-300"
                              } ${isCurrent ? "ring-4 ring-slate-900/10" : ""}`}
                            >
                              {reached ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <span className="text-[10px] font-black">{idx + 1}</span>
                              )}
                            </div>
                            <span className={`text-[9px] font-bold mt-1 ${reached ? "text-slate-900" : "text-slate-400"}`}>
                              {step}
                            </span>
                          </div>
                          {idx < STATUS_STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-2 mb-4 ${idx < currentIdx ? "bg-slate-900" : "bg-slate-200"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 font-semibold">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    {order.paymentMethod || "COD"}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      order.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      {order.paymentStatus || "Pending"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 font-semibold sm:justify-end">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {order.shippingAddress?.city || "—"}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Vendor Packages ({order.vendorOrders?.length || 0})
                  </h4>

                  {order.vendorOrders?.map((vo, idx) => {
                    const vStyle = STATUS_STYLES[vo.status] || STATUS_STYLES.Pending;
                    return (
                      <div key={idx} className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-100">
                        <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                          <span className="text-xs font-extrabold text-[#FF3B6B]">
                            {vo.vendor?.name || "Independent Merchant"}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${vStyle.badge}`}>
                            {vo.status}
                          </span>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          {vo.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex justify-between text-xs font-semibold text-slate-700">
                              <span>
                                {item.title} <span className="text-slate-400">× {item.quantity}</span>
                              </span>
                              <span>{formatPrice(Number(item.price) * item.quantity)}</span>
                            </div>
                          ))}
                        </div>

                        {vo.status === "Shipped" && vo.courierName && vo.trackingId && (
                          <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100">
                            <Truck className="w-3.5 h-3.5" />
                            {vo.courierName} • <span className="font-mono">{vo.trackingId}</span>
                          </div>
                        )}

                        {vo.status === "Cancelled" && vo.cancelReason && (
                          <div className="text-[11px] font-medium text-rose-700 bg-rose-50 px-3 py-2 rounded-xl border border-rose-100">
                            Reason: {vo.cancelReason}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pt-3 border-t border-slate-100 text-xs">
                  <div className="font-semibold text-slate-500">
                    {order.vendorOrders?.length || 1} package(s)
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {(overall === "Pending" || overall === "Processing") && (
                      <button
                        onClick={() => setCancelModalOrder(order)}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition"
                      >
                        Cancel Order
                      </button>
                    )}
                    {(overall === "Delivered" || overall === "Cancelled") && (
                      <button
                        onClick={() => setDeleteModalOrder(order)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                      >
                        Delete Order
                      </button>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-semibold">Total</span>
                      <span className="text-lg font-black text-slate-900">{formatPrice(Number(order.totalAmount))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-rose-600">Request Cancellation</h3>
              <button
                onClick={() => setCancelModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Please tell us why you are requesting cancellation for this order.
            </p>
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                Reason for Cancellation
              </label>
              <textarea
                rows={4}
                placeholder="e.g. I changed my mind, address issue, shipping delay..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white focus:border-slate-900"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalOrder(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Dismiss
              </button>
              <button
                onClick={() => requestCancellation(cancelModalOrder._id)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-rose-600">Delete Order</h3>
              <button
                onClick={() => setDeleteModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              This will remove the order from your order history view. It does not reopen the order.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModalOrder(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Dismiss
              </button>
              <button
                onClick={deleteOrder}
                disabled={deletingId === deleteModalOrder._id}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {deletingId === deleteModalOrder._id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
