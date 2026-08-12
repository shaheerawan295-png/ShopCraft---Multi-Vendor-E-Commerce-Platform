"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Plus,
  Package,
  Edit,
  Trash2,
  Upload,
  ImageIcon,
  X,
  Loader2,
  Sparkles,
  Layers,
  CheckCircle2,
  Tag,
  Box,
  ChevronDown,
  Check
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { formatPrice } from "@/lib/formatPrice";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function VendorProductsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [existingImages, setExistingImages] = useState([]);

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    stock: 1,
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await fetch(`${API_URL}/api/v1/categories`);
        const data = await res.json();
        if (data.success) {
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const filePreviews = useMemo(() => {
    return selectedFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
  }, [selectedFiles]);

  useEffect(() => {
    return () => {
      filePreviews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [filePreviews]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/v1/products`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
    } else if (user.role !== "vendor" && user.role !== "admin") {
      router.replace("/");
    } else {
      fetchProducts();
    }
  }, [authLoading, user, router, fetchProducts]);

  const getCategoryEmoji = (categoryName) => {
    const found = categories.find((c) => c.name === categoryName);
    return found?.emoji || "🏷️";
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) return;

    const currentTotal = (editingId ? existingImages.length : 0) + selectedFiles.length;

    if (currentTotal + newFiles.length > 5) {
      alert("Maximum 5 images allowed in total.");
      e.target.value = "";
      return;
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({ title: "", description: "", price: "", category: "", stock: 1 });
    setSelectedFiles([]);
    setExistingImages([]);
    setIsCategoryOpen(false);
    setShowModal(true);
  };

  const handleEditClick = (item) => {
    setEditingId(item._id);
    setFormData({
      title: item.title || "",
      description: item.description || "",
      price: item.price || "",
      category: item.category || "",
      stock: item.stock || 1,
    });
    setExistingImages(item.images || []);
    setSelectedFiles([]);
    setIsCategoryOpen(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ title: "", description: "", price: "", category: "", stock: 1 });
    setSelectedFiles([]);
    setExistingImages([]);
    setIsCategoryOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category) {
      alert("Please select a category");
      return;
    }

    if (!editingId && selectedFiles.length === 0) {
      alert("Please select at least one product image");
      return;
    }

    if (editingId && existingImages.length === 0 && selectedFiles.length === 0) {
      alert("Product must have at least one image");
      return;
    }

    setSubmitting(true);

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("price", formData.price);
      data.append("category", formData.category);
      data.append("stock", formData.stock);

      if (editingId) {
        data.append("existingImages", JSON.stringify(existingImages));
      }

      selectedFiles.forEach((file) => {
        data.append("images", file);
      });

      const url = editingId
        ? `${API_URL}/api/v1/products/${editingId}`
        : `${API_URL}/api/v1/products`;

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        body: data,
      });

      const result = await res.json();
      if (result.success) {
        closeModal();
        fetchProducts();
      } else {
        alert(result.message || "Failed to save product");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["vendor", "admin"]}>
      <div className="min-h-screen bg-slate-50/60 pb-16">
        <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8 selection:bg-slate-900 selection:text-white">
          
          <div className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-slate-100/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 transition-all duration-300 hover:shadow-md">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-56 h-56 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-900/10 ring-1 ring-white/20">
                    <Layers className="w-5 h-5" />
                  </span>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      Product Inventory
                    </h1>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium pl-1">
                  Manage your store catalog, pricing, and media assets
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleOpenCreateModal}
                  className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-black text-white px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-slate-900/10 hover:shadow-xl hover:shadow-slate-900/20 active:scale-[0.98] transition-all duration-300 overflow-hidden"
                >
                  <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {!loading && products.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 bg-white/70 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/60 shadow-sm">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Box className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Total Items</span>
                    <span className="text-base sm:text-lg font-extrabold text-slate-900">{products.length}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/70 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/60 shadow-sm">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">In Stock</span>
                    <span className="text-base sm:text-lg font-extrabold text-slate-900">
                      {products.filter((p) => p.stock > 0).length}
                    </span>
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1 flex items-center gap-3 bg-white/70 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/60 shadow-sm">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Categories</span>
                    <span className="text-base sm:text-lg font-extrabold text-slate-900">
                      {new Set(products.map((p) => p.category)).size}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm animate-pulse space-y-4"
                >
                  <div className="aspect-[4/3] bg-slate-100 rounded-2xl w-full" />
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-slate-100 rounded-full w-1/3" />
                    <div className="h-4 bg-slate-100 rounded-full w-1/4" />
                  </div>
                  <div className="h-5 bg-slate-100 rounded-full w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-full w-full" />
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <div className="h-6 bg-slate-100 rounded-full w-16" />
                    <div className="flex gap-2">
                      <div className="h-8 bg-slate-100 rounded-xl w-8" />
                      <div className="h-8 bg-slate-100 rounded-xl w-8" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="relative overflow-hidden bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm">
              <div className="max-w-xs mx-auto space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-400 border border-slate-200/60 shadow-inner">
                  <Package className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-slate-900">No products listed</h3>
                  <p className="text-xs text-slate-500">
                    Start building your collection by creating your first product listing.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-2 text-xs font-bold bg-slate-900 hover:bg-black text-white px-5 py-3 rounded-2xl transition-all shadow-md active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" /> Create Listing
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((item) => (
                <div
                  key={item._id}
                  className="group relative bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:shadow-2xl hover:shadow-slate-900/10 hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    <div className="relative aspect-[4/3] w-full bg-slate-100 rounded-2xl mb-4 overflow-hidden border border-slate-100/80">
                      {item.images?.[0] ? (
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-300">
                          <ImageIcon className="w-10 h-10 stroke-[1.5]" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                      {item.images?.length > 1 && (
                        <span className="absolute bottom-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md border border-white/10">
                          +{item.images.length - 1} photos
                        </span>
                      )}

                      {item.stock <= 0 && (
                        <div className="absolute top-2.5 left-2.5 bg-rose-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
                          Out of Stock
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/60 truncate">
                        {getCategoryEmoji(item.category)} {item.category}
                      </span>
                      <span className={`text-xs font-bold ${item.stock > 0 ? "text-slate-500" : "text-rose-500"}`}>
                        Stock: {item.stock}
                      </span>
                    </div>

                    <h3 className="font-black text-slate-900 text-base line-clamp-1 group-hover:text-[#FF3366] transition-colors duration-200">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-5 pt-3.5 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Price</span>
                      <span className="text-lg font-black text-slate-900">{formatPrice(item.price)}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-xl transition-all duration-200 active:scale-90"
                        title="Edit product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 active:scale-90"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showModal && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 my-auto max-h-[90vh] overflow-y-auto">
                
                <div className="flex justify-between items-start mb-6 sticky top-0 bg-white pt-1 pb-2 z-10 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      {editingId ? "Edit Product" : "Add New Product"}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {editingId
                        ? "Update product information, inventory, and gallery"
                        : "Fill in the details to publish a new item"}
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">Product Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Minimalist Wireless Headphones"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-sm font-medium text-slate-900 outline-none focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all duration-200 placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">Description</label>
                    <textarea
                      placeholder="Provide a detailed overview of the item..."
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-sm font-medium text-slate-900 outline-none focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all duration-200 h-24 resize-none placeholder:text-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700">Price (PKR)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="99.00"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-sm font-medium text-slate-900 outline-none focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700">Stock Units</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="10"
                        required
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-sm font-medium text-slate-900 outline-none focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 relative" ref={categoryRef}>
                    <label className="text-xs font-extrabold text-slate-700">Category</label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryOpen((prev) => !prev)}
                      className={`w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-sm font-medium text-left flex justify-between items-center transition-all duration-200 ${
                        isCategoryOpen
                          ? "border-slate-900 bg-white ring-4 ring-slate-900/5"
                          : "hover:border-slate-300"
                      }`}
                    >
                      <span className={formData.category ? "text-slate-900 font-semibold" : "text-slate-400"}>
                        {formData.category
                          ? `${getCategoryEmoji(formData.category)} ${formData.category}`
                          : "Select a category"}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                          isCategoryOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isCategoryOpen && (
                      <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-30 max-h-56 overflow-y-auto p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                        {loadingCategories ? (
                          <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading categories...
                          </div>
                        ) : categories.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-400">
                            No categories created by Admin yet.
                          </div>
                        ) : (
                          categories.map((cat) => {
                            const isSelected = formData.category === cat.name;
                            return (
                              <button
                                key={cat._id}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, category: cat.name });
                                  setIsCategoryOpen(false);
                                }}
                                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                                  isSelected
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-700 hover:bg-slate-100/80"
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <span>{cat.emoji || "🏷️"}</span>
                                  <span>{cat.name}</span>
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-extrabold text-slate-700">Product Images</label>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Max 5 photos total
                      </span>
                    </div>

                    {(existingImages.length > 0 || filePreviews.length > 0) && (
                      <div className="grid grid-cols-5 gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-200/60">
                        {existingImages.map((src, idx) => (
                          <div
                            key={`existing-${idx}`}
                            className="relative group/item aspect-square bg-slate-200 rounded-xl overflow-hidden border border-slate-300/50"
                          >
                            <img src={src} alt="Existing product asset" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeExistingImage(idx)}
                              className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-md transition-all duration-150"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}

                        {filePreviews.map((item, idx) => (
                          <div
                            key={`new-${idx}`}
                            className="relative group/item aspect-square bg-slate-200 rounded-xl overflow-hidden border border-indigo-400/80"
                          >
                            <img src={item.url} alt="New upload preview" className="w-full h-full object-cover" />
                            <span className="absolute bottom-1 left-1 bg-indigo-600 text-white text-[8px] font-bold px-1 rounded">
                              NEW
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFile(idx)}
                              className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-md transition-all duration-150"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {existingImages.length + selectedFiles.length < 5 && (
                      <div className="relative group border-2 border-dashed border-slate-200 hover:border-slate-900 rounded-2xl p-5 text-center bg-slate-50/50 hover:bg-slate-50 transition-all duration-200 cursor-pointer">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                          <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-600 group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">
                              Click to upload or drag & drop
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              PNG, JPG, WEBP (Up to 5MB)
                            </span>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 font-bold text-xs rounded-2xl text-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-3.5 bg-slate-900 hover:bg-black font-bold text-xs rounded-2xl text-white shadow-lg shadow-slate-900/10 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{editingId ? "Updating..." : "Saving..."}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{editingId ? "Update Product" : "Save Product"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}