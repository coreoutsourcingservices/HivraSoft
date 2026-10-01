"use client";

import Link from "next/link";
import type { CatalogProduct } from "@/lib/product-catalog";
import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function readJson(response: Response): Promise<{ products?: CatalogProduct[]; message?: string }> {
  try { return await response.json(); } catch { return {}; }
}

function normalizeProduct(product: CatalogProduct) {
  const colors = Array.isArray(product?.colors) ? product.colors : [];
  const defaultColor = colors.find((color) => color?.isDefault) || colors[0];
  const images = Array.isArray(defaultColor?.images) ? defaultColor?.images : [];
  const totalStock = colors.reduce(
    (total, color) => total + (Array.isArray(color?.sizes) ? color.sizes : []).reduce(
      (sum, size) => sum + (size?.isActive === false ? 0 : Math.max(0, Number(size?.stock || 0))), 0
    ), 0
  );
  return {
    id: String(product?._id || ""),
    name: defaultColor?.nameProduct || "Product",
    slug: defaultColor?.slugProduct || "",
    color: defaultColor?.nameColor || "",
    image: images.find((image) => image?.isDefault)?.url || images[0]?.url || "",
    stock: totalStock,
    colors: colors.length,
    isActive: product?.isActive === true,
    isFeatured: product?.isFeatured === true,
    isNewLaunch: product?.isNewLaunch === true,
    updatedAt: product?.updatedAt || product?.createdAt || "",
  };
}

export default function ProductsManager() {
  const [products, setProducts] = useState<ReturnType<typeof normalizeProduct>[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/api/products`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to load products.");
      setProducts((Array.isArray(data?.products) ? data.products : []).map(normalizeProduct).filter((item) => item.id));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadProducts(); }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = !q || product.name.toLowerCase().includes(q) || product.slug.toLowerCase().includes(q) || product.id.toLowerCase().includes(q);
      const matchesFilter = filter === "all" || (filter === "active" ? product.isActive : !product.isActive);
      return matchesSearch && matchesFilter;
    });
  }, [products, search, filter]);

  const updateActive = async (id: string, isActive: boolean) => {
    if (actionId) return;
    try {
      setActionId(id); setError(""); setSuccess("");
      const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to update product.");
      setProducts((current) => current.map((product) => product.id === id ? { ...product, isActive } : product));
      setSuccess(isActive ? "Product activated successfully." : "Product deactivated successfully.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to update product.");
    } finally { setActionId(null); }
  };

  const deleteProduct = async (id: string, name: string) => {
    if (actionId || !window.confirm(`Delete "${name}"?\n\nProduct and its Cloudinary images will be deleted.`)) return;
    try {
      setActionId(id); setError(""); setSuccess("");
      const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: "DELETE", credentials: "include", headers: { Accept: "application/json" },
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to delete product.");
      setProducts((current) => current.filter((product) => product.id !== id));
      setSuccess(data?.message || "Product deleted successfully.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to delete product.");
    } finally { setActionId(null); }
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-8 md:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C1839]">Admin Catalog</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#211A18]">Products</h1>
          <p className="mt-1 text-sm text-[#211A18]/50">Manage color products, images, sizes and stock.</p>
        </div>
        <Link href="/admin/products/new" className="inline-flex h-11 items-center justify-center rounded-xl bg-[#8C1839] px-5 text-xs font-semibold text-white">+ Add Product</Link>
      </div>

      {(error || success) && <div className={`mt-5 rounded-xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>{error || success}</div>}

      <div className="mt-6 grid gap-3 rounded-2xl border border-black/10 bg-white p-4 md:grid-cols-[1fr_180px_auto]">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, slug or ID" className="h-11 rounded-xl border border-black/10 px-4 text-sm outline-none" />
        <select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-11 rounded-xl border border-black/10 px-3 text-sm outline-none">
          <option value="all">All products</option><option value="active">Active</option><option value="inactive">Inactive</option>
        </select>
        <button type="button" onClick={() => void loadProducts()} className="h-11 rounded-xl border border-black/10 px-4 text-sm">Refresh</button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white">
        {loading ? <div className="p-10 text-center text-sm text-black/45">Loading products...</div> : filteredProducts.length === 0 ? <div className="p-10 text-center text-sm text-black/45">No products found.</div> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F8F5F2] text-[10px] uppercase tracking-wider text-black/50"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Colors</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-t border-black/5">
                    <td className="px-4 py-4"><div className="flex min-w-[280px] items-center gap-3">{product.image ? <img src={product.image} alt={product.name} className="h-14 w-12 rounded-lg object-cover" /> : <div className="h-14 w-12 rounded-lg bg-[#F3EEE8]" />}<div><div className="font-semibold text-[#211A18]">{product.name}</div><div className="mt-1 text-[11px] text-black/45">{product.slug}</div>{product.color && <div className="mt-1 text-[10px] text-black/40">Default: {product.color}</div>}</div></div></td>
                    <td className="px-4 py-4"><span className={product.stock > 0 ? "text-green-700" : "text-red-600"}>{product.stock}</span></td>
                    <td className="px-4 py-4">{product.colors}</td>
                    <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${product.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>{product.isActive ? "Active" : "Inactive"}</span></td>
                    <td className="px-4 py-4"><div className="flex justify-end gap-2"><Link href={`/admin/products/${product.id}/edit`} className="rounded-lg border border-black/10 px-3 py-2 text-xs">Edit</Link><button type="button" disabled={actionId === product.id} onClick={() => void updateActive(product.id, !product.isActive)} className="rounded-lg border border-black/10 px-3 py-2 text-xs">{product.isActive ? "Disable" : "Activate"}</button><button type="button" disabled={actionId === product.id} onClick={() => void deleteProduct(product.id, product.name)} className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-600">Delete</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
