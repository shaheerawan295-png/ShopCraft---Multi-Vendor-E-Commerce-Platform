"use client";

import { useState } from "react";
import { useAuth, redirectUserByRole } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Store, Sparkles, Mail, Lock, UserCheck, ArrowRight } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { API_URL } from "@/lib/api";

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "customer" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { checkUserLoggedIn } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token: credentialResponse.credential,
          idToken: credentialResponse.credential,
          role: formData?.role || "customer",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Google Sign-Up failed");

      const loggedInUser = await checkUserLoggedIn();
      const userRole = loggedInUser?.role || data.user?.role || formData.role || "customer";
      redirectUserByRole(userRole, router);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      const loggedInUser = await checkUserLoggedIn();
      const userRole = loggedInUser?.role || data.user?.role || formData.role || "customer";
      redirectUserByRole(userRole, router);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="min-h-[90vh] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50/50">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] p-8 sm:p-10 relative overflow-hidden transition-all">
          
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-[#FF3B6B] text-white rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-lg shadow-[#FF3B6B]/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Create Account
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Join our curated multi-vendor marketplace
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200/60 text-rose-600 text-xs font-semibold flex items-center gap-2 animate-shake">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-[11px] font-bold text-slate-700 mb-2 uppercase tracking-wider">
              I want to join as:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "customer" })}
                className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                  formData.role === "customer"
                    ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <User className="w-4 h-4" /> Customer
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "vendor" })}
                className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                  formData.role === "vendor"
                    ? "border-[#FF3B6B] bg-[#FF3B6B] text-white shadow-sm"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Store className="w-4 h-4" /> Vendor
              </button>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google Sign-Up failed")}
              theme="outline"
              shape="circle"
              width="350"
              text="signup_with"
            />
          </div>

          <div className="relative flex py-2 items-center mb-6">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              or fill details
            </span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Shaheer awan"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-slate-900 outline-none transition font-medium text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="shaheer@gmail.com"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-slate-900 outline-none transition font-medium text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-slate-900 outline-none transition font-medium text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-slate-900 hover:bg-black text-white font-extrabold rounded-2xl shadow-lg shadow-slate-900/10 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? "Creating Account..." : <>Register Now <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500 font-semibold">
              Already have an account?{" "}
              <Link href="/login" className="font-extrabold text-slate-900 hover:underline">
                Sign In
              </Link>
            </p>
          </div>

        </div>
      </div>
  );
}