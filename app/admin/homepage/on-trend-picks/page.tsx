"use client";



import { confirmAdminAction } from "@/src/components/Admin/AdminConfirmProvider";



import { useCallback, useEffect, useMemo, useState } from "react";

import { Pencil, Plus, Trash2 } from "lucide-react";

import {

  ActiveToggle,

  CategorySelect,

  formatDateTime,

  HOMEPAGE_API_URL,

  ImageUploadField,

  ProductSelect,

  readJson,

  type HomepageImage,

  useHomepageOptions,

} from "@/src/components/Admin/HomepageAdminShared";



type RedirectType = "none" | "link" | "product" | "category";



type OnTrendItem = {

  _id: string;

  image: HomepageImage;

  link?: string;

  productId?: string | null;

  categoryId?: string | null;

  order: number;

  isActive: boolean;

  createdAt?: string;

  updatedAt?: string;

};



type HistoryItem = {

  _id?: string;

  itemId: string;

  action: string;

  image?: HomepageImage;

  link?: string;

  productId?: string | null;

  categoryId?: string | null;

  order?: number;

  isActive?: boolean;

  changedAt?: string;

};



const emptyImage: HomepageImage | null = null;



export default function OnTrendPicksAdminPage() {

  const { products, categories, loading: optionsLoading, error: optionsError } = useHomepageOptions();

  const [items, setItems] = useState<OnTrendItem[]>([]);

  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [busyId, setBusyId] = useState("");

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");



  const [editingId, setEditingId] = useState("");

  const [image, setImage] = useState<HomepageImage | null>(emptyImage);

  const [redirectType, setRedirectType] = useState<RedirectType>("none");

  const [link, setLink] = useState("");

  const [productId, setProductId] = useState("");

  const [categoryId, setCategoryId] = useState("");

  const [order, setOrder] = useState("0");

  const [isActive, setIsActive] = useState(true);



  const productMap = useMemo(() => new Map(products.map((product) => [product._id, product.name])), [products]);

  const categoryMap = useMemo(() => new Map(categories.map((category) => [category._id, category.name])), [categories]);



  const load = useCallback(async () => {

    try {

      setLoading(true);

      setError("");

      const response = await fetch(`${HOMEPAGE_API_URL}/api/admin/on-trend-picks`, {

        credentials: "include",

        cache: "no-store",

      });

      const data = await readJson(response);

      if (!response.ok) throw new Error(data?.message || "Unable to load On Trend Picks.");

      setItems(Array.isArray(data?.items) ? data.items : []);

      setHistory(Array.isArray(data?.history) ? data.history : []);

    } catch (loadError) {

      setError(loadError instanceof Error ? loadError.message : "Unable to load On Trend Picks.");

    } finally {

      setLoading(false);

    }

  }, []);



  useEffect(() => {

    void load();

  }, [load]);



  function resetForm() {

    setEditingId("");

    setImage(null);

    setRedirectType("none");

    setLink("");

    setProductId("");

    setCategoryId("");

    setOrder("0");

    setIsActive(true);

  }



  function editItem(item: OnTrendItem) {

    setEditingId(item._id);

    setImage(item.image || null);

    setOrder(String(item.order ?? 0));

    setIsActive(item.isActive !== false);

    if (item.link) {

      setRedirectType("link");

      setLink(item.link);

      setProductId("");

      setCategoryId("");

    } else if (item.productId) {

      setRedirectType("product");

      setProductId(String(item.productId));

      setLink("");

      setCategoryId("");

    } else if (item.categoryId) {

      setRedirectType("category");

      setCategoryId(String(item.categoryId));

      setLink("");

      setProductId("");

    } else {

      setRedirectType("none");

      setLink("");

      setProductId("");

      setCategoryId("");

    }

    window.scrollTo({ top: 0, behavior: "smooth" });

  }



  async function saveItem() {

    try {

      setError("");

      setSuccess("");

      if (!image?.url || !image.publicId) throw new Error("Image upload is required.");

      if (redirectType === "link" && !link.trim()) throw new Error("Link is required.");

      if (redirectType === "product" && !productId) throw new Error("Product is required.");

      if (redirectType === "category" && !categoryId) throw new Error("Category is required.");



      const payload = {

        image,

        link: redirectType === "link" ? link.trim() : "",

        productId: redirectType === "product" ? productId : null,

        categoryId: redirectType === "category" ? categoryId : null,

        order: Number(order || 0),

        isActive,

      };



      setSaving(true);

      const response = await fetch(

        editingId

          ? `${HOMEPAGE_API_URL}/api/admin/on-trend-picks/${editingId}`

          : `${HOMEPAGE_API_URL}/api/admin/on-trend-picks`,

        {

          method: editingId ? "PATCH" : "POST",

          credentials: "include",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify(payload),

        }

      );

      const data = await readJson(response);

      if (!response.ok) throw new Error(data?.message || "Unable to save On Trend Pick.");

      setSuccess(data?.message || "Saved successfully.");

      setItems(Array.isArray(data?.items) ? data.items : []);

      setHistory(Array.isArray(data?.history) ? data.history : []);

      resetForm();

    } catch (saveError) {

      setError(saveError instanceof Error ? saveError.message : "Unable to save On Trend Pick.");

    } finally {

      setSaving(false);

    }

  }



  async function deleteItem(item: OnTrendItem) {

    const confirmed = await confirmAdminAction({

      title: "Delete On-Trend Pick?",

      description: "This homepage card will move to Trash for 30 days. Its image will not be removed from Cloudinary yet.",

      confirmLabel: "Move to Trash",

    });

    if (!confirmed) return;

    try {

      setBusyId(item._id);

      setError("");

      setSuccess("");

      const response = await fetch(`${HOMEPAGE_API_URL}/api/admin/on-trend-picks/${item._id}`, {

        method: "DELETE",

        credentials: "include",

      });

      const data = await readJson(response);

      if (!response.ok) throw new Error(data?.message || "Unable to delete item.");

      setItems(Array.isArray(data?.items) ? data.items : []);

      setHistory(Array.isArray(data?.history) ? data.history : []);

      setSuccess(data?.message || "Deleted.");

      if (editingId === item._id) resetForm();

    } catch (deleteError) {

      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete item.");

    } finally {

      setBusyId("");

    }

  }



  function redirectText(item: Pick<OnTrendItem, "link" | "productId" | "categoryId">) {

    if (item.link) return `Link: ${item.link}`;

    if (item.productId) return `Product: ${productMap.get(String(item.productId)) || String(item.productId)}`;

    if (item.categoryId) return `Category: ${categoryMap.get(String(item.categoryId)) || String(item.categoryId)}`;

    return "No redirect";

  }



  return (

    <div className="p-5 md:p-7 xl:p-8">

      <section className="rounded-[26px] bg-[#211A18] p-6 text-white md:p-7">

        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/45">Homepage Management</p>

        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

          <div>

            <h1 className="text-[28px] font-semibold">ON TREND PICKS</h1>

            <p className="mt-2 max-w-2xl text-[12px] leading-5 text-white/55">Image Cloudinary par upload hogi. Har card ko custom link, product ya category me se kisi ek se connect karo. Edit, delete aur full history yahin milegi.</p>

          </div>

          <div className="rounded-[16px] bg-white/[0.08] px-4 py-3 text-[11px] text-white/65">{items.length} active records</div>

        </div>

      </section>



      {(error || success || optionsError) && (

        <div className={`mt-5 rounded-[16px] border px-4 py-3 text-[12px] ${error || optionsError ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>

          {error || optionsError || success}

        </div>

      )}



      <div className="mt-6 grid gap-5 xl:grid-cols-[430px_1fr]">

        <section className="h-fit rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">

          <div className="flex items-center justify-between gap-3">

            <div>

              <h2 className="text-[18px] font-semibold">{editingId ? "Edit Pick" : "Add Pick"}</h2>

              <p className="mt-1 text-[10px] text-[#211A18]/45">Image mandatory hai. Redirect optional hai.</p>

            </div>

            {editingId && (

              <button type="button" onClick={resetForm} className="rounded-xl border border-[#211A18]/10 px-3 py-2 text-[10px] font-semibold">Cancel edit</button>

            )}

          </div>



          <div className="mt-5">

            <ImageUploadField label="Image" folder="homepage/on-trend-picks" value={image} onChange={setImage} />

          </div>



          <label className="mt-4 block">

            <span className="text-[12px] font-semibold">Redirect type</span>

            <select

              value={redirectType}

              onChange={(event) => {

                const next = event.target.value as RedirectType;

                setRedirectType(next);

                if (next !== "link") setLink("");

                if (next !== "product") setProductId("");

                if (next !== "category") setCategoryId("");

              }}

              className="mt-3 h-12 w-full rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4 text-[12px] outline-none"

            >

              <option value="none">No redirect</option>

              <option value="link">Custom link</option>

              <option value="product">Product</option>

              <option value="category">Category</option>

            </select>

          </label>



          {redirectType === "link" && (

            <label className="mt-4 block">

              <span className="text-[12px] font-semibold">Link</span>

              <input value={link} onChange={(event) => setLink(event.target.value)} placeholder="/collections/core-tshirts" className="mt-3 h-12 w-full rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4 text-[12px] outline-none" />

            </label>

          )}



          {redirectType === "product" && (

            <div className="mt-4"><ProductSelect products={products} value={productId} onChange={setProductId} disabled={optionsLoading} /></div>

          )}



          {redirectType === "category" && (

            <div className="mt-4"><CategorySelect categories={categories} value={categoryId} onChange={setCategoryId} disabled={optionsLoading} /></div>

          )}



          <label className="mt-4 block">

            <span className="text-[12px] font-semibold">Order</span>

            <input
              type="number"
              min={0}
              value={order}
              onChange={(event) => setOrder(event.target.value)}
              className="mt-3 h-12 w-full rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4 text-[12px] outline-none"
            />

          </label>



          {/* UI only - no backend/API/database connection */}
          <div className="mt-4 rounded-[18px] border border-[#211A18]/10 bg-[#FAF8F6] p-4">

            <p className="text-[12px] font-semibold text-[#211A18]">Gender</p>

            <div className="mt-3 grid grid-cols-2 gap-3">

              <div className="rounded-[14px] border border-[#211A18]/8 bg-white px-4 py-3">

                <p className="text-[10px] text-[#211A18]/50">Men</p>

                <p className="mt-1 text-[20px] font-semibold leading-none text-[#211A18]">1</p>

              </div>

              <div className="rounded-[14px] border border-[#211A18]/8 bg-white px-4 py-3">

                <p className="text-[10px] text-[#211A18]/50">Women</p>

                <p className="mt-1 text-[20px] font-semibold leading-none text-[#211A18]">0</p>

              </div>

            </div>

          </div>



          <div className="mt-4"><ActiveToggle checked={isActive} onChange={setIsActive} /></div>



          <button type="button" onClick={() => void saveItem()} disabled={saving || optionsLoading} className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#A51D45] text-[11px] font-semibold uppercase tracking-[0.08em] text-white disabled:opacity-50">

            {editingId ? <Pencil size={14} /> : <Plus size={14} />}

            {saving ? "Saving..." : editingId ? "Update Pick" : "Add Pick"}

          </button>

        </section>



        <section className="rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">

          <div className="flex items-center justify-between border-b border-[#211A18]/8 pb-5">

            <div><h2 className="text-[18px] font-semibold">On Trend Items</h2><p className="mt-1 text-[10px] text-[#211A18]/45">Edit ya delete kisi bhi card ko karo.</p></div>

            <span className="rounded-full bg-[#F2EEEA] px-3 py-1.5 text-[10px] font-semibold">{items.length} items</span>

          </div>



          {loading ? (

            <div className="py-14 text-center text-[12px] text-[#211A18]/40">Loading...</div>

          ) : items.length === 0 ? (

            <div className="py-14 text-center text-[12px] text-[#211A18]/40">No On Trend Pick added yet.</div>

          ) : (

            <div className="mt-4 space-y-3">

              {items.map((item) => (

                <div key={item._id} className="flex flex-col gap-4 rounded-[18px] bg-[#FAF8F6] p-4 sm:flex-row sm:items-center">

                  <img src={item.image?.url} alt="On trend" className="h-24 w-full rounded-[14px] object-cover sm:w-36" />

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2">

                      <p className="text-[12px] font-semibold">Order {item.order ?? 0}</p>

                      <span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-600"}`}>{item.isActive ? "Active" : "Inactive"}</span>

                    </div>

                    <p className="mt-2 break-all text-[10px] text-[#211A18]/50">{redirectText(item)}</p>

                    <p className="mt-1 text-[9px] text-[#211A18]/35">Updated {formatDateTime(item.updatedAt)}</p>

                  </div>

                  <div className="flex gap-2">

                    <button type="button" onClick={() => editItem(item)} className="rounded-xl border border-[#211A18]/10 bg-white px-3 py-2 text-[10px] font-semibold">Edit</button>

                    <button type="button" disabled={busyId === item._id} onClick={() => void deleteItem(item)} className="flex items-center gap-1 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-semibold text-red-600 disabled:opacity-50"><Trash2 size={12} />Delete</button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

      </div>



      <section className="mt-6 rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">

        <div className="border-b border-[#211A18]/8 pb-5">

          <h2 className="text-[18px] font-semibold">On Trend History</h2>

          <p className="mt-1 text-[10px] text-[#211A18]/45">Create, edit, status aur delete ka data save rahega.</p>

        </div>

        {history.length === 0 ? (

          <div className="py-10 text-center text-[12px] text-[#211A18]/40">No history yet.</div>

        ) : (

          <div className="mt-4 overflow-x-auto">

            <table className="w-full min-w-[900px] text-left text-[11px]">

              <thead className="text-[9px] uppercase tracking-[0.08em] text-[#211A18]/40"><tr><th className="px-3 py-3">Changed</th><th className="px-3 py-3">Action</th><th className="px-3 py-3">Redirect</th><th className="px-3 py-3">Order</th><th className="px-3 py-3">Status</th></tr></thead>

              <tbody>

                {history.map((entry, index) => (

                  <tr key={entry._id || `${entry.itemId}-${index}`} className="border-t border-[#211A18]/6">

                    <td className="px-3 py-3">{formatDateTime(entry.changedAt)}</td>

                    <td className="px-3 py-3 font-semibold capitalize">{String(entry.action || "updated").replaceAll("_", " ")}</td>

                    <td className="max-w-[430px] px-3 py-3 break-all">{redirectText(entry)}</td>

                    <td className="px-3 py-3">{entry.order ?? 0}</td>

                    <td className="px-3 py-3">{entry.isActive ? "Active" : "Inactive"}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </div>

  );

}
