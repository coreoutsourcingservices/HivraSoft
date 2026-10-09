"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Download, Eye, Loader2, Search, Trash2 } from "lucide-react";
import {
  deleteAdminOrders,
  downloadAdminInvoice,
  downloadAdminOrdersCsv,
  downloadSelectedAdminInvoices,
  getAdminOrders,
  setAdminOrderStatus,
  setAdminOrdersStatus,
  syncAdminRazorpayPayment,
} from "@/lib/admin-api";
import { adminPaymentStatus } from "@/lib/admin-payment-status";

function text(value: unknown, fallback = "—") {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : fallback;
}

function record(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function money(value: unknown) {
  const amount = Number(value ?? 0);
  return `₹${
    Number.isFinite(amount)
      ? amount.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00"
  }`;
}

function orderItems(order: Record<string, unknown>) {
  return Array.isArray(order.items) ? order.items.map(record) : [];
}

function productImage(item: Record<string, unknown>) {
  return text(item.image ?? item.imageUrl ?? item.productImage ?? item.photo, "");
}

function customerName(order: Record<string, unknown>) {
  const user = record(order.user);
  const customer = record(order.customer);
  const address = record(order.shippingAddress);

  return text(
    user.name ?? customer.name ?? customer.fullName ?? address.fullName,
    "Customer"
  );
}

function orderTotal(order: Record<string, unknown>) {
  return order.total ?? order.grandTotal ?? order.finalTotal ?? 0;
}

type SimpleOrderStatus = "pending" | "completed" | "cancelled";

function simpleOrderStatus(value: unknown): SimpleOrderStatus {
  const status = text(value, "pending").toLowerCase();

  if (["delivered", "completed"].includes(status)) return "completed";
  if (["cancelled", "canceled", "returned", "refunded"].includes(status)) {
    return "cancelled";
  }
  return "pending";
}

function statusClass(status: SimpleOrderStatus) {
  if (status === "completed") return "border-green-200 bg-green-50 text-green-700";
  if (status === "cancelled") return "border-red-200 bg-red-50 text-red-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function sourceLabel(value: unknown) {
  const source = text(value, "").trim().toLowerCase();

  if (!source) return "Unknown";
  if (source === "instagram" || source === "ig") return "Ig";
  if (source === "facebook" || source === "fb" || source === "meta") return "Fb";
  if (source === "google") return "Google";
  if (source === "youtube" || source === "yt") return "YouTube";
  if (source === "whatsapp" || source === "wa") return "WhatsApp";
  if (source === "direct") return "Direct";
  if (source === "x" || source === "twitter") return "X";

  return source.charAt(0).toUpperCase() + source.slice(1);
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [bulkAction, setBulkAction] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getAdminOrders({
        page,
        limit: 20,
        search: search.trim(),
        status: orderStatus,
        paymentMethod,
        paymentStatus,
      });

      setOrders(Array.isArray(result.orders) ? result.orders : []);
      setPagination(
        result.pagination || {
          page,
          limit: 20,
          total: 0,
          totalPages: 1,
        }
      );
      setSelected([]);
    } catch (err) {
      setOrders([]);
      setError(err instanceof Error ? err.message : "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }, [page, search, orderStatus, paymentMethod, paymentStatus]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOrders();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadOrders]);

  const visibleIds = useMemo(
    () => orders.map((order) => text(order._id, "")).filter(Boolean),
    [orders]
  );

  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

  function toggleOrder(id: string, checked: boolean) {
    if (!id) return;

    setSelected((current) =>
      checked
        ? [...new Set([...current, id])]
        : current.filter((value) => value !== id)
    );
  }

  async function checkPayment(id: string) {
    setBusyId(`payment-${id}`);
    setError("");
    setActionMessage("");
    try {
      const result = await syncAdminRazorpayPayment(id);
      setActionMessage(result.message);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to check Razorpay payment.");
    } finally {
      setBusyId("");
    }
  }

  async function downloadInvoice(order: Record<string, unknown>) {
    const id = text(order._id, "");
    if (!id) return;

    try {
      setBusyId(`invoice-${id}`);
      setError("");
      setActionMessage("");
      await downloadAdminInvoice(
        id,
        text(order.invoiceNumber ?? order.orderNumber, "invoice")
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to download invoice.");
    } finally {
      setBusyId("");
    }
  }

  async function changeOrderStatus(id: string, status: SimpleOrderStatus) {
    if (!id) return;

    try {
      setBusyId(`status-${id}`);
      setError("");
      setActionMessage("");
      const result = await setAdminOrderStatus(id, status);
      setOrders((current) =>
        current.map((order) =>
          text(order._id, "") === id ? result.order : order
        )
      );
      setActionMessage(`Order status changed to ${status}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update order status.");
    } finally {
      setBusyId("");
    }
  }

  async function applyBulkAction() {
    if (!bulkAction) {
      setError("Choose a bulk action first.");
      return;
    }

    if (!selected.length) {
      setError("Select at least one order first.");
      return;
    }

    if (
      bulkAction === "delete" &&
      !window.confirm(
        `Delete ${selected.length} selected order(s)? Open-order stock will be restored. This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setBusyId("bulk");
      setError("");
      setActionMessage("");

      if (bulkAction === "export") {
        await downloadAdminOrdersCsv(selected);
        setActionMessage(`${selected.length} selected order(s) exported as CSV.`);
      } else if (bulkAction === "invoices") {
        await downloadSelectedAdminInvoices(selected);
        setActionMessage(`${selected.length} invoice(s) downloaded.`);
      } else if (bulkAction === "delete") {
        const result = await deleteAdminOrders(selected);
        setActionMessage(`${result.deleted} selected order(s) deleted.`);
        await loadOrders();
      } else if (bulkAction.startsWith("status:")) {
        const status = bulkAction.split(":")[1] as SimpleOrderStatus;
        const result = await setAdminOrdersStatus(selected, status);
        setActionMessage(
          result.failed.length
            ? `${result.updated} order(s) updated. ${result.failed.length} order(s) could not be updated.`
            : `${result.updated} order(s) changed to ${status}.`
        );
        await loadOrders();
      }

      setBulkAction("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to apply bulk action.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="mx-auto w-full max-w-[1600px]">
      <div className="rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#8C1839]">
              Order Management
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[#211A18]">Orders</h1>
            <p className="mt-1 text-xs text-[#211A18]/50">
              Manage order status, export orders and apply bulk actions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/orders/reports" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#8C1839] px-4 text-[10px] font-semibold uppercase tracking-wide text-white transition hover:bg-[#71132e]">
              <BarChart3 size={14} /> Reports
            </Link>
            <div className="rounded-xl border border-[#211A18]/10 bg-[#FAF8F6] px-4 py-2 text-[10px] font-semibold text-[#211A18]/60">
              Selected: <span className="text-[#8C1839]">{selected.length}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 lg:flex-row lg:items-center">
          <select
            value={bulkAction}
            onChange={(event) => setBulkAction(event.target.value)}
            disabled={busyId === "bulk"}
            className="h-11 min-w-[270px] rounded-xl border border-[#211A18]/15 bg-white px-3 text-xs font-medium text-[#211A18] outline-none transition focus:border-[#8C1839]/40 disabled:opacity-50"
          >
            <option value="">Bulk actions</option>
            <option value="export">Export selected as CSV</option>
            <option value="status:pending">Change status to Pending</option>
            <option value="status:completed">Change status to Completed</option>
            <option value="status:cancelled">Change status to Cancelled</option>
            <option value="invoices">Download selected invoices</option>
            <option value="delete">Delete selected orders</option>
          </select>

          <button
            type="button"
            onClick={() => void applyBulkAction()}
            disabled={busyId === "bulk"}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#8C1839] px-5 text-[10px] font-semibold uppercase tracking-wide text-white transition hover:bg-[#71132e] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busyId === "bulk" ? <Loader2 size={14} className="animate-spin" /> : null}
            Apply
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#211A18]/35"
              size={15}
            />
            <input
              type="text"
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Search order or customer"
              className="h-11 w-full rounded-xl border border-[#211A18]/10 bg-[#FAF8F6] pl-9 pr-3 text-xs text-[#211A18] outline-none transition focus:border-[#8C1839]/40"
            />
          </label>

          <select
            value={orderStatus}
            onChange={(event) => {
              setPage(1);
              setOrderStatus(event.target.value);
            }}
            className="h-11 rounded-xl border border-[#211A18]/10 bg-white px-3 text-xs text-[#211A18] outline-none transition focus:border-[#8C1839]/40"
          >
            <option value="">All order status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={paymentMethod}
            onChange={(event) => {
              setPage(1);
              setPaymentMethod(event.target.value);
            }}
            className="h-11 rounded-xl border border-[#211A18]/10 bg-white px-3 text-xs text-[#211A18] outline-none transition focus:border-[#8C1839]/40"
          >
            <option value="">All payment methods</option>
            <option value="cod">COD</option>
            <option value="razorpay">Razorpay</option>
          </select>

          <select
            value={paymentStatus}
            onChange={(event) => {
              setPage(1);
              setPaymentStatus(event.target.value);
            }}
            className="h-11 rounded-xl border border-[#211A18]/10 bg-white px-3 text-xs text-[#211A18] outline-none transition focus:border-[#8C1839]/40"
          >
            <option value="">All payment status</option>
            <option value="paid">Successful</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {actionMessage && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-medium text-green-700">
            {actionMessage}
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void loadOrders()}
              className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-1.5 font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        <div className="mt-5 overflow-x-auto rounded-2xl border border-[#211A18]/8">
          <table className="w-full min-w-[1280px] text-left">
            <thead className="bg-[#FAF8F6]">
              <tr className="text-[9px] uppercase tracking-[0.12em] text-[#211A18]/50">
                <th className="w-[50px] px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(event) =>
                      setSelected(event.target.checked ? visibleIds : [])
                    }
                    className="h-4 w-4 cursor-pointer accent-[#8C1839]"
                  />
                </th>
                <th className="px-3 py-3">Order</th>
                <th className="px-3 py-3">Product</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Qty</th>
                <th className="px-3 py-3">Total</th>
                <th className="px-3 py-3">Payment / Status</th>
                <th className="px-3 py-3">Origin</th>
                <th className="px-3 py-3">Order Status</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Invoice</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#211A18]/7">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-xs text-[#211A18]/45">
                    <Loader2 className="mx-auto mb-2 animate-spin" size={20} />
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-xs text-[#211A18]/45">
                    {error ? "Orders could not be loaded." : "No orders found."}
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const id = text(order._id, "");
                  const items = orderItems(order);
                  const firstItem = items[0] || {};
                  const image = productImage(firstItem);
                  const name = customerName(order);
                  const totalQuantity = items.reduce(
                    (sum, item) => sum + Number(item.quantity || 0),
                    0
                  );
                  const status = simpleOrderStatus(order.status);
                  const paymentState = adminPaymentStatus(order);
                  const origin = record(order.origin);
                  const source = sourceLabel(origin.source);
                  const sourceDetails = [
                    text(origin.medium, ""),
                    text(origin.campaign, ""),
                  ].filter(Boolean).join(" · ");

                  const createdAt = order.createdAt
                    ? new Date(String(order.createdAt)).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—";

                  return (
                    <tr
                      key={id}
                      className="align-middle text-[11px] text-[#211A18] transition hover:bg-[#FAF8F6]/70"
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selected.includes(id)}
                          onChange={(event) => toggleOrder(id, event.target.checked)}
                          className="h-4 w-4 cursor-pointer accent-[#8C1839]"
                        />
                      </td>

                      <td className="px-3 py-4">
                        <Link
                          href={`/admin/orders/${id}`}
                          className="whitespace-nowrap font-semibold text-[#8C1839] hover:underline"
                        >
                          {text(order.orderNumber, id ? id.slice(-8) : "—")}
                        </Link>
                      </td>

                      <td className="px-3 py-4">
                        <Link href={`/admin/orders/${id}`} className="inline-flex flex-col items-center">
                          {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={image}
                              alt="Product"
                              className="h-14 w-14 rounded-xl border border-[#211A18]/10 bg-[#F7F3F1] object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#211A18]/10 bg-[#F2ECE8] text-[8px] text-[#211A18]/35">
                              No Image
                            </div>
                          )}

                          {items.length > 1 && (
                            <span className="mt-1 text-[8px] font-semibold text-[#8C1839]">
                              +{items.length - 1} more
                            </span>
                          )}
                        </Link>
                      </td>

                      <td className="px-3 py-4">
                        <p className="max-w-[170px] truncate font-semibold">{name}</p>
                      </td>

                      <td className="px-3 py-4 font-semibold">{totalQuantity}</td>

                      <td className="px-3 py-4 font-semibold">{money(orderTotal(order))}</td>

                      <td className="px-3 py-4">
                        <p className="text-[10px] font-semibold uppercase text-[#211A18]">
                          {text(order.paymentMethod)}
                        </p>
                        <span title={paymentState.hint}
                          className={`mt-1.5 inline-flex rounded-full border px-2 py-1 text-[8px] font-bold uppercase tracking-wide ${paymentState.className}`}
                        >
                          {paymentState.label}
                        </span>
                        {paymentState.canSync && (
                          <button type="button" onClick={() => void checkPayment(id)} disabled={busyId === `payment-${id}`}
                            className="mt-1 block text-[9px] font-semibold text-[#8C1839] underline disabled:opacity-50">
                            {busyId === `payment-${id}` ? "Checking..." : "Check Payment"}
                          </button>
                        )}
                      </td>

                      <td className="px-3 py-4">
                        <div
                          className="min-w-[92px]"
                          title={
                            [
                              `Source: ${source}`,
                              text(origin.medium, "") ? `Medium: ${text(origin.medium, "")}` : "",
                              text(origin.campaign, "") ? `Campaign: ${text(origin.campaign, "")}` : "",
                              text(origin.referrer, "") ? `Referrer: ${text(origin.referrer, "")}` : "",
                            ]
                              .filter(Boolean)
                              .join("\n")
                          }
                        >
                          <p className="whitespace-nowrap text-[10px] font-semibold text-[#211A18]">
                            Source: <span className="text-[#8C1839]">{source}</span>
                          </p>
                          {sourceDetails ? (
                            <p className="mt-1 max-w-[150px] truncate text-[8px] text-[#211A18]/45">
                              {sourceDetails}
                            </p>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <div className="relative inline-flex items-center">
                          {busyId === `status-${id}` && (
                            <Loader2
                              size={12}
                              className="pointer-events-none absolute right-2 animate-spin"
                            />
                          )}
                          <select
                            value={status}
                            disabled={busyId === `status-${id}` || busyId === "bulk"}
                            onChange={(event) =>
                              void changeOrderStatus(id, event.target.value as SimpleOrderStatus)
                            }
                            className={`h-9 min-w-[112px] rounded-lg border px-2 pr-7 text-[9px] font-semibold uppercase outline-none ${statusClass(status)}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-3 py-4 text-[10px] text-[#211A18]/65">
                        {createdAt}
                      </td>

                      <td className="px-3 py-4">
                        <button
                          type="button"
                          disabled={busyId === `invoice-${id}`}
                          onClick={() => void downloadInvoice(order)}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#211A18] px-3 text-[9px] font-semibold text-white transition hover:bg-[#8C1839] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busyId === `invoice-${id}` ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Download size={12} />
                          )}
                          Invoice
                        </button>
                      </td>

                      <td className="px-3 py-4">
                        <Link
                          href={`/admin/orders/${id}`}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#211A18]/10 bg-white px-3 text-[9px] font-semibold transition hover:border-[#8C1839]/30 hover:text-[#8C1839]"
                        >
                          <Eye size={12} />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center gap-2 text-[10px] text-[#211A18]/50">
          <Trash2 size={12} />
          Delete is available from Bulk actions after selecting one or more orders.
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] text-[#211A18]/50">
            Total orders: <strong className="text-[#211A18]">{pagination.total}</strong>{" "}
            • Page {pagination.page} of {pagination.totalPages}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="h-9 rounded-lg border border-[#211A18]/10 bg-white px-3 text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, index) => {
              const start = Math.max(
                1,
                Math.min(page - 2, Math.max(1, pagination.totalPages - 4))
              );
              const pageNumber = start + index;

              if (pageNumber > pagination.totalPages) return null;

              return (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`h-9 w-9 rounded-lg text-[10px] font-semibold ${
                    pageNumber === page
                      ? "bg-[#8C1839] text-white"
                      : "border border-[#211A18]/10 bg-white text-[#211A18]"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              type="button"
              disabled={page >= pagination.totalPages || loading}
              onClick={() =>
                setPage((current) => Math.min(pagination.totalPages, current + 1))
              }
              className="h-9 rounded-lg border border-[#211A18]/10 bg-white px-3 text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
