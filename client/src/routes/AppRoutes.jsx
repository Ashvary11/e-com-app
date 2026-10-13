import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "@/pages/auth/ProtectedRoute";
import AdminRoute from "./AdminRoute";
import Loader from "@/components/ui/loader.jsx";

// Public pages
const Home = lazy(() => import("../pages/Home"));
const Products = lazy(() => import("../pages/Products"));
const ProductDetails = lazy(() => import("../pages/ProductDetails"));
const Cart = lazy(() => import("../pages/Cart"));
const Checkout = lazy(() => import("../pages/Checkout"));
const NotFound = lazy(() => import("../pages/NotFound"));

// Auth pages
const Login = lazy(() => import("../pages/auth/Login"));
const Register = lazy(() => import("@/pages/auth/Register"));
const VerifyEmail = lazy(() => import("@/pages/auth/VerifyEmail"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));

// Account pages
const AccountLayout = lazy(() => import("@/pages/account/AccountLayout"));
const Profile = lazy(() => import("@/pages/account/Profile"));
const Order = lazy(() => import("@/pages/account/Order"));
const Security = lazy(() => import("@/pages/account/Security"));
const Sessions = lazy(() => import("@/pages/account/Sessions"));
const OrderDetails = lazy(() => import("@/pages/account/OrderDetails"));

// Admin pages
const AdminDashboard = lazy(
  () => import("@/pages/account/(admin)/AdminDashboard"),
);
const AdminLayout = lazy(() => import("@/pages/account/(admin)/AdminLayout"));
const AdminProducts = lazy(
  () => import("@/pages/account/(admin)/AdminProducts"),
);
const AdminOrders = lazy(() => import("@/pages/account/(admin)/AdminOrders"));
const AdminUsers = lazy(() => import("@/pages/account/(admin)/AdminUsers"));

function AppRoutes() {
  return (
    <Suspense fallback={ <Loader/>}>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/products" element={<Products />} />
        <Route path="/products/:slug" element={<ProductDetails />} />

        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="order/:orderNumber" element={<OrderDetails />} />

        {/* Users routes*/}
        <Route element={<ProtectedRoute />}>
          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<Profile />} />
            <Route path="profile" element={<Profile />} />
            <Route path="orders" element={<Order />} />
            <Route path="orders/:orderNumber" element={<OrderDetails />} />
            <Route path="security" element={<Security />} />
            <Route path="sessions" element={<Sessions />} />

            {/* Admin-only nested routes */}
          </Route>

          {/* Admin Routes*/}
          <Route element={<AdminRoute />}>
            <Route path="account/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route
                path="products"
                element={<AdminProducts title="Products" />}
              />
              <Route path="orders" element={<AdminOrders title="Orders" />} />
              <Route path="users" element={<AdminUsers title="Users" />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
