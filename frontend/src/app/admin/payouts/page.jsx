"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { formatPrice } from "@/lib/formatPrice";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminPayoutsPage() {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminStats = async () => {
    try {
const res = await fetch(`${API_URL}/api/v1/earnings/admin/stats`, {
        credentials: "include",
      });
      const result = await res.json();
      if (result.success) setAdminData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchAdminStats();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const handlePayoutStatus = async (payoutId, newStatus) => {
    try {
const res = await fetch(`${API_URL}/api/v1/earnings/admin/payout/${payoutId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await res.json();
      if (result.success) {
        alert(result.message);
        fetchAdminStats();
      }
    } catch (err) {
      alert("Failed to update payout status.");
    }
  };

  if (loading) return <div className="p-8 text-center text-sm font-bold">Loading Admin Analytics...</div>;

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Super Admin Financial Panel</h1>
          <p className="text-xs text-slate-500">Marketplace overview and vendor payout management.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-black text-white space-y-1">
            <p className="text-xs text-slate-400">Total Marketplace GMV</p>
            <p className="text-2xl font-black">{formatPrice(adminData?.stats?.marketplaceGMV ?? 0)}</p>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-500 text-white space-y-1">
            <p className="text-xs text-emerald-100">Net Admin Commission (10%)</p>
            <p className="text-2xl font-black">{formatPrice(adminData?.stats?.totalAdminRevenue ?? 0)}</p>
          </div>

          <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 space-y-1">
            <p className="text-xs text-indigo-600 font-semibold">Active Vendors</p>
            <p className="text-2xl font-black">{adminData?.stats?.totalVendors ?? 0}</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Pending Vendor Payout Requests</h2>

          {adminData?.pendingPayouts?.length === 0 ? (
            <p className="text-xs text-slate-400">No pending payout requests.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-bold">
                <thead className="bg-slate-100 text-slate-600 uppercase border-b">
                  <tr>
                    <th className="p-3">Vendor</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Account Details</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminData?.pendingPayouts?.map((payout) => (
                    <tr key={payout._id} className="border-b hover:bg-slate-50">
                      <td className="p-3">
                        <div>{payout.vendor?.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{payout.vendor?.email}</div>
                      </td>
                      <td className="p-3 text-emerald-600 font-black">{formatPrice(payout.amount)}</td>
                      <td className="p-3">{payout.paymentMethod}</td>
                      <td className="p-3">
                        <div>{payout.accountDetails?.accountTitle}</div>
                        <div className="text-[10px] text-slate-400">{payout.accountDetails?.accountNumber} ({payout.accountDetails?.bankName || "Mobile Wallet"})</div>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handlePayoutStatus(payout._id, "Approved")}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] hover:bg-emerald-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handlePayoutStatus(payout._id, "Rejected")}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[10px] hover:bg-red-700"
                        >
                          Reject
                        </button>
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