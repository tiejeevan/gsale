import { type JSX } from "react";
import { Navigate } from "react-router-dom";
import { useUserContext } from "../context/UserContext";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { token } = useUserContext();
  if (!token) {
    return <Navigate to="/market" replace />;
  }
  return children;
};

export default ProtectedRoute;
