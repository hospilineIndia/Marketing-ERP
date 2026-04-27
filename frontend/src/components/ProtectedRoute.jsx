import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, accessToken, logout } = useAuth();
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          setIsExpired(true);
          logout();
        }
      } catch (err) {
        setIsExpired(true);
        logout();
      }
    }
  }, [accessToken, logout]);

  if (!isAuthenticated || !accessToken || isExpired) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
