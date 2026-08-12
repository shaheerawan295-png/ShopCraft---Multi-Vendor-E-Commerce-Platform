"use client";

import { useState, useEffect } from "react";
import { Tag, Plus, Calendar, Percent, Trash2 } from "lucide-react";
import { API_URL } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

const API_BASE = API_URL;

export default function VendorCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discountPercentage: "",
    expirationDate: "",
  });

  const fetchCoupons = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/coupons`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setCoupons(data.coupons);
    } catch (err) {
      console.error("Failed to fetch coupons:", err);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchCoupons();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/coupons/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        alert("Store Coupon Created Successfully!");
        setFormData({ code: "", discountPercentage: "", expirationDate: "" });
        fetchCoupons();
      } else {
        alert(data.message || "Failed to create coupon");
      }
    } catch (error) {
      console.error("Create coupon error:", error);
      alert("Error creating coupon");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/coupons/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) fetchCoupons();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["vendor"]}>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-slate-800" /> Vendor Store Coupons
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Create discount coupons for your products
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 h-fit"
          >
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Store Coupon
            </h2>

            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-slate-600 uppercase">
                Coupon Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MYSHOP10"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold uppercase outline-none focus:bg-white focus:border-slate-900 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-slate-600 uppercase flex items-center gap-1">
                <Percent className="w-3 h-3" /> Discount %
              </label>
              <input
                type="number"
                required
                min="1"
                max="100"
                placeholder="10"
                value={formData.discountPercentage}
                onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold outline-none focus:bg-white focus:border-slate-900 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-slate-600 uppercase flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Expiration Date
              </label>
              <input
                type="date"
                required
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold outline-none focus:bg-white focus:border-slate-900 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
            >
              {loading ? "Creating..." : "Save Coupon"}
            </button>
          </form>

          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">My Store Coupons</h2>

            {coupons.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium py-8 text-center">
                No coupons created yet.
              </p>
            ) : (
              <div className="space-y-3">
                {coupons.map((c) => {
                  const isExpired = new Date(c.expirationDate) < new Date();
                  return (
                    <div
                      key={c._id}
                      className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 tracking-wider">
                            {c.code}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isExpired
                                ? "bg-rose-100 text-rose-600"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {isExpired ? "Expired" : "Active"}
                          </span>
                        </div>
                        <p className="text-[10px] font-semibold text-slate-500">
                          {c.discountPercentage}% OFF • Expiry:{" "}
                          {new Date(c.expirationDate).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDelete(c._id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}