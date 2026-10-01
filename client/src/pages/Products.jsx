import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Container from "../components/layout/Container";
import ProductCard from "../components/common/ProductCard";
import { Skeleton } from "../components/ui/skeleton";
import { Input } from "../components/ui/input";
import { Slider } from "../components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

import {
  fetchProducts,
  fetchCategories,
  setFilters,
  clearFilters,
  fetchPriceRange,
} from "../store/slices/productSlice";
import { Button } from "../components/ui/button";

function Products() {
  const dispatch = useDispatch();

  const {
    products,
    categories,
    categoriesLoading,
    priceRange,
    pagination,
    filters,
    loading,
    error,
    priceRangeLoading,
  } = useSelector((state) => state.products);

  const [searchInput, setSearchInput] = useState(filters.search);
  const [localPriceRange, setLocalPriceRange] = useState(null);
  // Fetch categories once.
  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchPriceRange());
  }, [dispatch]);

  // useEffect(() => {
  //   if (priceRange.max > 0) {
  //     setLocalPriceRange([priceRange.min, priceRange.max]);
  //   }
  // }, [priceRange.min, priceRange.max]);
  // Fetch products whenever the active filters change.
  useEffect(() => {
    dispatch(
      fetchProducts({
        search: filters.search,
        category: filters.category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        sort: filters.sort,
        page: 1,
        limit: pagination.limit,
      }),
    );
  }, [
    dispatch,
    filters.search,
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.sort,
    pagination.limit,
  ]);

  // Debounce search input.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        dispatch(
          setFilters({
            search: searchInput,
          }),
        );
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, filters.search, dispatch]);

  const handleSortChange = (value) => {
    dispatch(
      setFilters({
        sort: value,
      }),
    );
  };
  const handleCategoryChange = (value) => {
    dispatch(
      setFilters({
        category: value === "all" ? "" : value,
      }),
    );
  };
  const handlePriceChange = (value) => {
    setLocalPriceRange(value);
  };
  const handleApplyPrice = () => {
    const [minPrice, maxPrice] = currentPriceRange;

    dispatch(
      setFilters({
        minPrice,
        maxPrice,
      }),
    );
  };
  const handleClearFilters = () => {
    dispatch(clearFilters());
    setSearchInput("");
    setLocalPriceRange(null);
  };

  const formatCategoryName = (category) => {
    return category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };
  const priceFilterActive = filters.minPrice !== "" || filters.maxPrice !== "";
  //  when the user hasn't interacted with the slider yet.
  const currentPriceRange =
    Array.isArray(localPriceRange) && localPriceRange.length === 2
      ? localPriceRange
      : [priceRange.min, priceRange.max];

  const isDefaultPriceRange =
    currentPriceRange[0] === priceRange.min &&
    currentPriceRange[1] === priceRange.max;

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>

        {!loading && pagination && (
          <p className="mt-2 text-sm text-muted-foreground">
            Showing {products.length} of {pagination.total} products
          </p>
        )}
      </div>

      {/* Toolbar */}
      <div className="mb-8 flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="w-full sm:max-w-md">
          <Input
            type="search"
            placeholder="Search products..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label="Search products"
          />
        </div>
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            value={filters.category || "all"}
            onValueChange={handleCategoryChange}
            disabled={categoriesLoading}
          >
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Category" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>

              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {formatCategoryName(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">
              Sort by
            </span>

            <Select value={filters.sort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="Sort products" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="priceLow">Price: Low to High</SelectItem>
                <SelectItem value="priceHigh">Price: High to Low</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
                <SelectItem value="name">Name: A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Price Filter */}
      <div className="rounded-lg border bg-muted/20 p-4">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Price Range</h2>

            <p className="text-xs text-muted-foreground">
              Filter products by price
            </p>
          </div>

          {!priceRangeLoading && priceRange.max > 0 && (
            <span className="text-sm font-medium">
              {/* {formatPrice(localPriceRange[0])} -{" "}
              {formatPrice(localPriceRange[1])} */}
              {formatPrice(currentPriceRange[0])} -{" "}
              {formatPrice(currentPriceRange[1])}
            </span>
          )}
        </div>

        {priceRangeLoading ? (
          <Skeleton className="h-5 w-full" />
        ) : priceRange.max > priceRange.min ? (
          <>
            <Slider
              min={priceRange.min}
              max={priceRange.max}
              step={500}
              value={currentPriceRange}
              onValueChange={handlePriceChange}
              className="py-2"
            />

            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{formatPrice(priceRange.min)}</span>
              <span>{formatPrice(priceRange.max)}</span>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {priceFilterActive
                  ? "Price filter applied"
                  : "Select a price range"}
              </p>

              <Button
                type="button"
                size="sm"
                onClick={handleApplyPrice}
                disabled={isDefaultPriceRange && !priceFilterActive}
              >
                Apply Price
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Price range unavailable.
          </p>
        )}
      </div>

      {/* Clear Filters */}
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={handleClearFilters}>
          Clear Filters
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-xl border">
              <Skeleton className="aspect-square w-full" />

              <div className="space-y-3 p-4">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && products.length === 0 && (
        <div className="flex min-h-80 items-center justify-center rounded-xl border border-dashed">
          <div className="text-center">
            <h2 className="text-lg font-semibold">No products found</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Try changing your search or filters.
            </p>
          </div>
        </div>
      )}

      {/* Products */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </Container>
  );
}

export default Products;
