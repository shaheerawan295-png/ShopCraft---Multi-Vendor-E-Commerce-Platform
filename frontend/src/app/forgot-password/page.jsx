"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, ArrowLeft } from "lucide-react";
import { API_URL } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ email: "", otp: "", newPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
const res = await fetch(`${API_URL}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
         credentials: "include",
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");

      setMessage(data.message);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
const res = await fetch(`${API_URL}/api/v1/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");

      setMessage(data.message);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-4xl border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.04)] p-8 sm:p-10">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {step === 1 ? "Enter your email to receive an OTP" : "Enter OTP and your new password"}
          </p>
        </div>

        {error && <div className="mb-6 p-4 rounded-2xl bg-rose-50 text-rose-600 text-xs font-semibold">⚠️ {error}</div>}
        {message && <div className="mb-6 p-4 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-semibold">✅ {message}</div>}

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-sm focus:bg-white focus:border-slate-900 outline-none transition font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-black hover:bg-slate-800 text-white font-extrabold rounded-2xl shadow-md transition"
            >
              {loading ? "Sending OTP..." : "Send Reset OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                6-Digit OTP
              </label>
              <input
                type="text"
                name="otp"
                required
                maxLength={6}
                value={formData.otp}
                onChange={handleChange}
                placeholder="123456"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-center font-mono text-lg font-bold text-slate-900 outline-none transition tracking-widest"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                required
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-sm focus:bg-white focus:border-slate-900 outline-none transition font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-black hover:bg-slate-800 text-white font-extrabold rounded-2xl shadow-md transition"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        <div className="text-center mt-6">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
}