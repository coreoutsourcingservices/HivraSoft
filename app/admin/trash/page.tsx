"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { confirmAdminAction } from "@/src/components/Admin/AdminConfirmProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type TrashItem = {
  _id: string;
  entityId: string;
  type: string;
  typeLabel: string;
  name: string;
  deletedAt: string;
  permanentDeleteAt: string;
  remainingDays: number;
  deletedBy?: { _id?: string; name?: string; email?: string } | null;
};

type TrashResponse = {
  success: boolean;
  data: TrashItem[];
  counts: Record<string, number>;
  stats: { total: number; products: number; expiringSoon: number };
  pagination: { page: number; limit: number; total: number; totalPages: number };
  message?: string;
};

const filters = [
  ["all", "All"],
  ["product", "Products"],
  ["category", "Categories"],
  ["banner", "Banners"],
  ["blog", "Blogs"],
  ["notification", "Notifications"],
  ["offer", "Offers"],
  ["on_trend_pick", "On-Trend"],
  ["always_in_it", "Always In It"],
  ["prime_selection", "Prime Selection"],
  ["discount_code", "Discount Codes"],
  ["automatic_discount", "Automatic Discount"],
  ["tax", "Tax"],
  ["delivery_charge", "Delivery"],
] as const;

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function remainingClass(days: number) {
  if (days <= 3) return "bg-red-100 text-red-700";
  if (days <= 7) return "bg-amber-100 text-amber-700";
  return "bg-[#F2EEEA] text-black/50";
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export default function AdminTrashPage() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({ total: 0, products: 0, expiringSoon: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [emptying, setEmptying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        type,
        page: String(page),
        limit: "20",
      });
      if (debouncedSearch) params.set("search", debouncedSearch);

      const response = await fetch(`${API_URL}/api/admin/trash?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = (await readJson(response)) as TrashResponse;
      if (!response.ok) throw new Error(data?.message || "Unable to load Trash.");
      setItems(Array.isArray(data?.data) ? data.data : []);
      setCounts(data?.counts || {});
      setStats(data?.stats || { total: 0, products: 0, expiringSoon: 0 });
      setPagination(data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load Trash.");
    } finally {
      setLoading(false);
    }
  }, [type, page, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedFilterLabel = useMemo(
    () => filters.find(([key]) => key === type)?.[1] || "All",
    [type]
  );

  async function restore(item: TrashItem) {
    const confirmed = await confirmAdminAction({
      title: `Restore ${item.typeLabel}?`,
      itemName: item.name,
      description: "The record will return to its normal admin/storefront location with its previous active state.",
      confirmLabel: "Restore Item",
      destructive: false,
    });
    if (!confirmed) return;

    try {
      setBusyId(item._id);
      setError("");
      setSuccess("");
      const response = await fetch(
        `${API_URL}/api/admin/trash/${encodeURIComponent(item.type)}/${item.entityId}/restore`,
        { method: "POST", credentials: "include" }
      );
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to restore item.");
      setSuccess(data?.message || "Item restored successfully.");
      await load();
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : "Unable to restore item.");
    } finally {
      setBusyId("");
    }
  }

  async function permanentDelete(item: TrashItem) {
    const confirmed = await confirmAdminAction({
      title: "Permanently delete this item?",
      itemName: item.name,
      description:
        "This action cannot be undone. The database record and associated Cloudinary media will be permanently removed.",
      confirmLabel: "Delete Permanently",
      requireText: "DELETE",
    });
    if (!confirmed) return;

    try {
      setBusyId(item._id);
      setError("");
      setSuccess("");
      const response = await fetch(
        `${API_URL}/api/admin/trash/${encodeURIComponent(item.type)}/${item.entityId}/permanent`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to permanently delete item.");
      setSuccess(data?.message || "Item permanently deleted.");
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to permanently delete item.");
    } finally {
      setBusyId("");
    }
  }

  async function emptyCurrentTrash() {
    if (stats.total === 0) return;
    const scopeCount = type === "all" ? stats.total : Number(counts[type] || 0);
    if (scopeCount === 0) return;

    const confirmed = await confirmAdminAction({
      title: type === "all" ? "Empty Trash?" : `Empty ${selectedFilterLabel} Trash?`,
      itemName: `${scopeCount} item${scopeCount === 1 ? "" : "s"}`,
      description:
        "All matching records and associated media will be permanently deleted. This action cannot be undone.",
      confirmLabel: "Empty Trash Permanently",
      requireText: "EMPTY TRASH",
    });
    if (!confirmed) return;

    try {
      setEmptying(true);
      setError("");
      setSuccess("");
      const query = type === "all" ? "" : `?type=${encodeURIComponent(type)}`;
      const response = await fetch(`${API_URL}/api/admin/trash/empty${query}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to empty Trash.");
      setSuccess(data?.message || "Trash emptied successfully.");
      setPage(1);
      await load();
    } catch (emptyError) {
      setError(emptyError instanceof Error ? emptyError.message : "Unable to empty Trash.");
    } finally {
      setEmptying(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <section className="relative overflow-hidden rounded-[28px] bg-[#211A18] px-5 py-7 text-white shadow-[0_28px_80px_rgba(45,29,23,0.18)] md:px-8 md:py-9">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#A51D45]/30 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white/55">
              <Trash2 size={13} /> Data Safety
            </div>
            <h1 className="mt-4 text-[30px] font-semibold tracking-[-0.04em] md:text-[40px]">Trash</h1>
            <p className="mt-2 max-w-2xl text-[12px] leading-6 text-white/55 md:text-[13px]">
              Deleted records are retained for 30 days. Restore them safely, or permanently remove them with explicit confirmation.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-4 text-[10px] font-semibold text-white/80 transition hover:bg-white/[0.12] disabled:opacity-50"
            >
              <RefreshCcw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button
              type="button"
              onClick={() => void emptyCurrentTrash()}
              disabled={emptying || stats.total === 0}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-4 text-[10px] font-semibold text-white transition hover:bg-red-700 disabled:opacity-40"
            >
              <Trash2 size={14} /> {emptying ? "Deleting..." : "Empty Trash"}
            </button>
          </div>
        </div>
      </section>

      {(error || success) && (
        <div className={`fixed right-5 top-24 z-[120] flex w-[calc(100%-40px)] max-w-sm items-start gap-3 rounded-2xl border px-4 py-4 text-[11px] font-semibold shadow-2xl ${
          error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}>
          <div className="min-w-0 flex-1">{error || success}</div>
          <button type="button" onClick={() => { setError(""); setSuccess(""); }} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-black/[0.05]" aria-label="Close notification">
            <X size={14} />
          </button>
        </div>
      )}

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Trash Items" value={stats.total} />
        <StatCard label="Products" value={stats.products} />
        <StatCard label="Expiring Soon" value={stats.expiringSoon} warning={stats.expiringSoon > 0} />
      </section>

      <section className="mt-6 rounded-[24px] border border-black/[0.06] bg-white p-4 shadow-[0_18px_55px_rgba(45,29,23,0.05)] md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
            {filters.map(([key, label]) => {
              const count = key === "all" ? stats.total : Number(counts[key] || 0);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setType(key); setPage(1); }}
                  className={`shrink-0 rounded-xl px-3 py-2 text-[10px] font-semibold transition ${
                    type === key ? "bg-[#8C1839] text-white" : "bg-[#F5F1EE] text-black/55 hover:bg-[#EEE7E2]"
                  }`}
                >
                  {label} <span className="ml-1 opacity-65">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="flex h-11 w-full items-center gap-3 rounded-xl border border-black/[0.08] bg-[#FAF8F6] px-3 xl:max-w-sm">
            <Search size={15} className="text-black/30" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search deleted items..."
              className="min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-black/30"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="text-black/30 hover:text-black/60" aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-[24px] border border-black/[0.06] bg-white shadow-[0_18px_55px_rgba(45,29,23,0.05)]">
        {loading ? (
          <div className="py-20 text-center text-[12px] text-black/40">Loading Trash...</div>
        ) : items.length === 0 ? (
          <div className="px-5 py-20 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#F5F1EE] text-black/25"><Trash2 size={24} /></div>
            <h2 className="mt-4 text-[15px] font-semibold">Trash is empty</h2>
            <p className="mt-1 text-[11px] text-black/40">Deleted records will appear here for 30 days.</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[980px] text-left">
                <thead className="bg-[#FAF8F6] text-[9px] font-bold uppercase tracking-[0.12em] text-black/35">
                  <tr>
                    <th className="px-5 py-4">Item</th>
                    <th className="px-4 py-4">Type</th>
                    <th className="px-4 py-4">Deleted</th>
                    <th className="px-4 py-4">Deleted By</th>
                    <th className="px-4 py-4">Expires</th>
                    <th className="px-4 py-4">Remaining</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05]">
                  {items.map((item) => (
                    <tr key={item._id} className="text-[11px] hover:bg-[#FFFDFC]">
                      <td className="max-w-[300px] px-5 py-4"><p className="truncate font-semibold text-[#211A18]">{item.name}</p><p className="mt-1 truncate text-[9px] text-black/35">{item.entityId}</p></td>
                      <td className="px-4 py-4"><span className="rounded-full bg-[#F4F0ED] px-2.5 py-1 text-[9px] font-semibold text-black/50">{item.typeLabel}</span></td>
                      <td className="px-4 py-4 text-black/50">{formatDate(item.deletedAt)}</td>
                      <td className="px-4 py-4 text-black/50">{item.deletedBy?.name || item.deletedBy?.email || "System/Admin"}</td>
                      <td className="px-4 py-4 text-black/50">{formatDate(item.permanentDeleteAt)}</td>
                      <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${remainingClass(item.remainingDays)}`}>{item.remainingDays} day{item.remainingDays === 1 ? "" : "s"}</span></td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button type="button" disabled={busyId === item._id} onClick={() => void restore(item)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 text-[9px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-40"><RotateCcw size={12} />Restore</button>
                          <button type="button" disabled={busyId === item._id} onClick={() => void permanentDelete(item)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 text-[9px] font-semibold text-red-600 hover:bg-red-100 disabled:opacity-40"><Trash2 size={12} />Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-black/[0.06] md:hidden">
              {items.map((item) => (
                <article key={item._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="truncate text-[12px] font-semibold">{item.name}</p><p className="mt-1 text-[9px] text-black/40">{item.typeLabel}</p></div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold ${remainingClass(item.remainingDays)}`}>{item.remainingDays}d</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-[#FAF8F6] p-3 text-[9px] text-black/45">
                    <div><span className="block text-black/30">Deleted</span><span className="mt-1 block">{formatDate(item.deletedAt)}</span></div>
                    <div><span className="block text-black/30">Permanent delete</span><span className="mt-1 block">{formatDate(item.permanentDeleteAt)}</span></div>
                    <div className="col-span-2"><span className="block text-black/30">Deleted by</span><span className="mt-1 block">{item.deletedBy?.name || item.deletedBy?.email || "System/Admin"}</span></div>
                  </div>
                  {item.remainingDays <= 3 && <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-[9px] font-semibold text-red-700"><AlertTriangle size={12} />Permanent deletion is very close.</div>}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button type="button" disabled={busyId === item._id} onClick={() => void restore(item)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-[10px] font-semibold text-emerald-700 disabled:opacity-40"><RotateCcw size={13} />Restore</button>
                    <button type="button" disabled={busyId === item._id} onClick={() => void permanentDelete(item)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-red-50 text-[10px] font-semibold text-red-600 disabled:opacity-40"><Trash2 size={13} />Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        <div className="flex flex-col gap-3 border-t border-black/[0.06] bg-[#FAF8F6] px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
          <p className="text-[10px] text-black/40">{pagination.total} deleted item{pagination.total === 1 ? "" : "s"} · Page {pagination.page} of {pagination.totalPages}</p>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))} className="grid h-9 w-9 place-items-center rounded-xl border border-black/[0.08] bg-white text-black/50 disabled:opacity-30" aria-label="Previous page"><ChevronLeft size={15} /></button>
            <button type="button" disabled={page >= pagination.totalPages || loading} onClick={() => setPage((current) => current + 1)} className="grid h-9 w-9 place-items-center rounded-xl border border-black/[0.08] bg-white text-black/50 disabled:opacity-30" aria-label="Next page"><ChevronRight size={15} /></button>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) {
  return (
    <div className={`rounded-[22px] border bg-white p-5 shadow-[0_12px_35px_rgba(45,29,23,0.04)] ${warning ? "border-amber-200" : "border-black/[0.06]"}`}>
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-black/35">{label}</p>
      <p className={`mt-2 text-[28px] font-semibold tracking-[-0.04em] ${warning ? "text-amber-700" : "text-[#211A18]"}`}>{value}</p>
    </div>
  );
}
