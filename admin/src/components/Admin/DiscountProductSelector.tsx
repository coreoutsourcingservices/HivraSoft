"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

type ProductCategory = {
  _id: string;
  name: string;
  slug: string;
  level: number;
};

type DiscountProduct = {
  _id: string;
  name: string;
  slug: string;
  colorName?: string;
  isColor?: boolean;
  originalPrice: number;
  showPrice: number;
  stock: number;
  image?: {
    url: string;
    publicId: string;
  } | null;
  categories: ProductCategory[];
};

type CategoryOption = {
  _id: string;
  name: string;
  slug: string;
  level: number;
  parent?: string | null;
};

type Props = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  title?: string;
  description?: string;
  emptySelectionText?: string;
};

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function money(value: number) {
  if (!Number.isFinite(value)) return "₹0";
  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

export default function DiscountProductSelector({
  selectedIds,
  onChange,
  disabled = false,
  title = "Products",
  description = "Choose products by category or search.",
  emptySelectionText = "No products selected.",
}: Props) {
  const [products, setProducts] = useState<DiscountProduct[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [categoryOpen, setCategoryOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/admin/discounts/products`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const data = await readJson(response);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to load products."
          );
        }

        if (cancelled) return;

        setProducts(
          Array.isArray(data?.products)
            ? data.products
            : []
        );
        setCategories(
          Array.isArray(data?.categories)
            ? data.categories
            : []
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load products."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedSet = useMemo(
    () => new Set(selectedIds),
    [selectedIds]
  );

  const selectedCategory = useMemo(
    () =>
      categories.find(
        (category) =>
          category._id === categoryId
      ) || null,
    [categories, categoryId]
  );

  const filteredProducts = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return products.filter((product) => {
      const categoryMatch =
        categoryId === "all" ||
        product.categories.some(
          (category) =>
            category._id === categoryId
        );

      if (!categoryMatch) return false;
      if (!query) return true;

      const categoryText = product.categories
        .map((category) => category.name)
        .join(" ")
        .toLowerCase();

      return (
        product.name
          .toLowerCase()
          .includes(query) ||
        product.slug
          .toLowerCase()
          .includes(query) ||
        String(product.colorName || "")
          .toLowerCase()
          .includes(query) ||
        categoryText.includes(query)
      );
    });
  }, [
    products,
    categoryId,
    search,
  ]);

  const visibleIds = filteredProducts.map(
    (product) => product._id
  );

  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) =>
      selectedSet.has(id)
    );

  const toggleProduct = (id: string) => {
    if (disabled) return;

    if (selectedSet.has(id)) {
      onChange(
        selectedIds.filter(
          (value) => value !== id
        )
      );
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const toggleVisible = () => {
    if (disabled || !visibleIds.length) {
      return;
    }

    if (allVisibleSelected) {
      const visibleSet = new Set(visibleIds);
      onChange(
        selectedIds.filter(
          (id) => !visibleSet.has(id)
        )
      );
      return;
    }

    onChange(
      Array.from(
        new Set([
          ...selectedIds,
          ...visibleIds,
        ])
      )
    );
  };

  return (
    <section className="min-w-0 rounded-[20px] border border-[#211A18]/10 bg-white p-4 sm:rounded-[24px] sm:p-5 md:p-6">
      <div className="flex flex-col gap-4 border-b border-[#211A18]/8 pb-4 sm:pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-[18px] font-semibold text-[#211A18]">
            {title}
          </h3>
          <p className="mt-1 text-[12px] leading-5 text-[#211A18]/45">
            {description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#F8E8ED] px-3 py-1.5 text-[10px] font-semibold text-[#8C1839]">
            {selectedIds.length} selected
          </span>
          <span className="rounded-full bg-[#F2EEEA] px-3 py-1.5 text-[10px] font-semibold text-[#211A18]/55">
            {products.length} total
          </span>
        </div>
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:mt-5 lg:grid-cols-[minmax(180px,240px)_minmax(0,1fr)_auto]">
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setCategoryOpen(
                (current) => !current
              )
            }
            className="flex h-12 w-full items-center justify-between rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4 text-left text-[12px] font-medium text-[#211A18]"
          >
            <span className="truncate">
              {selectedCategory
                ? selectedCategory.name
                : "All Products"}
            </span>
            <ChevronDown
              size={16}
              className={`shrink-0 text-[#211A18]/45 transition ${
                categoryOpen
                  ? "rotate-180"
                  : ""
              }`}
            />
          </button>

          {categoryOpen && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 max-h-72 overflow-y-auto rounded-[16px] border border-[#211A18]/10 bg-white p-2 shadow-[0_18px_50px_rgba(33,26,24,0.16)]">
              <button
                type="button"
                onClick={() => {
                  setCategoryId("all");
                  setCategoryOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[12px] ${
                  categoryId === "all"
                    ? "bg-[#FFF3F7] font-semibold text-[#8C1839]"
                    : "text-[#211A18]/70 hover:bg-[#F8F5F2]"
                }`}
              >
                <span>All Products</span>
                <span className="text-[10px] opacity-60">
                  {products.length}
                </span>
              </button>

              {categories.map((category) => {
                const count = products.filter(
                  (product) =>
                    product.categories.some(
                      (item) =>
                        item._id === category._id
                    )
                ).length;

                return (
                  <button
                    key={category._id}
                    type="button"
                    onClick={() => {
                      setCategoryId(category._id);
                      setCategoryOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[12px] ${
                      categoryId === category._id
                        ? "bg-[#FFF3F7] font-semibold text-[#8C1839]"
                        : "text-[#211A18]/70 hover:bg-[#F8F5F2]"
                    }`}
                    style={{
                      paddingLeft: `${12 + Math.min(category.level, 4) * 12}px`,
                    }}
                  >
                    <span className="truncate">
                      {category.name}
                    </span>
                    <span className="ml-2 text-[10px] opacity-60">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex h-12 min-w-0 items-center gap-3 rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-3 sm:px-4">
          <Search
            size={16}
            className="shrink-0 text-[#211A18]/35"
          />
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search product, slug or category..."
            className="min-w-0 flex-1 bg-transparent text-[12px] text-[#211A18] outline-none placeholder:text-[#211A18]/30"
          />
        </div>

        <button
          type="button"
          onClick={toggleVisible}
          disabled={
            disabled ||
            loading ||
            !visibleIds.length
          }
          className="h-12 w-full rounded-[14px] border border-[#8C1839]/15 bg-[#FFF5F8] px-4 text-[11px] font-semibold text-[#8C1839] disabled:cursor-not-allowed disabled:opacity-40 lg:w-auto"
        >
          {allVisibleSelected
            ? "Clear shown"
            : "Select shown"}
        </button>
      </div>

      {disabled && (
        <div className="mt-4 rounded-[14px] border border-[#E6D4DB] bg-[#FFF8FA] px-4 py-3 text-[11px] leading-5 text-[#7A5260]">
          All Products is ON. You can browse the list, but individual product selection is disabled.
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 max-h-[460px] space-y-2 overflow-y-auto pr-1">
        {loading ? (
          <div className="rounded-[16px] border border-dashed border-[#211A18]/10 px-5 py-12 text-center text-[12px] text-[#211A18]/40">
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-[#211A18]/10 px-5 py-12 text-center text-[12px] text-[#211A18]/40">
            {products.length === 0
              ? "No active products found."
              : "No products match this category/search."}
          </div>
        ) : (
          filteredProducts.map((product) => {
            const checked = selectedSet.has(
              product._id
            );

            return (
              <button
                key={product._id}
                type="button"
                onClick={() =>
                  toggleProduct(product._id)
                }
                disabled={disabled}
                className={`flex w-full min-w-0 items-center gap-3 rounded-[16px] border p-3 text-left transition ${
                  checked
                    ? "border-[#8C1839]/25 bg-[#FFF6F8]"
                    : "border-[#211A18]/8 bg-white hover:border-[#211A18]/15 hover:bg-[#FCFAF8]"
                } ${
                  disabled
                    ? "cursor-default"
                    : "cursor-pointer"
                }`}
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border text-white ${
                    checked
                      ? "border-[#8C1839] bg-[#8C1839]"
                      : "border-[#211A18]/15 bg-white"
                  }`}
                >
                  {checked && <Check size={13} />}
                </span>

                {product.image?.url ? (
                  <img
                    src={product.image.url}
                    alt={product.name}
                    className="h-12 w-12 shrink-0 rounded-xl border border-[#211A18]/8 object-cover"
                  />
                ) : (
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#F1ECE8] text-[9px] font-semibold text-[#211A18]/35">
                    IMG
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[12px] font-semibold text-[#211A18]">
                      {product.name}
                    </p>
                    {product.colorName &&
                      product.colorName !== "Default" && (
                        <span className="rounded-full bg-[#F2EEEA] px-2 py-0.5 text-[9px] font-medium text-[#211A18]/50">
                          {product.colorName}
                        </span>
                      )}
                  </div>

                  <p className="mt-1 truncate text-[10px] text-[#211A18]/40">
                    {product.categories.length
                      ? product.categories
                          .map(
                            (category) =>
                              category.name
                          )
                          .join(" / ")
                      : "Uncategorized"}
                  </p>
                </div>

                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-[11px] font-semibold text-[#211A18]">
                    {money(product.showPrice)}
                  </p>
                  {product.originalPrice >
                    product.showPrice && (
                    <p className="text-[9px] text-[#211A18]/35 line-through">
                      {money(product.originalPrice)}
                    </p>
                  )}
                  <p className="mt-1 text-[9px] text-[#211A18]/40">
                    Stock {product.stock}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {!loading &&
        !error &&
        selectedIds.length === 0 && (
          <p className="mt-4 text-[10px] text-[#211A18]/40">
            {emptySelectionText}
          </p>
        )}
    </section>
  );
}
