"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  ActiveToggle,
  formatDateTime,
  HOMEPAGE_API_URL,
  ImageUploadField,
  MultiProductPicker,
  readJson,
  type HomepageImage,
  useHomepageOptions,
} from "@/src/components/Admin/HomepageAdminShared";

type Gender = "men" | "women";

type AlwaysItem = {
  _id: string;
  gender: Gender;
  mainImage: HomepageImage;
  productIds: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type HistoryItem = {
  _id?: string;
  itemId: string;
  action: string;
  gender: Gender;
  mainImage?: HomepageImage;
  productIds?: string[];
  isActive?: boolean;
  changedAt?: string;
};

export default function AlwaysInItAdminPage() {
  const { products, loading: optionsLoading, error: optionsError } = useHomepageOptions();
  const [items, setItems] = useState<AlwaysItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState("");
  const [gender, setGender] = useState<Gender>("women");
  const [mainImage, setMainImage] = useState<HomepageImage | null>(null);
  const [productIds, setProductIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${HOMEPAGE_API_URL}/api/admin/always-in-it`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to load Always In It.");
      setItems(Array.isArray(data?.items) ? data.items : []);
      setHistory(Array.isArray(data?.history) ? data.history : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load Always In It.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setEditingId("");
    setGender("women");
    setMainImage(null);
    setProductIds([]);
    setIsActive(true);
  }

  function editItem(item: AlwaysItem) {
    setEditingId(item._id);
    setGender(item.gender);
    setMainImage(item.mainImage || null);
    setProductIds(Array.isArray(item.productIds) ? item.productIds.map(String) : []);
    setIsActive(item.isActive !== false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveItem() {
    try {
      setError("");
      setSuccess("");
      if (!mainImage?.url || !mainImage.publicId) throw new Error("Main image upload is required.");
      if (productIds.length === 0) throw new Error("At least one product select karo.");

      setSaving(true);
      const response = await fetch(
        editingId
          ? `${HOMEPAGE_API_URL}/api/admin/always-in-it/${editingId}`
          : `${HOMEPAGE_API_URL}/api/admin/always-in-it`,
        {
          method: editingId ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gender, mainImage, productIds, isActive }),
        }
      );
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to save Always In It.");
      setItems(Array.isArray(data?.items) ? data.items : []);
      setHistory(Array.isArray(data?.history) ? data.history : []);
      setSuccess(data?.message || "Saved successfully.");
      resetForm();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save Always In It.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(item: AlwaysItem) {
    if (!window.confirm(`Delete ${item.gender} Always In It? History will remain saved.`)) return;
    try {
      setBusyId(item._id);
      setError("");
      setSuccess("");
      const response = await fetch(`${HOMEPAGE_API_URL}/api/admin/always-in-it/${item._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to delete Always In It.");
      setItems(Array.isArray(data?.items) ? data.items : []);
      setHistory(Array.isArray(data?.history) ? data.history : []);
      setSuccess(data?.message || "Deleted.");
      if (editingId === item._id) resetForm();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete Always In It.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="p-5 md:p-7 xl:p-8">
      <section className="rounded-[26px] bg-[#211A18] p-6 text-white md:p-7">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/45">Homepage Management</p>
        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-[28px] font-semibold">ALWAYS IN IT</h1>
            <p className="mt-2 max-w-2xl text-[12px] leading-5 text-white/55">Gender select karo, main image Cloudinary par upload karo aur jitne products chaho select karo. Men aur Women ka ek-ek record rahega.</p>
          </div>
          <div className="rounded-[16px] bg-white/[0.08] px-4 py-3 text-[11px] text-white/65">{items.length}/2 gender records</div>
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
            <div><h2 className="text-[18px] font-semibold">{editingId ? "Edit Record" : "Add Record"}</h2><p className="mt-1 text-[10px] text-[#211A18]/45">First gender, then image, then products.</p></div>
            {editingId && <button type="button" onClick={resetForm} className="rounded-xl border border-[#211A18]/10 px-3 py-2 text-[10px] font-semibold">Cancel edit</button>}
          </div>

          <label className="mt-5 block">
            <span className="text-[12px] font-semibold">Gender</span>
            <select value={gender} onChange={(event) => setGender(event.target.value as Gender)} className="mt-3 h-12 w-full rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4 text-[12px] outline-none">
              <option value="women">Women</option>
              <option value="men">Men</option>
            </select>
          </label>

          <div className="mt-4"><ImageUploadField label="Main Image" folder={`homepage/always-in-it/${gender}`} value={mainImage} onChange={setMainImage} /></div>
          <div className="mt-4"><ActiveToggle checked={isActive} onChange={setIsActive} /></div>

          <button type="button" onClick={() => void saveItem()} disabled={saving || optionsLoading} className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#A51D45] text-[11px] font-semibold uppercase tracking-[0.08em] text-white disabled:opacity-50">
            {editingId ? <Pencil size={14} /> : <Plus size={14} />}
            {saving ? "Saving..." : editingId ? "Update Record" : "Add Record"}
          </button>
        </section>

        <div className="space-y-5">
          <MultiProductPicker products={products} selectedIds={productIds} onChange={setProductIds} />

          <section className="rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
            <div className="flex items-center justify-between border-b border-[#211A18]/8 pb-5"><div><h2 className="text-[18px] font-semibold">Always In It Records</h2><p className="mt-1 text-[10px] text-[#211A18]/45">Edit or delete Men/Women data.</p></div><span className="rounded-full bg-[#F2EEEA] px-3 py-1.5 text-[10px] font-semibold">{items.length} records</span></div>
            {loading ? (
              <div className="py-12 text-center text-[12px] text-[#211A18]/40">Loading...</div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-[12px] text-[#211A18]/40">No Always In It record yet.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {items.map((item) => (
                  <div key={item._id} className="flex flex-col gap-4 rounded-[18px] bg-[#FAF8F6] p-4 sm:flex-row sm:items-center">
                    <img src={item.mainImage?.url} alt={item.gender} className="h-24 w-full rounded-[14px] object-cover sm:w-36" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><p className="text-[12px] font-semibold capitalize">{item.gender}</p><span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-600"}`}>{item.isActive ? "Active" : "Inactive"}</span></div>
                      <p className="mt-2 text-[10px] text-[#211A18]/50">{Array.isArray(item.productIds) ? item.productIds.length : 0} products selected</p>
                      <p className="mt-1 text-[9px] text-[#211A18]/35">Updated {formatDateTime(item.updatedAt)}</p>
                    </div>
                    <div className="flex gap-2"><button type="button" onClick={() => editItem(item)} className="rounded-xl border border-[#211A18]/10 bg-white px-3 py-2 text-[10px] font-semibold">Edit</button><button type="button" disabled={busyId === item._id} onClick={() => void deleteItem(item)} className="flex items-center gap-1 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-semibold text-red-600 disabled:opacity-50"><Trash2 size={12} />Delete</button></div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <section className="mt-6 rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
        <div className="border-b border-[#211A18]/8 pb-5"><h2 className="text-[18px] font-semibold">Always In It History</h2><p className="mt-1 text-[10px] text-[#211A18]/45">Create, edit, status and delete snapshots.</p></div>
        {history.length === 0 ? <div className="py-10 text-center text-[12px] text-[#211A18]/40">No history yet.</div> : (
          <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-[11px]"><thead className="text-[9px] uppercase tracking-[0.08em] text-[#211A18]/40"><tr><th className="px-3 py-3">Changed</th><th className="px-3 py-3">Action</th><th className="px-3 py-3">Gender</th><th className="px-3 py-3">Products</th><th className="px-3 py-3">Status</th></tr></thead><tbody>{history.map((entry, index) => <tr key={entry._id || `${entry.itemId}-${index}`} className="border-t border-[#211A18]/6"><td className="px-3 py-3">{formatDateTime(entry.changedAt)}</td><td className="px-3 py-3 font-semibold capitalize">{String(entry.action || "updated").replaceAll("_", " ")}</td><td className="px-3 py-3 capitalize">{entry.gender}</td><td className="px-3 py-3">{Array.isArray(entry.productIds) ? entry.productIds.length : 0}</td><td className="px-3 py-3">{entry.isActive ? "Active" : "Inactive"}</td></tr>)}</tbody></table></div>
        )}
      </section>
    </div>
  );
}
