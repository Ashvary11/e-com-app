import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Package,
  RefreshCw,
  ShoppingBag,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import api from "../../../services/api";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";

const LOW_STOCK_THRESHOLD = 5;

const RANGE_OPTIONS = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "Last 12 months", value: "12m" },
  { label: "Custom range", value: "custom" },
];

const STATUS_ITEMS = [
  {
    label: "Pending",
    value: "pending",
    color: "bg-amber-500",
    textColor: "text-amber-600",
  },
  {
    label: "Confirmed",
    value: "confirmed",
    color: "bg-blue-500",
    textColor: "text-blue-600",
  },
  {
    label: "Processing",
    value: "processing",
    color: "bg-violet-500",
    textColor: "text-violet-600",
  },
  {
    label: "Shipped",
    value: "shipped",
    color: "bg-indigo-500",
    textColor: "text-indigo-600",
  },
  {
    label: "Delivered",
    value: "delivered",
    color: "bg-emerald-500",
    textColor: "text-emerald-600",
  },
  {
    label: "Cancelled",
    value: "cancelled",
    color: "bg-red-500",
    textColor: "text-red-600",
  },
];

const STATUS_STYLES = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  confirmed: "border-blue-200 bg-blue-50 text-blue-700",
  processing: "border-violet-200 bg-violet-50 text-violet-700",
  shipped: "border-indigo-200 bg-indigo-50 text-indigo-700",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-red-200 bg-red-50 text-red-700",
  refunded: "border-violet-200 bg-violet-50 text-violet-700",
};

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const formatNumber = (number) =>
  new Intl.NumberFormat("en-IN").format(Number(number) || 0);

const formatStatus = (status = "") =>
  status.charAt(0).toUpperCase() + status.slice(1);

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
};

const formatChartDate = (date) => {
  if (!date) return "";

  // Monthly bucket from the backend: YYYY-MM.
  if (/^\d{4}-\d{2}$/.test(date)) {
    const [year, month] = date.split("-").map(Number);

    return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
      month: "short",
      year: "2-digit",
    });
  }

  // Daily bucket from the backend: YYYY-MM-DD.
  const [year, month, day] = date.split("-").map(Number);

  if (!year || !month || !day) return date;

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

function StatusBadge({ status }) {
  return (
    <Badge
      variant="outline"
      className={`whitespace-nowrap font-medium ${
        STATUS_STYLES[status] || "border-border bg-muted text-muted-foreground"
      }`}
    >
      {formatStatus(status)}
    </Badge>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
  loading,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group min-w-0 rounded-xl border bg-background p-4 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>

          {loading ? (
            <Skeleton className="mt-3 h-8 w-28" />
          ) : (
            <p className="mt-2 truncate text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
              {value}
            </p>
          )}
        </div>

        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
        >
          <Icon className="size-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{description}</p>
        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

function Comparison({ value }) {
  if (value === null || value === undefined) {
    return (
      <span className="text-xs text-muted-foreground">
        No previous-period baseline
      </span>
    );
  }

  const isPositive = value > 0;
  const isNegative = value < 0;
  const Icon = isNegative ? ArrowDownRight : ArrowUpRight;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        isPositive
          ? "text-emerald-600"
          : isNegative
            ? "text-red-600"
            : "text-muted-foreground"
      }`}
    >
      {value !== 0 && <Icon className="size-3.5" />}
      {value > 0 ? "+" : ""}
      {value.toFixed(2)}%
      <span className="font-normal text-muted-foreground">
        vs previous period
      </span>
    </span>
  );
}

function SalesChart({ data, loading }) {
  const chart = useMemo(() => {
    const width = 720;
    const height = 260;
    const padding = { top: 18, right: 14, bottom: 38, left: 54 };

    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    const maxValue = Math.max(
      1,
      ...data.map((item) => Number(item.revenue) || 0),
    );

    const maxOrders = Math.max(
      1,
      ...data.map((item) => Number(item.orders) || 0),
    );

    const revenuePoints = data.map((item, index) => ({
      x:
        padding.left +
        (data.length > 1
          ? (index / (data.length - 1)) * innerWidth
          : innerWidth / 2),
      y:
        padding.top +
        innerHeight -
        ((Number(item.revenue) || 0) / maxValue) * innerHeight,
    }));

    const orderPoints = data.map((item, index) => ({
      x:
        padding.left +
        (data.length > 1
          ? (index / (data.length - 1)) * innerWidth
          : innerWidth / 2),
      y:
        padding.top +
        innerHeight -
        ((Number(item.orders) || 0) / maxOrders) * innerHeight,
    }));

    const line = (points) =>
      points.map((point) => `${point.x},${point.y}`).join(" ");

    const area =
      revenuePoints.length > 0
        ? `${padding.left},${padding.top + innerHeight} ${line(
            revenuePoints,
          )} ${padding.left + innerWidth},${padding.top + innerHeight}`
        : "";

    return {
      width,
      height,
      padding,
      innerWidth,
      innerHeight,
      revenuePoints,
      orderPoints,
      revenueLine: line(revenuePoints),
      orderLine: line(orderPoints),
      area,
      maxValue,
      maxOrders,
    };
  }, [data]);

  const hasActivity = data.some(
    (item) => Number(item.revenue) > 0 || Number(item.orders) > 0,
  );

  if (loading) {
    return <Skeleton className="h-[280px] w-full rounded-lg" />;
  }

  if (!data.length || !hasActivity) {
    return (
      <div className="flex h-[280px] flex-col items-center justify-center text-center">
        <Activity className="mb-3 size-8 text-muted-foreground" />
        <p className="font-medium">No sales activity in this period</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Sales and order trends will appear here when orders are placed.
        </p>
      </div>
    );
  }

  const tickLabels = [0, 0.25, 0.5, 0.75, 1];

  const labelIndexes = [
    ...new Set([
      0,
      Math.floor((data.length - 1) / 3),
      Math.floor(((data.length - 1) * 2) / 3),
      data.length - 1,
    ]),
  ];

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-primary" />
          Revenue
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-emerald-500" />
          Orders
        </span>
      </div>

      <svg
        viewBox={`0 0 ${chart.width} ${chart.height}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="Revenue and order trends for the selected period"
      >
        {tickLabels.map((fraction) => {
          const y = chart.padding.top + chart.innerHeight * (1 - fraction);

          return (
            <g key={fraction}>
              <line
                x1={chart.padding.left}
                y1={y}
                x2={chart.width - chart.padding.right}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.10"
                strokeDasharray="4 4"
              />
              <text
                x={chart.padding.left - 9}
                y={y + 4}
                textAnchor="end"
                fill="currentColor"
                opacity="0.65"
                fontSize="10"
              >
                {formatPrice(chart.maxValue * fraction)}
              </text>
            </g>
          );
        })}

        <polygon points={chart.area} fill="currentColor" fillOpacity="0.06" />

        {chart.revenuePoints.length > 1 && (
          <polyline
            points={chart.revenueLine}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {chart.orderPoints.length > 1 && (
          <polyline
            points={chart.orderLine}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {chart.revenuePoints.map((point, index) => (
          <circle
            key={`revenue-${data[index].date}`}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="currentColor"
          >
            <title>
              {formatChartDate(data[index].date)}:{" "}
              {formatPrice(data[index].revenue)}
            </title>
          </circle>
        ))}

        {chart.orderPoints.map((point, index) => (
          <circle
            key={`orders-${data[index].date}`}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="#10b981"
          >
            <title>
              {formatChartDate(data[index].date)}: {data[index].orders} orders
            </title>
          </circle>
        ))}

        {labelIndexes.map((index) => {
          const item = data[index];
          const point = chart.revenuePoints[index];

          return (
            <text
              key={`label-${item.date}`}
              x={point.x}
              y={chart.height - 12}
              textAnchor={
                index === 0
                  ? "start"
                  : index === data.length - 1
                    ? "end"
                    : "middle"
              }
              fill="currentColor"
              opacity="0.65"
              fontSize="10"
            >
              {formatChartDate(item.date)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();

  const [range, setRange] = useState("30d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboard = useCallback(
    async ({ refresh = false, showToast = false } = {}) => {
      if (range === "custom") {
        if (!startDate || !endDate) {
          toast.error("Select both a start date and an end date.");
          return;
        }

        if (startDate > endDate) {
          toast.error("Start date must be before or equal to end date.");
          return;
        }
      }

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(false);

      try {
        const params = range === "custom" ? { startDate, endDate } : { range };

        const response = await api.get("/admin/dashboard", { params });

        if (!response.data?.success) {
          throw new Error(
            response.data?.message || "Unable to load dashboard data.",
          );
        }

        setDashboard(response.data.data);
        setLastUpdated(new Date());

        if (showToast) {
          toast.success("Dashboard refreshed.");
        }
      } catch (err) {
        setError(true);

        toast.error(
          err.response?.data?.message ||
            err.message ||
            "Unable to load dashboard data.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [range, startDate, endDate],
  );

  useEffect(() => {
    if (range !== "custom") {
      fetchDashboard();
    }
  }, [range, fetchDashboard]);

  const overview = dashboard?.overview;
  const comparison = dashboard?.comparison;
  const orderStatus = dashboard?.orderStatus || {};
  const recentOrders = dashboard?.recentOrders || [];

  const chartData = useMemo(() => {
    const rawTrend = dashboard?.salesTrend || [];

    // The backend returns monthly buckets for the 12-month preset.
    if (range === "12m") {
      const trendMap = new Map(
        rawTrend.map((item) => [
          item.date,
          {
            date: item.date,
            revenue: Number(item.revenue) || 0,
            orders: Number(item.orders) || 0,
          },
        ]),
      );

      const result = [];
      const now = new Date();

      for (let offset = 11; offset >= 0; offset -= 1) {
        const monthDate = new Date(
          now.getFullYear(),
          now.getMonth() - offset,
          1,
        );

        const key = getLocalDateString(monthDate);

        result.push(
          trendMap.get(key) || {
            date: key,
            revenue: 0,
            orders: 0,
          },
        );
      }

      return result;
    }

    // Fill missing daily buckets with zero values.
    if (range === "7d" || range === "30d" || range === "90d") {
      const trendMap = new Map(
        rawTrend.map((item) => [
          item.date,
          {
            date: item.date,
            revenue: Number(item.revenue) || 0,
            orders: Number(item.orders) || 0,
          },
        ]),
      );

      const dayCount = Number.parseInt(range, 10);
      const result = [];
      const today = new Date();

      for (let offset = dayCount - 1; offset >= 0; offset -= 1) {
        const date = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - offset,
        );

        const key = getDateString(date);

        result.push(
          trendMap.get(key) || {
            date: key,
            revenue: 0,
            orders: 0,
          },
        );
      }

      return result;
    }

    // For custom ranges, keep the API buckets and normalize their values.
    return rawTrend.map((item) => ({
      date: item.date,
      revenue: Number(item.revenue) || 0,
      orders: Number(item.orders) || 0,
    }));
  }, [dashboard?.salesTrend, range]);

  const totalStatusOrders = STATUS_ITEMS.reduce(
    (total, item) => total + (Number(orderStatus[item.value]) || 0),
    0,
  );

  const maxStatusCount = Math.max(
    1,
    ...STATUS_ITEMS.map((item) => Number(orderStatus[item.value]) || 0),
  );

  const hasDashboard = Boolean(dashboard);

  return (
    <div className="min-w-0 space-y-6 pb-6">
      {/* Page header */}
      <div className="flex min-w-0 flex-col gap-3 border-b pb-4 sm:gap-4 sm:pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Admin</span>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground">Overview</span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Dashboard
          </h1>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Monitor your store performance, sales, orders, and inventory.
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated{" "}
              {lastUpdated.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboard({ refresh: true, showToast: true })}
            disabled={loading || refreshing}
          >
            <RefreshCw
              className={`mr-2 size-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Welcome section */}
      <section className="relative min-w-0 overflow-hidden rounded-2xl border bg-muted/30 p-4 sm:p-6 lg:p-7">
        <div className="pointer-events-none absolute -right-12 -top-16 size-56 rounded-full border-[28px] border-muted/60" />
        <div className="pointer-events-none absolute -right-2 -top-5 size-36 rounded-full border border-border/80" />

        <div className="relative flex min-w-0 flex-col gap-4 sm:gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <Badge variant="outline" className="mb-3 gap-1.5 bg-background">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Store overview
            </Badge>

            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Welcome to CartSphere
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Manage your catalog, track customer orders, and monitor store
              performance from one place.
            </p>
          </div>

          <div className="flex min-w-0 flex-wrap gap-2">
            <Button
              className="flex-1 sm:flex-none"
              onClick={() => navigate("/account/admin/orders")}
            >
              View orders
              <ArrowRight className="ml-2 size-4" />
            </Button>

            <Button
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={() => navigate("/account/admin/products")}
            >
              <Package className="mr-2 size-4" />
              Products
            </Button>
          </div>
        </div>
      </section>

      {/* Date range filters */}
      <section className="rounded-xl border bg-background p-4 sm:p-5">
       <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
  <div className="min-w-0">
    <h2 className="font-semibold tracking-tight">
      Analytics overview
    </h2>
    <p className="mt-1 text-sm leading-5 text-muted-foreground">
      Revenue and order trends for your selected period.
    </p>
  </div>

          <div  className={`grid min-w-0 grid-cols-1 gap-3 ${
      range === "custom"
        ? "sm:grid-cols-2 xl:max-w-3xl xl:grid-cols-4"
        : "sm:grid-cols-[minmax(0,1fr)] xl:w-44"
    }`}>
            <div className="min-w-0 space-y-1.5">
              <label
                htmlFor="dashboard-range"
                className="text-xs font-medium text-muted-foreground"
              >
                Date range
              </label>

              <select
                id="dashboard-range"
                value={range}
                onChange={(event) => setRange(event.target.value)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-44"
              >
                {RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {range === "custom" && (
              <>
                <div className="min-w-0 space-y-1.5">
                  <label
                    htmlFor="dashboard-start-date"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    From
                  </label>

                  <input
                    id="dashboard-start-date"
                    type="date"
                    value={startDate}
                    max={endDate || undefined}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="min-w-0 space-y-1.5">
                  <label
                    htmlFor="dashboard-end-date"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    To
                  </label>

                  <input
                    id="dashboard-end-date"
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <Button
                  size="sm"
                  onClick={() => fetchDashboard()}
                  disabled={loading || refreshing || !startDate || !endDate}
                >
                  <CalendarDays className="mr-2 size-4" />
                  Apply
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Error state */}
      {error && !hasDashboard && (
        <section className="flex flex-col items-center rounded-xl border p-8 text-center">
          <XCircle className="mb-3 size-9 text-muted-foreground" />
          <h2 className="font-semibold">Dashboard couldn't be loaded</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Check your connection and try again.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => fetchDashboard()}
            disabled={loading}
          >
            Try again
          </Button>
        </section>
      )}

      {/* Overview cards */}
    <section className="min-w-0 rounded-xl border bg-background p-3 sm:p-4 lg:p-5">
        <div>
          <h2 className="font-semibold tracking-tight">Store metrics</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Current store totals and selected-period performance.
          </p>
        </div>

       <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 2xl:grid-cols-4">
          <StatCard
            title="Total users"
            value={formatNumber(overview?.totalUsers)}
            description={`${formatNumber(overview?.newUsers)} new in period`}
            icon={Users}
            iconClass="bg-blue-50 text-blue-700"
            loading={loading && !hasDashboard}
            onClick={() => navigate("/account/admin/users")}
          />

          <StatCard
            title="Total products"
            value={formatNumber(overview?.totalProducts)}
            description={`${formatNumber(overview?.activeProducts)} active products`}
            icon={Package}
            iconClass="bg-violet-50 text-violet-700"
            loading={loading && !hasDashboard}
            onClick={() => navigate("/account/admin/products")}
          />

          <StatCard
            title="Total orders"
            value={formatNumber(overview?.totalOrders)}
            description={`${formatNumber(overview?.periodOrders)} in selected period`}
            icon={ShoppingBag}
            iconClass="bg-amber-50 text-amber-700"
            loading={loading && !hasDashboard}
            onClick={() => navigate("/account/admin/orders")}
          />

          <StatCard
            title="Paid revenue"
            value={formatPrice(overview?.paidRevenue)}
            description="For the selected period"
            icon={Wallet}
            iconClass="bg-emerald-50 text-emerald-700"
            loading={loading && !hasDashboard}
            onClick={() => navigate("/account/admin/orders")}
          />
        </div>
      </section>

      {/* Revenue and order trend */}
      <section className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="min-w-0 rounded-xl border bg-background p-4 sm:p-5 xl:col-span-2">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-semibold tracking-tight">Sales overview</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Paid revenue and order volume over time.
              </p>
            </div>

            <Badge variant="outline" className="w-fit">
              {RANGE_OPTIONS.find((item) => item.value === range)?.label}
            </Badge>
          </div>

          <SalesChart data={chartData} loading={loading && !hasDashboard} />

          <div className="mt-5 grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Revenue change</p>
              <div className="mt-2">
                {loading && !hasDashboard ? (
                  <Skeleton className="h-5 w-36" />
                ) : (
                  <Comparison value={comparison?.revenueChangePercent} />
                )}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Order change</p>
              <div className="mt-2">
                {loading && !hasDashboard ? (
                  <Skeleton className="h-5 w-36" />
                ) : (
                  <Comparison value={comparison?.ordersChangePercent} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Order status */}
        <section className="min-w-0 rounded-xl border bg-background">
          <div className="border-b px-4 py-4 sm:px-5">
            <h2 className="font-semibold tracking-tight">Order status</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              All orders across your store.
            </p>
          </div>

          {loading && !hasDashboard ? (
            <div className="space-y-5 p-5">
              {STATUS_ITEMS.map((item) => (
                <div key={item.value} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-5 p-4 sm:p-5">
              <div className="rounded-lg bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">Total orders</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {formatNumber(totalStatusOrders)}
                </p>
              </div>

              {STATUS_ITEMS.map((item) => {
                const count = Number(orderStatus[item.value]) || 0;
                const percentage = totalStatusOrders
                  ? (count / totalStatusOrders) * 100
                  : 0;

                return (
                  <div key={item.value} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm">{item.label}</span>
                      <span className="text-sm font-medium tabular-nums">
                        {formatNumber(count)}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${item.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/account/admin/orders")}
              >
                Manage orders
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          )}
        </section>
      </section>

      {/* Inventory and order summary */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-xl border bg-background p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold tracking-tight">Inventory health</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Products that need attention.
              </p>
            </div>

            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <AlertTriangle className="size-5" />
            </div>
          </div>

          {loading && !hasDashboard ? (
            <div className="mt-5 space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                    <AlertTriangle className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">Low stock</p>
                    <p className="text-xs text-muted-foreground">
                      1–{LOW_STOCK_THRESHOLD} units remaining
                    </p>
                  </div>
                </div>
                <span className="text-lg font-semibold tabular-nums">
                  {formatNumber(overview?.lowStockProducts)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-red-50 text-red-700">
                    <XCircle className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">Out of stock</p>
                    <p className="text-xs text-muted-foreground">
                      No units available
                    </p>
                  </div>
                </div>
                <span className="text-lg font-semibold tabular-nums">
                  {formatNumber(overview?.outOfStockProducts)}
                </span>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/account/admin/products")}
              >
                Review inventory
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-background p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold tracking-tight">Order attention</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Store-wide order counts.
              </p>
            </div>

            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Clock3 className="size-5" />
            </div>
          </div>

          {loading && !hasDashboard ? (
            <div className="mt-5 space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Pending orders</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Awaiting the next step
                  </p>
                </div>
                <span className="text-xl font-semibold tabular-nums">
                  {formatNumber(overview?.pendingOrders)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Cancelled orders</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Across all order records
                  </p>
                </div>
                <span className="text-xl font-semibold tabular-nums">
                  {formatNumber(overview?.cancelledOrders)}
                </span>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/account/admin/orders")}
              >
                Review orders
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-background p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold tracking-tight">Payment summary</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Selected-period payment performance.
              </p>
            </div>

            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <CreditCard className="size-5" />
            </div>
          </div>

          {loading && !hasDashboard ? (
            <div className="mt-5 space-y-3">
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Average paid order value
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {formatPrice(overview?.averageOrderValue)}
                </p>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">
                    Paid revenue
                  </span>
                  <span className="text-sm font-medium tabular-nums">
                    {formatPrice(overview?.paidRevenue)}
                  </span>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  Revenue includes orders whose payment status is paid.
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/account/admin/orders")}
              >
                View transactions
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Recent orders */}
      <section className="min-w-0 overflow-hidden rounded-xl border bg-background">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-4 sm:px-5">
          <div>
            <h2 className="font-semibold tracking-tight">Recent orders</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              The latest five orders received by your store.
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={() => navigate("/account/admin/orders")}
          >
            View all
            <ArrowRight className="ml-1.5 size-4" />
          </Button>
        </div>

        {loading && !hasDashboard ? (
          <div className="space-y-4 p-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="size-10 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 max-w-full" />
                  <Skeleton className="h-3 w-24 max-w-full" />
                </div>
                <Skeleton className="h-5 w-20 shrink-0" />
              </div>
            ))}
          </div>
        ) : error && !hasDashboard ? (
          <div className="flex flex-col items-center px-5 py-12 text-center">
            <XCircle className="mb-3 size-8 text-muted-foreground" />
            <p className="font-medium">Orders couldn't be loaded</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Refresh the dashboard to try again.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => fetchDashboard()}
            >
              Try again
            </Button>
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-muted">
              <ShoppingBag className="size-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No orders yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              New customer orders will appear here when they are placed.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {recentOrders.map((order) => (
              <button
                key={order._id || order.orderNumber}
                type="button"
                onClick={() => navigate("/account/admin/orders")}
                className="flex w-full min-w-0 items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/30 sm:px-5"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
                  <Package className="size-5 text-muted-foreground" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {order.orderNumber}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {order.shippingAddress?.fullName ||
                      order.customer?.email ||
                      "Customer"}{" "}
                    · {formatDate(order.createdAt)}
                  </p>
                </div>

                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-sm font-semibold tabular-nums">
                    {formatPrice(order.total)}
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={order.paymentStatus} />
                  </div>
                </div>

                <div className="shrink-0 sm:hidden">
                  <StatusBadge status={order.orderStatus} />
                </div>

                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminDashboard;
