 
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminLinks = [
  {
    to: "/account/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: "/account/admin/users",
    label: "Users",
    icon: Users,
  },
  {
    to: "/account/admin/products",
    label: "Products",
    icon: Package,
  },
  {
    to: "/account/admin/orders",
    label: "Orders",
    icon: ShoppingBag,
  },
];

function AdminLayout() {
  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      {/* Admin heading */}
      <header className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Administration
        </h2>

        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          Manage your store and its operations.
        </p>
      </header>

      {/* Responsive admin navigation */}
      <nav
        aria-label="Admin navigation"
        className="grid grid-cols-2 gap-1 rounded-xl border bg-background p-1.5 sm:flex sm:flex-wrap sm:gap-1 sm:p-2"
      >
        {adminLinks.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "flex min-w-0 items-center justify-center gap-2 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-colors",
                  "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "sm:justify-start sm:px-3",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground",
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Current admin page */}
      <section className="min-w-0">
        <Outlet />
      </section>
    </div>
  );
}

export default AdminLayout;
 