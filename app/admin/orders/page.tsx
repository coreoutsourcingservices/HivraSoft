"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Eye, Loader2, Search } from "lucide-react";
import {
  downloadAdminInvoice,
  downloadSelectedAdminInvoices,
  getAdminOrders,
} from "@/lib/admin-api";

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
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
        paymentStatus,
        paymentMethod,
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
  }, [page, search, paymentStatus, paymentMethod]);

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

  async function downloadInvoice(order: Record<string, unknown>) {
    const id = text(order._id, "");
    if (!id) return;

    try {
      setBusyId(`invoice-${id}`);
      setError("");
      await downloadAdminInvoice(
        id,
        text(order.invoiceNumber ?? order.orderNumber, "invoice")
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to download invoice."
      );
    } finally {
      setBusyId("");
    }
  }

  async function downloadSelected() {
    if (!selected.length) return;

    try {
      setBusyId("selected");
      setError("");
      await downloadSelectedAdminInvoices(selected);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to download selected invoices."
      );
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
              Real customer orders from MongoDB.
            </p>
          </div>

          <button
            type="button"
            disabled={selected.length === 0 || busyId === "selected"}
            onClick={() => void downloadSelected()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#8C1839] px-4 text-[10px] font-semibold uppercase tracking-wide text-white transition hover:bg-[#71132e] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busyId === "selected" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            Download Selected Invoices ({selected.length})
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
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
            value={paymentStatus}
            onChange={(event) => {
              setPage(1);
              setPaymentStatus(event.target.value);
            }}
            className="h-11 rounded-xl border border-[#211A18]/10 bg-white px-3 text-xs text-[#211A18] outline-none transition focus:border-[#8C1839]/40"
          >
            <option value="">All payment status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
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
        </div>

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
          <table className="w-full min-w-[1000px] text-left">
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
                <th className="px-3 py-3">Payment</th>
                <th className="px-3 py-3">Payment Status</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#211A18]/7">
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="py-16 text-center text-xs text-[#211A18]/45"
                  >
                    <Loader2 className="mx-auto mb-2 animate-spin" size={20} />
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="py-16 text-center text-xs text-[#211A18]/45"
                  >
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

                  const createdAt = order.createdAt
                    ? new Date(String(order.createdAt)).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—";

                  const paymentStatusValue = text(
                    order.paymentStatus,
                    "pending"
                  ).toLowerCase();

                  return (
                    <tr
                      key={id}
                      className="align-middle text-[11px] text-[#211A18] transition hover:bg-[#FAF8F6]/70"
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selected.includes(id)}
                          onChange={(event) =>
                            toggleOrder(id, event.target.checked)
                          }
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
                        <Link
                          href={`/admin/orders/${id}`}
                          className="inline-flex flex-col items-center"
                        >
                          {image ? (
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
                        <p className="max-w-[170px] truncate font-semibold">
                          {name}
                        </p>
                      </td>

                      <td className="px-3 py-4 font-semibold">{totalQuantity}</td>

                      <td className="px-3 py-4 font-semibold">
                        {money(orderTotal(order))}
                      </td>

                      <td className="px-3 py-4 font-medium uppercase">
                        {text(order.paymentMethod)}
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase ${
                            paymentStatusValue === "paid"
                              ? "bg-green-50 text-green-700"
                              : paymentStatusValue === "failed"
                                ? "bg-red-50 text-red-700"
                                : paymentStatusValue === "refunded"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-[#F5F0ED] text-[#6F625D]"
                          }`}
                        >
                          {paymentStatusValue}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-3 py-4 text-[10px] text-[#211A18]/65">
                        {createdAt}
                      </td>

                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/orders/${id}`}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#211A18]/10 bg-white px-3 text-[9px] font-semibold transition hover:border-[#8C1839]/30 hover:text-[#8C1839]"
                          >
                            <Eye size={12} />
                            View
                          </Link>

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
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] text-[#211A18]/50">
            Total orders: <strong className="text-[#211A18]">{pagination.total}</strong>
            {" "}• Page {pagination.page} of {pagination.totalPages}
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

            {Array.from(
              { length: Math.min(5, pagination.totalPages) },
              (_, index) => {
                const start = Math.max(
                  1,
                  Math.min(
                    page - 2,
                    Math.max(1, pagination.totalPages - 4)
                  )
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
              }
            )}

            <button
              type="button"
              disabled={page >= pagination.totalPages || loading}
              onClick={() =>
                setPage((current) =>
                  Math.min(pagination.totalPages, current + 1)
                )
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
