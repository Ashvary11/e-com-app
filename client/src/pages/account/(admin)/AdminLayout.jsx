import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingBag, Users } from "lucide-react";
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
    <div className="space-y-6">
      {/* Admin heading */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Administration
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your store and its operations.
        </p>
      </div>

      {/* Admin navigation */}
      <nav className="flex gap-1 overflow-x-auto rounded-xl border bg-background p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {adminLinks.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  "hover:bg-muted",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground",
                )
              }
            >
              <Icon className="size-4" />
              {link.label}
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
