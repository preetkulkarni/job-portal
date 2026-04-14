import { createContext, useContext, useState, useEffect, useCallback } from "react";
import apiClient from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on app load
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    apiClient
      .get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem("access_token");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const res = await apiClient.post("/auth/login", { email, password });
      const { access_token } = res.data;
      localStorage.setItem("access_token", access_token);
      const meRes = await apiClient.get("/auth/me");
      setUser(meRes.data);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.userMessage };
    }
  }, []);

  const registerCandidate = useCallback(async (formData) => {
    if (formData.password.length > 72) {
      return { success: false, error: "Password must be 72 characters or fewer." };
    }
    try {
      await apiClient.post("/auth/register/candidate", {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        headline: formData.headline || "",
      });
      return await login(formData.email, formData.password);
    } catch (err) {
      return { success: false, error: err.userMessage };
    }
  }, [login]);

  const registerRecruiter = useCallback(async (formData) => {
  if (formData.password.length > 72) {
    return { success: false, error: "Password must be 72 characters or fewer." };
  }
  try {
    await apiClient.post("/auth/register/recruiter", {
      email: formData.email,
      password: formData.password,
      first_name: formData.first_name,
      last_name: formData.last_name,
      headline: formData.headline || "",
      company_name: formData.company_name,  // ← added
    });
    return await login(formData.email, formData.password);
  } catch (err) {
    return { success: false, error: err.userMessage };
  }
}, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        registerCandidate,
        registerRecruiter,
        isCandidate: user?.role === "candidate",
        isRecruiter: user?.role === "recruiter",
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}