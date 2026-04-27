import { createContext, useContext, useState, useEffect } from "react";
import api, { setupInterceptors } from "@/services/api";

const AuthContext = createContext(null);

const ACCESS_TOKEN_KEY = "marketing-erp-access-token";
const REFRESH_TOKEN_KEY = "marketing-erp-refresh-token";
const USER_STORAGE_KEY = "marketing-erp-user";

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem(ACCESS_TOKEN_KEY));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem(REFRESH_TOKEN_KEY));
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const logout = () => {
    // Attempt backend logout (non-blocking)
    api.post("/auth/logout").catch((err) => {
      console.error("API logout failed:", err);
    });

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  const handleUpdateAccessToken = (newToken) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
    setAccessToken(newToken);
  };

  // Setup API interceptor callbacks
  setupInterceptors(
    () => accessToken,
    () => refreshToken,
    handleUpdateAccessToken,
    logout
  );

  useEffect(() => {
    if (accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          logout();
        }
      } catch (err) {
        logout();
      }
    }
  }, [accessToken]);

  const login = ({ accessToken: newAccess, refreshToken: newRefresh, user: nextUser }) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, newAccess);
    localStorage.setItem(REFRESH_TOKEN_KEY, newRefresh);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    setAccessToken(newAccess);
    setRefreshToken(newRefresh);
    setUser(nextUser);
  };

  const value = {
    accessToken,
    refreshToken,
    user,
    isAuthenticated: Boolean(accessToken && user),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
