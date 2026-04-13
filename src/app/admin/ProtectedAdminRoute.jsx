// src/components/auth/ProtectedAdminRoute.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

const ProtectedAdminRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/AdminLogin");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/User/Profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          navigate("/AdminLogin");
          return;
        }

        const result = await response.json();
        const role = result?.data?.role || result?.role;

        if (role === "admin") {
          setIsAdmin(true);
        } else {
          navigate("/AdminLogin");
        }
      } catch (error) {
        navigate("/AdminLogin");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [navigate]);

  if (loading) return <div className="text-white p-10">Loading...</div>;

  return isAdmin ? children : null;
};

export default ProtectedAdminRoute;
