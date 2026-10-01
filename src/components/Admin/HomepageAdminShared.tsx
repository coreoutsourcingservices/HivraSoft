"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ImagePlus, Loader2, Search, X } from "lucide-react";

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

export type HomepageProduct = {
  _id: string;
  name: string;
  slug: string;
  colorName?: string;
  originalPrice: number;
  showPrice: number;
  stock: number;
  image?: HomepageImage | null;
  categories: HomepageCategory[];
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
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => {
      const categories = product.categories.map((category) => category.name).join(" ").toLowerCase();
      return `${product.name} ${product.slug} ${product.colorName || ""} ${categories}`.toLowerCase().includes(query);
    });
  }, [products, search]);

  function toggle(id: string) {
    if (selected.has(id)) onChange(selectedIds.filter((item) => item !== id));
    else onChange([...selectedIds, id]);
  }

  return (
    <section className="rounded-[20px] border border-[#211A18]/10 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-semibold">Select Products</h3>
          <p className="mt-1 text-[10px] text-[#211A18]/45">Admin jitne chahe products select kar sakta hai.</p>
        </div>
        <span className="rounded-full bg-[#F8E8ED] px-3 py-1.5 text-[10px] font-semibold text-[#8C1839]">{selectedIds.length} selected</span>
      </div>

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
          <div className="rounded-[14px] border border-dashed border-[#211A18]/10 px-4 py-8 text-center text-[11px] text-[#211A18]/40">No products found.</div>
        ) : (
          filtered.map((product) => {
            const checked = selected.has(product._id);
            return (
              <button
                key={product._id}
                type="button"
                onClick={() => toggle(product._id)}
                className={`flex w-full items-center gap-3 rounded-[14px] border p-3 text-left ${checked ? "border-[#A51D45]/25 bg-[#FFF5F8]" : "border-[#211A18]/8 bg-[#FAF8F6]"}`}
              >
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${checked ? "border-[#A51D45] bg-[#A51D45] text-white" : "border-[#211A18]/15 bg-white"}`}>
                  {checked && <Check size={13} />}
                </span>
                {product.image?.url ? (
                  <img src={product.image.url} alt={product.name} className="h-11 w-11 rounded-xl object-cover" />
                ) : (
                  <div className="grid h-11 w-11 rounded-xl bg-[#EEE8E3] text-[8px] text-[#211A18]/35 place-items-center">IMG</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold">{product.name}</p>
                  <p className="mt-1 truncate text-[9px] text-[#211A18]/40">{product.categories.map((category) => category.name).join(" / ") || "Uncategorized"}</p>
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
