import { NavLink, Outlet, useNavigate } from "react-router-dom";
import Container from "../../components/layout/Container";

import { cn } from "../../lib/utils";
import { Separator } from "../../components/ui/separator";
import {
  LogOut,
  LockKeyhole,
  Monitor,
  UserRound,
  ShieldCheck,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { logout } from "@/store/slices/authSlice";

const accountLinks = [
  {
    to: "/account/profile",
    label: "Profile",
    icon: UserRound,
  },
  {
    to: "/account/orders",
    label: "Order",
    icon: UserRound,
    end: true,
  },
  {
    to: "/account/security",
    label: "Security",
    icon: LockKeyhole,
  },
  {
    to: "/account/sessions",
    label: "Sessions",
    icon: Monitor,
  },
];

function AccountLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin";

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();

      toast.success("Logged out successfully.");
      navigate("/");
    } catch (error) {
      toast.error(error || "Unable to logout.");
    }
  };

  return (
    <Container>
      <div className="min-h-screen py-5 sm:py-8">
        {/* Account heading */}
        <div className="mb-5 sm:mb-7">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your profile, security, and active sessions.
          </p>
        </div>

        {/* Responsive account layout */}
        <div className="grid min-w-0 grid-cols-1 items-start gap-4 sm:gap-6 lg:grid-cols-[210px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]">
          {/* Navigation */}
          <aside className="min-w-0 rounded-xl border bg-background p-1.5 sm:p-2 lg:sticky lg:top-20">
            <nav className="flex min-w-0 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col">
              {accountLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      cn(
                        "flex shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors sm:justify-start",
                        "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground",
                      )
                    }
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}

              {/* Admin-only navigation */}
              {isAdmin && (
                <>
                  <Separator className="my-1 hidden lg:block" />

                  <NavLink
                    to="/account/admin"
                    end
                    className={({ isActive }) =>
                      cn(
                        "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground",
                      )
                    }
                  >
                    <ShieldCheck className="size-4 shrink-0" />
                    <span>Admin Dashboard</span>
                  </NavLink>
                </>
              )}

              <Separator className="my-1 hidden lg:block" />

              <button
                type="button"
                onClick={handleLogout}
                className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <LogOut className="size-4 shrink-0" />
                <span>Logout</span>
              </button>
            </nav>
          </aside>

          {/* Page content */}
          <section className="min-w-0 w-full">
            <Outlet />
          </section>
        </div>
      </div>
    </Container>
  );
}

export default AccountLayout;
