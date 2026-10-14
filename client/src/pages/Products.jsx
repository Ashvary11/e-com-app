import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Container from "../components/layout/Container";
import { fetchProducts } from "../store/slices/productSlice";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../components/ui/pagination";
import ProductSkeleton from "@/components/ProductSkeleton";
import ProductFilterAndSearch from "@/components/ProductFilterAndSearch";
import { HoverEffect } from "@/components/ui/card-hover-effect";
// import ProductCard from "@/components/ProductCard";
import { SlidersHorizontal, ChevronDown } from "lucide-react";

function Products() {
  const dispatch = useDispatch();
  const { products, pagination, filters, loading, error } = useSelector(
    (state) => state.products,
  );
  const [showFloatingPagination, setShowFloatingPagination] = useState(false);

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

  // for nav menu show
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 200) {
        setShowFloatingPagination(true);
      } else if (currentScrollY < lastScrollY) {
        setShowFloatingPagination(false);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages || page === pagination.page) {
      return;
    }

    dispatch(
      fetchProducts({
        search: filters.search,
        category: filters.category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        sort: filters.sort,
        page,
        limit: pagination.limit,
      }),
    );
  };

  return (
    <Container className="py-8 bg-white/20 mt-5 rounded-lg">
      {/* Header + Search */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>

          {!loading && (
            <p className="mt-1 text-sm text-muted-foreground">
              Showing {products.length} of {pagination.total} products
            </p>
          )}
        </div>

        {/* Search and filters */}
        <details className="group relative shrink-0">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border bg-white/70 px-3 py-2 text-sm font-medium transition hover:bg-white">
            <SlidersHorizontal size={16} />
            {/* <span className="hidden sm:inline">Search & Filters</span> */}
            <ChevronDown
              size={14}
              className="transition-transform group-open:rotate-180"
            />
          </summary>

          <div className="absolute right-0 top-full z-40 mt-2 w-[min(90vw,36rem)] rounded-xl border p-4 shadow-lg">
            <ProductFilterAndSearch />
          </div>
        </details>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && <ProductSkeleton count={18} />}

      {/* Empty state */}
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

      {/* Product grid */}
      {!loading && products.length > 0 && (
        <>
          <div>
            {/* {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))} */}
            <HoverEffect items={products} />
          </div>

          {/* Floating pagination */}
          {pagination.totalPages > 1 && showFloatingPagination && (
            <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
              <div className="rounded-full border bg-background/95 p-1 shadow-lg backdrop-blur">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          handlePageChange(pagination.page - 1);
                        }}
                        className={
                          !pagination.hasPreviousPage
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>

                    <PaginationItem>
                      <PaginationLink
                        // href="#"
                        isActive
                        onClick={(event) => event.preventDefault()}
                      >
                        {pagination.page} / {pagination.totalPages}
                      </PaginationLink>
                    </PaginationItem>

                    <PaginationItem>
                      <PaginationNext
                        // href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          handlePageChange(pagination.page + 1);
                        }}
                        className={
                          !pagination.hasNextPage
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </>
      )}
    </Container>
  );
}

export default Products;
