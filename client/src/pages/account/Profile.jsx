import { useSelector } from "react-redux";
import { Mail, UserRound } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

function Profile() {
  const { user } = useSelector((state) => state.auth);
  const isPrivilegedRole = user?.role && user.role !== "user";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          View your CartSphere account information.
        </p>
      </div>

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
