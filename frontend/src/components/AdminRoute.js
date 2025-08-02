// src/components/AdminRoute.js
import { Navigate } from "react-router-dom";
import { isAdmin } from "../utils/auth";

const AdminRoute = ({ children }) => {
  return isAdmin() ? children : <Navigate to="/login" replace />;
};

export default AdminRoute;
