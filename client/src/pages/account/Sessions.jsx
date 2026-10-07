import { useEffect, useState } from "react";
import {
  Clock3,
  Laptop,
  LogOut,
  Monitor,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";

import {
  fetchActiveSessions,
  logoutAll,
} from "../../store/slices/authSlice";

function getDeviceIcon(deviceName = "") {
  const device = deviceName.toLowerCase();

  if (
    device.includes("mobile") ||
    device.includes("android") ||
    device.includes("iphone")
  ) {
    return Smartphone;
  }

  if (
    device.includes("windows") ||
    device.includes("mac") ||
    device.includes("linux")
  ) {
    return Laptop;
  }

  return Monitor;
}

function Sessions() {
  const dispatch = useDispatch();

const {
  sessions = [],
  sessionsLoading = false,
} = useSelector((state) => state.auth);

  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchActiveSessions());
  }, [dispatch]);

  const handleLogoutAll = async () => {
    try {
      setLogoutLoading(true);

      const result = await dispatch(logoutAll()).unwrap();

      toast.success(
        result?.message ||
          "Logged out from other sessions.",
      );

      dispatch(fetchActiveSessions());
    } catch (error) {
      toast.error(
        error || "Unable to logout from other sessions.",
      );
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Active sessions
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Review the devices currently signed in to your account.
          </p>
        </div>

        {sessions.length > 1 && (
          <Button
            variant="outline"
            onClick={handleLogoutAll}
            disabled={logoutLoading}
          >
            <LogOut className="mr-2 size-4" />

            {logoutLoading
              ? "Logging out..."
              : "Log out other sessions"}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Devices</CardTitle>
        </CardHeader>

        <CardContent>
          {sessionsLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading active sessions...
            </p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active sessions found.
            </p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session, index) => {
                const DeviceIcon = getDeviceIcon(
                  session.deviceName,
                );

                return (
                  <div key={session.sessionId || session._id}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <DeviceIcon className="size-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="font-medium">
                            {session.deviceName || "Unknown device"}
                          </p>

                          {session.ipAddress && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              IP: {session.ipAddress}
                            </p>
                          )}

                          {session.lastUsedAt && (
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock3 className="size-3.5" />
                              Last active{" "}
                              {new Date(
                                session.lastUsedAt,
                              ).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-xs text-muted-foreground">
                        Created{" "}
                        {new Date(
                          session.createdAt,
                        ).toLocaleDateString()}
                      </div>
                    </div>

                    {index < sessions.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Sessions;