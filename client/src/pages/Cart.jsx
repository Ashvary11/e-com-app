import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import Container from "../components/layout/Container";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Separator } from "../components/ui/separator";

import {
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  // clearCart,
} from "../store/slices/cartSlice";

function Cart() {
  const dispatch = useDispatch();

  const cartItems = useSelector((state) => state.cart.items);

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const handleRemove = (id) => {
    dispatch(removeFromCart(id));
    toast.success("Item removed from cart");
  };

  // const handleClearCart = () => {
  //   dispatch(clearCart());
  //   toast.success("Cart cleared");
  // };

  return (
    <Container>
      <section className="py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Shopping Cart</h1>

          {cartItems.length > 0 && (
            <p className="mt-2 text-muted-foreground">
              {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in
              your cart
            </p>
          )}
        </div>

        {cartItems.length === 0 ? (
          <Card className="flex min-h-[350px] flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />

            <h2 className="mt-4 text-xl font-semibold">Your cart is empty</h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Add some products to your cart and they will appear here.
            </p>

            <Button asChild className="mt-6">
              <Link to="/products">Continue Shopping</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Cart Items */}
            <div className="space-y-4">
              {cartItems.map((item) => (
                <Card key={item._id} className="p-4 sm:p-6">
                  <div className="flex gap-4">
                    {/* Image */}
                    <Link
                      to={`/products/${item.slug}`}
                      className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-32 sm:w-32"
                    >
                      <img
                        src={item.images?.[0]}
                        alt={item.name}
                        className="h-full w-full object-contain p-2"
                      />
                    </Link>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link
                            to={`/products/${item.slug}`}
                            className="font-semibold hover:underline"
                          >
                            {item.name}
                          </Link>

                          <p className="mt-1 text-sm text-muted-foreground">
                            ₹{item.price.toLocaleString("en-IN")}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(item._id)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        {/* Quantity */}
                        <div className="flex items-center rounded-md border">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => dispatch(decreaseQuantity(item._id))}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>

                          <span className="w-10 text-center text-sm font-medium">
                            {item.quantity}
                          </span>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => dispatch(increaseQuantity(item._id))}
                            disabled={item.quantity >= item.stock}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Item Total */}
                        <span className="font-semibold">
                          ₹
                          {(item.price * item.quantity).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {/* <Button variant="outline" onClick={handleClearCart}>
                Clear Cart
              </Button> */}
            </div>

            {/* Summary */}
            <Card className="h-fit p-6">
              <h2 className="text-xl font-semibold">Order Summary</h2>

              <div className="mt-6 space-y-4">
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

                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>

                <Button className="w-full" size="lg">
                  Checkout
                </Button>

                <Button variant="outline" className="w-full" asChild>
                  <Link to="/products">Continue Shopping</Link>
                </Button>
              </div>
            </Card>
          </div>
        )}
      </section>
    </Container>
  );
}

export default Cart;
