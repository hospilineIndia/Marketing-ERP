import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, accessToken, logout } = useAuth();

  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      // Defer state update to avoid React render warnings
      setTimeout(() => logout(), 0);
      return <Navigate to="/login" replace />;
    }
  } catch (err) {
    setTimeout(() => logout(), 0);
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
