import { Link, NavLink } from "react-router-dom";
import Container from "./Container";
import { useSelector } from "react-redux";
import { ShoppingCart } from "lucide-react";

function Navbar() {
  const navLinkClass = ({ isActive }) =>
    `transition-colors ${
      isActive ? "text-black font-semibold" : "text-gray-600 hover:text-black"
    }`;
  const cartItems = useSelector((state) => state.cart.items);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
      <Container>
        <nav className="flex h-16 items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight">
            Cart<span className="text-indigo-600">Sphere</span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <NavLink to="/" className={navLinkClass}>
              Home
            </NavLink>

            <NavLink to="/products" className={navLinkClass}>
              Products
            </NavLink>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/cart"
              className="relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100"
            >
              <ShoppingCart className="h-4 w-4" />

              <span>Cart</span>

              {cartCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-xs font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              to="/login"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Login
            </Link>
          </div>
        </nav>
      </Container>
    </header>
  );
}

export default Navbar;
