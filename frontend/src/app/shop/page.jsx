"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useCart } from "@/context/CartContext";
import {
  Search,
  ShoppingBag,
  Filter,
  CheckCircle2,
  X,
  Package,
  Ban,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/api";
import { formatPrice } from "@/lib/formatPrice";

function ShopContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [dbCategories, setDbCategories] = useState([]); 
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [addedId, setAddedId] = useState(null);

  const { addToCart, isInCart } = useCart();
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/v1/categories`);
        const data = await res.json();
        if (data.success) {
          setDbCategories(data.categories || []);
        }
      } catch (err) {
        console.error("Failed to fetch dynamic categories:", err);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (category && category !== "All") {
      params.set("category", category);
    }

    const newQueryString = params.toString();
    const currentQueryString = searchParams.toString();

    if (newQueryString !== currentQueryString) {
      const newUrl = newQueryString ? `${pathname}?${newQueryString}` : pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [search, category, pathname, router, searchParams]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      setLoading(true);
      setError("");

      try {
        let url = `${API_URL}/api/v1/public/products?search=${encodeURIComponent(search)}`;
        if (category && category !== "All") {
          url += `&category=${encodeURIComponent(category)}`;
        }

        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to load products");

        const data = await res.json();
        if (data.success) {
          setProducts(data.products || []);
        } else {
          setError(data.message || "Failed to fetch products");
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch products:", err);
          setError("Unable to connect to the store server. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(() => {
      fetchProducts();
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, category]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const handleAddToCart = (product) => {
    if (product.stock <= 0) return;

    if (!isInCart(product._id)) {
      addToCart(product, 1);
    }

    setAddedId(product._id);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setAddedId(null), 1500);
  };

  const handleCategorySelect = (catName) => {
    if (catName === "All") {
      setCategory("");
    } else {
      setCategory((prev) => (prev === catName ? "" : catName));
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setCategory("");
  };

  const hasActiveFilters = search !== "" || (category !== "" && category !== "All");

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8 selection:bg-slate-900 selection:text-white">
      <div className="relative overflow-hidden bg-linear-to-br from-white via-slate-50/80 to-slate-100/60 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 transition-all duration-300">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-linear-to-br from-indigo-500/10 to-slate-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-slate-900 text-white rounded-xl shadow-md shadow-slate-900/10">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Explore Marketplace
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium pl-1">
              Discover verified products from independent vendors
            </p>
          </div>

          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search products by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all duration-200 placeholder:text-slate-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 scrollbar-none border-t border-slate-200/60">
          <div className="flex items-center gap-1.5 shrink-0 text-xs font-bold text-slate-400 mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Categories:</span>
          </div>

          <button
            onClick={() => handleCategorySelect("All")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 ${
              category === "" || category === "All"
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/10 scale-[1.02]"
                : "bg-white/80 text-slate-600 hover:bg-slate-200/70 border border-slate-200/60"
            }`}
          >
            📦 All
          </button>

          {categoriesLoading ? (
            <div className="flex items-center gap-2 animate-pulse">
              <div className="h-8 w-20 bg-slate-200/70 rounded-xl" />
              <div className="h-8 w-24 bg-slate-200/70 rounded-xl" />
            </div>
          ) : (
            dbCategories.map((catItem) => {
              const catName = typeof catItem === "string" ? catItem : catItem.name;
              const catEmoji = typeof catItem === "object" ? catItem.emoji : "";
              const isActive = category === catName;

              return (
                <button
                  key={catItem._id || catName}
                  onClick={() => handleCategorySelect(catName)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? "bg-slate-900 text-white shadow-md shadow-slate-900/10 scale-[1.02]"
                      : "bg-white/80 text-slate-600 hover:bg-slate-200/70 border border-slate-200/60"
                  }`}
                >
                  {catEmoji && <span>{catEmoji}</span>}
                  <span>{catName}</span>
                </button>
              );
            })
          )}

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 rounded-xl text-xs font-extrabold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition-colors shrink-0 ml-auto flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm animate-pulse space-y-3"
            >
              <div className="aspect-4/3 bg-slate-100 rounded-2xl w-full" />
              <div className="h-3 bg-slate-100 rounded-full w-1/3" />
              <div className="h-4 bg-slate-100 rounded-full w-3/4" />
              <div className="h-3 bg-slate-100 rounded-full w-full" />
              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <div className="h-5 bg-slate-100 rounded-full w-16" />
                <div className="h-8 bg-slate-100 rounded-xl w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50/80 border border-rose-200 text-rose-800 rounded-3xl p-8 text-center max-w-xl mx-auto shadow-sm">
          <p className="text-sm font-bold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-xs font-extrabold bg-rose-600 text-white px-4 py-2 rounded-xl hover:bg-rose-700 transition"
          >
            Retry Connection
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-md mx-auto my-8">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4 border border-slate-200/60 shadow-inner">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">No products found</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
            We couldn't find any items matching your filter criteria. Try adjusting your search term or category.
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="mt-5 inline-flex items-center gap-2 text-xs font-bold bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-black transition shadow-md active:scale-95"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((item) => {
            const inCart = isInCart(item._id);
            const isJustAdded = addedId === item._id;
            const isOutOfStock = item.stock <= 0;

            return (
              <div
                key={item._id}
                className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-4/3 bg-slate-100 rounded-2xl mb-3 overflow-hidden border border-slate-100">
                    {item.images?.[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.title || "Product image"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                        <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
                      </div>
                    )}

                    <span className="absolute top-2.5 left-2.5 text-[10px] font-black uppercase tracking-wider text-slate-800 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-sm">
                      {item.category}
                    </span>

                    {item.images?.length > 1 && (
                      <span className="absolute bottom-2.5 right-2.5 text-[10px] font-bold text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md">
                        +{item.images.length - 1} photos
                      </span>
                    )}

                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center p-2">
                        <span className="bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1">
                          <Ban className="w-3 h-3" /> Out of Stock
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] font-extrabold text-[#FF3366] uppercase tracking-wider line-clamp-1">
                    Store: {item.vendor?.name || "Verified Merchant"}
                  </p>

                  <Link href={`/shop/${item._id}`}>
                    <h3 className="font-extrabold text-slate-900 text-sm mt-1 line-clamp-1 group-hover:text-[#FF3366] transition-colors">
                      {item.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed font-medium">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">
                      Price
                    </span>
                    <span className="text-lg font-black text-slate-900">
                      {formatPrice(item.price)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={inCart || isOutOfStock}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all duration-200 active:scale-95 ${
                      isOutOfStock
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : inCart
                        ? "bg-emerald-100 text-emerald-700 cursor-default"
                        : isJustAdded
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                        : "bg-slate-900 hover:bg-black text-white shadow-md shadow-slate-900/10"
                    }`}
                  >
                    {isOutOfStock ? (
                      "Unavailable"
                    ) : inCart ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> In Cart
                      </>
                    ) : isJustAdded ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 animate-bounce" /> Added
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5" /> Add
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PublicShopPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto text-center py-24 font-bold text-slate-400 animate-pulse">
          Loading marketplace collection...
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}