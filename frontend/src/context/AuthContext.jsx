import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import api, { setupInterceptors } from "@/services/api";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_STORAGE_KEY } from "@/config/constants";

const AuthContext = createContext(null);

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

  const authStateRef = useRef({ accessToken, refreshToken });
  const isLoggingOut = useRef(false);

  useEffect(() => {
    authStateRef.current = { accessToken, refreshToken };
  }, [accessToken, refreshToken]);

  const logout = useCallback(() => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    
    window.location.href = "/login";
    
    // Non-blocking API call post-redirect
    api.post("/auth/logout").catch((err) => {
      console.error("API logout failed:", err);
    });
  }, []);

  const handleUpdateAccessToken = useCallback((newToken) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
    setAccessToken(newToken);
  }, []);

  // Setup interceptors exactly once per lifecycle to prevent memory leaks
  useEffect(() => {
    setupInterceptors(
      () => authStateRef.current.accessToken,
      () => authStateRef.current.refreshToken,
      handleUpdateAccessToken,
      logout
    );
  }, [handleUpdateAccessToken, logout]);

  // Hardened Auth Hydration on App Load
  useEffect(() => {
    const localToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const localUser = localStorage.getItem(USER_STORAGE_KEY);

    if (!localToken || !localUser) {
      if (localToken || localUser) {
        logout(); // Clear partially invalid session
      }
      return;
    }

    try {
      const payload = JSON.parse(atob(localToken.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        logout();
      }
    } catch (err) {
      logout();
    }
  }, [logout]);

  const login = ({ accessToken: newAccess, refreshToken: newRefresh, user: nextUser }) => {
    isLoggingOut.current = false;
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
