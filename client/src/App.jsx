import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import AppRoutes from "./routes/AppRoutes";
import { useLocation } from "react-router-dom";
import { fetchMe } from "./store/slices/authSlice";
import { useDispatch } from "react-redux";
import { useEffect } from "react";

function App() {
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  const isAuthPage =
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/register") ||
    location.pathname.startsWith("/verify-email") ||
    location.pathname.startsWith("/forgot-password");
  // location.pathname.startsWith("/reset-password");

  return (
    <div className="flex min-h-screen flex-col">
      {!isAuthPage && <Navbar />}

      <main className="flex-1">
        <AppRoutes />
      </main>

      {!isAuthPage && <Footer />}
    </div>
  );
}

export default App;
