import { useCallback, useEffect, useState } from "react";

import {
  RefreshCw,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Package,
  ShoppingBag,
  CreditCard,
  CalendarDays,
  X,
  LoaderCircle,
} from "lucide-react";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import { Separator } from "../../../components/ui/separator";
import { toast } from "sonner";
import api from "@/services/api";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatStatus = (status = "") =>
  status.charAt(0).toUpperCase() + status.slice(1);

function OrderStatusBadge({ status }) {
  const styles = {
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

  return (
    <Badge
      variant="outline"
      className={`whitespace-nowrap font-medium ${
        styles[status] || "border-border bg-muted text-muted-foreground"
      }`}
    >
      {formatStatus(status)}
    </Badge>
  );
}

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [nextStatus, setNextStatus] = useState("");

  const fetchOrders = useCallback(
    async ({ refresh = false } = {}) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
        };

        if (search.trim()) params.search = search.trim();
        if (orderStatus !== "all") params.orderStatus = orderStatus;
        if (paymentStatus !== "all") params.paymentStatus = paymentStatus;
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;

        const response = await api.get("/admin/orders", { params });
        const result = response.data;

        if (!result.success) {
          throw new Error(result.message || "Failed to fetch orders");
        }

        setOrders(result.data || []);
        setPagination((current) => ({
          ...current,
          ...(result.pagination || {}),
        }));
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to load orders.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      pagination.page,
      pagination.limit,
      search,
      orderStatus,
      paymentStatus,
      dateFrom,
      dateTo,
    ],
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Debounce search input and reset pagination when filters change.
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((current) => ({ ...current, page: 1 }));
      setSearch(searchInput);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const changeFilter = (setter, value) => {
    setter(value);
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const openOrderDetails = async (orderNumber) => {
    setDetailsLoading(true);
    setSelectedOrder(null);
    setNextStatus("");

    try {
      const response = await api.get(
        `/admin/orders/${encodeURIComponent(orderNumber)}`,
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Unable to load order");
      }

      const order = response.data.data;
      setSelectedOrder(order);
      setNextStatus(order.orderStatus);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to load order details.",
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder || !nextStatus) return;

    if (nextStatus === selectedOrder.orderStatus) {
      toast.info("Choose a different order status.");
      return;
    }

    setUpdatingStatus(true);

    try {
      const response = await api.patch(
        `/admin/orders/${encodeURIComponent(selectedOrder.orderNumber)}/status`,
        { orderStatus: nextStatus },
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Unable to update status");
      }

      toast.success("Order status updated.");

      // Refresh the selected order so its details stay in sync.
      await openOrderDetails(selectedOrder.orderNumber);
      await fetchOrders({ refresh: true });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to update order status.",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const totalItems = (items = []) =>
    items.reduce((total, item) => total + (item.quantity || 0), 0);

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setOrderStatus("all");
    setPaymentStatus("all");
    setDateFrom("");
    setDateTo("");
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const hasFilters =
    searchInput ||
    orderStatus !== "all" ||
    paymentStatus !== "all" ||
    dateFrom ||
    dateTo;

  return (
    <div className="min-w-0 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Orders
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage customer orders, payments, and fulfillment.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => fetchOrders({ refresh: true })}
          disabled={loading || refreshing}
          className="w-full sm:w-auto"
        >
          <RefreshCw
            className={`mr-2 size-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-background p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total orders</p>
            <ShoppingBag className="size-5 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {pagination.total}
          </p>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Current page</p>
            <Package className="size-5 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {pagination.totalPages
              ? `${pagination.page} / ${pagination.totalPages}`
              : "0"}
          </p>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Showing</p>
            <CreditCard className="size-5 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {orders.length}
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="space-y-3 rounded-xl border bg-background p-3 sm:p-4">
        <div className="relative min-w-0">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search order number, customer name, email or phone..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Order status</label>
            <Select
              value={orderStatus}
              onValueChange={(value) => changeFilter(setOrderStatus, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Order status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All order statuses</SelectItem>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {formatStatus(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Payment status</label>
            <Select
              value={paymentStatus}
              onValueChange={(value) => changeFilter(setPaymentStatus, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All payment statuses</SelectItem>
                {PAYMENT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {formatStatus(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">From date</label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                aria-label="From date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) =>
                  changeFilter(setDateFrom, event.target.value)
                }
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">To date</label>
            <Input
              type="date"
              aria-label="To date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => changeFilter(setDateTo, event.target.value)}
            />
          </div>
        </div>

        {hasFilters && (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-2 size-4" />
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Orders table */}
      <div className="overflow-hidden rounded-xl border bg-background">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-medium">All orders</h2>
          <span className="text-xs text-muted-foreground">
            {pagination.total} total
          </span>
        </div>

        <div className="w-full overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 8 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-4">
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center">
                    <Package className="mx-auto mb-3 size-8 text-muted-foreground" />
                    <p className="font-medium">No orders found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Try changing your search or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order._id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-4">
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {order.paymentMethod?.toUpperCase() || "—"}
                      </p>
                    </td>

                    <td className="max-w-[220px] px-4 py-4">
                      <p className="truncate font-medium">
                        {order.shippingAddress?.fullName ||
                          order.customer?.name ||
                          "Customer"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {order.customer?.email || "—"}
                      </p>
                    </td>

                    <td className="px-4 py-4 tabular-nums">
                      {totalItems(order.items)}
                    </td>

                    <td className="px-4 py-4 font-medium tabular-nums">
                      {formatPrice(order.total)}
                    </td>

                    <td className="px-4 py-4">
                      <OrderStatusBadge status={order.paymentStatus} />
                    </td>

                    <td className="px-4 py-4">
                      <OrderStatusBadge status={order.orderStatus} />
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openOrderDetails(order.orderNumber)}
                        aria-label={`View order ${order.orderNumber}`}
                      >
                        <Eye className="mr-2 size-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <p className="text-sm text-muted-foreground">
            {pagination.total === 0
              ? "No orders"
              : `Showing ${
                  (pagination.page - 1) * pagination.limit + 1
                }–${Math.min(
                  pagination.page * pagination.limit,
                  pagination.total,
                )} of ${pagination.total}`}
          </p>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevPage || loading}
              onClick={() =>
                setPagination((current) => ({
                  ...current,
                  page: current.page - 1,
                }))
              }
            >
              <ChevronLeft className="mr-1 size-4" />
              Previous
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage || loading}
              onClick={() =>
                setPagination((current) => ({
                  ...current,
                  page: current.page + 1,
                }))
              }
            >
              Next
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Order details dialog */}
      <Dialog
        open={Boolean(selectedOrder) || detailsLoading}
        onOpenChange={(open) => {
          if (!open && !updatingStatus) {
            setSelectedOrder(null);
          }
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] overflow-y-auto rounded-xl p-4 sm:max-h-[90dvh] sm:w-full sm:max-w-2xl sm:p-6">
          {detailsLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <LoaderCircle className="size-7 animate-spin text-muted-foreground" />
              <span className="ml-3 text-sm text-muted-foreground">
                Loading order details...
              </span>
            </div>
          ) : selectedOrder ? (
            <>
              <DialogHeader>
                <DialogTitle className="break-all">
                  Order {selectedOrder.orderNumber}
                </DialogTitle>
                <DialogDescription>
                  Placed on {formatDate(selectedOrder.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                {/* Statuses */}
                <div className="flex flex-wrap gap-2">
                  <OrderStatusBadge status={selectedOrder.orderStatus} />
                  <OrderStatusBadge status={selectedOrder.paymentStatus} />
                </div>

                {/* Customer */}
                <section className="space-y-2">
                  <h3 className="font-semibold">Customer</h3>
                  <div className="rounded-lg border p-3 text-sm">
                    <p className="font-medium">
                      {selectedOrder.shippingAddress?.fullName ||
                        selectedOrder.customer?.name ||
                        "Customer"}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {selectedOrder.customer?.email || "—"}
                    </p>
                    {selectedOrder.shippingAddress?.phone && (
                      <p className="mt-1 text-muted-foreground">
                        {selectedOrder.shippingAddress.phone}
                      </p>
                    )}
                  </div>
                </section>

                {/* Shipping */}
                <section className="space-y-2">
                  <h3 className="font-semibold">Shipping address</h3>
                  <div className="rounded-lg border p-3 text-sm leading-6">
                    {selectedOrder.shippingAddress ? (
                      <>
                        <p>{selectedOrder.shippingAddress.addressLine}</p>
                        <p>
                          {[
                            selectedOrder.shippingAddress.city,
                            selectedOrder.shippingAddress.state,
                            selectedOrder.shippingAddress.postalCode,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        <p>{selectedOrder.shippingAddress.country}</p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">
                        No shipping address available.
                      </p>
                    )}
                  </div>
                </section>

                {/* Items */}
                <section className="space-y-3">
                  <h3 className="font-semibold">
                    Items ({totalItems(selectedOrder.items)})
                  </h3>

                  <div className="divide-y rounded-lg border">
                    {(selectedOrder.items || []).map((item, index) => (
                      <div
                        key={item.productId || item._id || index}
                        className="flex items-center gap-3 p-3"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="size-14 shrink-0 rounded-md border object-contain"
                          />
                        ) : (
                          <div className="flex size-14 shrink-0 items-center justify-center rounded-md border bg-muted">
                            <Package className="size-5 text-muted-foreground" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-medium">
                            {item.name}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Qty: {item.quantity}
                          </p>
                        </div>

                        <p className="shrink-0 text-sm font-medium tabular-nums">
                          {formatPrice(
                            item.total ?? item.price * item.quantity,
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Totals */}
                <section className="space-y-2">
                  <h3 className="font-semibold">Payment summary</h3>
                  <div className="space-y-2 rounded-lg border p-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{formatPrice(selectedOrder.shipping)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between gap-4 font-semibold">
                      <span>Total</span>
                      <span>{formatPrice(selectedOrder.total)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">
                        Payment method
                      </span>
                      <span>
                        {selectedOrder.paymentMethod?.toUpperCase() || "—"}
                      </span>
                    </div>

                    {selectedOrder.payment && (
                      <>
                        <Separator />
                        <p className="font-medium">Gateway details</p>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">
                            Gateway status
                          </span>
                          <OrderStatusBadge
                            status={selectedOrder.payment.status}
                          />
                        </div>
                        {selectedOrder.payment.razorpayPaymentId && (
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">
                              Payment ID
                            </span>
                            <span className="max-w-[60%] break-all text-right">
                              {selectedOrder.payment.razorpayPaymentId}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </section>

                {/* Update status */}
                <section className="space-y-3 rounded-lg border p-3">
                  <div>
                    <h3 className="font-semibold">Update order status</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Only valid status transitions are accepted by the server.
                      Paid orders are required for fulfillment.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Select
                      value={nextStatus}
                      onValueChange={setNextStatus}
                      disabled={updatingStatus}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Choose status" />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {formatStatus(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={updateOrderStatus}
                      disabled={
                        updatingStatus ||
                        !nextStatus ||
                        nextStatus === selectedOrder.orderStatus
                      }
                    >
                      {updatingStatus && (
                        <LoaderCircle className="mr-2 size-4 animate-spin" />
                      )}
                      Save status
                    </Button>
                  </div>

                  {selectedOrder.paymentStatus !== "paid" &&
                    nextStatus !== "cancelled" &&
                    nextStatus !== selectedOrder.orderStatus && (
                      <p className="text-xs text-amber-700">
                        This order has not been paid. The server may reject
                        fulfillment status changes.
                      </p>
                    )}
                </section>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminOrders;
