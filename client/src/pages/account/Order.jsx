import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders } from "@/store/slices/orderSlice";

const getStatusClass = (status) => {
  if (status === "pending") {
    return "text-yellow-600";
  }
  if (status === "delivered") {
    return "text-green-600";
  }

  if (status === "cancelled") {
    return "text-red-600";
  }

  if (status === "shipped") {
    return "text-blue-600";
  }

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
    return <div className="py-10 text-center">Loading orders...</div>;
  }

  if (error && orders.length === 0) {
    return <div className="py-10 text-center text-destructive">{error}</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-xl font-semibold">No orders yet</h2>

        <p className="mt-2 text-muted-foreground">
          Your orders will appear here.
        </p>

        <Link
          to="/products"
          className="mt-5 inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white p-3 rounded-xl">
      <div>
        <h1 className="text-2xl font-semibold">My Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage your orders.
        </p>
      </div>

      <div>
        <ol className="space-y-4">
          {orders.map((order, index) => {
            const itemNames = order.items.map((item) => item.name);
            const maxItems = 3;
            const displayNames =
              itemNames.length > maxItems
                ? itemNames.slice(0, maxItems).join(" , ") + " ..."
                : itemNames.join(" , ");

            return (
              <li key={order.orderNumber}>
                <div className="rounded-lg border p-4 hover:bg-gray-200 bg-gray-100">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">
                        <span>{index + 1}.</span> {displayNames}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={`text-sm font-medium capitalize ${getStatusClass(
                          order.orderStatus,
                        )}`}
                      >
                        {order.orderStatus}
                      </span>

                      {/* <span className="text-sm capitalize">
                        {order.paymentStatus}
                      </span> */}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t pt-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-semibold">₹{order.total.toFixed(2)}</p>
                    </div>

                    <Link
                      to={`/account/orders/${order.orderNumber}`}
                      className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                    >
                      View Order
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};

export default Order;
