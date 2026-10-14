import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders } from "@/store/slices/orderSlice";

const getStatusClass = (status) => {
  if (status === "pending") return "text-yellow-600";
  if (status === "delivered") return "text-green-600";
  if (status === "cancelled") return "text-red-600";
  if (status === "shipped") return "text-blue-600";

  return "text-orange-600";
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const Order = () => {
  const dispatch = useDispatch();

  const { orders, loading, error } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  if (loading && orders.length === 0) {
    return (
      <div className="rounded-xl border bg-background px-4 py-12 text-center text-sm text-muted-foreground">
        Loading orders...
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="rounded-xl border bg-background px-4 py-12 text-center text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border bg-background px-4 py-12 text-center sm:py-16">
        <h2 className="text-lg font-semibold sm:text-xl">No orders yet</h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Your orders will appear here.
        </p>

        <Link
          to="/products"
          className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-5 rounded-xl border bg-background p-3 sm:space-y-6 sm:p-5 lg:p-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          My Orders
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage your orders.
        </p>
      </div>

      {/* Order list */}
      <ol className="space-y-3 sm:space-y-4">
        {orders.map((order, index) => {
          const itemNames = order.items.map((item) => item.name);
          const maxItems = 3;

          const displayNames =
            itemNames.length > maxItems
              ? `${itemNames.slice(0, maxItems).join(", ")} ...`
              : itemNames.join(", ");

          return (
            <li key={order.orderNumber} className="min-w-0">
              <article className="min-w-0 rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/60 sm:p-4">
                {/* Product names and order status */}
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium leading-6 sm:text-base">
                      <span className="mr-1 text-muted-foreground">
                        {index + 1}.
                      </span>
                      {displayNames}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`w-fit shrink-0 rounded-full bg-background px-2.5 py-1 text-xs font-medium capitalize sm:text-sm ${getStatusClass(
                      order.orderStatus,
                    )}`}
                  >
                    {order.orderStatus}
                  </span>
                </div>

                {/* Total and action */}
                <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3 sm:mt-5 sm:pt-4">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      Total
                    </p>
                    <p className="mt-0.5 break-words text-base font-semibold sm:text-lg">
                      ₹{order.total.toFixed(2)}
                    </p>
                  </div>

                  <Link
                    to={`/account/orders/${order.orderNumber}`}
                    className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-md border bg-background px-3 py-2 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4 sm:text-sm"
                  >
                    View Order
                  </Link>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default Order;
