import Link from "next/link";
import { Home, Compass } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-slate-50/50">
            <div className="max-w-md w-full text-center space-y-8">

                <div className="relative inline-flex items-center justify-center">
                    <div className="absolute inset-0 rounded-3xl bg-linear-to-tr from-slate-200 to-rose-100 blur-xl opacity-70"></div>
                    <div className="relative w-24 h-24 rounded-3xl bg-white border border-slate-200/80 shadow-[0_15px_35px_rgba(0,0,0,0.05)] flex items-center justify-center transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                        <Compass className="w-10 h-10 text-slate-800 animate-pulse" />
                    </div>
                    <span className="absolute -top-3 -right-3 px-3 py-1 bg-[#FF3B6B] text-white text-[11px] font-black tracking-widest uppercase rounded-full shadow-md shadow-rose-500/20">
                        404
                    </span>
                </div>
                <div className="space-y-3">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        Page not found
                    </h1>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                        Oops! The page you are looking for doesn&apos;t exist, was removed, or might be temporarily unavailable.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <Link
                        href="/"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-full shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Home className="w-4 h-4" />
                        Back to Home
                    </Link>

                    <Link
                        href="/shop"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-full border border-slate-200 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Compass className="w-4 h-4" />
                        Explore Shop
                    </Link>
                </div>
                <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase pt-6">
                    Shop<span className="text-[#FF3B6B]">Craft</span> Marketplace
                </p>
            </div>
        </div>
    );
}