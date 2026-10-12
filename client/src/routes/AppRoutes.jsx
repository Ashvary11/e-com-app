import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Products from "../pages/Products";
import ProductDetails from "../pages/ProductDetails";
import Cart from "../pages/Cart";
import Login from "../pages/auth/Login";
import NotFound from "../pages/NotFound";
import Checkout from "../pages/Checkout";
import Register from "@/pages/auth/Register";
import VerifyEmail from "@/pages/auth/VerifyEmail";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ProtectedRoute from "@/pages/auth/ProtectedRoute";
import AccountLayout from "@/pages/account/AccountLayout";
import Profile from "@/pages/account/Profile";
import Order from "@/pages/account/Order";
import Security from "@/pages/account/Security";
import Sessions from "@/pages/account/Sessions";
import OrderDetails from "@/pages/account/OrderDetails";
import AdminDashboard from "@/pages/account/(admin)/AdminDashboard";
import AdminRoute from "./AdminRoute";
import AdminLayout from "@/pages/account/(admin)/AdminLayout";
import AdminProducts from "@/pages/account/(admin)/AdminProducts";
import AdminOrders from "@/pages/account/(admin)/AdminOrders";
import AdminUsers from "@/pages/account/(admin)/AdminUsers";

function AppRoutes() {
  return (
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
      {/* Profile + Admin*/}
      <Route element={<ProtectedRoute />}>
        <Route path="/account" element={<AccountLayout />}>
          <Route index element={<Profile />} />
          <Route path="profile" element={<Profile />} />
          <Route path="orders" element={<Order />} />
          <Route path="orders/:orderNumber" element={<OrderDetails />} />
          <Route path="security" element={<Security />} />
          <Route path="sessions" element={<Sessions />} />

          {/* Admin-only nested routes */}
          <Route element={<AdminRoute />}>
            <Route path="admin" element={<AdminLayout />}>
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
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
