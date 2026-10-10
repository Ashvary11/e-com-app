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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          View your CartSphere account information.
        </p>
      </div>

      {needsPassword && (
        <Card className="border-amber-500/40">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />

              <div>
                <p className="font-medium">Secure your account</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  You haven't set a password yet. Set one to enable
                  password-based sign-in to your CartSphere account.
                </p>
              </div>
            </div>

            <Button
              className="shrink-0"
              onClick={() => navigate("/account/security")}
            >
              Set password
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="size-5" />
            Personal information
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div className="min-w-0">
              <p className="font-medium">{user?.name || "User"}</p>

              <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="size-4 shrink-0" />
                <span className="truncate">{user?.email}</span>
              </div>
            </div>
          </div>

          <div
            className={`grid gap-4 ${
              isPrivilegedRole ? "sm:grid-cols-3" : "sm:grid-cols-2"
            }`}
          >
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="mt-1 font-medium">
                {user?.name || "Not available"}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="mt-1 break-all font-medium">
                {user?.email || "Not available"}
              </p>
            </div>

            {isPrivilegedRole && (
              <div className="rounded-lg border p-4">
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