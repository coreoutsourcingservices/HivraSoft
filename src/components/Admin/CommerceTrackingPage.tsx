"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Heart, Loader2, Search, ShoppingCart } from "lucide-react";
import {
  getAdminCartTracking,
  getAdminWishlistTracking,
  type CommerceTrackingRow,
} from "@/lib/admin-api";

function money(value: unknown) {
  const amount = Number(value || 0);
  return `₹${Number.isFinite(amount) ? amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}`;
}

function dateTime(value: unknown) {
  if (!value) return "—";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const classes = status === "PURCHASED"
    ? "bg-emerald-50 text-emerald-700"
    : status === "REMOVED"
      ? "bg-slate-100 text-slate-600"
      : "bg-amber-50 text-amber-700";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide ${classes}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function EmailBadge({ label, sent }: { label: string; sent: boolean }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-[8px] font-semibold uppercase tracking-wide ${sent ? "bg-emerald-50 text-emerald-700" : "bg-[#F7F3EF] text-[#211A18]/40"}`}>
      {label}: {sent ? "Sent" : "Pending"}
    </span>
  );
}

export default function CommerceTrackingPage({ kind }: { kind: "cart" | "wishlist" }) {
  const isCart = kind === "cart";
  const [rows, setRows] = useState<CommerceTrackingRow[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = isCart
        ? await getAdminCartTracking({ page, limit: 20, search: search.trim(), status, dateFrom, dateTo })
        : await getAdminWishlistTracking({ page, limit: 20, search: search.trim(), status, dateFrom, dateTo });
      setRows(result.tracking);
      setPagination(result.pagination);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : `Unable to load ${kind} tracking.`);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, isCart, kind, page, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const Icon = isCart ? ShoppingCart : Heart;
  const title = isCart ? "Cart Tracking" : "Wishlist Tracking";
  const description = isCart
    ? "See which customer added which product, quantity, exact time, purchase status and email reminders."
    : "See which customer saved which product, exact time, purchase status and email reminders.";

  return (
    <section className="mx-auto w-full max-w-[1600px]">
      <div className="rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#8C1839]">Customer Intelligence</p>
            <div className="mt-2 flex items-center gap-2">
              <Icon size={22} className="text-[#8C1839]" />
              <h1 className="text-2xl font-semibold text-[#211A18]">{title}</h1>
            </div>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-[#211A18]/50">{description}</p>
          </div>
          <div className="rounded-xl bg-[#F7F3EF] px-4 py-3 text-[10px] font-semibold text-[#211A18]/60">
            {pagination.total.toLocaleString("en-IN")} tracking record{pagination.total === 1 ? "" : "s"}
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-5">
          <label className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#211A18]/35" size={15} />
            <input
              value={search}
              onChange={(event) => { setPage(1); setSearch(event.target.value); }}
              placeholder="Search user, email or product"
              className="h-11 w-full rounded-xl border border-[#211A18]/10 bg-[#FAF8F6] pl-9 pr-3 text-xs outline-none focus:border-[#8C1839]/40"
            />
          </label>

          <select
            value={status}
            onChange={(event) => { setPage(1); setStatus(event.target.value); }}
            className="h-11 rounded-xl border border-[#211A18]/10 bg-white px-3 text-xs outline-none focus:border-[#8C1839]/40"
          >
            <option value="">All status</option>
            <option value={isCart ? "IN_CART" : "IN_WISHLIST"}>{isCart ? "In Cart" : "In Wishlist"}</option>
            <option value="PURCHASED">Purchased</option>
            <option value="REMOVED">Removed</option>
          </select>

          <input
            type="date"
            aria-label="From date"
            value={dateFrom}
            onChange={(event) => { setPage(1); setDateFrom(event.target.value); }}
            className="h-11 rounded-xl border border-[#211A18]/10 bg-white px-3 text-xs outline-none focus:border-[#8C1839]/40"
          />
          <input
            type="date"
            aria-label="To date"
            value={dateTo}
            onChange={(event) => { setPage(1); setDateTo(event.target.value); }}
            className="h-11 rounded-xl border border-[#211A18]/10 bg-white px-3 text-xs outline-none focus:border-[#8C1839]/40"
          />
        </div>

        {error && (
          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            <span>{error}</span>
            <button type="button" onClick={() => void load()} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 font-semibold">Retry</button>
          </div>
        )}

        <div className="mt-5 overflow-x-auto rounded-2xl border border-[#211A18]/8">
          <table className="w-full min-w-[1120px] text-left">
            <thead className="bg-[#FAF8F6]">
              <tr className="text-[9px] uppercase tracking-[0.12em] text-[#211A18]/50">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Product</th>
                {isCart && <th className="px-4 py-3">Qty</th>}
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Added At</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Email Tracking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#211A18]/7">
              {loading ? (
                <tr><td colSpan={isCart ? 7 : 6} className="py-16 text-center text-xs text-[#211A18]/45"><Loader2 className="mx-auto mb-2 animate-spin" size={20} />Loading tracking...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={isCart ? 7 : 6} className="py-16 text-center text-xs text-[#211A18]/45">No tracking records found.</td></tr>
              ) : rows.map((row) => (
                <tr key={row.id} className="text-[10px] text-[#211A18]/65 hover:bg-[#FAF8F6]/60">
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-center gap-3">
                      {row.user.photo ? (
                        <img src={row.user.photo} alt={row.user.name} className="h-9 w-9 rounded-full border border-[#211A18]/10 object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8C1839]/10 font-semibold text-[#8C1839]">{row.user.name.slice(0, 1).toUpperCase()}</div>
                      )}
                      <div>
                        <Link href={`/admin/customers/${encodeURIComponent(row.user.id)}`} className="font-semibold text-[#211A18] hover:text-[#8C1839]">{row.user.name}</Link>
                        <div className="mt-1 text-[9px] text-[#211A18]/45">{row.user.email || "—"}</div>
                        <div className="mt-0.5 text-[9px] text-[#211A18]/35">{row.user.phone || "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-center gap-3">
                      {row.product.imageUrl ? (
                        <img src={row.product.imageUrl} alt={row.product.name} className="h-12 w-12 rounded-xl border border-[#211A18]/10 object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F7F3EF] text-[8px] text-[#211A18]/35">No image</div>
                      )}
                      <div>
                        <div className="font-semibold text-[#211A18]">{row.product.name}</div>
                        <div className="mt-1 text-[9px] text-[#211A18]/45">{[row.product.colorName, row.product.sizeName].filter(Boolean).join(" / ") || "Default variant"}</div>
                        <div className="mt-0.5 max-w-[220px] truncate text-[8px] text-[#211A18]/30">{row.product.id}</div>
                      </div>
                    </div>
                  </td>
                  {isCart && <td className="px-4 py-4 align-top font-semibold text-[#211A18]">{row.quantity}</td>}
                  <td className="px-4 py-4 align-top font-semibold text-[#211A18]">{money(row.product.price)}</td>
                  <td className="px-4 py-4 align-top">
                    <div className="font-medium text-[#211A18]">{dateTime(row.addedAt)}</div>
                    <div className="mt-1 text-[9px] text-[#211A18]/35">Updated {dateTime(row.updatedAt)}</div>
                  </td>
                  <td className="px-4 py-4 align-top"><StatusBadge status={row.status} /></td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex max-w-[260px] flex-wrap gap-1.5">
                      <EmailBadge label="Added" sent={row.email.addedSent} />
                      <EmailBadge label="20 Min" sent={row.email.reminder20MinSent} />
                      <EmailBadge label="24 Hour" sent={row.email.reminder24HourSent} />
                      <EmailBadge label="48 Hr / 2 Day" sent={row.email.reminder48HourSent} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] text-[#211A18]/45">Page {pagination.page} of {pagination.totalPages}</p>
          <div className="flex gap-2">
            <button type="button" disabled={pagination.page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="h-9 rounded-lg border border-[#211A18]/10 bg-white px-4 text-[10px] font-semibold disabled:opacity-40">Previous</button>
            <button type="button" disabled={pagination.page >= pagination.totalPages || loading} onClick={() => setPage((value) => value + 1)} className="h-9 rounded-lg bg-[#8C1839] px-4 text-[10px] font-semibold text-white disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </section>
  );
}
