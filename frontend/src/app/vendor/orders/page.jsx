"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Package,
  Clock,
  Truck,
  Printer,
  Copy,
  AlertCircle,
  Banknote,
  Phone,
  MapPin,
Ban,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { API_URL } from "@/lib/api";

const API_BASE = API_URL;

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(null);
  const [trackingInput, setTrackingInput] = useState({ courierName: "TCS", trackingId: "" });

  const [vendorCancelModalOrder, setVendorCancelModalOrder] = useState(null);
  const [vendorCancelReason, setVendorCancelReason] = useState("");
  const [vendorCancelAction, setVendorCancelAction] = useState(null);

  const [deleteModalOrder, setDeleteModalOrder] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [copiedId, setCopiedId] = useState("");

  const fetchVendorOrders = async () => {
    setLoading(true);
    setError(null);
    try {
const res = await fetch(`${API_BASE}/api/v1/orders/vendor-orders`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.message || "Failed to load orders.");
      }
    } catch (err) {
      console.error("Fetch vendor orders error:", err);
      setError("Network error fetching orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchVendorOrders();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "Pending").length;
    const processing = orders.filter((o) => o.status === "Processing").length;
    const shipped = orders.filter((o) => o.status === "Shipped").length;
    const cancellationRequested = orders.filter((o) => o.status === "Cancellation Requested").length;
    const revenue = orders
      .filter((o) => o.status !== "Cancelled")
      .reduce((sum, o) => sum + (o.vendorEarnings || o.totalAmount || 0), 0);

    return { total, pending, processing, shipped, cancellationRequested, revenue };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesTab = activeTab === "All" || order.status === activeTab;
      const query = searchQuery.toLowerCase().trim();

      const orderNum = (order.orderNumber || order._id || "").toLowerCase();
      const custName = (order.shippingAddress?.fullName || order.customer?.name || "").toLowerCase();
      const custPhone = (order.shippingAddress?.phone || order.customer?.phone || "").toLowerCase();
      const itemMatch = order.items?.some((i) =>
        (i.product?.title || i.title || "").toLowerCase().includes(query)
      );

      const matchesSearch =
        !query ||
        orderNum.includes(query) ||
        custName.includes(query) ||
        custPhone.includes(query) ||
        itemMatch;

      return matchesTab && matchesSearch;
    });
  }, [orders, activeTab, searchQuery]);

  const updateOrderStatus = async (orderId, newStatus, extraData = {}) => {
    setUpdatingId(orderId);
    try {
const res = await fetch(`${API_BASE}/api/v1/orders/vendor-orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus, ...extraData }),
      });

      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, ...data.order, status: newStatus, ...extraData } : o))
        );
      } else {
        alert(data.message || "Failed to update order status.");
      }
    } catch (err) {
      console.error("Update order status error:", err);
      alert("Error updating status. Check your backend server connection.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusSelect = (order, newStatus) => {
    if (newStatus === "Shipped") {
      setSelectedOrderForTracking(order);
      setTrackingInput({
        courierName: order.courierName || "TCS",
        trackingId: order.trackingId || "",
      });
      return;
    }

    if (newStatus === "Cancelled") {
      setVendorCancelModalOrder(order);
      setVendorCancelAction("manual-cancel");
      setVendorCancelReason(order.cancelReason || "");
      return;
    }

    updateOrderStatus(order._id, newStatus);
  };

  const handleSaveTracking = async () => {
    if (!trackingInput.trackingId.trim()) {
      alert("Please enter a valid Tracking/Consignment ID.");
      return;
    }

    await updateOrderStatus(selectedOrderForTracking._id, "Shipped", {
      courierName: trackingInput.courierName,
      trackingId: trackingInput.trackingId,
    });

    setSelectedOrderForTracking(null);
  };

  const handleConfirmCancel = async () => {
    if (!vendorCancelReason.trim()) {
      alert("Please enter a reason for cancelling this order.");
      return;
    }

    if (!vendorCancelModalOrder) return;

    if (vendorCancelAction === "approve-request") {
      try {
        setUpdatingId(vendorCancelModalOrder._id);
        const res = await fetch(`${API_BASE}/api/v1/orders/vendor-orders/${vendorCancelModalOrder._id}/approve-cancellation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ vendorReason: vendorCancelReason }),
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || "Unable to approve cancellation.");
        }
        setOrders((prev) => prev.map((o) => (o._id === data.order._id ? { ...o, ...data.order, status: data.order.status } : o)));
        alert("Cancellation approved and customer notified.");
      } catch (err) {
        console.error(err);
        alert(err.message || "Unable to approve cancellation.");
      } finally {
        setUpdatingId(null);
      }
    } else {
      await updateOrderStatus(vendorCancelModalOrder._id, "Cancelled", {
        cancelReason: vendorCancelReason,
        cancellationStatus: "Approved",
      });
    }

    setVendorCancelModalOrder(null);
    setVendorCancelReason("");
    setVendorCancelAction(null);
  };

  const handleDeleteOrder = async () => {
    if (!deleteModalOrder) return;
    setDeletingId(deleteModalOrder._id);
    try {
      const res = await fetch(`${API_BASE}/api/v1/orders/vendor-orders/${deleteModalOrder._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.filter((o) => o._id !== deleteModalOrder._id));
        setDeleteModalOrder(null);
      } else {
        alert(data.message || "Failed to delete order.");
      }
    } catch (err) {
      console.error("Delete order error:", err);
      alert("Error deleting order. Check your backend server connection.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRejectCancellation = async (order) => {
    const restoreStatus = order.previousStatus || "Processing";
    await updateOrderStatus(order._id, restoreStatus, {
      cancellationStatus: "Rejected",
    });
  };

  const handleOpenApproveModal = (order) => {
    setVendorCancelModalOrder(order);
    setVendorCancelAction("approve-request");
    setVendorCancelReason(order.cancelReason || "");
  };

  const copyToClipboard = (text, idKey) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(""), 2000);
  };

  const handlePrintSlip = (order) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const formattedId = order.orderNumber || `#${order._id.slice(-6).toUpperCase()}`;
    const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : new Date().toLocaleDateString();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Packing Slip - ${formattedId}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #0f172a; line-height: 1.5; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 20px; font-weight: 800; margin: 0; }
            .meta { font-size: 12px; color: #64748b; margin: 4px 0 0 0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
            .box { background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; }
            .box h4 { margin: 0 0 6px 0; text-transform: uppercase; font-size: 10px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 12px; }
            th { background: #f1f5f9; font-weight: 700; text-transform: uppercase; font-size: 10px; }
            .footer { margin-top: 32px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">VENDOR PACKING SLIP</h1>
              <p class="meta">Order Ref: <strong>${formattedId}</strong></p>
            </div>
            <div style="text-align: right;">
              <p class="meta">Date: ${dateStr}</p>
              <p class="meta">Payment: <strong>${order.paymentMethod || "COD"} (${order.paymentStatus || "Pending"})</strong></p>
            </div>
          </div>

          <div class="grid">
            <div class="box">
              <h4>Shipping Destination</h4>
              <p style="margin:0; font-weight:700;">${order.shippingAddress?.fullName || order.customer?.name || "Customer"}</p>
              <p style="margin:4px 0;">${order.shippingAddress?.street || ""}, ${order.shippingAddress?.city || ""}</p>
              <p style="margin:0;">Phone: ${order.shippingAddress?.phone || order.customer?.phone || "N/A"}</p>
            </div>
            <div class="box">
              <h4>Fulfillment Notes</h4>
              <p style="margin:0;">Courier: <strong>${order.courierName || "Standard Dispatch"}</strong></p>
              <p style="margin:4px 0;">Tracking: <strong>${order.trackingId || "Pending Assignment"}</strong></p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || [])
                .map((item) => {
                  const title = item.product?.title || item.title || "Product";
                  const price = item.product?.price || item.price || 0;
                  const qty = item.quantity || 1;
                  return `
                    <tr>
                      <td><strong>${title}</strong></td>
                      <td style="text-align: center;">${qty}</td>
                      <td style="text-align: right;">Rs. ${price.toLocaleString()}</td>
                      <td style="text-align: right;">Rs. ${(price * qty).toLocaleString()}</td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>

          <div class="footer">
            Thank you for shopping with us. Verified Vendor Dispatch Document.
          </div>

          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <ProtectedRoute allowedRoles={["vendor", "admin"]}>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 bg-slate-50/50 min-h-screen">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Order Fulfillments</h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Live vendor dashboard for order processing, dispatch tracking, and metrics
            </p>
          </div>

          <button
            onClick={fetchVendorOrders}
            disabled={loading}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Sync Orders
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Pending</p>
              <h3 className="text-xl font-black text-slate-900">{stats.pending}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Processing</p>
              <h3 className="text-xl font-black text-slate-900">{stats.processing}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Dispatched</p>
              <h3 className="text-xl font-black text-slate-900">{stats.shipped}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Est. Earnings</p>
              <h3 className="text-xl font-black text-slate-900">Rs. {stats.revenue.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                    activeTab === tab
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search Order ID, Customer, Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:bg-white focus:border-slate-900 transition"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Loading live vendor orders...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center space-y-3 bg-rose-50/50 rounded-2xl border border-rose-100">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <p className="text-xs font-bold text-rose-600">{error}</p>
              <button
                onClick={fetchVendorOrders}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-extrabold"
              >
                Retry Loading
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No matching orders found</p>
              <p className="text-xs text-slate-400">Adjust your status tab or search keywords.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const orderDisplayCode = order.orderNumber || `#${order._id.slice(-6).toUpperCase()}`;
                const custName = order.shippingAddress?.fullName || order.customer?.name || "Customer";
                const custPhone = order.shippingAddress?.phone || order.customer?.phone || "N/A";
                const fullAddress = order.shippingAddress
                  ? `${order.shippingAddress.street}, ${order.shippingAddress.city}`
                  : "Address missing";

                const isUpdatingThis = updatingId === order._id;

                return (
                  <div
                    key={order._id}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden hover:border-slate-300 transition"
                  >
                    <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                          {orderDisplayCode}
                        </span>
                        <button
                          onClick={() => copyToClipboard(order._id, order._id)}
                          className="text-[11px] font-mono text-slate-400 hover:text-slate-700 flex items-center gap-1 transition"
                          title="Copy Mongo DB ObjectId"
                        >
                          <span>{order._id.slice(0, 8)}...</span>
                          <Copy className="w-3 h-3" />
                          {copiedId === order._id && (
                            <span className="text-emerald-600 font-sans text-[10px] font-bold">Copied!</span>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                            order.paymentStatus === "Paid"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {order.paymentMethod || "COD"} • {order.paymentStatus || "Unpaid"}
                        </span>

                        <span
                          className={`text-[10px] font-black px-3 py-1 rounded-full border ${
                            order.status === "Pending"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : order.status === "Processing"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : order.status === "Shipped"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : order.status === "Delivered"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            Customer
                          </p>
                          <h4 className="text-xs font-black text-slate-900">{custName}</h4>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <a href={`tel:${custPhone}`} className="hover:underline hover:text-slate-900">
                              {custPhone}
                            </a>
                          </div>
                        </div>

                        <div className="space-y-1 md:col-span-2">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            Delivery Destination
                          </p>
                          <div className="flex items-start gap-1.5 text-xs text-slate-700 font-semibold">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span>{fullAddress}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          Items Summary ({order.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 0})
                        </p>
                        <div className="space-y-2">
                          {(order.items || []).map((item, idx) => {
                            const title = item.product?.title || item.title || "Product item";
                            const price = item.product?.price || item.price || 0;
                            const qty = item.quantity || 1;

                            return (
                              <div
                                key={item._id || idx}
                                className="flex items-center justify-between text-xs font-semibold text-slate-800"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                  <span>{title}</span>
                                </div>
                                <span className="font-extrabold text-slate-900">
                                  Qty: {qty} × Rs. {price.toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {order.courierName && order.trackingId && (
                        <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between text-xs font-semibold text-indigo-950">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-indigo-600" />
                            <span>
                              Courier: <strong>{order.courierName}</strong> | Tracking ID:{" "}
                              <strong className="font-mono">{order.trackingId}</strong>
                            </span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(order.trackingId, `tr-${order._id}`)}
                            className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                          >
                            Copy Tracking
                          </button>
                        </div>
                      )}

                      {order.cancelReason && (
                        <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                          <div>
                            <strong className="font-bold">Cancellation Reason:</strong> {order.cancelReason}
                          </div>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 text-xs">
                          <div>
                            <span className="text-slate-400 font-medium">Order Total: </span>
                            <span className="font-black text-slate-900">
                              Rs. {(order.totalAmount || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="border-l border-slate-200 pl-4">
                            <span className="text-slate-400 font-medium">Vendor Payout: </span>
                            <span className="font-black text-emerald-600">
                              Rs. {(order.vendorEarnings || order.totalAmount || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => handlePrintSlip(order)}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Print Slip
                          </button>

                          {order.status === "Cancellation Requested" && (
                            <>
                              <button
                                onClick={() => handleOpenApproveModal(order)}
                                disabled={isUpdatingThis}
                                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectCancellation(order)}
                                disabled={isUpdatingThis}
                                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5" />
                                Reject
                              </button>
                            </>
                          )}

                          {(order.status === "Cancelled" || order.status === "Delivered") && (
                            <button
                              onClick={() => setDeleteModalOrder(order)}
                              disabled={deletingId === order._id}
                              className="px-3 py-2 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {deletingId === order._id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                              Delete
                            </button>
                          )}

                          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                            <span className="text-[10px] font-extrabold uppercase text-slate-400 pl-2">
                              Status:
                            </span>
                            <select
                              value={order.status}
                              disabled={isUpdatingThis || order.status === "Cancelled" || order.status === "Delivered"}
                              onChange={(e) => handleStatusSelect(order, e.target.value)}
                              className="bg-white text-xs font-bold text-slate-800 py-1.5 px-3 rounded-lg border border-slate-200 outline-none focus:border-slate-900 transition disabled:opacity-50"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedOrderForTracking && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900">Dispatch Tracking Details</h3>
                <button
                  onClick={() => setSelectedOrderForTracking(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Enter the shipping courier and consignment tracking number to notify the customer.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                    Courier Service
                  </label>
                  <select
                    value={trackingInput.courierName}
                    onChange={(e) => setTrackingInput({ ...trackingInput, courierName: e.target.value })}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white focus:border-slate-900"
                  >
                    <option value="TCS">TCS</option>
                    <option value="Leopard Courier">Leopard Courier</option>
                    <option value="M&P">M&P</option>
                    <option value="Trax">Trax</option>
                    <option value="PostEx">PostEx</option>
                    <option value="Pakistan Post">Pakistan Post</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                    Tracking / Consignment ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1234567890"
                    value={trackingInput.trackingId}
                    onChange={(e) => setTrackingInput({ ...trackingInput, trackingId: e.target.value })}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setSelectedOrderForTracking(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTracking}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                >
                  Confirm & Ship
                </button>
              </div>
            </div>
          </div>
        )}

        {vendorCancelModalOrder && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-rose-600 flex items-center gap-2">
                  <Ban className="w-5 h-5" /> Cancel Order
                </h3>
                <button
                  onClick={() => setVendorCancelModalOrder(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Are you sure you want to cancel this order? Please state the reason below.
              </p>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                  Reason for Cancellation
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Item out of stock, customer requested cancellation..."
                  value={vendorCancelReason}
                  onChange={(e) => setVendorCancelReason(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white focus:border-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setVendorCancelModalOrder(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteModalOrder && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-rose-600 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" /> Delete Order
                </h3>
                <button
                  onClick={() => setDeleteModalOrder(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete this order? This action cannot be undone. Stock for
                any non-cancelled items will be restored.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeleteModalOrder(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleDeleteOrder}
                  disabled={deletingId === deleteModalOrder._id}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
                >
                  {deletingId === deleteModalOrder._id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
