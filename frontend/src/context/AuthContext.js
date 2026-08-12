"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

const AuthContext = createContext();

export const redirectUserByRole = (role, router) => {
  switch (role) {
    case "admin":
      router.push("/admin");
      break;
    case "vendor":
      router.push("/vendor");
      break;
    case "customer":
    default:
      router.push("/");
      break;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkUserLoggedIn = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/me`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        setUser(null);
        return null;
      }

      const data = await res.json();
      const userData = data.user || data;

      if (userData?._id) {
        setUser(userData);
        return userData;
      } else {
        setUser(null);
        return null;
      }
    } catch (error) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void checkUserLoggedIn();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [checkUserLoggedIn]);

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        logout,
        checkUserLoggedIn,
        redirectUserByRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};