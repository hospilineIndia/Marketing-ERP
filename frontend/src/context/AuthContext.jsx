import { createContext, useContext, useState } from "react";
import { storageKey } from "@/services/api";

const AuthContext = createContext(null);
const userStorageKey = "marketing-erp-user";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(storageKey));
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem(userStorageKey);
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = ({ token: nextToken, user: nextUser }) => {
    localStorage.setItem(storageKey, nextToken);
    localStorage.setItem(userStorageKey, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(userStorageKey);
    setToken(null);
    setUser(null);
  };

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token),
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
