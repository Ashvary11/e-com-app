import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Power,
  ChevronLeft,
  ChevronRight,
  X,
  Package,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";

import api from "../../../services/api";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";

const emptyForm = {
  name: "",
  sku: "",
  slug: "",
  description: "",
  price: "",
  originalPrice: "",
  category: "",
  brand: "",
  images: "",
  stock: "0",
  rating: "0",
  reviewCount: "0",
  isActive: true,
};

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(price || 0);

const getErrorMessage = (error) =>
  error.response?.data?.message || "Something went wrong. Please try again.";

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmProduct, setConfirmProduct] = useState(null);
  // Debounce product search.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load product categories for the filter.
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/products/categories");
        setCategories(response.data.categories || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch products whenever the filters or page change.
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/products", {
        params: {
          search,
          category,
          status,
          sort,
          page,
          limit: 20,
        },
      });

      setProducts(response.data.products || []);
      setPagination(response.data.pagination);
    } catch (error) {
      setError(getErrorMessage(error));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, status, sort, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Open the form for creating a product.
  const openCreateModal = () => {
    setEditingProduct(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  // Open the form with existing product data.
  const openEditModal = (product) => {
    setEditingProduct(product);

    setForm({
      name: product.name || "",
      sku: product.sku || "",
      slug: product.slug || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      originalPrice:
        product.originalPrice == null ? "" : String(product.originalPrice),
      category: product.category || "",
      brand: product.brand || "",
      images: (product.images || []).join("\n"),
      stock: String(product.stock ?? 0),
      rating: String(product.rating ?? 0),
      reviewCount: String(product.reviewCount ?? 0),
      isActive: product.isActive !== false,
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingProduct(null);
    setForm({ ...emptyForm });
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Create or update a product.
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    if (!form.description.trim()) {
      toast.error("Product description is required");
      return;
    }

    if (!form.category.trim()) {
      toast.error("Product category is required");
      return;
    }

    if (form.price.trim() === "" || !Number.isFinite(Number(form.price))) {
      toast.error("Enter a valid product price");
      return;
    }

    if (
      form.originalPrice.trim() !== "" &&
      !Number.isFinite(Number(form.originalPrice))
    ) {
      toast.error("Enter a valid original price");
      return;
    }

    const numericFields = ["price", "stock", "rating", "reviewCount"];

    for (const field of numericFields) {
      if (form[field].trim() === "" || !Number.isFinite(Number(form[field]))) {
        toast.error(`Enter a valid ${field}`);
        return;
      }
    }

    if (form.originalPrice.trim() !== "" && Number(form.originalPrice) < 0) {
      toast.error("Original price cannot be negative");
      return;
    }

    if (Number(form.stock) < 0 || !Number.isInteger(Number(form.stock))) {
      toast.error("Stock must be a non-negative whole number");
      return;
    }

    if (
      Number(form.reviewCount) < 0 ||
      !Number.isInteger(Number(form.reviewCount))
    ) {
      toast.error("Review count must be a non-negative whole number");
      return;
    }

    if (Number(form.price) < 0) {
      toast.error("Price cannot be negative");
      return;
    }

    if (Number(form.rating) < 0 || Number(form.rating) > 5) {
      toast.error("Rating must be between 0 and 5");
      return;
    }

    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category.trim(),
      images: form.images
        .split("\n")
        .map((image) => image.trim())
        .filter(Boolean),
      stock: Number(form.stock),
      rating: Number(form.rating),
      reviewCount: Number(form.reviewCount),
      isActive: form.isActive,
    };

    if (form.originalPrice.trim() !== "") {
      data.originalPrice = Number(form.originalPrice);
    }

    if (form.brand.trim()) {
      data.brand = form.brand.trim();
    }

    if (form.sku.trim()) {
      data.sku = form.sku.trim().toUpperCase();
    }

    if (form.slug.trim()) {
      data.slug = form.slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    try {
      setSaving(true);

      if (editingProduct) {
        await api.patch(`/admin/products/${editingProduct._id}`, data);
        toast.success("Product updated successfully");
      } else {
        await api.post("/admin/products", data);
        toast.success("Product created successfully");
      }

      setModalOpen(false);
      setEditingProduct(null);
      setForm({ ...emptyForm });

      // Refresh the list after a successful save.
      await fetchProducts();

      // Refresh categories in case a new category was added.
      const response = await api.get("/products/categories");
      setCategories(response.data.categories || []);
    } catch (error) {
      const errors = error.response?.data?.errors;
      const firstError = errors
        ? Object.values(errors).flat().find(Boolean)
        : null;

      toast.error(firstError || getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // Activate or deactivate without deleting the product.

  const handleToggleStatus = async () => {
    if (!confirmProduct) return;

    const product = confirmProduct;
    const nextStatus = !product.isActive;

    try {
      setActionId(product._id);

      await api.patch(`/admin/products/${product._id}/status`, {
        isActive: nextStatus,
      });

      toast.success(
        nextStatus
          ? "Product activated successfully"
          : "Product deactivated successfully",
      );

      setConfirmProduct(null);
      await fetchProducts();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionId(null);
    }
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setCategory("");
    setStatus("all");
    setSort("newest");
    setPage(1);
  };

  const handleSort = (field) => {
    const sortPairs = {
      name: ["name", "nameDesc"],
      category: ["category", "categoryDesc"],
      price: ["priceLow", "priceHigh"],
      stock: ["stockLow", "stockHigh"],
      status: ["status", "statusDesc"],
    };

    const pair = sortPairs[field];
    if (!pair) return;

    setSort((current) => (current === pair[0] ? pair[1] : pair[0]));
    setPage(1);
  };

  const renderSortIcon = (field) => {
    const sortPairs = {
      name: ["name", "nameDesc"],
      category: ["category", "categoryDesc"],
      price: ["priceLow", "priceHigh"],
      stock: ["stockLow", "stockHigh"],
      status: ["status", "statusDesc"],
    };

    const pair = sortPairs[field];

    if (!pair || !pair.includes(sort)) {
      return <ArrowUpDown className="h-3.5 w-3.5" />;
    }

    return sort === pair[0] ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
  };

  const sortableHeading = (label, field) => (
    <button
      type="button"
      onClick={() => handleSort(field)}
      className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium hover:text-foreground"
    >
      {label}
      {renderSortIcon(field)}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your store products, inventory, and visibility.
          </p>
        </div>

        <Button onClick={openCreateModal} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add product
        </Button>
      </div>

      {/* Product statistics */}
    <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">Products found</p>
          <p className="mt-2 text-2xl font-semibold">
            {loading ? "—" : pagination.total}
          </p>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">Active on store</p>
          <p className="mt-2 text-2xl font-semibold">
            {loading
              ? "—"
              : products.filter((product) => product.isActive).length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            On the current page
          </p>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">Inactive</p>
          <p className="mt-2 text-2xl font-semibold">
            {loading
              ? "—"
              : products.filter((product) => !product.isActive).length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            On the current page
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="space-y-4 rounded-xl border bg-background p-4">
        <div className="relative min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search products by name, brand, or description..."
            className="pl-9"
          />
        </div>

       <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
            <option value="priceLow">Price: low to high</option>
            <option value="priceHigh">Price: high to low</option>
            <option value="rating">Highest rated</option>
          </select>

          <Button
            type="button"
            variant="outline"
            onClick={resetFilters}
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset filters
          </Button>
        </div>
      </div>

      {/* Product table +pagination +refresh */}
      <div className="overflow-hidden rounded-xl border bg-background">
        <div className="flex flex-col gap-3 border-b px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div>
            <h2 className="font-medium">Product inventory</h2>
            <div className="mt-1 text-xs text-muted-foreground">
              {/* {pagination.total} products */}
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * pagination.limit + 1}–
                {Math.min(page * pagination.limit, pagination.total)} of{" "}
                {pagination.total}
              </p>
            </div>
          </div>

          {/* Pagination */}
          {!error && !loading && products.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 sm:ml-auto">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => setPage((current) => current - 1)}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground">
                  {page} / {Math.max(pagination.totalPages, 1)}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={fetchProducts}
            disabled={loading}
            aria-label="Refresh products"
            className="shrink-0 self-end sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {error && (
          <div className="flex flex-col gap-3 p-6 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={fetchProducts}>
              Try again
            </Button>
          </div>
        )}

        {!error && loading && (
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-14 animate-pulse rounded-md bg-muted"
              />
            ))}
          </div>
        )}

        {!error && !loading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <Package className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 font-medium">No products found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try changing your filters or create a new product.
            </p>
            <Button className="mt-4" onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Add product
            </Button>
          </div>
        )}

        {!error && !loading && products.length > 0 && (
          <div className="max-h-[400px] w-full overflow-auto overscroll-x-contain">
          <table className="w-full min-w-[850px] table-fixed text-left text-sm">
              <thead className="sticky top-0 z-10 border-b bg-muted text-muted-foreground">
                <tr>
                  <th className="w-[32%] px-3 py-3">
                    {sortableHeading("Product", "name")}
                  </th>

                  <th className="w-[17%] px-3 py-3">
                    {sortableHeading("Category", "category")}
                  </th>

                  <th className="w-[17%] px-3 py-3">
                    {sortableHeading("Price", "price")}
                  </th>

                  <th className="w-[10%] px-2 py-3">
                    {sortableHeading("Stock", "stock")}
                  </th>

                  <th className="w-[12%] px-2 py-3">
                    {sortableHeading("Status", "status")}
                  </th>

                  <th className="w-[12%] px-2 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y overflow-scroll  ">
                {products.map((product) => (
                  <tr
                    key={product._id}
                    className="transition-colors hover:bg-muted/20"
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-12 w-12 shrink-0 rounded-md border object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border bg-muted">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="max-w-[280px] truncate font-medium">
                            {product.name}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            SKU: {product.sku}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="block truncate capitalize">
                        {product.category}
                      </span>
                    </td>

                    <td className="px-3 py-3 font-medium whitespace-nowrap ">
                      {formatPrice(product.price)}
                    </td>

                    <td className="px-2 py-3">
                      <span
                        className={
                          product.stock <= 5
                            ? "font-medium text-destructive"
                            : ""
                        }
                      >
                        {product.stock}
                      </span>
                      {product.stock === 0 && (
                        <p className="mt-1 text-xs text-destructive">
                          Out of stock
                        </p>
                      )}
                    </td>

                    <td className="px-2 py-3">
                      <Badge
                        variant={product.isActive ? "default" : "secondary"}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditModal(product)}
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setConfirmProduct(product)}
                          disabled={actionId === product._id}
                          aria-label={`${
                            product.isActive ? "Deactivate" : "Activate"
                          } ${product.name}`}
                          title={
                            product.isActive
                              ? "Deactivate product"
                              : "Activate product"
                          }
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit product modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-2 sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
            className="my-auto w-full max-w-3xl rounded-xl border bg-background shadow-xl"
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 id="product-form-title" className="text-lg font-semibold">
                  {editingProduct ? "Edit product" : "Create product"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {editingProduct
                    ? "Update product details and inventory."
                    : "Add a new product to your store."}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close product form"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Product name *</label>
                  <Input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Wireless headphones"
                    required
                    maxLength={200}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Category *</label>
                  <Input
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    placeholder="audio"
                    required
                    maxLength={100}
                    list="product-categories"
                  />
                  <datalist id="product-categories">
                    {categories.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Price (₹) *</label>
                  <Input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="2499"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Original price (₹)
                  </label>
                  <Input
                    name="originalPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.originalPrice}
                    onChange={handleChange}
                    placeholder="2999"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">SKU</label>
                  <Input
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                    placeholder={
                      editingProduct
                        ? "Product SKU"
                        : "Leave empty to generate automatically"
                    }
                    maxLength={100}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Slug</label>
                  <Input
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    placeholder="Leave empty to generate automatically"
                    maxLength={220}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Brand</label>
                  <Input
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                    placeholder="Brand name"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Stock *</label>
                  <Input
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Rating (0–5)</label>
                  <Input
                    name="rating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.01"
                    value={form.rating}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Review count</label>
                  <Input
                    name="reviewCount"
                    type="number"
                    min="0"
                    step="1"
                    value={form.reviewCount}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium">Description *</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe this product..."
                    required
                    maxLength={10000}
                    rows={4}
                    className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium">Image URLs</label>
                  <textarea
                    name="images"
                    value={form.images}
                    onChange={handleChange}
                    placeholder={
                      "Enter one image URL per line\nhttps://example.com/product.jpg"
                    }
                    rows={3}
                    className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter one image URL per line. Empty lines are ignored.
                  </p>
                </div>

                <label className="flex items-center gap-3 rounded-lg border p-3 sm:col-span-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 accent-primary"
                  />
                  <span>
                    <span className="block text-sm font-medium">
                      Active product
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Active products are visible in the storefront.
                    </span>
                  </span>
                </label>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : editingProduct
                      ? "Save changes"
                      : "Create product"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="status-dialog-title"
            className="w-full max-w-md rounded-xl border bg-background p-5 shadow-xl"
          >
            <h2 id="status-dialog-title" className="text-lg font-semibold">
              {confirmProduct.isActive
                ? "Deactivate product?"
                : "Activate product?"}
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to{" "}
              {confirmProduct.isActive ? "deactivate" : "activate"}{" "}
              <span className="font-medium text-foreground">
                "{confirmProduct.name}"
              </span>
              ?
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmProduct(null)}
                disabled={actionId === confirmProduct._id}
              >
                Cancel
              </Button>

              <Button
                variant={confirmProduct.isActive ? "destructive" : "default"}
                onClick={handleToggleStatus}
                disabled={actionId === confirmProduct._id}
              >
                {actionId === confirmProduct._id
                  ? "Updating..."
                  : confirmProduct.isActive
                    ? "Deactivate"
                    : "Activate"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
