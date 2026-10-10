import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

import Container from "../components/layout/Container";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Separator } from "../components/ui/separator";
import api from "../services/api";
import { checkoutSchema } from "../validators/checkoutValidators.js";
import { clearCart } from "@/store/slices/cartSlice";

const initialForm = {
  email: "",
  fullName: "",
  phone: "",
  addressLine: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

const CHECKOUT_IDEMPOTENCY_KEY = "cartsphere_checkout_attempt";

function FieldError({ message }) {
  if (!message) return null;

  return <p className="mt-1.5 text-sm text-destructive">{message}</p>;
}

const getCartSignature = (items) =>
  JSON.stringify(
    items
      .map((item) => ({
        productId: item._id,
        quantity: item.quantity,
      }))
      .sort((a, b) => a.productId.localeCompare(b.productId)),
  );

const getCheckoutIdempotencyKey = (cartItems) => {
  const cartSignature = getCartSignature(cartItems);
  const saved = sessionStorage.getItem(CHECKOUT_IDEMPOTENCY_KEY);

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.cartSignature === cartSignature && parsed.key) {
        return parsed.key;
      }
    } catch {
      sessionStorage.removeItem(CHECKOUT_IDEMPOTENCY_KEY);
    }
  }

  const key = crypto.randomUUID();

  sessionStorage.setItem(
    CHECKOUT_IDEMPOTENCY_KEY,
    JSON.stringify({
      key,
      cartSignature,
    }),
  );

  return key;
};

function Checkout() {
  const navigate = useNavigate();

  const cartItems = useSelector((state) => state.cart.items);
  const user = useSelector((state) => state.auth.user);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const shipping = 0;
  const total = subtotal + shipping;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((previous) => ({
        ...previous,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const result = checkoutSchema.safeParse(form);

    if (result.success) {
      setErrors({});
      return result.data;
    }

    const fieldErrors = {};

    result.error.issues.forEach((issue) => {
      const fieldName = issue.path[0];

      if (fieldName && !fieldErrors[fieldName]) {
        fieldErrors[fieldName] = issue.message;
      }
    });

    setErrors(fieldErrors);

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      navigate("/cart");
      return;
    }

    const validatedForm = validateForm();

    if (!validatedForm) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    if (!user) {
      toast.error("Please login to continue");
      return;
    }

    try {
      setLoading(true);

      // Same cart + retry = same idempotency key.
      const idempotencyKey = getCheckoutIdempotencyKey(cartItems);
      // 1. Create our CartSphere order.
      const orderResponse = await api.post("/orders", {
        email: validatedForm.email,
        idempotencyKey,
        items: cartItems.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
        })),

        shippingAddress: {
          fullName: validatedForm.fullName,
          phone: validatedForm.phone,
          addressLine: validatedForm.addressLine,
          city: validatedForm.city,
          state: validatedForm.state,
          postalCode: validatedForm.postalCode,
          country: validatedForm.country,
        },
      });

      const order = orderResponse.data.order;
      // 2. Create the Razorpay order.
      const paymentResponse = await api.post(`/payments/${order.orderNumber}`);
      const payment = paymentResponse.data;

      // 3.Razorpay Checkout is available.
      if (!window.Razorpay) {
        toast.error("Payment gateway failed to load");
        return;
      }

      // 4. Open Razorpay Checkout.
      const options = {
        key: payment.keyId,
        amount: payment.amount,
        currency: payment.currency,
        name: "CartSphere",
        description: `Order ${payment.orderNumber}`,
        order_id: payment.razorpayOrderId,
        prefill: {
          name: validatedForm.fullName,
          email: validatedForm.email,
          contact: validatedForm.phone,
        },
        theme: {
          color: "#000000",
        },

        handler: async (response) => {
          try {
            setLoading(true);

            // 5. Verify the payment on our backend.
            const verifyResponse = await api.post("/payments/verify", {
              orderNumber: payment.orderNumber,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyResponse.data.success) {
              // Payment is confirmed, so this checkout attempt is complete.
              dispatch(clearCart());
              localStorage.removeItem("cartsphere-cart");
              sessionStorage.removeItem(CHECKOUT_IDEMPOTENCY_KEY);

              toast.success("Payment successful");

              // Payment is confirmed, so now clear the cart.
              // We'll add the actual Redux clearCart dispatch next.
              navigate(`/account/orders/${payment.orderNumber}`);
            }
          } catch (error) {
            const message =
              error.response?.data?.message || "Payment verification failed";
            toast.error(message);
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.info("Payment cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        console.error("Razorpay payment failed:", response.error);
        toast.error(
          response.error?.description || "Payment failed. Please try again.",
        );

        setLoading(false);
      });

      razorpay.open();
    } catch (error) {
      const data = error.response?.data;

      // Map backend Zod field errors to matching inputs.
      if (data?.errors) {
        const backendErrors = {};

        Object.entries(data.errors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            backendErrors[field] = messages[0];
          }
        });

        setErrors((previous) => ({
          ...previous,
          ...backendErrors,
        }));

        const firstError = Object.values(backendErrors)[0];

        toast.error(firstError || data.message || "Invalid order details");

        return;
      }

      toast.error(data?.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <Container>
        <section className="py-12">
          <Card className="mx-auto max-w-lg p-8 text-center">
            <h1 className="text-2xl font-bold">Your cart is empty</h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Add products before proceeding to checkout.
            </p>

            <Button asChild className="mt-6">
              <Link to="/products">Continue Shopping</Link>
            </Button>
          </Card>
        </section>
      </Container>
    );
  }

  return (
    <Container>
      <section className="py-8 sm:py-12">
        <div className="mb-8">
          <div className="mb-4 flex items-center">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
              aria-label="Back to cart"
            >
              <Link to="/cart">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Checkout
          </h1>

          <p className="mt-2 max-w-xl text-muted-foreground">
            Enter your delivery details to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Customer + Address */}
            <div className="space-y-6">
              <Card className="p-6">
                <div>
                  <h2 className="text-xl font-semibold">
                    Customer Information
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    We'll use these details for your order.
                  </p>
                </div>

                <div className="mt-6 space-y-5">
                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium"
                    >
                      Email
                    </label>

                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      aria-invalid={Boolean(errors.email)}
                      className={
                        errors.email
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                    />

                    <FieldError message={errors.email} />
                  </div>

                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="fullName"
                      className="mb-2 block text-sm font-medium"
                    >
                      Full Name
                    </label>

                    <Input
                      id="fullName"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="Your full name"
                      aria-invalid={Boolean(errors.fullName)}
                      className={
                        errors.fullName
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                    />

                    <FieldError message={errors.fullName} />
                  </div>

                  {/* Phone */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-sm font-medium"
                    >
                      Phone
                    </label>

                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      aria-invalid={Boolean(errors.phone)}
                      className={
                        errors.phone
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                    />

                    <FieldError message={errors.phone} />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div>
                  <h2 className="text-xl font-semibold">Shipping Address</h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Where should we deliver your order?
                  </p>
                </div>

                <div className="mt-6 space-y-5">
                  {/* Address */}
                  <div>
                    <label
                      htmlFor="addressLine"
                      className="mb-2 block text-sm font-medium"
                    >
                      Address
                    </label>

                    <Input
                      id="addressLine"
                      name="addressLine"
                      value={form.addressLine}
                      onChange={handleChange}
                      placeholder="House no., street, area"
                      aria-invalid={Boolean(errors.addressLine)}
                      className={
                        errors.addressLine
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                    />

                    <FieldError message={errors.addressLine} />
                  </div>

                  {/* City + State */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="city"
                        className="mb-2 block text-sm font-medium"
                      >
                        City
                      </label>

                      <Input
                        id="city"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        placeholder="City"
                        aria-invalid={Boolean(errors.city)}
                        className={
                          errors.city
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                      />

                      <FieldError message={errors.city} />
                    </div>

                    <div>
                      <label
                        htmlFor="state"
                        className="mb-2 block text-sm font-medium"
                      >
                        State
                      </label>

                      <Input
                        id="state"
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        placeholder="State"
                        aria-invalid={Boolean(errors.state)}
                        className={
                          errors.state
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                      />

                      <FieldError message={errors.state} />
                    </div>
                  </div>

                  {/* Postal + Country */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="postalCode"
                        className="mb-2 block text-sm font-medium"
                      >
                        Postal Code
                      </label>

                      <Input
                        id="postalCode"
                        name="postalCode"
                        inputMode="numeric"
                        maxLength={6}
                        value={form.postalCode}
                        onChange={handleChange}
                        placeholder="6-digit postal code"
                        aria-invalid={Boolean(errors.postalCode)}
                        className={
                          errors.postalCode
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                      />

                      <FieldError message={errors.postalCode} />
                    </div>

                    <div>
                      <label
                        htmlFor="country"
                        className="mb-2 block text-sm font-medium"
                      >
                        Country
                      </label>

                      <Input
                        id="country"
                        name="country"
                        value={form.country}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.country)}
                        className={
                          errors.country
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                      />

                      <FieldError message={errors.country} />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Order Summary */}
            <Card className="h-fit p-6 lg:sticky lg:top-24">
              <h2 className="text-xl font-semibold">Order Summary</h2>

              <div className="mt-6 space-y-4">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                      <img
                        src={item.images?.[0]}
                        alt={item.name}
                        className="h-full w-full object-contain p-1"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium">
                        {item.name}
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                    </div>

                    <span className="whitespace-nowrap text-sm font-medium">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>

                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>

                  <span className="font-medium text-green-600">Free</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>

                  <span>₹{total.toLocaleString("en-IN")}</span>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Proceed to Payment
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  You'll review your payment securely in the next step.
                </p>
              </div>
            </Card>
          </div>
        </form>
      </section>
    </Container>
  );
}

export default Checkout;
