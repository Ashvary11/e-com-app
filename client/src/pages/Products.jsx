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
import ProductCard from "@/components/ProductCard";
import ProductSkeleton from "@/components/ProductSkeleton";
import ProductFilterAndSearch from "@/components/ProductFilterAndSearch";

function Products() {
  const dispatch = useDispatch();

  const [showFloatingPagination, setShowFloatingPagination] = useState(false);

  const { products, pagination, filters, loading, error } = useSelector(
    (state) => state.products,
  );

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
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>

        {!loading && (
          <p className="mt-2 text-sm text-muted-foreground">
            Showing {products.length} of {pagination.total} products
          </p>
        )}
      </div>

      {/* Search and filters */}
      <ProductFilterAndSearch />

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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
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
                        href="#"
                        isActive
                        onClick={(event) => event.preventDefault()}
                      >
                        {pagination.page} / {pagination.totalPages}
                      </PaginationLink>
                    </PaginationItem>

                    <PaginationItem>
                      <PaginationNext
                        href="#"
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
