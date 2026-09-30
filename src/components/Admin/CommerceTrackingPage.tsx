"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FileSpreadsheet, Heart, Loader2, Search, ShoppingCart } from "lucide-react";
import {
  getAdminCartTracking,
  getAdminWishlistTracking,
  type CommerceTrackingRow,
} from "@/lib/admin-api";

function money(value: unknown) {
  const amount = Number(value || 0);
  return `₹${Number.isFinite(amount) ? amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}`;
}

function parsedDate(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateTime(value: unknown) {
  const date = parsedDate(value);
  if (!date) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function exportDate(value: unknown) {
  const date = parsedDate(value);
  if (!date) return "";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function exportTime(value: unknown) {
  const date = parsedDate(value);
  if (!date) return "";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function xmlEscape(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function textCell(value: unknown) {
  return `<Cell><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`;
}

function numberCell(value: unknown) {
  const number = Number(value || 0);
  return `<Cell><Data ss:Type="Number">${Number.isFinite(number) ? number : 0}</Data></Cell>`;
}

function downloadExcel(kind: "cart" | "wishlist", rows: CommerceTrackingRow[]) {
  const headers = [
    "User Name",
    "User Number",
    "User Mail",
    "Product",
    "Category",
    "Size",
    "Price",
    "Quantity",
    "Date",
    "Time",
  ];

  const headerRow = headers.map((header) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${xmlEscape(header)}</Data></Cell>`).join("");
  const dataRows = rows.map((row) => `
    <Row>
      ${textCell(row.user.name)}
      ${textCell(row.user.phone)}
      ${textCell(row.user.email)}
      ${textCell(row.product.name)}
      ${textCell(row.product.categoryName || "—")}
      ${textCell(row.product.sizeName || "—")}
      ${numberCell(row.product.price)}
      ${numberCell(row.quantity)}
      ${textCell(exportDate(row.addedAt))}
      ${textCell(exportTime(row.addedAt))}
    </Row>`).join("");

  const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/></Style>
  <Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#F2ECE8" ss:Pattern="Solid"/></Style>
 </Styles>
 <Worksheet ss:Name="${kind === "cart" ? "Cart Tracking" : "Wishlist Tracking"}">
  <Table>
   <Row>${headerRow}</Row>
   ${dataRows}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = `${kind}-tracking-filtered-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
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
    <span className={`inline-flex rounded-full border px-2 py-1 text-[8px] font-semibold uppercase tracking-wide ${sent ? "border-emerald-200 bg-emerald-100 text-emerald-800" : "border-transparent bg-[#F7F3EF] text-[#211A18]/40"}`}>
      {label}: {sent ? "Complete" : "Pending"}
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
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const getTracking = useCallback((requestedPage: number, limit: number) => {
    const params = {
      page: requestedPage,
      limit,
      search: search.trim(),
      status,
      dateFrom,
      dateTo,
    };
    return isCart ? getAdminCartTracking(params) : getAdminWishlistTracking(params);
  }, [dateFrom, dateTo, isCart, search, status]);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError("");
      const result = await getTracking(page, 20);
      setRows(result.tracking);
      setPagination(result.pagination);
    } catch (err) {
      if (!silent) {
        setRows([]);
        setError(err instanceof Error ? err.message : `Unable to load ${kind} tracking.`);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [getTracking, kind, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    const emailStatusTimer = window.setInterval(() => void load(true), 15000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(emailStatusTimer);
    };
  }, [load]);

  async function exportFilteredRows() {
    try {
      setExporting(true);
      const first = await getTracking(1, 100);
      const allRows = [...first.tracking];
      const totalPages = Math.max(1, first.pagination.totalPages);

      for (let exportPage = 2; exportPage <= totalPages; exportPage += 1) {
        const next = await getTracking(exportPage, 100);
        allRows.push(...next.tracking);
      }

      if (!allRows.length) {
        window.alert("No filtered tracking records to export.");
        return;
      }

      downloadExcel(kind, allRows);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : `Unable to export ${kind} tracking.`);
    } finally {
      setExporting(false);
    }
  }

  const Icon = isCart ? ShoppingCart : Heart;
  const title = isCart ? "Cart Tracking" : "Wishlist Tracking";
  const description = isCart
    ? "See which customer added which product, quantity, exact time, purchase status and email reminders."
    : "See which customer saved which product, quantity, exact time, purchase status and email reminders.";

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
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void exportFilteredRows()}
              disabled={exporting || loading}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#8C1839] px-4 text-[10px] font-semibold text-white disabled:opacity-50"
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
              {exporting ? "Exporting..." : "Export Excel"}
            </button>
            <div className="rounded-xl bg-[#F7F3EF] px-4 py-3 text-[10px] font-semibold text-[#211A18]/60">
              {pagination.total.toLocaleString("en-IN")} tracking record{pagination.total === 1 ? "" : "s"}
            </div>
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
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Added At</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Email Tracking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#211A18]/7">
              {loading ? (
                <tr><td colSpan={7} className="py-16 text-center text-xs text-[#211A18]/45"><Loader2 className="mx-auto mb-2 animate-spin" size={20} />Loading tracking...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-xs text-[#211A18]/45">No tracking records found.</td></tr>
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
                  <td className="px-4 py-4 align-top font-semibold text-[#211A18]">{row.quantity}</td>
                  <td className="px-4 py-4 align-top font-semibold text-[#211A18]">{money(row.product.price)}</td>
                  <td className="px-4 py-4 align-top">
                    <div className="font-medium text-[#211A18]">{dateTime(row.addedAt)}</div>
                    <div className="mt-1 text-[9px] text-[#211A18]/35">Updated {dateTime(row.updatedAt)}</div>
                  </td>
                  <td className="px-4 py-4 align-top"><StatusBadge status={row.status} /></td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex max-w-[280px] flex-wrap gap-1.5">
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
