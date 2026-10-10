import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { cancelOrderByNumber, fetchOrder } from "@/store/slices/orderSlice";
import Container from "@/components/layout/Container";

const formatDate = (date) => {
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const OrderDetails = () => {
  const { orderNumber } = useParams();
  const dispatch = useDispatch();

  const { currentOrder, loading, error } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrder(orderNumber));
  }, [dispatch, orderNumber]);

  const handleCancel = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?",
    );

    if (!confirmed) {
      return;
    }

    const result = await dispatch(
      cancelOrderByNumber({
        orderNumber,
        reason: "Cancelled by customer",
      }),
    );

    if (cancelOrderByNumber.fulfilled.match(result)) {
      toast.success("Order cancelled successfully");
    } else {
      toast.error(result.payload || "Failed to cancel order");
    }
  };

  if (loading && !currentOrder) {
    return <div className="py-10 text-center">Loading order...</div>;
  }

  if (error && !currentOrder) {
    return <div className="py-10 text-center text-destructive">{error}</div>;
  }

  if (!currentOrder) {
    return <div className="py-10 text-center">Order not found.</div>;
  }

  const canCancel =
    ["pending", "confirmed"].includes(currentOrder.orderStatus) &&
    !(
      currentOrder.paymentMethod === "razorpay" &&
      currentOrder.paymentStatus === "paid"
    );

  return (
    <Container>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/account/orders"
              className="text-sm text-muted-foreground hover:underline"
            >
              ← Back to Orders
            </Link>

            <h1 className="mt-2 text-2xl font-semibold">
              Order {currentOrder.orderNumber}
            </h1>

            <p className="text-sm text-muted-foreground">
              Placed on {formatDate(currentOrder.createdAt)}
            </p>
          </div>

          {canCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              Cancel Order
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Order Status</p>

            <p className="mt-1 font-medium capitalize">
              {currentOrder.orderStatus}
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Payment Status</p>

            <p className="mt-1 font-medium capitalize">
              {currentOrder.paymentStatus}
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Payment Method</p>

            <p className="mt-1 font-medium uppercase">
              {currentOrder.paymentMethod}
            </p>
          </div>
        </div>

        <div className="rounded-lg border">
          <div className="border-b p-4">
            <h2 className="font-semibold">Items</h2>
          </div>

          <div className="divide-y">
            {currentOrder.items.map((item) => (
              <div
                key={`${item.productId}-${item.sku}`}
                className="flex gap-4 p-4"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-20 w-20 rounded-md object-cover"
                />

                <div className="min-w-0 flex-1">
                  <h3 className="font-medium">{item.name}</h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    SKU: {item.sku}
                  </p>

                  <p className="mt-1 text-sm">
                    ₹{item.price.toFixed(2)} × {item.quantity}
                  </p>
                </div>

                <p className="font-medium">₹{item.total.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold">Shipping Address</h2>

            <div className="mt-3 space-y-1 text-sm">
              <p>{currentOrder.shippingAddress.fullName}</p>

              <p>{currentOrder.shippingAddress.phone}</p>

              <p>{currentOrder.shippingAddress.addressLine}</p>

              <p>
                {currentOrder.shippingAddress.city},{" "}
                {currentOrder.shippingAddress.state}
              </p>

              <p>
                {currentOrder.shippingAddress.postalCode},{" "}
                {currentOrder.shippingAddress.country}
              </p>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h2 className="font-semibold">Order Summary</h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{currentOrder.subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span>Shipping</span>
                <span>₹{currentOrder.shipping.toFixed(2)}</span>
              </div>

              <div className="flex justify-between border-t pt-3 text-base font-semibold">
                <span>Total</span>
                <span>₹{currentOrder.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {currentOrder.orderStatus === "cancelled" && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="font-medium text-destructive">Order cancelled</p>

            {currentOrder.cancellationReason && (
              <p className="mt-1 text-sm text-muted-foreground">
                Reason: {currentOrder.cancellationReason}
              </p>
            )}

            {currentOrder.cancelledAt && (
              <p className="mt-1 text-sm text-muted-foreground">
                Cancelled on {formatDate(currentOrder.cancelledAt)}
              </p>
            )}
          </div>
        )}
      </div>
    </Container>
  );
};

export default OrderDetails;
