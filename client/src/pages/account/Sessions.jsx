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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Active sessions
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Review and manage the devices signed in to your account.
          </p>
        </div>

        {sessions.length > 1 && (
          <Button
            variant="outline"
            onClick={handleLogoutAll}
            disabled={logoutLoading || Boolean(revokingSessionId)}
          >
            <LogOut className="mr-2 size-4" />

            {logoutLoading ? "Logging out..." : "Log out all sessions"}
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
                const DeviceIcon = getDeviceIcon(session.deviceName);

                const isCurrentSession =
                  Boolean(user?.sessionId) &&
                  user.sessionId === session.sessionId;

                const isRevoking = revokingSessionId === session.sessionId;

                return (
                  <div key={session.sessionId || session._id}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <DeviceIcon className="size-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">
                              {session.deviceName || "Unknown device"}
                            </p>

                            {isCurrentSession && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                This device
                              </span>
                            )}
                          </div>

                          {session.ipAddress && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              IP: {session.ipAddress}
                            </p>
                          )}

                          {session.lastUsedAt && (
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock3 className="size-3.5" />
                              Last active{" "}
                              {new Date(session.lastUsedAt).toLocaleString()}
                            </p>
                          )}

                          {/* {session.createdAt && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Created{" "}
                              {new Date(
                                session.createdAt,
                              ).toLocaleDateString()}
                            </p>
                          )} */}
                        </div>
                      </div>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRevokeSession(session)}
                        disabled={
                          Boolean(revokingSessionId) ||
                          logoutLoading ||
                          !session.sessionId
                        }
                      >
                        <LogOut className="mr-2 size-4" />

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
