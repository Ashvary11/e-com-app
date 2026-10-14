import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { cancelOrderByNumber, fetchOrder } from "@/store/slices/orderSlice";
import Container from "@/components/layout/Container";
import ScrollToTop from "@/components/ui/scrollToTop";

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
    return (
      <Container>
        <div className="py-10 text-center text-sm text-muted-foreground">
          Loading order...
        </div>
      </Container>
    );
  }

  if (error && !currentOrder) {
    return (
      <Container>
        <div className="py-10 text-center text-sm text-destructive">
          {error}
        </div>
      </Container>
    );
  }

  if (!currentOrder) {
    return (
      <Container>
        <div className="py-10 text-center">Order not found.</div>
      </Container>
    );
  }

  const canCancel =
    ["pending", "confirmed"].includes(currentOrder.orderStatus) &&
    !(
      currentOrder.paymentMethod === "razorpay" &&
      currentOrder.paymentStatus === "paid"
    );

  return (
    <div className="min-w-0 space-y-5 rounded-xl border bg-background p-3 sm:space-y-6 sm:p-5 lg:p-6">
      <ScrollToTop top={120} />
      {/* Order heading and actions */}
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <Link
            to="/account/orders"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            ← Back to Orders
          </Link>

          <h1 className="mt-2 break-words text-xl font-semibold tracking-tight sm:text-2xl">
            Order {currentOrder.orderNumber}
          </h1>

          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Placed on {formatDate(currentOrder.createdAt)}
          </p>
        </div>

        {canCancel && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="inline-flex min-h-10 w-full shrink-0 items-center justify-center rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-50 sm:w-fit"
          >
            Cancel Order
          </button>
        )}
      </div>

      {/* Order and payment status */}
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
        <div className="min-w-0 rounded-lg border p-3 sm:p-4">
          <p className="text-sm text-muted-foreground">Order Status</p>
          <p className="mt-1 break-words font-medium capitalize">
            {currentOrder.orderStatus}
          </p>
        </div>

        <div className="min-w-0 rounded-lg border p-3 sm:p-4">
          <p className="text-sm text-muted-foreground">Payment Status</p>
          <p className="mt-1 break-words font-medium capitalize">
            {currentOrder.paymentStatus}
          </p>
        </div>

        <div className="min-w-0 rounded-lg border p-3 sm:col-span-2 sm:p-4 lg:col-span-1">
          <p className="text-sm text-muted-foreground">Payment Method</p>
          <p className="mt-1 break-words font-medium uppercase">
            {currentOrder.paymentMethod}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="min-w-0 overflow-hidden rounded-lg border">
        <div className="border-b p-3 sm:p-4">
          <h2 className="font-semibold">Items</h2>
        </div>

        <div className="divide-y">
          {currentOrder.items.map((item) => (
            <div
              key={`${item.productId}-${item.sku}`}
              className="flex min-w-0 items-start gap-3 p-3 sm:gap-4 sm:p-4"
            >
              <img
                src={item.image}
                alt={item.name}
                className="size-16 shrink-0 rounded-md border object-cover sm:size-20"
              />

              <div className="min-w-0 flex-1">
                <h3 className="break-words text-sm font-medium sm:text-base">
                  {item.name}
                </h3>

                <p className="mt-1 break-all text-xs text-muted-foreground sm:text-sm">
                  SKU: {item.sku}
                </p>

                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  ₹{item.price.toFixed(2)} × {item.quantity}
                </p>
              </div>

              <p className="shrink-0 break-words text-right text-sm font-semibold sm:text-base">
                ₹{item.total.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping and summary */}
      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
        <div className="min-w-0 rounded-lg border p-3 sm:p-4">
          <h2 className="font-semibold">Shipping Address</h2>

          <div className="mt-3 space-y-1 break-words text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              {currentOrder.shippingAddress.fullName}
            </p>

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

        <div className="min-w-0 rounded-lg border p-3 sm:p-4">
          <h2 className="font-semibold">Order Summary</h2>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-right">
                ₹{currentOrder.subtotal.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-right">
                ₹{currentOrder.shipping.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 border-t pt-3 text-base font-semibold">
              <span>Total</span>
              <span className="text-right">
                ₹{currentOrder.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation details */}
      {currentOrder.orderStatus === "cancelled" && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 sm:p-4">
          <p className="font-medium text-destructive">Order cancelled</p>

          {currentOrder.cancellationReason && (
            <p className="mt-1 break-words text-sm text-muted-foreground">
              Reason: {currentOrder.cancellationReason}
            </p>
          )}

          {currentOrder.cancelledAt && (
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Cancelled on {formatDate(currentOrder.cancelledAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
