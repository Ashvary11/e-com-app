import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock3, Laptop, LogOut, Monitor, Smartphone } from "lucide-react";
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
  clearAuth,
  fetchActiveSessions,
  logoutAll,
  revokeSessionById,
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
  const navigate = useNavigate();

  const {
    user,
    sessions = [],
    sessionsLoading = false,
  } = useSelector((state) => state.auth);

  const [logoutLoading, setLogoutLoading] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState(null);

  useEffect(() => {
    dispatch(fetchActiveSessions());
  }, [dispatch]);

  const handleLogoutAll = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to log out from all sessions? You will need to sign in again on your devices.",
    );

    if (!confirmed) return;

    try {
      setLogoutLoading(true);

      const result = await dispatch(logoutAll()).unwrap();

      toast.success(result?.message || "Logged out from all sessions.");
      dispatch(fetchActiveSessions());
    } catch (error) {
      toast.error(error || "Unable to log out from all sessions.");
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleRevokeSession = async (session) => {
    const sessionId = session.sessionId;

    if (!sessionId) {
      toast.error("Session ID is missing.");
      return;
    }

    const isCurrentSession =
      Boolean(user?.sessionId) && user.sessionId === sessionId;

    const confirmed = window.confirm(
      isCurrentSession
        ? "This is your current active session. If you continue, you will be logged out of this device and redirected to the login page. Do you want to continue?"
        : `Are you sure you want to revoke the session for ${
            session.deviceName || "this device"
          }? This device will no longer be able to refresh its login session.`,
    );

    if (!confirmed) return;

    try {
      setRevokingSessionId(sessionId);

      const result = await dispatch(revokeSessionById(sessionId)).unwrap();

      if (isCurrentSession) {
        dispatch(clearAuth());
        navigate("/login");
        toast.success(result?.message || "Your session has been revoked.");
        return;
      }

      toast.success(result?.message || "Session revoked successfully.");

      await dispatch(fetchActiveSessions()).unwrap();
    } catch (error) {
      toast.error(error || "Unable to revoke this session.");
    } finally {
      setRevokingSessionId(null);
    }
  };

  return (
    <div className="min-w-0 space-y-4 rounded-xl border bg-background p-3 sm:space-y-6 sm:p-5 lg:p-6">
      {/* Heading and actions */}
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Active sessions
          </h2>

          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Review and manage the devices signed in to your account.
          </p>
        </div>

        {sessions.length > 1 && (
          <Button
            variant="outline"
            className="w-full shrink-0 sm:w-fit"
            onClick={handleLogoutAll}
            disabled={logoutLoading || Boolean(revokingSessionId)}
          >
            <LogOut className="mr-2 size-4 shrink-0" />
            {logoutLoading ? "Logging out..." : "Log out all sessions"}
          </Button>
        )}
      </div>

      {/* Devices */}
      <Card className="min-w-0">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Devices</CardTitle>
        </CardHeader>

        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
          {sessionsLoading ? (
            <p className="py-4 text-sm text-muted-foreground">
              Loading active sessions...
            </p>
          ) : sessions.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              No active sessions found.
            </p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {sessions.map((session, index) => {
                const DeviceIcon = getDeviceIcon(session.deviceName);

                const isCurrentSession =
                  Boolean(user?.sessionId) &&
                  user.sessionId === session.sessionId;

                const isRevoking = revokingSessionId === session.sessionId;

                return (
                  <div
                    key={session.sessionId || session._id}
                    className="min-w-0 rounded-xl border bg-muted/30 p-3 transition-colors hover:bg-muted/60 sm:p-4"
                  >
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      {/* Device information */}
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background">
                          <DeviceIcon className="size-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="break-words text-sm font-medium sm:text-base">
                              {session.deviceName || "Unknown device"}
                            </p>

                            {isCurrentSession && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                This device
                              </span>
                            )}
                          </div>

                          {session.ipAddress && (
                            <p className="mt-1 break-all text-xs text-muted-foreground sm:text-sm">
                              IP: {session.ipAddress}
                            </p>
                          )}

                          {session.lastUsedAt && (
                            <p className="mt-2 flex min-w-0 items-start gap-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                              <Clock3 className="mt-0.5 size-3.5 shrink-0" />
                              <span className="min-w-0 break-words">
                                Last active{" "}
                                {new Date(session.lastUsedAt).toLocaleString()}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Revoke action */}
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full shrink-0 sm:w-fit"
                        onClick={() => handleRevokeSession(session)}
                        disabled={
                          Boolean(revokingSessionId) ||
                          logoutLoading ||
                          !session.sessionId
                        }
                      >
                        <LogOut className="mr-2 size-4 shrink-0" />
                        {isRevoking ? "Revoking..." : "Revoke session"}
                      </Button>
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
