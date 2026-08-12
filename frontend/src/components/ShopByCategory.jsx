'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { API_URL } from '@/lib/api';
const containerStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};
const cardFadeUp = {
  hidden: { opacity: 0, y: 25, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 20 },
  },
};

const INITIAL_LIMIT = 6; 

export default function ShopByCategory() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false); 
  const fetchCategories = async (signal) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/v1/categories`, { signal });
      
      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.categories)) {
        setCategories(data.categories);
      } else {
        setError(data.message || 'Failed to load categories');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Category fetch error:', err);
        setError('Unable to load categories. Please check your network.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchCategories(controller.signal);

    return () => controller.abort();
  }, []);

  const resolveLucideIcon = (iconName) => {
    if (!iconName || typeof iconName !== 'string') return LucideIcons.Package;

    const pascalName = iconName
      .trim()
      .replace(/[-_]+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^./, (char) => char.toUpperCase());

    if (LucideIcons[pascalName]) {
      return LucideIcons[pascalName];
    }

    const allKeys = Object.keys(LucideIcons);
    const matchedKey = allKeys.find(
      (key) => key.toLowerCase() === iconName.toLowerCase().replace(/[-_\s]/g, '')
    );

    return matchedKey ? LucideIcons[matchedKey] : LucideIcons.Package;
  };
  const visibleCategories = showAll ? categories : categories.slice(0, INITIAL_LIMIT);

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-75 bg-[#FF3B6B]/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="relative z-10 text-center space-y-3 max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#FF3B6B]/10 text-[#FF3B6B] border border-[#FF3B6B]/20">
          Curated Collections
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Shop by Category
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
          Discover unique handmade goods and trending items from top artisan sellers
        </p>
      </div>
      {loading && (
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-36 sm:h-40 rounded-3xl bg-slate-100/80 border border-slate-200/50 p-4 flex flex-col items-center justify-center space-y-3 animate-pulse"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-200" />
              <div className="h-3.5 w-20 bg-slate-200 rounded-md" />
              <div className="h-2.5 w-12 bg-slate-200/70 rounded-md" />
            </div>
          ))}
        </div>
      )}
      {!loading && error && (
        <div className="relative z-10 max-w-md mx-auto p-6 text-center bg-red-50/80 backdrop-blur border border-red-100 rounded-3xl space-y-3 shadow-sm">
          <LucideIcons.AlertTriangle className="w-8 h-8 text-red-500 mx-auto stroke-[1.5]" />
          <p className="text-xs sm:text-sm font-semibold text-red-600">{error}</p>
          <button
            onClick={() => fetchCategories()}
            className="px-4 py-2 text-xs font-bold text-white bg-[#FF3B6B] hover:bg-[#e02e5b] active:scale-95 rounded-xl transition-all shadow-sm"
          >
            Retry Connection
          </button>
        </div>
      )}
      {!loading && !error && categories.length === 0 && (
        <div className="relative z-10 text-center py-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl space-y-2">
          <LucideIcons.FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-xs sm:text-sm font-semibold text-slate-500">No categories found</p>
        </div>
      )}
      {!loading && !error && categories.length > 0 && (
        <div className="space-y-8">
          <motion.div
            variants={containerStagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5 perspective-1000"
          >
            <AnimatePresence mode="popLayout">
              {visibleCategories.map((cat) => {
                const IconComp = resolveLucideIcon(cat.icon);
                return (
                  <motion.div
                    key={cat._id}
                    layout
                    variants={cardFadeUp}
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    whileHover={{
                      y: -8,
                      scale: 1.03,
                      rotateX: 5,
                      rotateY: -5,
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="group relative h-full transform-style-3d"
                  >
                    <Link
                      href={`/shop?category=${encodeURIComponent(cat.name)}`}
                      className="block h-full outline-none focus:ring-2 focus:ring-[#FF3B6B]/40 rounded-3xl"
                      aria-label={`Browse ${cat.name} category`}
                    >
                      <div className="absolute -inset-0.5 bg-linear-to-r from-[#FF3B6B] to-[#FF6B8B] rounded-3xl opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300" />
                      <div className="relative h-full bg-white/80 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-slate-200/70 group-hover:border-[#FF3B6B]/30 shadow-xs group-hover:shadow-xl group-hover:shadow-[#FF3B6B]/15 transition-all duration-300 flex flex-col items-center justify-between text-center overflow-hidden">
                        <div className="absolute -top-12 -left-12 w-24 h-24 bg-[#FF3B6B]/5 rounded-full blur-xl group-hover:bg-[#FF3B6B]/10 transition-colors" />
                        <div className="relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-linear-to-br from-slate-50 to-slate-100/80 border border-slate-200/60 group-hover:border-[#FF3B6B]/30 group-hover:from-[#FF3B6B]/10 group-hover:to-[#FF6B8B]/10 flex items-center justify-center mb-3 transition-all duration-300 transform-style-3d group-hover:translate-z-6">
                          <IconComp className="w-6 h-6 sm:w-7 sm:h-7 text-slate-700 group-hover:text-[#FF3B6B] transition-colors duration-300 stroke-[1.75]" />
                        </div>

                        <div className="relative z-10 space-y-0.5 w-full">
                          <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight truncate w-full group-hover:text-[#FF3B6B] transition-colors">
                            {cat.name}
                          </h3>
                          <p className="text-[10px] font-semibold text-slate-400 group-hover:text-[#FF3B6B]/80 transition-colors">
                            Explore &rarr;
                          </p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {categories.length > INITIAL_LIMIT && (
            <div className="relative z-10 text-center pt-2">
              <button
                onClick={() => setShowAll(!showAll)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-extrabold text-[#FF3B6B] bg-[#FF3B6B]/10 hover:bg-[#FF3B6B] hover:text-white border border-[#FF3B6B]/20 transition-all duration-300 shadow-sm active:scale-95 cursor-pointer group"
              >
                <span>
                  {showAll
                    ? 'Show Less Categories'
                    : `View All Categories (${categories.length})`}
                </span>
                {showAll ? (
                  <LucideIcons.ChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                ) : (
                  <LucideIcons.ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}