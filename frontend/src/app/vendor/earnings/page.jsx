"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { formatPrice } from "@/lib/formatPrice";

export default function VendorEarningsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Bank Transfer");
  const [accountTitle, setAccountTitle] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");

  const fetchStats = async () => {
    try {
const res = await fetch(`${API_URL}/api/v1/earnings/vendor/stats`, {
        credentials: "include",
      });
      const result = await res.json();
      if (result.success) setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchStats();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    if (Number(amount) > data.stats.availableBalance) {
      alert("Amount exceeds your available balance!");
      return;
    }

    try {
const res = await fetch(`${API_URL}/api/v1/earnings/vendor/request-payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount: Number(amount),
          paymentMethod: method,
          accountTitle,
          accountNumber,
          bankName,
        }),
      });

      const result = await res.json();
      if (result.success) {
        alert("Payout request submitted!");
        setAmount("");
        fetchStats();
      } else {
        alert(result.message);
      }
    } catch (err) {
      alert("Error submitting payout request.");
    }
  };

  if (loading) return <div className="p-8 text-center text-sm font-bold">Loading Financial Data...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Vendor Earnings & Wallet</h1>
        <p className="text-xs text-slate-500">Track sales, 10% platform commission, and request payouts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-1">
          <p className="text-xs text-slate-400">Total Gross Sales</p>
          <p className="text-2xl font-black">{formatPrice(data?.stats?.totalGrossSales)}</p>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
          <p className="text-xs font-semibold text-amber-600">Platform Fee (10%)</p>
          <p className="text-2xl font-black">-{formatPrice(data?.stats?.adminCommissionDeducted)}</p>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
          <p className="text-xs font-semibold text-emerald-600">Available Balance</p>
          <p className="text-2xl font-black">{formatPrice(data?.stats?.availableBalance)}</p>
        </div>

        <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
          <p className="text-xs font-semibold text-blue-600">Pending Payouts</p>
          <p className="text-2xl font-black">{formatPrice(data?.stats?.pendingPayouts)}</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Request Withdrawal</h2>

        <form onSubmit={handlePayoutSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="Withdrawal Amount (PKR)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none"
          />

          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none"
          >
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="JazzCash">JazzCash</option>
            <option value="EasyPaisa">EasyPaisa</option>
          </select>

          <input
            type="text"
            placeholder="Account Title"
            value={accountTitle}
            onChange={(e) => setAccountTitle(e.target.value)}
            required
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none"
          />

          <input
            type="text"
            placeholder="Account / IBAN Number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            required
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none"
          />

          {method === "Bank Transfer" && (
            <input
              type="text"
              placeholder="Bank Name (e.g. Meezan Bank)"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              required
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none col-span-2"
            />
          )}

          <button
            type="submit"
            className="col-span-2 py-3 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition"
          >
            Submit Payout Request
          </button>
        </form>
      </div>
    </div>
  );
}