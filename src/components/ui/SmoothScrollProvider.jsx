import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const SmoothScrollProvider = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    // Check if the location has a hash
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const element = document.getElementById(id);

      if (element) {
        // Small timeout to ensure the element is rendered
        setTimeout(() => {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      }
    } else {
      // Scroll to top when no hash
      window.scrollTo(0, 0);
    }
  }, [location]);

  return children;
};
