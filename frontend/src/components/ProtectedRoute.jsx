"use client";

import { useAuth, redirectUserByRole } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      redirectUserByRole(user.role, router);
    }
  }, [user, loading, router, allowedRoles]);

  if (loading || !user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3 bg-slate-50/50">
        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-slate-900" />
          <p className="text-xs font-bold text-slate-700">Checking authorization...</p>
        </div>
      </div>
    );
  }

  return children;
}