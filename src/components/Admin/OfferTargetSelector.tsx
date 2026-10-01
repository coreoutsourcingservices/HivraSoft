"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type CategoryOption = {
  _id: string;
  name: string;
  slug: string;
  level: number;
  parent?: string | null;
};

type ProductOption = {
  _id: string;
  name: string;
  slug: string;
  colorName?: string;
  showPrice: number;
  stock: number;
  categories: Array<{ _id: string; name: string; slug: string; level: number }>;
};

type Props = {
  appliesToAllProducts: boolean;
  onAllProductsChange: (value: boolean) => void;
  selectedProductIds: string[];
  onProductIdsChange: (ids: string[]) => void;
  selectedCategoryIds: string[];
  onCategoryIdsChange: (ids: string[]) => void;
  disabled?: boolean;
};

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function money(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default function OfferTargetSelector({
  appliesToAllProducts,
  onAllProductsChange,
  selectedProductIds,
  onProductIdsChange,
  selectedCategoryIds,
  onCategoryIdsChange,
  disabled = false,
}: Props) {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(`${API_URL}/api/admin/discounts/products`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await readJson(response);
        if (!response.ok) throw new Error(data?.message || "Unable to load products and categories.");
        if (cancelled) return;
        setProducts(Array.isArray(data?.products) ? data.products : []);
        setCategories(Array.isArray(data?.categories) ? data.categories : []);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load products and categories.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedProducts = useMemo(() => new Set(selectedProductIds), [selectedProductIds]);
  const selectedCategories = useMemo(() => new Set(selectedCategoryIds), [selectedCategoryIds]);

  const visibleCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((category) =>
      `${category.name} ${category.slug}`.toLowerCase().includes(query)
    );
  }, [categories, categorySearch]);

  const visibleProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => {
      const categoryNames = product.categories.map((category) => category.name).join(" ");
      return `${product.name} ${product.slug} ${product.colorName || ""} ${categoryNames}`
        .toLowerCase()
        .includes(query);
    });
  }, [products, productSearch]);

  function toggleProduct(id: string) {
    if (disabled || appliesToAllProducts) return;
    onProductIdsChange(
      selectedProducts.has(id)
        ? selectedProductIds.filter((value) => value !== id)
        : [...selectedProductIds, id]
    );
  }

  function toggleCategory(id: string) {
    if (disabled || appliesToAllProducts) return;
    onCategoryIdsChange(
      selectedCategories.has(id)
        ? selectedCategoryIds.filter((value) => value !== id)
        : [...selectedCategoryIds, id]
    );
  }

  return (
    <section className="rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
      <div className="flex flex-col gap-4 border-b border-[#211A18]/8 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-[18px] font-semibold text-[#211A18]">Products & Categories</h3>
          <p className="mt-1 text-[11px] leading-5 text-[#211A18]/45">
            Choose exact products, complete categories, or both. A category also covers products inside its child categories.
          </p>
        </div>
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[15px] bg-[#FAF8F6] px-4 py-3">
          <span>
            <span className="block text-[11px] font-semibold">All Products</span>
            <span className="mt-0.5 block text-[9px] text-[#211A18]/45">Apply offer store-wide</span>
          </span>
          <input
            type="checkbox"
            checked={appliesToAllProducts}
            disabled={disabled}
            onChange={(event) => onAllProductsChange(event.target.checked)}
            className="h-4 w-4 accent-[#A51D45]"
          />
        </label>
      </div>

      {error && (
        <div className="mt-4 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-[11px] text-red-700">
          {error}
        </div>
      )}

      {appliesToAllProducts && (
        <div className="mt-4 rounded-[14px] border border-[#E6D4DB] bg-[#FFF8FA] px-4 py-3 text-[11px] leading-5 text-[#7A5260]">
          All Products is ON. Product/category selection below is disabled for this offer.
        </div>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <div className={`${appliesToAllProducts ? "opacity-45" : ""}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-[13px] font-semibold">Categories</h4>
              <p className="mt-1 text-[9px] text-[#211A18]/40">{selectedCategoryIds.length} selected</p>
            </div>
            {selectedCategoryIds.length > 0 && !appliesToAllProducts && (
              <button
                type="button"
                onClick={() => onCategoryIdsChange([])}
                className="text-[9px] font-semibold text-[#A51D45]"
              >
                Clear
              </button>
            )}
          </div>

          <div className="mt-3 flex h-11 items-center gap-2 rounded-[13px] border border-[#211A18]/10 bg-[#FAF8F6] px-3">
            <Search size={14} className="text-[#211A18]/35" />
            <input
              value={categorySearch}
              onChange={(event) => setCategorySearch(event.target.value)}
              placeholder="Search category..."
              className="min-w-0 flex-1 bg-transparent text-[11px] outline-none"
            />
          </div>

          <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1">
            {loading ? (
              <Empty text="Loading categories..." />
            ) : visibleCategories.length === 0 ? (
              <Empty text="No categories found." />
            ) : (
              visibleCategories.map((category) => {
                const checked = selectedCategories.has(category._id);
                return (
                  <button
                    key={category._id}
                    type="button"
                    disabled={disabled || appliesToAllProducts}
                    onClick={() => toggleCategory(category._id)}
                    className={`flex w-full items-center gap-3 rounded-[13px] border px-3 py-3 text-left transition ${
                      checked
                        ? "border-[#A51D45]/30 bg-[#FFF4F7]"
                        : "border-[#211A18]/8 bg-white hover:bg-[#FAF8F6]"
                    } disabled:cursor-not-allowed`}
                    style={{ paddingLeft: `${12 + Math.min(category.level || 0, 5) * 10}px` }}
                  >
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                        checked ? "border-[#A51D45] bg-[#A51D45] text-white" : "border-[#211A18]/15"
                      }`}
                    >
                      {checked && <Check size={12} />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-medium">{category.name}</span>
                      <span className="mt-0.5 block truncate text-[9px] text-[#211A18]/35">/{category.slug}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className={`${appliesToAllProducts ? "opacity-45" : ""}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-[13px] font-semibold">Products</h4>
              <p className="mt-1 text-[9px] text-[#211A18]/40">{selectedProductIds.length} selected</p>
            </div>
            {selectedProductIds.length > 0 && !appliesToAllProducts && (
              <button
                type="button"
                onClick={() => onProductIdsChange([])}
                className="text-[9px] font-semibold text-[#A51D45]"
              >
                Clear
              </button>
            )}
          </div>

          <div className="mt-3 flex h-11 items-center gap-2 rounded-[13px] border border-[#211A18]/10 bg-[#FAF8F6] px-3">
            <Search size={14} className="text-[#211A18]/35" />
            <input
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
              placeholder="Search product..."
              className="min-w-0 flex-1 bg-transparent text-[11px] outline-none"
            />
          </div>

          <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1">
            {loading ? (
              <Empty text="Loading products..." />
            ) : visibleProducts.length === 0 ? (
              <Empty text="No products found." />
            ) : (
              visibleProducts.map((product) => {
                const checked = selectedProducts.has(product._id);
                return (
                  <button
                    key={product._id}
                    type="button"
                    disabled={disabled || appliesToAllProducts}
                    onClick={() => toggleProduct(product._id)}
                    className={`flex w-full items-center gap-3 rounded-[13px] border p-3 text-left transition ${
                      checked
                        ? "border-[#A51D45]/30 bg-[#FFF4F7]"
                        : "border-[#211A18]/8 bg-white hover:bg-[#FAF8F6]"
                    } disabled:cursor-not-allowed`}
                  >
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                        checked ? "border-[#A51D45] bg-[#A51D45] text-white" : "border-[#211A18]/15"
                      }`}
                    >
                      {checked && <Check size={12} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-medium">{product.name}</span>
                      <span className="mt-0.5 block truncate text-[9px] text-[#211A18]/35">
                        {product.categories.map((category) => category.name).join(" / ") || "No category"}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-[10px] font-semibold">{money(product.showPrice)}</span>
                      <span className="mt-0.5 block text-[8px] text-[#211A18]/35">Stock {product.stock}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-[14px] border border-dashed border-[#211A18]/10 px-4 py-8 text-center text-[10px] text-[#211A18]/40">
      {text}
    </div>
  );
}
