import { Link } from "react-router-dom";
import { Star } from "lucide-react";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter } from "../ui/card";

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

  const discount =
    originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  const image = images?.[0] || "/placeholder-product.png";

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
      {/* Image */}
      <Link to={`/products/${slug || _id}`} className="block">
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

      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full">
          <Link to={`/products/${slug || _id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ProductCard;
