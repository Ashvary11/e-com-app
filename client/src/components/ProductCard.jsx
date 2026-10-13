import { Link } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import { addToCart, scheduleDbCartUpdate } from "./../store/slices/cartSlice";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

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
  const isOutOfStock = stock <= 0;
  const productUrl = `/products/${slug || _id}`;

  const handleAddToCart = () => {
    dispatch(addToCart({ ...product, quantity: 1 }));

    if (isAuthenticated) {
      dispatch(scheduleDbCartUpdate());
    }

    toast.success("Product added to cart");
  };

  return (
    <Card className="group h-full overflow-hidden rounded-xl border bg-card transition-shadow duration-200 hover:shadow-md">
      <Link to={productUrl} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {discount > 0 && (
            <Badge className="absolute left-2 top-2 text-[10px]">
              -{discount}%
            </Badge>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Badge variant="secondary">Out of stock</Badge>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="space-y-1.5 p-3">
        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden text-[11px] text-muted-foreground">
          {brand && <span className="truncate">{brand}</span>}

          {brand && category && <span>·</span>}

          {category && <span className="truncate">{category}</span>}
        </div>

        <Link to={productUrl} className="block">
          <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-5 transition-colors hover:text-primary">
            {name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 text-xs">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="font-medium">{Number(rating).toFixed(1)}</span>
          <span className="text-muted-foreground">({reviewCount})</span>
        </div>

        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-base font-bold">
            ₹{Number(price).toLocaleString("en-IN")}
          </span>

          {originalPrice > price && (
            <span className="text-xs text-muted-foreground line-through">
              ₹{Number(originalPrice).toLocaleString("en-IN")}
            </span>
          )}
        </div>
        {stock > 0 && stock <= 5 && (
          <p className="text-[11px] text-muted-foreground">Only {stock} left</p>
        )}
      </CardContent>

      <CardFooter className="grid gap-2 p-3 pt-0">
        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>

        <Button asChild size="sm" className="w-full text-xs">
          <Link to={productUrl}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ProductCard;
