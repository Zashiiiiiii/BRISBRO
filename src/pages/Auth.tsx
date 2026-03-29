import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home — resident login is now handled via modal in the Header
    navigate("/", { replace: true });
  }, [navigate]);

  return null;
};

export default Auth;
