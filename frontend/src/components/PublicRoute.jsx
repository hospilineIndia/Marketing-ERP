import { Navigate } from "react-router-dom";
import { ACCESS_TOKEN_KEY } from "@/services/api";

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (token) {
    return <Navigate to="/my-leads" replace />;
  }

  return children;
};

export default PublicRoute;
