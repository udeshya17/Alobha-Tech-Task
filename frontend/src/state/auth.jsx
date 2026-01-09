import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setAuthToken } from "../lib/api";

const AuthContext = createContext(null);
const TOKEN_KEY = "ttm_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  async function refresh(tokenOverride) {
    const t = tokenOverride ?? token;
    if (!t) {
      setMe(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/auth/me");
      setMe(res.data);
    } catch {
      setMe(null);
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    const next = String(res.data.token || "");
    setToken(next);
    localStorage.setItem(TOKEN_KEY, next);
    setAuthToken(next);
    setLoading(true);
    await refresh(next);
  }

  function logout() {
    setMe(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
  }

  const value = useMemo(
    () => ({
      token,
      me,
      loading,
      login,
      logout,
      refresh,
      role: me?.role || null
    }),
    [token, me, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}


