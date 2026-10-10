import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Skeleton } from "./ui/skeleton";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import { Button } from "./ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

import {
  fetchCategories,
  fetchPriceRange,
  setFilters,
  clearFilters,
} from "../store/slices/productSlice";

export default function ProductFilterAndSearch() {
  const dispatch = useDispatch();

  const {
    categories,
    categoriesLoading,
    priceRange,
    priceRangeLoading,
    filters,
  } = useSelector((state) => state.products);

  const [searchInput, setSearchInput] = useState(filters.search);
  const [localPriceRange, setLocalPriceRange] = useState(null);

  // Fetch filter options.
  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchPriceRange());
  }, [dispatch]);

  // Keep the search input synchronized with Redux.
//   useEffect(() => {
//     setSearchInput(filters.search);
//   }, [filters.search]);

  // Debounce search.
  useEffect(() => {
    const timer = setTimeout(() => {
        
      if (searchInput !== filters.search) {
        dispatch(setFilters({ search: searchInput }));
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, filters.search, dispatch]);

  const handleSortChange = (value) => {
    dispatch(setFilters({ sort: value }));
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

  // Use the locally selected range, or the currently applied range.
  const currentPriceRange = localPriceRange ?? [
    filters.minPrice !== "" && filters.minPrice != null
      ? Number(filters.minPrice)
      : priceRange.min,
    filters.maxPrice !== "" && filters.maxPrice != null
      ? Number(filters.maxPrice)
      : priceRange.max,
  ];

  const priceFilterActive =
    (filters.minPrice !== "" && filters.minPrice != null) ||
    (filters.maxPrice !== "" && filters.maxPrice != null);

  const isDefaultPriceRange =
    currentPriceRange[0] === priceRange.min &&
    currentPriceRange[1] === priceRange.max;

  const handleApplyPrice = () => {
    const [minPrice, maxPrice] = currentPriceRange;

    dispatch(
      setFilters({
        minPrice,
        maxPrice,
      }),
    );

    setLocalPriceRange(null);
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setSearchInput("");
    setLocalPriceRange(null);
  };

  const formatCategoryName = (category) =>
    category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <div className="mb-6 space-y-4">
      {/* Search, category and sorting */}
      <div className="rounded-xl border bg-muted/20 p-3 sm:p-4">
        <div className="space-y-3">
          <Input
            type="search"
            placeholder="Search products..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label="Search products"
            className="h-10"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              value={filters.category || "all"}
              onValueChange={handleCategoryChange}
              disabled={categoriesLoading}
            >
              <SelectTrigger className="h-10 w-full">
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

            <Select value={filters.sort} onValueChange={handleSortChange}>
              <SelectTrigger className="h-10 w-full">
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

      {/* Price filter */}
      <div className="rounded-xl border bg-muted/20 p-4">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Price Range</h2>
            <p className="text-xs text-muted-foreground">
              Filter products by price
            </p>
          </div>

          {!priceRangeLoading && priceRange.max > 0 && (
            <span className="text-sm font-medium">
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

      {/* Clear filters */}
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={handleClearFilters}>
          Clear Filters
        </Button>
      </div>
    </div>
  );
}
