"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ShoppingBag, CheckCircle2, ShieldCheck, Truck, Store, ArrowLeft, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { formatPrice } from "@/lib/formatPrice";
import ProductReviews from "../../../components/ProductReviews";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

const { addToCart, isInCart } = useCart();

  const images = product?.images?.length ? product.images : [];
  const goToPrev = () => setActiveImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const goToNext = () => setActiveImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  const inCart = isInCart(id);
  const stock = Number(product?.stock) || 0;
  const outOfStock = stock <= 0;
  const maxQtyReached = quantity >= stock;

  const updateQty = (next) => {
    if (stock <= 0) return;
    setQuantity(Math.min(Math.max(1, next), stock));
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
const res = await fetch(`${API_URL}/api/v1/public/products/${id}`);
        const data = await res.json();
        if (data.success) {
          setProduct(data.product);
        }
      } catch (err) {
        console.error("Failed to fetch product details", err);
        setError("Unable to load product details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-bold text-slate-400">
        Loading product details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <p className="text-sm font-bold text-rose-700 mb-2">{error}</p>
        <Link href="/shop" className="px-6 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition">
          Back to Shop
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 font-bold text-slate-600">
        Product not found!
        <br />
        <Link href="/shop" className="text-xs text-rose-500 underline mt-2 inline-block">
          Back to Shop
        </Link>
      </div>
    );
  }

const handleAddToCart = () => {
    if (inCart) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
      return;
    }
    if (outOfStock) return;
    addToCart(product, Math.min(quantity, stock));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Shop
      </Link>

      <div className="bg-white/90 backdrop-blur-md rounded-4xl p-6 sm:p-10 border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <div className="relative aspect-square bg-slate-50 rounded-3xl overflow-hidden">
            {images.length > 0 ? (
              <img
                key={activeImage}
                src={images[activeImage]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <ImageIcon className="w-16 h-16 stroke-[1.2]" />
              </div>
            )}

            {images.length > 1 && (
              <>
                <button
                  onClick={goToPrev}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/85 hover:bg-white text-slate-700 rounded-full shadow-md transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goToNext}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/85 hover:bg-white text-slate-700 rounded-full shadow-md transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <span className="absolute bottom-3 right-3 text-[11px] font-semibold text-white bg-black/55 backdrop-blur-md px-2.5 py-1 rounded-full">
                  {activeImage + 1} / {images.length}
                </span>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2.5 mt-3">
              {images.map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`flex-1 aspect-square rounded-xl overflow-hidden bg-slate-100 transition border-2 ${
                    activeImage === idx
                      ? "border-slate-900 ring-2 ring-slate-900/10"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={src} alt={`${product.title} thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-rose-500 bg-rose-50 px-3 py-1 rounded-full">
                {product.category}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                <Store className="w-3.5 h-3.5 text-slate-400" />
                <span>{product.vendor?.name || "Verified Vendor"}</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {product.title}
            </h1>

            <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed">
              {product.description}
            </p>

            <div className="text-3xl font-black text-slate-900 pt-2">
              {formatPrice(product.price)}
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-slate-200 rounded-2xl bg-slate-50 p-1">
                <button
                  onClick={() => updateQty(quantity - 1)}
                  disabled={quantity <= 1}
                  className="px-3 py-1.5 font-bold text-slate-600 hover:bg-white rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <span className="px-4 text-xs font-extrabold text-slate-900">{quantity}</span>
                <button
                  onClick={() => updateQty(quantity + 1)}
                  disabled={maxQtyReached}
                  className="px-3 py-1.5 font-bold text-slate-600 hover:bg-white rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={inCart || outOfStock}
                className={`flex-1 py-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition ${
                  inCart || added
                    ? "bg-emerald-500 text-white cursor-not-allowed"
                    : outOfStock
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                    : "bg-slate-900 hover:bg-slate-800 text-white shadow-md"
                }`}
              >
                {outOfStock ? (
                  <>Out of Stock</>
                ) : inCart ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Already in Cart
                  </>
                ) : added ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" /> Add to Cart ({formatPrice(product.price * quantity)})
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Verified Vendor Product</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                <Truck className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Fast Direct Shipping</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ProductReviews productId={id}/>
    </div>
  );
}