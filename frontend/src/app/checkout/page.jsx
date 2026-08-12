"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import {
  Truck,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Tag,
  X,
  Check,
} from "lucide-react";

import { useCart } from "@/context/CartContext";
import { stripePromise } from "@/lib/stripe";
import { auth } from "@/lib/firebase";
import { API_URL } from "@/lib/api";
import CardPaymentForm from "@/components/CardPaymentForm";
import ProtectedRoute from "../../components/ProtectedRoute";
import { formatPrice } from "@/lib/formatPrice";

const API_BASE = API_URL;

const formatPakPhone = (phone) => {
  if (!phone) return "";
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.startsWith("92")) return `+${cleanPhone}`;
  if (cleanPhone.startsWith("0")) return `+92${cleanPhone.slice(1)}`;
  if (cleanPhone.length === 10 && cleanPhone.startsWith("3")) return `+92${cleanPhone}`;
  return phone.startsWith("+") ? phone : `+${cleanPhone}`;
};

const normalizePhoneInput = (value) => value.replace(/\D/g, "").slice(0, 11);

function CheckoutWalletSection({
  walletType,
  setWalletType,
  createBaseOrder,
  clearCart,
  router,
  createdOrder,
  setCreatedOrder,
  validateShippingAddress,
  defaultPhone,
}) {
  const [phone, setPhone] = useState(defaultPhone || "");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const recaptchaVerifierRef = useRef(null);

  useEffect(() => {
    if (defaultPhone && !phone) {
      const timeout = window.setTimeout(() => {
        setPhone(defaultPhone);
      }, 0);

      return () => window.clearTimeout(timeout);
    }
  }, [defaultPhone, phone]);

  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {}
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const setupRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch (e) {}
      recaptchaVerifierRef.current = null;
    }

    recaptchaVerifierRef.current = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "invisible",
        callback: () => {},
        "expired-callback": () => {
          if (recaptchaVerifierRef.current) {
            try {
              recaptchaVerifierRef.current.clear();
            } catch (e) {}
            recaptchaVerifierRef.current = null;
          }
        },
      }
    );
  };

  const handleSendSMS = async () => {
    if (!validateShippingAddress()) return;

    const formattedNumber = formatPakPhone(phone);
    if (!formattedNumber || formattedNumber.length !== 13) {
      alert("Please enter a valid 11-digit Pakistani phone number (e.g., 03001234567).");
      return;
    }

    setLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = recaptchaVerifierRef.current;

      const result = await signInWithPhoneNumber(
        auth,
        formattedNumber,
        appVerifier
      );
      setConfirmationResult(result);
      alert(`OTP sent via SMS to ${phone}`);
    } catch (error) {
      console.error("Firebase SMS Error:", error);
      alert(error.message || "Failed to send SMS OTP.");
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {}
        recaptchaVerifierRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || !confirmationResult) return;

    setLoading(true);
    try {
      let orderId = createdOrder?._id;
      if (!orderId) {
        const orderData = await createBaseOrder();
        if (!orderData?.success) {
          alert(orderData?.message || "Failed to create order");
          setLoading(false);
          return;
        }
        orderId = orderData.order._id;
        setCreatedOrder(orderData.order);
      }

      const userCredential = await confirmationResult.confirm(otp);
      const idToken = await userCredential.user.getIdToken();

      const res = await fetch(`${API_BASE}/api/v1/payments/verify-firebase-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          idToken,
          orderId,
          walletType,
        }),
      });

      const data = await res.json();
      if (data.success) {
        clearCart();
        router.push("/orders");
      } else {
        alert(data.message || "Wallet payment verification failed.");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      alert("Invalid OTP code or verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
      <div id="recaptcha-container"></div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => setWalletType("JazzCash")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
            walletType === "JazzCash"
              ? "bg-red-500 text-white border-red-500"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
          }`}
        >
          JazzCash
        </button>
        <button
          type="button"
          onClick={() => setWalletType("EasyPaisa")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
            walletType === "EasyPaisa"
              ? "bg-emerald-500 text-white border-emerald-500"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
          }`}
        >
          EasyPaisa
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="tel"
            inputMode="numeric"
            placeholder="03001234567"
            value={phone}
            onChange={(e) => setPhone(normalizePhoneInput(e.target.value))}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 transition"
          />
          <button
            type="button"
            onClick={handleSendSMS}
            disabled={loading}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shrink-0"
          >
            {loading ? "Sending..." : "Get SMS OTP"}
          </button>
        </div>

        {confirmationResult && (
          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <input
              type="text"
              maxLength={6}
              placeholder="Enter 6-Digit SMS Code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 transition"
            />
            <button
              type="button"
              onClick={handleVerifyOTP}
              disabled={loading}
              className="px-4 py-2.5 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shrink-0"
            >
              {loading ? "Verifying..." : "Verify & Pay"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { cart, getCartTotal, clearCart } = useCart();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("COD");
  const [walletType, setWalletType] = useState("JazzCash");

  const [createdOrder, setCreatedOrder] = useState(null);
  const [clientSecret, setClientSecret] = useState("");
  const orderSubmittingRef = useRef(false);

const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    street: "",
    city: "",
    phone: "",
  });

const subtotal = getCartTotal();
  const discountAmount = appliedCoupon
    ? Math.round((subtotal * appliedCoupon.discountPercentage) / 100)
    : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount);

  const validateShippingAddress = () => {
    const { fullName, street, city, phone } = shippingAddress;
    if (!fullName.trim() || !street.trim() || !city.trim() || !phone.trim()) {
      alert("Please fill in all shipping address fields before proceeding.");
      return false;
    }

    const normalizedPhone = phone.replace(/\D/g, "");
    if (!/^(03)\d{9}$/.test(normalizedPhone) && normalizedPhone.length !== 11) {
      alert("Please enter a valid Pakistani phone number (e.g. 03001234567).");
      return false;
    }

    return true;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");

    try {
      const vendorIds = cart
        .map((item) => item.vendorId || item.product?.vendor?._id || item.product?.vendor)
        .filter(Boolean);

      const res = await fetch(`${API_BASE}/api/v1/coupons/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          code: couponCode,
          subtotal,
          vendorIds,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAppliedCoupon({
          code: data.code || couponCode.toUpperCase(),
          discountPercentage: data.discountPercentage,
        });
        setCouponCode("");
      } else {
        setCouponError(data.message || "Invalid coupon code");
      }
    } catch (error) {
      console.error("Coupon Error:", error);
      setCouponError("Failed to apply coupon. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl font-black text-slate-900">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6 font-medium">
          Add items to cart before proceeding to checkout.
        </p>
        <Link
          href="/shop"
          className="px-6 py-3.5 bg-black text-white text-xs font-extrabold rounded-2xl shadow-md"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  const createBaseOrder = async () => {
    const res = await fetch(`${API_BASE}/api/v1/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        items: cart,
        shippingAddress,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        discountAmount,
        totalAmount: grandTotal,
        paymentMethod:
          selectedMethod === "Wallet"
            ? walletType
            : selectedMethod === "Card"
            ? "Stripe Card"
            : selectedMethod,
      }),
    });
    return await res.json();
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (selectedMethod === "Wallet") return;
    if (!validateShippingAddress()) return;

    if (orderSubmittingRef.current) return;
    orderSubmittingRef.current = true;

    setLoading(true);

    try {
      const orderData = await createBaseOrder();
      if (!orderData.success) {
        alert(orderData.message || "Failed to create order");
        return;
      }

      const orderId = orderData.order._id;

      if (selectedMethod === "COD") {
        clearCart();
        router.push("/orders");
      } else if (selectedMethod === "Card") {
        const intentRes = await fetch(
          `${API_BASE}/api/v1/payments/create-payment-intent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ orderId }),
          }
        );
        const intentData = await intentRes.json();

        if (intentData.success) {
          setCreatedOrder(orderData.order);
          setClientSecret(intentData.clientSecret);
        } else {
          alert(intentData.message || "Failed to initialize card payment.");
        }
      }
    } catch (err) {
      console.error("Checkout submit error:", err);
      alert("Something went wrong processing your order.");
    } finally {
      orderSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <div className="max-w-5xl mx-auto space-y-8 p-4 sm:p-6">
        <div className="bg-white/90 backdrop-blur-md rounded-4xl p-6 border border-slate-100 shadow-sm">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Checkout</h1>
          <p className="text-xs text-slate-500 font-medium">
            Select your payment preference and complete delivery details
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 lg:gap-8">
          <div className="space-y-6">
            <form onSubmit={handleCheckoutSubmit} className="space-y-6">
              <div className="bg-white/90 backdrop-blur-md rounded-4xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-slate-700" /> Shipping Address
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={shippingAddress.fullName}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, fullName: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:bg-white focus:border-slate-900 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="03001234567"
                      value={shippingAddress.phone}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, phone: normalizePhoneInput(e.target.value) })
                      }
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:bg-white focus:border-slate-900 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                    Street Address
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="House #123, Street 5"
                    value={shippingAddress.street}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, street: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:bg-white focus:border-slate-900 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Lahore"
                    value={shippingAddress.city}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, city: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:bg-white focus:border-slate-900 transition"
                  />
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-md rounded-4xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-slate-700" /> Payment Options
                </h2>

                <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMethod("COD");
                      setClientSecret("");
                    }}
                    className={`py-3 text-xs font-extrabold rounded-xl transition ${
                      selectedMethod === "COD"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    COD
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod("Card")}
                    className={`py-3 text-xs font-extrabold rounded-xl transition ${
                      selectedMethod === "Card"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Stripe Card
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMethod("Wallet");
                      setClientSecret("");
                    }}
                    className={`py-3 text-xs font-extrabold rounded-xl transition ${
                      selectedMethod === "Wallet"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    JazzCash / EasyPaisa
                  </button>
                </div>

                {selectedMethod === "COD" && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-slate-900 shrink-0" />
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">Cash on Delivery</h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Pay cash upon receiving products at your doorstep.
                      </p>
                    </div>
                  </div>
                )}

                {selectedMethod === "Card" && !clientSecret && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
                    Clicking <strong>&quot;Proceed to Card Payment&quot;</strong> will initialize secure Stripe card processing.
                  </div>
                )}

                {selectedMethod === "Wallet" && (
                  <CheckoutWalletSection
                    walletType={walletType}
                    setWalletType={setWalletType}
                    createBaseOrder={createBaseOrder}
                    clearCart={clearCart}
                    router={router}
                    createdOrder={createdOrder}
                    setCreatedOrder={setCreatedOrder}
                    validateShippingAddress={validateShippingAddress}
                    defaultPhone={shippingAddress.phone}
                  />
                )}
              </div>

              {selectedMethod !== "Wallet" && (!clientSecret || selectedMethod !== "Card") && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-black hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {loading
                    ? "Processing Order..."
                    : selectedMethod === "Card"
                    ? "Proceed to Card Payment"
                    : "Place Order via COD"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </form>

            {selectedMethod === "Card" && clientSecret && createdOrder && (
              <div className="bg-white/90 backdrop-blur-md rounded-4xl p-6 border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-900">Enter Card Details</h3>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CardPaymentForm
                    clientSecret={clientSecret}
                    orderId={createdOrder._id}
                    onSuccess={() => {
                      clearCart();
                      router.push("/orders");
                    }}
                  />
                </Elements>
              </div>
            )}
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-4xl p-6 border border-slate-100 shadow-sm h-fit space-y-5 xl:sticky xl:top-24">
            <h2 className="text-lg font-black text-slate-900">Items Summary</h2>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {cart.map((item, idx) => (
                <div key={item.product?._id || item._id || idx} className="flex items-center gap-3">
                  <img
                    src={item.product?.images?.[0] || "/placeholder.png"}
                    alt={item.product?.title || "Product image"}
                    className="w-12 h-12 rounded-xl object-cover bg-slate-50 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-extrabold text-slate-900 truncate">
                      {item.product?.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Qty: {item.quantity} × {formatPrice(item.product?.price)}
                    </p>
                  </div>
                  <span className="text-xs font-black text-slate-900">
                    {formatPrice((item.product?.price || 0) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-700" /> Promo / Coupon Code
              </label>

              {!appliedCoupon ? (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ENTER CODE"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold uppercase tracking-wider outline-none focus:bg-white focus:border-slate-900 transition"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shrink-0"
                    >
                      {couponLoading ? "..." : "Apply"}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-[10px] font-bold text-rose-500 pl-1">{couponError}</p>
                  )}
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-3" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-emerald-900 tracking-wide">
                        {appliedCoupon.code}
                      </p>
                      <p className="text-[10px] font-bold text-emerald-600">
                        {appliedCoupon.discountPercentage}% Discount Applied
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="p-1 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                    title="Remove Coupon"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs font-medium text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">{formatPrice(subtotal)}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount ({appliedCoupon.discountPercentage}%)</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span className="text-emerald-600 font-bold">Free</span>
              </div>

              <div className="flex justify-between pt-2 border-t border-slate-100 text-sm font-black text-slate-900">
                <span>Total</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-50 p-3 rounded-2xl">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Encrypted & secure checkout handling</span>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}