import { Link } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter } from "../ui/card";
import { addToCart } from "../../store/slices/cartSlice";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { syncAuthenticatedCart } from "@/lib/syncAuthenticatedCart";

function ProductCard({ product }) {
  const {
    _id,
    name,
    slug,
    brand,
    category,
    images = [],
    price,
    originalPrice,
    rating = 0,
    reviewCount = 0,
    stock = 0,
  } = product;
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const discount =
    originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  const image = images?.[0] || "/placeholder-product.png";
  const handleAddToCart = () => {
    dispatch(
      addToCart({
        ...product,
        quantity: 1,
      }),
    );
    if (isAuthenticated) {
      syncAuthenticatedCart();
    }
    toast.success("Product added to cart");
  };
  const isOutOfStock = product?.stock <= 0;
  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
      {/* Image */}
      {/* <Link to={`/products/${_id}`} className="block"> */}
      <Link to={`/products/${slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {discount > 0 && (
            <Badge className="absolute left-3 top-3">-{discount}%</Badge>
          )}

          {stock <= 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Badge variant="secondary">Out of stock</Badge>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="space-y-2 p-4">
        {/* Brand / Category */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {brand && <span>{brand}</span>}
          {brand && category && <span>•</span>}
          {category && <span>{category}</span>}
        </div>

        {/* Name */}
        <Link to={`/products/${slug || _id}`} className="block">
          <h3 className="line-clamp-2 min-h-10 font-medium transition-colors hover:text-primary">
            {name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 text-sm">
          <Star className="h-4 w-4 fill-current" />
          <span className="font-medium">{Number(rating).toFixed(1)}</span>
          <span className="text-muted-foreground">({reviewCount})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">
            ₹{Number(price).toLocaleString("en-IN")}
          </span>

          {originalPrice > price && (
            <span className="text-sm text-muted-foreground line-through">
              ₹{Number(originalPrice).toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {/* Stock */}
        {stock > 0 && stock <= 5 && (
          <p className="text-xs text-muted-foreground">Only {stock} left</p>
        )}
      </CardContent>

      <CardFooter className="grid gap-2 p-4 pt-0">
        <Button
          size="lg"
          variant="outline"
          className="w-full"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>

        <Button asChild size="lg" className="w-full">
          <Link to={`/products/${slug || _id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ProductCard;
