"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, ImagePlus, Loader2, Search, X } from "lucide-react";

export const HOMEPAGE_API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

export type HomepageImage = {
  url: string;
  publicId: string;
};

export type HomepageCategory = {
  _id: string;
  name: string;
  slug: string;
  level: number;
  parent?: string | null;
};

export type HomepageProductColor = {
  _id: string;
  name: string;
  slug: string;
  hex?: string;
  isDefault?: boolean;
  stock: number;
  image?: HomepageImage | null;
};

export type HomepageProduct = {
  _id: string;
  name: string;
  slug: string;
  colorName?: string;
  originalPrice: number;
  showPrice: number;
  stock: number;
  image?: HomepageImage | null;
  colors?: HomepageProductColor[];
  categories: HomepageCategory[];
};

export type HomepageProductColorSelection = {
  productId: string;
  colorId: string;
  colorName: string;
  colorSlug: string;
};

export async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export function formatDateTime(value: string | Date | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function money(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

export function useHomepageOptions() {
  const [products, setProducts] = useState<HomepageProduct[]>([]);
  const [categories, setCategories] = useState<HomepageCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(`${HOMEPAGE_API_URL}/api/admin/homepage/options`, {
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

  return { products, categories, loading, error };
}

export function ImageUploadField({
  label,
  folder,
  value,
  onChange,
}: {
  label: string;
  folder: string;
  value: HomepageImage | null;
  onChange: (image: HomepageImage) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadFile(file: File) {
    try {
      setUploading(true);
      setError("");
      const formData = new FormData();
      formData.append("image", file);
      formData.append("folder", folder);
      formData.append("imageName", `homepage-${Date.now()}-${file.name}`);

      const response = await fetch(`${HOMEPAGE_API_URL}/api/uploads/image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Image upload failed.");
      if (!data?.image?.url || !data?.image?.publicId) throw new Error("Cloudinary image response is invalid.");
      onChange({ url: String(data.image.url), publicId: String(data.image.publicId) });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] font-semibold text-[#211A18]">{label}</span>
        {value?.url && <span className="text-[9px] font-medium text-emerald-600">Cloudinary uploaded</span>}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="mt-3 flex min-h-[122px] w-full items-center justify-center overflow-hidden rounded-[16px] border border-dashed border-[#211A18]/15 bg-[#FAF8F6] text-[#211A18]/50 disabled:opacity-50"
      >
        {value?.url ? (
          <div className="relative w-full">
            <img src={value.url} alt={label} className="max-h-[260px] w-full object-contain" />
            <div className="absolute inset-x-0 bottom-0 bg-black/55 px-3 py-2 text-center text-[10px] font-semibold text-white">
              {uploading ? "Uploading..." : "Click to replace image"}
            </div>
          </div>
        ) : (
          <span className="flex flex-col items-center gap-2 px-5 py-8 text-[11px] font-semibold">
            {uploading ? <Loader2 size={22} className="animate-spin" /> : <ImagePlus size={22} />}
            {uploading ? "Uploading to Cloudinary..." : "Upload image"}
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadFile(file);
        }}
      />

      {error && <p className="mt-2 text-[10px] text-red-600">{error}</p>}
    </div>
  );
}

export function ProductSelect({
  products,
  value,
  onChange,
  label = "Product",
  disabled = false,
}: {
  products: HomepageProduct[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-[#211A18]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="mt-3 h-12 w-full rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4 text-[12px] outline-none disabled:opacity-50"
      >
        <option value="">Select product</option>
        {products.map((product) => (
          <option key={product._id} value={product._id}>
            {product.name}{product.colorName ? ` - ${product.colorName}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CategorySelect({
  categories,
  value,
  onChange,
  label = "Category",
  disabled = false,
}: {
  categories: HomepageCategory[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-[#211A18]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="mt-3 h-12 w-full rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4 text-[12px] outline-none disabled:opacity-50"
      >
        <option value="">Select category</option>
        {categories.map((category) => (
          <option key={category._id} value={category._id}>
            {`${"— ".repeat(Math.min(category.level, 4))}${category.name}`}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MultiProductPicker({
  products,
  selectedIds,
  onChange,
}: {
  products: HomepageProduct[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const productMap = useMemo(
    () => new Map(products.map((product) => [product._id, product])),
    [products],
  );
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => {
      const categories = product.categories
        .map((category) => category.name)
        .join(" ")
        .toLowerCase();
      return `${product.name} ${product.slug} ${product.colorName || ""} ${categories}`
        .toLowerCase()
        .includes(query);
    });
  }, [products, search]);

  function toggle(id: string) {
    if (selected.has(id)) onChange(selectedIds.filter((item) => item !== id));
    else onChange([...selectedIds, id]);
  }

  function moveSelected(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= selectedIds.length) return;
    const next = [...selectedIds];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(next);
  }

  return (
    <section className="rounded-[20px] border border-[#211A18]/10 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-semibold">Select Products</h3>
          <p className="mt-1 text-[10px] text-[#211A18]/45">
            Product select karo. Selected order hi website par index/order rahega.
          </p>
        </div>
        <span className="rounded-full bg-[#F8E8ED] px-3 py-1.5 text-[10px] font-semibold text-[#8C1839]">
          {selectedIds.length} selected
        </span>
      </div>

      {selectedIds.length > 0 ? (
        <div className="mt-4 rounded-[16px] border border-[#211A18]/8 bg-[#FFFDFC] p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold text-[#211A18]">Selected Product Order</p>
            <p className="text-[8px] text-[#211A18]/40">↑ / ↓ se index change karo</p>
          </div>
          <div className="space-y-2">
            {selectedIds.map((id, index) => {
              const product = productMap.get(id);
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 rounded-[12px] border border-[#211A18]/8 bg-[#FAF8F6] p-2"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#211A18] text-[9px] font-bold text-white">
                    {index + 1}
                  </span>
                  {product?.image?.url ? (
                    <img
                      src={product.image.url}
                      alt={product.name}
                      className="h-9 w-9 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#EEE8E3] text-[7px] text-[#211A18]/35">
                      IMG
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-semibold text-[#211A18]">
                      {product?.name || `Product ${id.slice(-6)}`}
                    </p>
                    <p className="mt-0.5 text-[8px] text-[#211A18]/40">Index {index + 1}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveSelected(index, -1)}
                      title="Move product up"
                      aria-label={`Move ${product?.name || "product"} up`}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-[#211A18]/10 bg-white text-[#211A18]/65 transition hover:border-[#A51D45]/25 hover:text-[#A51D45] disabled:cursor-not-allowed disabled:opacity-25"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={index === selectedIds.length - 1}
                      onClick={() => moveSelected(index, 1)}
                      title="Move product down"
                      aria-label={`Move ${product?.name || "product"} down`}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-[#211A18]/10 bg-white text-[#211A18]/65 transition hover:border-[#A51D45]/25 hover:text-[#A51D45] disabled:cursor-not-allowed disabled:opacity-25"
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(id)}
                      title="Remove product"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-red-100 bg-red-50 text-red-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex h-11 items-center gap-2 rounded-[13px] border border-[#211A18]/10 bg-[#FAF8F6] px-3">
        <Search size={15} className="text-[#211A18]/35" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search product..."
          className="min-w-0 flex-1 bg-transparent text-[11px] outline-none"
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} className="text-[#211A18]/35">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="mt-3 max-h-[390px] space-y-2 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-[#211A18]/10 px-4 py-8 text-center text-[11px] text-[#211A18]/40">
            No products found.
          </div>
        ) : (
          filtered.map((product) => {
            const checked = selected.has(product._id);
            const selectedIndex = selectedIds.indexOf(product._id);
            return (
              <button
                key={product._id}
                type="button"
                onClick={() => toggle(product._id)}
                className={`flex w-full items-center gap-3 rounded-[14px] border p-3 text-left ${
                  checked
                    ? "border-[#A51D45]/25 bg-[#FFF5F8]"
                    : "border-[#211A18]/8 bg-[#FAF8F6]"
                }`}
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                    checked
                      ? "border-[#A51D45] bg-[#A51D45] text-white"
                      : "border-[#211A18]/15 bg-white"
                  }`}
                >
                  {checked && <Check size={13} />}
                </span>
                {product.image?.url ? (
                  <img
                    src={product.image.url}
                    alt={product.name}
                    className="h-11 w-11 rounded-xl object-cover"
                  />
                ) : (
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#EEE8E3] text-[8px] text-[#211A18]/35">
                    IMG
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[11px] font-semibold">{product.name}</p>
                    {checked ? (
                      <span className="shrink-0 rounded-full bg-[#211A18] px-2 py-0.5 text-[7px] font-semibold text-white">
                        #{selectedIndex + 1}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-[9px] text-[#211A18]/40">
                    {product.categories.map((category) => category.name).join(" / ") || "Uncategorized"}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-[10px] font-semibold">{money(product.showPrice)}</p>
                  <p className="mt-1 text-[9px] text-[#211A18]/40">Stock {product.stock}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}


export function PrimeProductColorPicker({
  products,
  selections,
  onChange,
  disabled = false,
}: {
  products: HomepageProduct[];
  selections: HomepageProductColorSelection[];
  onChange: (value: HomepageProductColorSelection[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeProductId, setActiveProductId] = useState("");
  const [activeColorId, setActiveColorId] = useState("");

  const selectedProductIds = useMemo(
    () => new Set(selections.map((item) => item.productId)),
    [selections],
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => {
      const colorText = (product.colors || []).map((color) => color.name).join(" ");
      const categoryText = product.categories.map((category) => category.name).join(" ");
      return `${product.name} ${product.slug} ${colorText} ${categoryText}`
        .toLowerCase()
        .includes(query);
    });
  }, [products, search]);

  const activeProduct =
    products.find((product) => product._id === activeProductId) || null;
  const colors = activeProduct?.colors || [];
  const activeColor =
    colors.find((color) => color._id === activeColorId) ||
    colors.find((color) => color.isDefault) ||
    colors[0] ||
    null;

  function chooseProduct(product: HomepageProduct) {
    setActiveProductId(product._id);
    const existing = selections.find((item) => item.productId === product._id);
    const nextColor =
      (product.colors || []).find((color) => color._id === existing?.colorId) ||
      (product.colors || []).find((color) => color.isDefault) ||
      (product.colors || [])[0] ||
      null;
    setActiveColorId(nextColor?._id || "");
  }

  function addSelection() {
    if (!activeProduct || !activeColor) return;
    const next: HomepageProductColorSelection = {
      productId: activeProduct._id,
      colorId: activeColor._id,
      colorName: activeColor.name,
      colorSlug: activeColor.slug,
    };
    onChange([
      ...selections.filter((item) => item.productId !== activeProduct._id),
      next,
    ]);
    setActiveProductId("");
    setActiveColorId("");
  }

  function removeSelection(productId: string) {
    onChange(selections.filter((item) => item.productId !== productId));
  }

  function moveSelection(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= selections.length) return;
    const next = [...selections];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(next);
  }

  return (
    <>
      <section className="rounded-[18px] border border-[#211A18]/10 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[12px] font-semibold text-[#211A18]">
              Hotspot Products + Colors
            </h3>
            <p className="mt-1 text-[9px] leading-4 text-[#211A18]/45">
              Product + color choose karo. ↑ / ↓ se product index/order change karo.
            </p>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen(true)}
            className="h-10 rounded-xl bg-[#A51D45] px-4 text-[9px] font-semibold uppercase tracking-[0.06em] text-white disabled:opacity-50"
          >
            + Choose Product
          </button>
        </div>

        {selections.length === 0 ? (
          <div className="mt-3 rounded-[12px] bg-[#FAF8F6] px-4 py-5 text-center text-[9px] text-[#211A18]/40">
            No product selected.
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {selections.map((selection, index) => {
              const product = products.find(
                (item) => item._id === selection.productId,
              );
              const color =
                product?.colors?.find(
                  (item) => item._id === selection.colorId,
                ) ||
                product?.colors?.find(
                  (item) => item.slug === selection.colorSlug,
                );
              return (
                <div
                  key={selection.productId}
                  className="flex items-center gap-2.5 rounded-[12px] border border-[#211A18]/8 bg-[#FAF8F6] p-2.5"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#211A18] text-[9px] font-bold text-white">
                    {index + 1}
                  </span>
                  {color?.image?.url || product?.image?.url ? (
                    <img
                      src={color?.image?.url || product?.image?.url || ""}
                      alt={product?.name || "Product"}
                      className="h-11 w-11 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#EEE8E3] text-[7px] text-[#211A18]/35">
                      IMG
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-semibold text-[#211A18]">
                      {product?.name ||
                        `Product ${selection.productId.slice(-6)}`}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[9px] text-[#211A18]/45">
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-black/10"
                        style={{ backgroundColor: color?.hex || "#DDD" }}
                      />
                      <span>
                        {selection.colorName ||
                          color?.name ||
                          "Color selected"}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveSelection(index, -1)}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-[#211A18]/10 bg-white text-[#211A18]/65 transition hover:border-[#A51D45]/25 hover:text-[#A51D45] disabled:cursor-not-allowed disabled:opacity-25"
                      title="Move product up"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={index === selections.length - 1}
                      onClick={() => moveSelection(index, 1)}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-[#211A18]/10 bg-white text-[#211A18]/65 transition hover:border-[#A51D45]/25 hover:text-[#A51D45] disabled:cursor-not-allowed disabled:opacity-25"
                      title="Move product down"
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSelection(selection.productId)}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-red-100 bg-red-50 text-red-600"
                      title="Remove product"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {open ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4">
          <div className="flex h-[88vh] max-h-[88vh] w-full max-w-[900px] flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl">
            <div className="shrink-0 flex items-center justify-between border-b border-[#211A18]/10 px-5 py-4">
              <div>
                <h3 className="text-[16px] font-semibold text-[#211A18]">
                  Choose Product & Color
                </h3>
                <p className="mt-1 text-[9px] text-[#211A18]/45">
                  Pehle product select karo, phir color select karke Add Product
                  dabao.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setActiveProductId("");
                  setActiveColorId("");
                  setSearch("");
                }}
                className="grid h-9 w-9 place-items-center rounded-full border border-[#211A18]/10"
              >
                <X size={15} />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 md:grid-cols-[1.1fr_0.9fr]">
              <div className="flex min-h-0 flex-col border-b border-[#211A18]/10 p-4 md:border-b-0 md:border-r">
                <div className="flex h-11 items-center gap-2 rounded-xl border border-[#211A18]/10 bg-[#FAF8F6] px-3">
                  <Search size={14} className="text-[#211A18]/35" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search product..."
                    className="min-w-0 flex-1 bg-transparent text-[10px] outline-none"
                  />
                </div>
                <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-scroll overscroll-contain pr-2 [scrollbar-gutter:stable]">
                  {filteredProducts.map((product) => {
                    const checked = selectedProductIds.has(product._id);
                    const active = product._id === activeProductId;
                    return (
                      <button
                        key={product._id}
                        type="button"
                        onClick={() => chooseProduct(product)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${
                          active
                            ? "border-[#A51D45] bg-[#FFF5F8]"
                            : "border-[#211A18]/8 bg-[#FAF8F6] hover:border-[#A51D45]/30"
                        }`}
                      >
                        {product.image?.url ? (
                          <img
                            src={product.image.url}
                            alt={product.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#EEE8E3] text-[7px] text-[#211A18]/35">
                            IMG
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10px] font-semibold">
                            {product.name}
                          </p>
                          <p className="mt-1 text-[8px] text-[#211A18]/40">
                            {(product.colors || []).length} colors · Stock{" "}
                            {product.stock}
                          </p>
                        </div>
                        {checked ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-[7px] font-semibold text-emerald-700">
                            Added
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex min-h-0 flex-col overflow-hidden p-5">
                {!activeProduct ? (
                  <div className="grid h-full min-h-[260px] place-items-center rounded-[18px] border border-dashed border-[#211A18]/10 text-center">
                    <div>
                      <p className="text-[11px] font-semibold">
                        Select a product
                      </p>
                      <p className="mt-1 text-[9px] text-[#211A18]/40">
                        Uske baad yahan colors dikhenge.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      {activeProduct.image?.url ? (
                        <img
                          src={activeProduct.image.url}
                          alt={activeProduct.name}
                          className="h-14 w-14 rounded-xl object-cover"
                        />
                      ) : null}
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-semibold">
                          {activeProduct.name}
                        </p>
                        <p className="mt-1 text-[9px] text-[#211A18]/40">
                          Choose one color for this hotspot.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-scroll overscroll-contain pr-2 [scrollbar-gutter:stable]">
                      {colors.length === 0 ? (
                        <div className="rounded-xl bg-red-50 px-4 py-4 text-[9px] text-red-600">
                          Is product me koi color available nahi hai.
                        </div>
                      ) : (
                        colors.map((color) => {
                          const active = color._id === activeColor?._id;
                          return (
                            <button
                              key={color._id}
                              type="button"
                              onClick={() => setActiveColorId(color._id)}
                              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${
                                active
                                  ? "border-[#A51D45] bg-[#FFF5F8]"
                                  : "border-[#211A18]/8 bg-[#FAF8F6]"
                              }`}
                            >
                              {color.image?.url ? (
                                <img
                                  src={color.image.url}
                                  alt={color.name}
                                  className="h-12 w-12 rounded-lg object-cover"
                                />
                              ) : (
                                <span
                                  className="h-9 w-9 rounded-full border border-black/10"
                                  style={{
                                    backgroundColor: color.hex || "#DDD",
                                  }}
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-semibold">
                                  {color.name}
                                </p>
                                <p className="mt-1 text-[8px] text-[#211A18]/40">
                                  Stock {color.stock}
                                </p>
                              </div>
                              {active ? (
                                <span className="grid h-5 w-5 place-items-center rounded-full bg-[#A51D45] text-white">
                                  <Check size={12} />
                                </span>
                              ) : null}
                            </button>
                          );
                        })
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={!activeColor}
                      onClick={addSelection}
                      className="mt-4 h-11 w-full shrink-0 rounded-xl bg-[#A51D45] text-[9px] font-semibold uppercase tracking-[0.06em] text-white disabled:opacity-40"
                    >
                      Add Product With This Color
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-between gap-3 border-t border-[#211A18]/10 px-5 py-4">
              <span className="text-[9px] text-[#211A18]/45">
                {selections.length} product(s) selected
              </span>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setActiveProductId("");
                  setActiveColorId("");
                  setSearch("");
                }}
                className="h-10 rounded-xl border border-[#211A18]/10 px-5 text-[9px] font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function ActiveToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-[14px] bg-[#FAF8F6] px-4 py-3">
      <span>
        <span className="block text-[11px] font-semibold">Active</span>
        <span className="mt-1 block text-[9px] text-[#211A18]/40">Only active data appears in public API.</span>
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[#A51D45]" />
    </label>
  );
}
