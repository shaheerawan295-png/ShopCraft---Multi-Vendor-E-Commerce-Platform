"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ArrowLeft, Tag, Plus, Trash2, Loader2, Layers } from "lucide-react";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Tag");
  const [error, setError] = useState("");

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/categories`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setCategories(data.categories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/v1/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, icon }),
      });
      const data = await res.json();
      if (data.success) {
        setName("");
        setIcon("Tag");
        fetchCategories();
      } else {
        setError(data.message || "Failed to add category");
      }
    } catch (err) {
      setError(err.message || "Failed to add category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      await fetch(`${API_URL}/api/v1/categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchCategories();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="p-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Product Categories</h1>
          <p className="text-xs text-slate-500 font-medium">Add or manage store categories</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm h-fit">
          <h2 className="font-extrabold text-slate-900 text-sm mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#FF3B6B]" /> Add Category
          </h2>

          {error && <div className="mb-3 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl font-bold">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Fashion, Electronics"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Icon Name (Lucide)</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="e.g. Tag, Shirt, Watch, Tv"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs outline-none focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-full text-xs transition flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Category"}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <h2 className="font-extrabold text-slate-900 text-sm mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4" /> Active Categories ({categories.length})
          </h2>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading...</div>
          ) : categories.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No categories found.</div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                      <Tag className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">{cat.name}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(cat._id)}
                    className="p-2 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}