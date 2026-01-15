import { Navigate } from "react-router-dom";
import { getUser } from "../utils/auth";

const ProtectedRoute = ({ children, role }) => {

  const user = getUser();

  if (!user) return <Navigate to="/" />;

  if (role && user.role !== role)
    return <Navigate to="/unauthorized" />;

  return children;
};

export default ProtectedRoute;
