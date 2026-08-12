
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/formatPrice";
import { useCart } from "@/context/CartContext";
import { API_URL } from "@/lib/api";
import ShopByCategory from "../components/ShopByCategory";
import HowItWorks from "../components/HowItWorks";
import {
  ArrowRight,
  ShoppingBag,
  Store,
  Users,
  ShieldCheck,
  Sparkles,
  Truck,
  Package,
  Globe,
  Heart,
  Star,
  Zap,
  BadgeCheck,
  Search,
  CreditCard,
  Mail,
  CheckCircle2,
  Quote,
  Home as HomeIcon,
  Shirt,
  Flame,
  Gem,
  Paintbrush,
  ShoppingBasket,
  Flower2,
  Plus,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const categoryIconMap = {
  Electronics: Zap,
  Fashion: Shirt,
  "Home & Living": HomeIcon,
  Footwear: ShoppingBag,
  Beauty: Flower2,
  Accessories: Gem,
  "Art & Decor": Paintbrush,
  Jewelry: Gem,
  Candles: Flame,
  Textiles: Shirt,
  Handcrafted: ShoppingBasket,
  Other: Package,
};

const floatingProducts = [
  {
    icon: HomeIcon,
    label: "Ceramics",
    color: "from-emerald-400/20 to-teal-300/10",
    delay: 0,
  },
  {
    icon: Shirt,
    label: "Textiles",
    color: "from-rose-400/20 to-pink-300/10",
    delay: 0.6,
  },
  {
    icon: Flame,
    label: "Candles",
    color: "from-amber-400/20 to-orange-300/10",
    delay: 1.2,
  },
  {
    icon: Gem,
    label: "Jewelry",
    color: "from-violet-400/20 to-purple-300/10",
    delay: 0.3,
  },
  {
    icon: Paintbrush,
    label: "Art",
    color: "from-blue-400/20 to-cyan-300/10",
    delay: 0.9,
  },
  {
    icon: ShoppingBasket,
    label: "Basketry",
    color: "from-lime-400/20 to-green-300/10",
    delay: 1.5,
  },
];

const features = [
  {
    icon: BadgeCheck,
    title: "Verified Vendors",
    desc: "Every merchant is hand-verified for authentic, quality craftsmanship.",
    color: "text-emerald-500 bg-emerald-50",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    desc: "Encrypted checkout with COD, Stripe cards & local wallets.",
    color: "text-blue-500 bg-blue-50",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    desc: "Nationwide direct shipping with real-time order tracking.",
    color: "text-amber-500 bg-amber-50",
  },
  {
    icon: Users,
    title: "Community Trust",
    desc: "Thousands of shoppers & independent sellers in one marketplace.",
    color: "text-rose-500 bg-rose-50",
  },
];

const howItWorks = [
  {
    step: "01",
    icon: Search,
    title: "Discover",
    desc: "Browse curated collections from verified independent vendors.",
  },
  {
    step: "02",
    icon: ShoppingBag,
    title: "Order",
    desc: "Add to cart and checkout securely with your preferred payment method.",
  },
  {
    step: "03",
    icon: Truck,
    title: "Receive",
    desc: "Track your order as the vendor ships straight to your doorstep.",
  },
];

const topVendors = [
  {
    name: "CraftNest Studio",
    category: "Home Decor",
    rating: "4.9",
    products: "120",
    icon: HomeIcon,
  },
  {
    name: "Thread & Co.",
    category: "Textiles",
    rating: "4.8",
    products: "86",
    icon: Shirt,
  },
  {
    name: "Lume Artisan",
    category: "Candles",
    rating: "5.0",
    products: "64",
    icon: Flame,
  },
  {
    name: "Gems of Lahore",
    category: "Jewelry",
    rating: "4.7",
    products: "152",
    icon: Gem,
  },
];

const testimonials = [
  {
    name: "Ayesha Khan",
    role: "Verified Buyer",
    quote:
      "Amazing quality! The handwoven textiles exceeded my expectations. Support for local artisans is everything.",
    icon: Flower2,
  },
  {
    name: "Bilal Ahmed",
    role: "Verified Vendor",
    quote:
      "ShopCraft helped me grow my small candle business beyond anything I imagined. The dashboard is so easy to use.",
    icon: Flame,
  },
  {
    name: "Sara Malik",
    role: "Verified Buyer",
    quote:
      "The checkout was smooth and my order arrived in 2 days. Love the buyer protection and verified vendors.",
    icon: ShoppingBag,
  },
];

const trustBadges = [
  { icon: Globe, label: "Nationwide Shipping" },
  { icon: ShieldCheck, label: "Buyer Protection" },
  { icon: Package, label: "Easy Returns" },
  { icon: Star, label: "5-Star Sellers" },
];

export default function Home() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [addedId, setAddedId] = useState(null);
  const { addToCart, isInCart } = useCart();

  useEffect(() => {
    const controller = new AbortController();

    const fetchLatest = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/public/products?limit=8`, {
          signal: controller.signal,
        });

        const data = await res.json();

        if (data.success) {
          setProducts(data.products || []);
          setProductsError("");
        } else {
          setProducts([]);
          setProductsError(
            data.message || "Unable to load featured products right now."
          );
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch featured products", err);
          setProductsError(
            "Unable to reach the marketplace right now. Please try again shortly."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setProductsLoading(false);
        }
      }
    };

    fetchLatest();

    return () => controller.abort();
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();

    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const handleAddToCart = (product) => {
    if (isInCart(product._id)) {
      setAddedId(product._id);
      setTimeout(() => setAddedId(null), 1500);
      return;
    }

    addToCart(product, 1);
    setAddedId(product._id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-40 w-125 h-125 bg-[#FF3B6B]/10 blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute top-20 -right-40 w-125 h-125 bg-emerald-300/20 blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 w-100 h-100 bg-violet-300/20 blur-[120px] rounded-full" />

      <div className="relative space-y-16 sm:space-y-24 py-6 sm:py-8">
        <motion.section
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-6 items-center min-h-[70vh]"
        >
          <div className="space-y-6 sm:space-y-8">
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur border border-slate-200/60 text-[11px] sm:text-xs font-bold text-slate-700 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF3B6B]" />
              Pakistan&apos;s Premium Multi-Vendor Marketplace
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-[2.5rem] leading-[1.05] sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900"
            >
              Discover Handcrafted
              <span className="block text-transparent bg-clip-text bg-linear-to-r from-[#FF3B6B] to-rose-500">
                Treasures
              </span>
              From Trusted Vendors
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-sm sm:text-base lg:text-lg text-slate-500 font-medium max-w-lg leading-relaxed"
            >
              Shop unique, handmade products directly from verified independent
              merchants. Every item tells a story — support local craftsmanship.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-wrap gap-3 sm:gap-4"
            >
              <Link
                href="/shop"
                className="group inline-flex items-center gap-2 bg-slate-900 hover:bg-black text-white font-bold text-xs sm:text-sm px-5 sm:px-7 py-3.5 sm:py-4 rounded-2xl shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <ShoppingBag className="w-4 h-4" />
                Explore Marketplace
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white/80 hover:bg-white text-slate-800 font-bold text-xs sm:text-sm px-5 sm:px-7 py-3.5 sm:py-4 rounded-2xl border border-slate-200 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Store className="w-4 h-4 text-[#FF3B6B]" />
                Become a Vendor
              </Link>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="flex flex-wrap gap-6 sm:gap-8 pt-2 sm:pt-4"
            >
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  12k+
                </div>
                <div className="text-[10px] sm:text-xs font-semibold text-slate-400">
                  Products
                </div>
              </div>

              <div className="w-px bg-slate-200" />

              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  1.5k+
                </div>
                <div className="text-[10px] sm:text-xs font-semibold text-slate-400">
                  Vendors
                </div>
              </div>

              <div className="w-px bg-slate-200" />

              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  98%
                </div>
                <div className="text-[10px] sm:text-xs font-semibold text-slate-400">
                  Happy Buyers
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative hidden sm:block"
          >
            <div className="relative aspect-square max-w-md mx-auto">
              <motion.div
                animate={{ y: [0, -16, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 m-auto w-56 sm:w-64 h-56 sm:h-64 rounded-full bg-linear-to-br from-[#FF3B6B] to-rose-500 shadow-2xl shadow-rose-500/30 flex items-center justify-center"
              >
                <div className="w-44 sm:w-52 h-44 sm:h-52 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <ShoppingBasket className="w-16 h-16 sm:w-20 sm:h-20 text-white drop-shadow-lg" />
                </div>
              </motion.div>

              {floatingProducts.map((p, index) => (
                <motion.div
                  key={p.label}
                  animate={{ y: [0, -12, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: p.delay,
                  }}
                  className={`absolute w-16 sm:w-20 h-16 sm:h-20 rounded-2xl bg-linear-to-br ${p.color} border border-white/80 backdrop-blur-xl shadow-lg flex flex-col items-center justify-center gap-0.5`}
                  style={{
                    top: `${[8, 30, 62, 12, 55, 26][index]}%`,
                    left: `${[2, 68, 6, 70, 62, 2][index]}%`,
                  }}
                >
                  <p.icon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
                  <span className="text-[7px] sm:text-[8px] font-extrabold text-slate-700">
                    {p.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.section>
        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              className="bg-white/70 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-slate-200/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <div
                className={`w-11 h-11 rounded-2xl ${f.color} flex items-center justify-center mb-4`}
              >
                <f.icon className="w-5 h-5" />
              </div>

              <h3 className="font-extrabold text-slate-900 text-sm">
                {f.title}
              </h3>

              <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </motion.section>
        <ShopByCategory />

        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-8"
        >
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                Latest Products
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Fresh handcrafted items from our vendors
              </p>
            </div>

            <Link
              href="/shop"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-[#FF3B6B] hover:underline shrink-0"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="bg-white/70 rounded-3xl p-4 border border-slate-200/60 shadow-sm animate-pulse space-y-3"
                >
                  <div className="h-40 sm:h-48 bg-slate-200/70 rounded-2xl w-full" />
                  <div className="h-4 bg-slate-200/70 rounded-full w-1/3" />
                  <div className="h-5 bg-slate-200/70 rounded-full w-3/4" />
                  <div className="h-4 bg-slate-200/70 rounded-full w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white/60 rounded-3xl p-12 text-center border border-slate-200/60">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">
                No products yet
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {productsError || "Check back soon for fresh artisan drops."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((item) => (
                <motion.div
                  key={item._id}
                  variants={fadeUp}
                  className="bg-white/80 backdrop-blur rounded-3xl p-4 border border-slate-200/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <Link href={`/shop/${item._id}`}>
                      <div className="h-40 sm:h-48 bg-slate-50 rounded-2xl overflow-hidden relative mb-3">
                        <img
                          src={item.images?.[0] || "/placeholder.png"}
                          alt={item.title || "Product"}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />

                        <span className="absolute top-2.5 left-2.5 text-[9px] font-black uppercase tracking-wider text-slate-900 bg-white/90 backdrop-blur-md px-2 py-1 rounded-full shadow-sm">
                          {item.category}
                        </span>
                      </div>
                    </Link>

                    <p className="text-[10px] font-extrabold text-[#FF3B6B] uppercase tracking-wider truncate">
                      Store: {item.vendor?.name || "Verified Vendor"}
                    </p>

                    <Link href={`/shop/${item._id}`}>
                      <h3 className="font-extrabold text-slate-900 text-sm mt-1 line-clamp-1 hover:underline">
                        {item.title}
                      </h3>
                    </Link>

                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-1 font-medium">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        Price
                      </span>
                      <span className="text-lg font-black text-slate-900">
                        {formatPrice(item.price)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={isInCart(item._id)}
                      className={`px-3.5 py-2.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 transition ${
                        isInCart(item._id)
                          ? "bg-emerald-100 text-emerald-700 cursor-not-allowed"
                          : addedId === item._id
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
                      }`}
                    >
                      {isInCart(item._id) ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> In Cart
                        </>
                      ) : addedId === item._id ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Added
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" /> Add
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center sm:hidden">
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF3B6B] hover:underline"
            >
              View all products <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.section>

     
       <HowItWorks />
        

        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-8"
        > 
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                Top Rated Vendors
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Meet our most-loved independent sellers
              </p>
            </div>

            <Link
              href="/shop"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-[#FF3B6B] hover:underline shrink-0"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {topVendors.map((v) => (
              <motion.div
                key={v.name}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                className="bg-white/70 backdrop-blur rounded-3xl p-5 sm:p-6 border border-slate-200/60 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-slate-50 to-slate-100 border border-slate-100 flex items-center justify-center">
                    <v.icon className="w-6 h-6 text-slate-600" />
                  </div>

                  <div className="min-w-0">
                    <div className="font-extrabold text-slate-900 text-sm truncate">
                      {v.name}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-400">
                      {v.category}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 font-extrabold text-slate-700">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    {v.rating}
                  </div>

                  <div className="text-[10px] font-semibold text-slate-400">
                    {v.products} products
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-4xl bg-slate-900 p-8 sm:p-14 text-center text-white"
        >
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#FF3B6B]/30 blur-3xl rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-emerald-400/20 blur-3xl rounded-full" />

          <div className="relative space-y-6">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto border border-white/10"
            >
              <Store className="w-7 h-7 text-[#FF3B6B]" />
            </motion.div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              Ready to Launch Your Store?
            </h2>

            <p className="text-xs sm:text-sm lg:text-base text-slate-300 font-medium max-w-xl mx-auto">
              Join thousands of artisans selling their craft to customers across
              Pakistan. Set up your shop in minutes — no hidden fees.
            </p>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-[#FF3B6B] hover:bg-rose-600 text-white font-bold text-xs sm:text-sm px-5 sm:px-7 py-3.5 sm:py-4 rounded-2xl shadow-lg shadow-rose-500/30 transition-all hover:scale-[1.02]"
              >
                <Zap className="w-4 h-4" />
                Start Selling Today
              </Link>

              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm px-5 sm:px-7 py-3.5 sm:py-4 rounded-2xl border border-white/20 transition-all hover:scale-[1.02]"
              >
                <Heart className="w-4 h-4" />
                Browse Products
              </Link>
            </div>
          </div>
        </motion.section>

        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-8"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              Loved by Buyers & Sellers
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Real stories from our growing community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((t) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                className="bg-white/70 backdrop-blur rounded-3xl p-6 sm:p-8 border border-slate-200/60 shadow-sm"
              >
                <Quote className="w-6 h-6 text-[#FF3B6B]/30 mb-4" />

                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>

                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <t.icon className="w-5 h-5 text-slate-600" />
                  </div>

                  <div>
                    <div className="text-sm font-extrabold text-slate-900">
                      {t.name}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-400">
                      {t.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="space-y-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            {trustBadges.map((t) => (
              <motion.div
                key={t.label}
                variants={fadeUp}
                className="bg-white/50 backdrop-blur rounded-3xl p-5 sm:p-6 border border-slate-200/50"
              >
                <t.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF3B6B] mx-auto mb-3" />

                <div className="text-[11px] sm:text-xs font-extrabold text-slate-700">
                  {t.label}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            variants={fadeUp}
            className="bg-white/80 backdrop-blur rounded-4xl p-6 sm:p-10 border border-slate-200/60 shadow-sm"
          >
            <div className="max-w-lg mx-auto text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FF3B6B]/10 text-[#FF3B6B] flex items-center justify-center mx-auto">
                <Mail className="w-5 h-5" />
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                Stay in the Loop
              </h3>

              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Get exclusive deals, new artisan drops & marketplace updates
                straight to your inbox.
              </p>

              {subscribed ? (
                <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-50 text-emerald-600 text-sm font-bold border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4" />
                  Subscribed! Welcome aboard.
                </div>
              ) : (
                <form
                  onSubmit={handleSubscribe}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:bg-white focus:border-slate-900 transition"
                  />

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-md transition-all hover:scale-[1.02]"
                  >
                    <CreditCard className="w-4 h-4" />
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
}
