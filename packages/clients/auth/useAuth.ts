import { useEffect, useState } from "react";
import { apiFetch, fireAnalytics } from "../http/api";

interface AuthState {
  user: Record<string, unknown> | null;
  role: string;
  tiers: string[];
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({ user: null, role: "guest", tiers: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AuthState>("/auth/me")
      .then((res) => setAuth(res))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiFetch<AuthState>("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setAuth(res);
    fireAnalytics("login_success");
  };

  const logout = async () => {
    await apiFetch("/auth/logout", { method: "POST" });
    setAuth({ user: null, role: "guest", tiers: [] });
  };

  return { ...auth, loading, login, logout };
}
