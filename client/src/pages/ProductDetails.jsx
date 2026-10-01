import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Minus, Plus, ShoppingCart, Star, Zap } from "lucide-react";
import { toast } from "sonner";

import Container from "../components/layout/Container";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Skeleton } from "../components/ui/skeleton";
import api from "../../src/services/api";
import { addToCart } from "../store/slices/cartSlice";
import { useDispatch } from "react-redux";

function ProductDetails() {
  // <ProductCard key={product._id} product={product} />
  const { slug } = useParams();
  // console.log(useParams());
  const dispatch = useDispatch();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/products/${slug}`);

        setProduct(response.data.product);
      } catch (error) {
        console.error("Failed to fetch product:", error);

        if (error.response?.status === 404) {
          setError("Product not found");
        } else {
          setError("Failed to load product");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const discount =
    product?.originalPrice > product?.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100,
        )
      : 0;

  const isOutOfStock = product?.stock <= 0;

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  const increaseQuantity = () => {
    setQuantity((current) => Math.min(product.stock, current + 1));
  };

  const handleAddToCart = () => {
    dispatch(
      addToCart({
        ...product,
        quantity,
      }),
    );
    toast.success("Product added to cart");
  };

  const handleBuyNow = () => {
    toast.success("Product Buying..");
  };

  if (loading) {
    return (
      <Container>
        <section className="py-8 sm:py-12">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <Skeleton className="aspect-square w-full rounded-xl" />

              <div className="flex gap-3">
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton key={item} className="h-20 w-20 rounded-md" />
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </section>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container>
        <section className="flex min-h-[50vh] items-center justify-center py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold">
              {error || "Product not found"}
            </h1>

            <p className="mt-2 text-muted-foreground">
              The product you're looking for doesn't exist or is no longer
              available.
            </p>
          </div>
        </section>
      </Container>
    );
  }

  return (
    <Container>
      <section className="py-8 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Product Images */}
          <div>
            <Card className="overflow-hidden">
              <div className="aspect-square bg-muted">
                {product.images?.length > 0 ? (
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="h-full w-full object-contain p-6 sm:p-10"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No image available
                  </div>
                )}
              </div>
            </Card>

            {product.images?.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {product.images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(index)}
                    className={`h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted ${
                      selectedImage === index
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="flex flex-col">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {product.brand && (
                  <Badge variant="secondary">{product.brand}</Badge>
                )}

                <Badge variant="outline">{product.category}</Badge>
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-sm font-medium text-primary-foreground">
                  <Star className="h-4 w-4 fill-current" />
                  {product.rating?.toFixed(1)}
                </div>

                <span className="text-sm text-muted-foreground">
                  {product.reviewCount}{" "}
                  {product.reviewCount === 1 ? "review" : "reviews"}
                </span>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Price */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-3xl font-bold">
                ₹{product.price.toLocaleString("en-IN")}
              </span>

              {product.originalPrice > product.price && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    ₹{product.originalPrice.toLocaleString("en-IN")}
                  </span>

                  <Badge>{discount}% OFF</Badge>
                </>
              )}
            </div>

            {/* Stock */}
            <div className="mt-4">
              {isOutOfStock ? (
                <span className="text-sm font-medium text-destructive">
                  Out of stock
                </span>
              ) : product.stock <= 5 ? (
                <span className="text-sm font-medium text-orange-600">
                  Only {product.stock} left in stock
                </span>
              ) : (
                <span className="text-sm font-medium text-green-600">
                  In stock
                </span>
              )}
            </div>

            <Separator className="my-6" />

            {/* Quantity */}
            {!isOutOfStock && (
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium">Quantity</span>

                <div className="flex items-center rounded-md border">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>

                  <span className="w-10 text-center text-sm font-medium">
                    {quantity}
                  </span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={increaseQuantity}
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button
                size="lg"
                variant="outline"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>

              <Button size="lg" disabled={isOutOfStock} onClick={handleBuyNow}>
                <Zap className="mr-2 h-5 w-5" />
                Buy Now
              </Button>
            </div>

            {/* Description */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold">Description</h2>

              <p className="mt-3 whitespace-pre-line leading-7 text-muted-foreground">
                {product.description}
              </p>
            </div>
          </div>
        </div>
      </section>
    </Container>
  );
}

export default ProductDetails;
