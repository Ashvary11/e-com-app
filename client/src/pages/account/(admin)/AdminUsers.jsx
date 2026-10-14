import { useCallback, useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Users,
  ShieldCheck,
  ShieldAlert,
  UserRound,
  Mail,
  CalendarDays,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  Ban,
  CheckCircle2,
  ShieldOff,
  Monitor,
  X,
  LoaderCircle,
} from "lucide-react";
import { toast } from "sonner";

import api from "../../../services/api";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

const PAGE_SIZE = 10;

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.message ||
  "Something went wrong. Please try again.";

const formatDate = (date) => {
  if (!date) return "Never";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "Never";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getAccountStatus = (user) => {
  if (user.isBlocked) {
    return {
      label: "Blocked",
      className: "bg-red-50 text-red-700 ring-red-600/20",
    };
  }

  if (!user.isActive) {
    return {
      label: "Inactive",
      className: "bg-gray-100 text-gray-700 ring-gray-500/20",
    };
  }

  return {
    label: "Active",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  };
};

const getRoleClass = (role) => {
  if (role === "admin") {
    return "bg-violet-50 text-violet-700 ring-violet-600/20";
  }

  if (role === "manager") {
    return "bg-blue-50 text-blue-700 ring-blue-600/20";
  }

  return "bg-gray-100 text-gray-700 ring-gray-500/20";
};

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [busyUserId, setBusyUserId] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Debounce search so the API is not called on every keystroke.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  // Fetch users from the existing admin API.
  const fetchUsers = useCallback(
    async ({ showRefresh = false } = {}) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      try {
        const response = await api.get("/admin/users", {
          params: {
            search,
            role: roleFilter,
            status: statusFilter,
            sort,
            page,
            limit: PAGE_SIZE,
          },
        });

        const data = response.data;

        setUsers(data.users || []);
        setPagination(
          data.pagination || {
            page,
            limit: PAGE_SIZE,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        );
      } catch (error) {
        const message = getErrorMessage(error);

        setErrorMessage(message);
        toast.error(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, roleFilter, statusFilter, sort, page],
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Change a user's role.
  const handleRoleChange = async (user, newRole) => {
    if (newRole === user.role) return;

    const confirmed = window.confirm(
      `Change ${user.name}'s role from "${user.role}" to "${newRole}"?`,
    );

    if (!confirmed) return;

    setBusyUserId(user._id);

    try {
      const response = await api.patch(`/admin/users/${user._id}/role`, {
        role: newRole,
      });

      toast.success(response.data.message || "User role updated successfully.");

      await fetchUsers({ showRefresh: true });

      if (selectedUser?._id === user._id) {
        await fetchUserDetails(user._id, { silent: true });
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyUserId(null);
    }
  };

  // Update active or blocked status.
  const handleStatusChange = async (user, changes, actionLabel) => {
    const confirmed = window.confirm(`${actionLabel} for ${user.name}?`);

    if (!confirmed) return;

    setBusyUserId(user._id);

    try {
      const response = await api.patch(
        `/admin/users/${user._id}/status`,
        changes,
      );

      toast.success(
        response.data.message || "Account status updated successfully.",
      );

      await fetchUsers({ showRefresh: true });

      if (selectedUser?._id === user._id) {
        await fetchUserDetails(user._id, { silent: true });
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyUserId(null);
    }
  };

  // Revoke every session belonging to the selected user.
  const handleRevokeSessions = async (user) => {
    const confirmed = window.confirm(
      `Revoke all active sessions for ${user.name}? They will need to log in again.`,
    );

    if (!confirmed) return;

    setBusyUserId(user._id);

    try {
      const response = await api.post(
        `/admin/users/${user._id}/revoke-sessions`,
      );

      toast.success(
        `${response.data.message || "Sessions revoked."} ${
          typeof response.data.revokedCount === "number"
            ? `(${response.data.revokedCount} sessions)`
            : ""
        }`,
      );

      if (selectedUser?._id === user._id) {
        await fetchUserDetails(user._id, { silent: true });
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyUserId(null);
    }
  };

  // Fetch details for the user information dialog.
  const fetchUserDetails = async (userId, { silent = false } = {}) => {
    if (!silent) {
      setLoadingDetails(true);
    }

    try {
      const response = await api.get(`/admin/users/${userId}`);

      setSelectedUser({
        ...response.data.user,
        activeSessions: response.data.activeSessions ?? 0,
      });
    } catch (error) {
      if (!silent) {
        toast.error(getErrorMessage(error));
      }
    } finally {
      if (!silent) {
        setLoadingDetails(false);
      }
    }
  };

  const openUserDetails = async (user) => {
    setSelectedUser({
      ...user,
      activeSessions: null,
    });

    await fetchUserDetails(user._id);
  };

  const closeUserDetails = () => {
    setSelectedUser(null);
  };

  const handleRefresh = () => {
    fetchUsers({ showRefresh: true });
  };

  const firstItem = pagination.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const lastItem = Math.min(page * PAGE_SIZE, pagination.total);

  const activeCount = users.filter(
    (user) => user.isActive && !user.isBlocked,
  ).length;

  const blockedCount = users.filter((user) => user.isBlocked).length;

  const adminCount = users.filter((user) => user.role === "admin").length;

  return (
    <div className="w-full min-w-0 space-y-5">
      {/* Header */}
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Users className="size-6 shrink-0 text-foreground" />

            <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          </div>

          <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">
            Manage accounts, roles, access and active sessions.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="w-full sm:w-auto"
        >
          <RefreshCw
            className={`mr-2 size-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Summary cards for the currently displayed page */}
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3">
        <div className="min-w-0 rounded-xl border bg-background p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                Users on this page
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {loading ? "—" : users.length}
              </p>
            </div>

            <div className="rounded-lg bg-muted p-2.5">
              <Users className="size-5 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-xl border bg-background p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                Active on this page
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {loading ? "—" : activeCount}
              </p>
            </div>

            <div className="rounded-lg bg-emerald-50 p-2.5">
              <ShieldCheck className="size-5 text-emerald-700" />
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-xl border bg-background p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                Blocked on this page
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {loading ? "—" : blockedCount}
              </p>
            </div>

            <div className="rounded-lg bg-red-50 p-2.5">
              <ShieldAlert className="size-5 text-red-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="min-w-0 space-y-4 rounded-xl border bg-background p-3 sm:p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            type="search"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <label
              htmlFor="user-role-filter"
              className="text-xs font-medium text-muted-foreground"
            >
              Role
            </label>

            <select
              id="user-role-filter"
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All roles</option>
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="user-status-filter"
              className="text-xs font-medium text-muted-foreground"
            >
              Account status
            </label>

            <select
              id="user-status-filter"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="user-sort"
              className="text-xs font-medium text-muted-foreground"
            >
              Sort by
            </label>

            <select
              id="user-sort"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-2 border-t pt-3 text-sm sm:flex-row sm:items-center">
          <p className="text-muted-foreground">
            {loading ? (
              "Loading users..."
            ) : (
              <>
                Showing{" "}
                <span className="font-medium text-foreground">
                  {firstItem}–{lastItem}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {pagination.total}
                </span>{" "}
                users
              </>
            )}
          </p>

          {(searchInput || roleFilter !== "all" || statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setSearch("");
                setRoleFilter("all");
                setStatusFilter("all");
                setPage(1);
              }}
              className="self-start text-sm font-medium text-foreground underline-offset-4 hover:underline sm:self-auto"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {errorMessage && !loading && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-sm text-red-800">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <p>{errorMessage}</p>
          </div>

          <Button variant="outline" onClick={handleRefresh}>
            Try again
          </Button>
        </div>
      )}

      {/* Users table */}
      <div className="overflow-hidden rounded-xl border bg-background">
        <div className="flex min-w-0 flex-col gap-1 border-b px-3 py-3 sm:px-4 md:flex-row md:items-center md:justify-between">
          <h2 className="font-semibold">All users</h2>

          <p className="text-xs text-muted-foreground">
            Manage each account using the actions column.
          </p>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="border-b bg-muted/95 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Last login</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 6 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-5">
                        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="rounded-full bg-muted p-3">
                        <Users className="size-6 text-muted-foreground" />
                      </div>

                      <p className="mt-3 font-medium">No users found</p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Try changing your search or filters.
                      </p>

                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          setSearchInput("");
                          setSearch("");
                          setRoleFilter("all");
                          setStatusFilter("all");
                          setPage(1);
                        }}
                      >
                        Reset filters
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const status = getAccountStatus(user);
                  const isBusy = busyUserId === user._id;

                  return (
                    <tr
                      key={user._id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      {/* User information */}
                      <td className="px-3 py-4 sm:px-4">
                        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt=""
                              className="size-10 shrink-0 rounded-full border object-cover"
                            />
                          ) : (
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                              <UserRound className="size-5 text-muted-foreground" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="max-w-[200px] truncate font-medium">
                              {user.name}
                            </p>

                            <p className="mt-0.5 flex max-w-[220px] min-w-0 items-center gap-1 truncate text-xs text-muted-foreground">
                              <Mail className="size-3 shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </p>

                            <div className="mt-1 flex flex-wrap gap-1">
                              {user.isEmailVerified ? (
                                <span className="text-[10px] font-medium text-emerald-700">
                                  Verified
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-amber-700">
                                  Unverified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role management */}
                      <td className="px-4 py-4">
                        <div className="space-y-1.5">
                          <span
                            className={`inline-flex rounded-md px-2 py-1 text-xs font-medium capitalize ring-1 ring-inset ${getRoleClass(user.role)}`}
                          >
                            {user.role}
                          </span>

                          <select
                            aria-label={`Change role for ${user.name}`}
                            value={user.role}
                            disabled={isBusy}
                            onChange={(event) =>
                              handleRoleChange(user, event.target.value)
                            }
                            className="block h-8 max-w-[125px] rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                          >
                            <option value="user">User</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </td>

                      {/* Account status */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${status.className}`}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          {status.label}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Last login */}
                      <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                        {formatDate(user.lastLoginAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex max-w-[260px] flex-wrap items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => openUserDetails(user)}
                            title="View user details"
                          >
                            <Eye className="mr-1.5 size-3.5" />
                            Details
                          </Button>

                          {user.isBlocked ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isBusy}
                              onClick={() =>
                                handleStatusChange(
                                  user,
                                  { isBlocked: false },
                                  "Unblock this account",
                                )
                              }
                              title="Unblock account"
                            >
                              {isBusy ? (
                                <LoaderCircle className="mr-1.5 size-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-1.5 size-3.5" />
                              )}
                              Unblock
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isBusy}
                              onClick={() =>
                                handleStatusChange(
                                  user,
                                  { isBlocked: true },
                                  "Block this account",
                                )
                              }
                              title="Block account"
                            >
                              {isBusy ? (
                                <LoaderCircle className="mr-1.5 size-3.5 animate-spin" />
                              ) : (
                                <Ban className="mr-1.5 size-3.5" />
                              )}
                              Block
                            </Button>
                          )}

                          {!user.isActive ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isBusy}
                              onClick={() =>
                                handleStatusChange(
                                  user,
                                  { isActive: true },
                                  "Activate this account",
                                )
                              }
                              title="Activate account"
                            >
                              <CheckCircle2 className="mr-1.5 size-3.5" />
                              Activate
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isBusy}
                              onClick={() =>
                                handleStatusChange(
                                  user,
                                  { isActive: false },
                                  "Deactivate this account",
                                )
                              }
                              title="Deactivate account"
                            >
                              <ShieldOff className="mr-1.5 size-3.5" />
                              Deactivate
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleRevokeSessions(user)}
                            title="Revoke all user sessions"
                          >
                            {isBusy ? (
                              <LoaderCircle className="mr-1.5 size-3.5 animate-spin" />
                            ) : (
                              <Monitor className="mr-1.5 size-3.5" />
                            )}
                            Revoke sessions
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex min-w-0 flex-col gap-3 border-t px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <p className="text-xs text-muted-foreground">
            Page {page} of {Math.max(pagination.totalPages, 1)}
          </p>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              disabled={loading || page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft className="mr-1 size-4" />
              Previous
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              disabled={
                loading ||
                !pagination.hasNextPage ||
                page >= pagination.totalPages
              }
              onClick={() => setPage((current) => current + 1)}
            >
              Next
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* User details dialog */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-2 pt-4 sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeUserDetails();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-user-details-title"
            className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto overscroll-contain rounded-2xl border bg-background shadow-xl sm:max-h-[90dvh]"
          >
            {/* Dialog header */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b bg-background px-3 py-3.5 sm:gap-4 sm:px-5 sm:py-4">
              <div>
                <h2
                  id="admin-user-details-title"
                  className="text-lg font-semibold"
                >
                  User details
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Account information and session status.
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={closeUserDetails}
                aria-label="Close user details"
              >
                <X className="size-4" />
              </Button>
            </div>

            {loadingDetails ? (
              <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-muted-foreground">
                <LoaderCircle className="size-5 animate-spin" />
                Loading user details...
              </div>
            ) : (
              <>
                {/* User profile */}
                <div className="flex items-center gap-4 px-5 py-5">
                  {selectedUser.avatar ? (
                    <img
                      src={selectedUser.avatar}
                      alt=""
                      className="size-16 rounded-full border object-cover"
                    />
                  ) : (
                    <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                      <UserRound className="size-8 text-muted-foreground" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-semibold">
                      {selectedUser.name}
                    </h3>

                    <p className="break-all text-sm text-muted-foreground">
                      {selectedUser.email}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-medium capitalize ring-1 ring-inset ${getRoleClass(selectedUser.role)}`}
                      >
                        {selectedUser.role}
                      </span>

                      <span
                        className={`rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getAccountStatus(selectedUser).className}`}
                      >
                        {getAccountStatus(selectedUser).label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Account information */}
                <div className="space-y-4 border-t px-5 py-5">
                  <h3 className="text-sm font-semibold">Account information</h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <DetailItem
                      icon={Mail}
                      label="Email verification"
                      value={
                        selectedUser.isEmailVerified
                          ? "Verified"
                          : "Not verified"
                      }
                    />

                    <DetailItem
                      icon={ShieldCheck}
                      label="Password"
                      value={
                        selectedUser.hasPassword
                          ? "Password configured"
                          : "Google sign-in / no password"
                      }
                    />

                    <DetailItem
                      icon={CalendarDays}
                      label="Joined"
                      value={formatDateTime(selectedUser.createdAt)}
                    />

                    <DetailItem
                      icon={Clock}
                      label="Last login"
                      value={formatDateTime(selectedUser.lastLoginAt)}
                    />

                    <DetailItem
                      icon={ShieldOff}
                      label="Password last changed"
                      value={formatDateTime(selectedUser.passwordChangedAt)}
                    />

                    <DetailItem
                      icon={Monitor}
                      label="Active sessions"
                      value={
                        selectedUser.activeSessions === null
                          ? "Unavailable"
                          : String(selectedUser.activeSessions)
                      }
                    />
                  </div>
                </div>

                {/* Account actions */}
                <div className="space-y-3 border-t px-5 py-5">
                  <h3 className="text-sm font-semibold">Account actions</h3>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyUserId === selectedUser._id}
                      onClick={() => handleRevokeSessions(selectedUser)}
                    >
                      <Monitor className="mr-2 size-4" />
                      Revoke all sessions
                    </Button>

                    {selectedUser.isBlocked ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyUserId === selectedUser._id}
                        onClick={() =>
                          handleStatusChange(
                            selectedUser,
                            { isBlocked: false },
                            "Unblock this account",
                          )
                        }
                      >
                        Unblock account
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyUserId === selectedUser._id}
                        onClick={() =>
                          handleStatusChange(
                            selectedUser,
                            { isBlocked: true },
                            "Block this account",
                          )
                        }
                      >
                        Block account
                      </Button>
                    )}
                  </div>

                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Changes are applied immediately after confirmation. Session
                    revocation requires the user to sign in again.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="mt-0.5 rounded-md bg-muted p-2">
        <Icon className="size-4 text-muted-foreground" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export default AdminUsers;
