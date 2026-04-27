import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { isTokenExpired } from "@/utils/jwt";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, accessToken, logout } = useAuth();

  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (isTokenExpired(accessToken)) {
    logout();
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
