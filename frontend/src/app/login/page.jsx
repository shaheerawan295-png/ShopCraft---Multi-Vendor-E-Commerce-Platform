"use client";

import { useState } from "react";
import { useAuth, redirectUserByRole } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Sparkles, ArrowRight } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { API_URL } from "@/lib/api";

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState("password");
  const [formData, setFormData] = useState({ email: "", password: "", otp: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
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
          role: "customer",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Google Authentication failed");

      const loggedInUser = await checkUserLoggedIn();
      const userRole = loggedInUser?.role || data.user?.role || "customer";
      redirectUserByRole(userRole, router);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid credentials");

      const loggedInUser = await checkUserLoggedIn();
      const userRole = loggedInUser?.role || data.user?.role || data.role || "customer";
      redirectUserByRole(userRole, router);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!formData.email) {
      setError("Please enter your email first");
      return;
    }
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/send-login-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");

      setOtpSent(true);
      setMessage(data.message || "OTP sent successfully to your email!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/verify-login-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: formData.email, otp: formData.otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "OTP verification failed");

      const loggedInUser = await checkUserLoggedIn();
      const userRole = loggedInUser?.role || data.user?.role || "customer";
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
          
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-lg shadow-slate-900/20">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Sign in to manage your account & orders
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google Sign-In failed")}
              theme="outline"
              shape="circle"
              width="350"
            />
          </div>

          <div className="relative flex py-2 items-center mb-6">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              or continue with
            </span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200/60 text-rose-600 text-xs font-semibold flex items-center gap-2 animate-shake">
              <span>⚠️</span> {error}
            </div>
          )}
          {message && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <span>✅</span> {message}
            </div>
          )}

          <div className="bg-slate-100 p-1 rounded-2xl flex mb-6">
            <button
              onClick={() => { setLoginMethod("password"); setError(""); setMessage(""); }}
              className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all ${
                loginMethod === "password"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Password Login
            </button>
            <button
              onClick={() => { setLoginMethod("otp"); setError(""); setMessage(""); }}
              className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all ${
                loginMethod === "otp"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              OTP Login
            </button>
          </div>

          {loginMethod === "password" ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
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
                    placeholder="name@example.com"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-slate-900 outline-none transition font-medium text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs font-bold text-[#FF3B6B] hover:underline">
                    Forgot?
                  </Link>
                </div>
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
                {loading ? "Signing in..." : <>Sign In <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    name="email"
                    required
                    disabled={otpSent}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-slate-900 outline-none transition font-medium disabled:bg-slate-100 text-slate-900"
                  />
                  {!otpSent && (
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={loading}
                      className="px-4 py-3 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-2xl whitespace-nowrap transition shadow-md"
                    >
                      Send OTP
                    </button>
                  )}
                </div>
              </div>

              {otpSent && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    6-Digit OTP
                  </label>
                  <input
                    type="text"
                    name="otp"
                    required
                    value={formData.otp}
                    onChange={handleChange}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-center font-mono text-lg font-bold text-slate-900 outline-none transition focus:border-slate-900 tracking-widest"
                  />
                </div>
              )}

              {otpSent && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-slate-900 hover:bg-black text-white font-extrabold rounded-2xl shadow-lg transition"
                >
                  {loading ? "Verifying..." : "Verify OTP & Sign In"}
                </button>
              )}
            </form>
          )}

          <div className="mt-8 text-center pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500 font-semibold">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-extrabold text-slate-900 hover:underline">
                Create Account
              </Link>
            </p>
          </div>

        </div>
      </div>
  );
}