import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Mail, UserRound, ShieldAlert } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";

function Profile() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const isPrivilegedRole = user?.role && user.role !== "user";
  const needsPassword = user?.hasPassword === false;

  return (
    <div className="min-w-0 space-y-4 rounded-xl border bg-background p-3 sm:space-y-6 sm:p-5 lg:p-6">
      {/* Page heading */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Profile
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          View your CartSphere account information.
        </p>
      </div>

      {/* Password reminder */}
      {needsPassword && (
        <Card className="min-w-0 border-amber-500/40">
          <CardContent className="flex flex-col gap-4 p-3 sm:p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />

              <div className="min-w-0">
                <p className="font-medium">Secure your account</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  You haven't set a password yet. Set one to enable
                  password-based sign-in to your CartSphere account.
                </p>
              </div>
            </div>

            <Button
              className="w-full shrink-0 sm:w-fit"
              onClick={() => navigate("/account/security")}
            >
              Set password
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Personal information */}
      <Card className="min-w-0">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <UserRound className="size-5 shrink-0" />
            Personal information
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5 p-4 pt-0 sm:space-y-6 sm:p-6 sm:pt-0">
          {/* User identity */}
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-semibold sm:size-14">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div className="min-w-0 flex-1">
              <p className="break-words font-medium">{user?.name || "User"}</p>

              <div className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="size-4 shrink-0" />
                <span className="min-w-0 break-all">
                  {user?.email || "Not available"}
                </span>
              </div>
            </div>
          </div>

          {/* Account information grid */}
          <div
            className={`grid min-w-0 grid-cols-1 gap-3 sm:gap-4 ${
              isPrivilegedRole
                ? "sm:grid-cols-2 xl:grid-cols-3"
                : "sm:grid-cols-2"
            }`}
          >
            <div className="min-w-0 rounded-lg border p-3 sm:p-4">
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="mt-1 break-words font-medium">
                {user?.name || "Not available"}
              </p>
            </div>

            <div className="min-w-0 rounded-lg border p-3 sm:p-4">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="mt-1 break-all font-medium">
                {user?.email || "Not available"}
              </p>
            </div>

            {isPrivilegedRole && (
              <div className="min-w-0 rounded-lg border p-3 sm:p-4">
                <p className="text-sm text-muted-foreground">Role</p>
                <div className="mt-2">
                  <Badge variant="secondary">{user.role}</Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Profile;
