import { NavLink, Outlet, useNavigate } from "react-router-dom";
import Container from "../../components/layout/Container";

import { cn } from "../../lib/utils";
import { Separator } from "../../components/ui/separator";
import { LogOut, LockKeyhole, Monitor, UserRound } from "lucide-react";
import { useDispatch } from "react-redux";
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
      <div className="py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your profile, security, and active sessions.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          {/* Navigation */}
          <aside className="h-fit rounded-xl border bg-background">
            {/* <nav className="flex gap-1 overflow-x-auto p-2 lg:flex-col "> */}
            <nav className="flex flex-nowrap gap-1 overflow-x-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col">
              {accountLinks.map((link) => {
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
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground",
                      )
                    }
                  >
                    <Icon className="size-4" />
                    {link.label}
                  </NavLink>
                );
              })}

              <Separator className="my-1 hidden lg:block" />

              <button
                type="button"
                onClick={handleLogout}
                className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="size-4" />
                Logout
              </button>
            </nav>
          </aside>

          {/* Page content */}
          <section className="min-w-0">
            <Outlet />
          </section>
        </div>
      </div>
    </Container>
  );
}

export default AccountLayout;
