"use client";

import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Lock, ShieldCheck, Loader2 } from "lucide-react";
import { API_URL } from "@/lib/api";

const API_BASE = API_URL;

export default function CardPaymentForm({ clientSecret, orderId, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleCardPay = async (e) => {
    e.preventDefault();

    
    if (loading) return;

    if (!stripe || !elements) {
      setErrorMessage("Stripe engine is initializing. Please try again in a moment.");
      return;
    }

    if (!clientSecret) {
      setErrorMessage("Payment session invalid. Please refresh the page.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const cardElement = elements.getElement(CardElement);

      
      const { paymentIntent, error } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      
      if (error) {
        console.error("Stripe API 400 Detail:", error);
        setErrorMessage(error.message || `Payment Error (${error.code})`);
        setLoading(false);
        return;
      }

      
      if (paymentIntent && paymentIntent.status === "succeeded") {
        const res = await fetch(`${API_BASE}/api/v1/payments/confirm-stripe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ orderId }),
        });

        const data = await res.json();
        if (data.success) {
          onSuccess();
        } else {
          setErrorMessage(data.message || "Failed to sync order status.");
        }
      }
    } catch (err) {
      console.error("Unexpected submission error:", err);
      setErrorMessage("Something went wrong during payment processing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleCardPay} className="w-full space-y-4 pt-2">
      <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl">
        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-2">
          Card Details
        </label>
        <div className="p-3 bg-white border border-slate-200 rounded-xl focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-400 transition-all">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "14px",
                  color: "#0f172a",
                  "::placeholder": { color: "#94a3b8" },
                },
                invalid: { color: "#ef4444" },
              },
            }}
          />
        </div>
      </div>

      {errorMessage && (
        <p className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100 wrap-break-word">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || loading || !clientSecret}
        className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm hover:shadow"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
            <span>Processing Card...</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Pay with Card Now</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Secured by 256-bit Stripe Encryption</span>
      </div>
    </form>
  );
}