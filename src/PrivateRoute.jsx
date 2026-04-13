import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "./context/UserContext";
import Loader from "./components/ui/Loader";

export const PrivateRoute = () => {
  const { isAuthenticated, isLoading } = useUser();

  // Add a safety timeout to prevent infinite loading
  if (isLoading) {
    return (
      <Loader
        label="Unlocking Workspace"
        subtext="Verifying session, restoring balance state, and securing access"
      />
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/LoginPage" replace />;
};
