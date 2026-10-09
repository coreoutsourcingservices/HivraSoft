"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Download,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  UserRound,
} from "lucide-react";

import {
  downloadAdminInvoice,
  getAdminOrder,
  syncAdminRazorpayPayment,
} from "@/lib/admin-api";
import { adminPaymentStatus } from "@/lib/admin-payment-status";

/* =========================================================
   Helpers
========================================================= */

function text(value: unknown, fallback = "—") {
  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    const result = String(value).trim();

    return result || fallback;
  }

  return fallback;
}

function record(value: unknown) {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function numberValue(value: unknown) {
  const amount = Number(value ?? 0);

  return Number.isFinite(amount)
    ? amount
    : 0;
}

function money(value: unknown) {
  return `₹${numberValue(value).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function hasValue(value: unknown) {
  return (
    value !== null &&
    value !== undefined &&
    String(value).trim() !== ""
  );
}

function isValidDate(value: unknown) {
  if (!value) return false;

  const date = new Date(
    String(value)
  );

  return !Number.isNaN(
    date.getTime()
  );
}

function formatDate(value: unknown) {
  if (!isValidDate(value)) {
    return "—";
  }

  return new Date(
    String(value)
  ).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(value: unknown) {
  const status = text(value, "");

  if (!status) {
    return "";
  }

  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

/* =========================================================
   Component
========================================================= */

export default function AdminOrderDetailsPage() {
  const params =
    useParams<{ id: string }>();

  const id = String(
    params?.id || ""
  );

  const [order, setOrder] =
    useState<Record<
      string,
      unknown
    > | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [
    invoiceLoading,
    setInvoiceLoading,
  ] = useState(false);

  const [error, setError] =
    useState("");
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentCheckMessage, setPaymentCheckMessage] = useState("");

  async function checkPayment() {
    if (!id || checkingPayment) return;
    setCheckingPayment(true);
    setPaymentCheckMessage("");
    try {
      const result = await syncAdminRazorpayPayment(id);
      setPaymentCheckMessage(result.message);
      // Reload from database to include the final persisted payment state.
      setOrder(await getAdminOrder(id));
    } catch (err) {
      setPaymentCheckMessage(err instanceof Error ? err.message : "Unable to check Razorpay payment.");
    } finally {
      setCheckingPayment(false);
    }
  }

  /* =======================================================
     Load Order
  ======================================================= */

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadOrder() {
      try {
        setLoading(true);
        setError("");

        const response =
          await getAdminOrder(id);

        if (!cancelled) {
          setOrder(response);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load order."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOrder();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /* =======================================================
     Items
  ======================================================= */

  const items = useMemo(() => {
    if (
      !order ||
      !Array.isArray(order.items)
    ) {
      return [];
    }

    return order.items.map(
      record
    );
  }, [order]);

  /* =======================================================
     Invoice
  ======================================================= */

  async function handleInvoice() {
    if (!order || !id) {
      return;
    }

    try {
      setInvoiceLoading(true);
      setError("");

      await downloadAdminInvoice(
        id,
        text(
          order.invoiceNumber ??
            order.orderNumber,
          "invoice"
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to download invoice."
      );
    } finally {
      setInvoiceLoading(false);
    }
  }

  /* =======================================================
     Loading
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2
            size={28}
            className="animate-spin text-[#A8143D]"
          />

          <p className="mt-3 text-xs font-medium text-[#271E1B]/45">
            Loading order details...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     Not Found
  ======================================================= */

  if (!order) {
    return (
      <div className="rounded-[24px] border border-[#271E1B]/10 bg-white p-8">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#A8143D]"
        >
          <ArrowLeft size={14} />
          Back to orders
        </Link>

        <p className="mt-5 text-sm text-red-600">
          {error ||
            "Order not found."}
        </p>
      </div>
    );
  }

  /* =======================================================
     Data
  ======================================================= */

  const user = record(
    order.user
  );

  const customer = record(
    order.customer
  );

  const address = record(
    order.shippingAddress
  );

  const payment = record(
    order.payment
  );

  const history =
    Array.isArray(
      order.statusHistory
    )
      ? order.statusHistory.map(
          record
        )
      : [];

  const customerName = text(
    user.name ??
      customer.name ??
      customer.fullName ??
      address.fullName,
    "Customer"
  );

  const customerEmail = text(
    user.email ??
      customer.email,
    ""
  );

  const customerPhone = text(
    user.phone ??
      customer.phone ??
      address.phone,
    ""
  );

  const paymentMethod = text(
    order.paymentMethod,
    "—"
  ).toUpperCase();

  const paymentState = adminPaymentStatus(order);

  const paymentId = text(
    payment.razorpayPaymentId ??
      payment.transactionId ??
      order.razorpayPaymentId,
    ""
  );

  const paidAt =
    payment.paidAt ??
    order.paidAt;

  const subtotal =
    numberValue(
      order.subtotal
    );

  const offerDiscount =
    numberValue(
      order.offerDiscount
    );

  const automaticDiscount =
    numberValue(
      order.automaticDiscount
    );

  const couponDiscount =
    numberValue(
      order.codeDiscount ??
        order.couponDiscount
    );

  const taxAmount =
    numberValue(
      order.tax ??
        order.taxAmount
    );

  const taxPercentage =
    numberValue(
      order.taxPercentage
    );

  const taxDetails = record(order.taxDetails);
  const taxValueType = text(taxDetails.valueType, "percentage").toLowerCase();

  const deliveryChargeDetails =
    record(order.deliveryCharge);

  const shippingAmount =
    Math.max(
      numberValue(
        order.shipping ??
          order.shippingCharge
      ),
      numberValue(
        deliveryChargeDetails.charge
      )
    );

  const deliveryChargeLabel =
    paymentMethod === "COD"
      ? "COD charge"
      : paymentMethod === "ONLINE" || paymentMethod === "RAZORPAY"
        ? "Online delivery charge"
        : "Delivery charge";

  const shouldShowDeliveryCharge =
    shippingAmount > 0 ||
    paymentMethod === "COD" ||
    paymentMethod === "ONLINE" ||
    paymentMethod === "RAZORPAY";

  const grandTotal =
    numberValue(
      order.total ??
        order.grandTotal ??
        order.finalTotal
    );

  const totalQuantity =
    items.reduce(
      (total, item) =>
        total +
        numberValue(
          item.quantity
        ),
      0
    );

  const addressLineOne = [
    address.homeNumber,
    address.officeNumber,
    address.addressLine1,
  ]
    .filter(hasValue)
    .map(String)
    .join(" ");

  const addressLineTwo = [
    address.addressLine2,
    address.landmark,
  ]
    .filter(hasValue)
    .map(String)
    .join(", ");

  const addressCity = [
    address.city,
    address.district,
    address.state,
    address.postalCode ??
      address.pincode,
  ]
    .filter(hasValue)
    .map(String)
    .join(", ");

  /* =======================================================
     UI
  ======================================================= */

  return (
    <section className="mx-auto w-full max-w-[1480px] pb-10">
      {/* ===================================================
          ONE MAIN CARD
      =================================================== */}
      <div className="overflow-hidden rounded-[24px] border border-[#2A211E]/10 bg-white shadow-[0_8px_32px_rgba(35,25,22,0.045)]">
        {/* =================================================
            HEADER
        ================================================= */}
        <div className="flex flex-col gap-5 border-b border-[#2A211E]/8 px-6 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="min-w-0">
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#A8143D] transition hover:opacity-70"
            >
              <ArrowLeft
                size={14}
              />

              Back to orders
            </Link>

            <div className="mt-4 flex flex-col gap-2">
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#A8143D]">
                Order Details
              </p>

              <h1 className="max-w-[720px] break-words text-[22px] font-bold tracking-[-0.02em] text-[#241C19] md:text-[25px]">
                {text(
                  order.orderNumber
                )}
              </h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-[#241C19]/45">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays
                    size={13}
                  />

                  {formatDate(
                    order.createdAt
                  )}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <Package
                    size={13}
                  />

                  {totalQuantity}{" "}
                  {totalQuantity === 1
                    ? "Item"
                    : "Items"}
                </span>
              </div>
            </div>
          </div>

          {/* STATUS DROPDOWN REMOVED */}
          <button
            type="button"
            disabled={
              invoiceLoading
            }
            onClick={() =>
              void handleInvoice()
            }
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-[#251D1A] px-5 text-[10px] font-bold uppercase tracking-[0.06em] text-white transition hover:bg-[#A8143D] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {invoiceLoading ? (
              <Loader2
                size={14}
                className="animate-spin"
              />
            ) : (
              <Download
                size={14}
              />
            )}

            Download Invoice
          </button>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}
        {error && (
          <div className="border-b border-[#2A211E]/8 bg-red-50 px-6 py-3 text-xs text-red-700 lg:px-8">
            {error}
          </div>
        )}

        {/* =================================================
            CUSTOMER / SHIPPING / PAYMENT
        ================================================= */}
        <div className="grid border-b border-[#2A211E]/8 md:grid-cols-2 xl:grid-cols-3">
          {/* CUSTOMER */}
          <div className="border-b border-[#2A211E]/8 px-6 py-6 md:border-r xl:border-b-0 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#A8143D]/8 text-[#A8143D]">
                <UserRound
                  size={16}
                />
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#241C19]/35">
                  Customer
                </p>

                <h2 className="mt-0.5 text-[14px] font-bold text-[#241C19]">
                  Customer Details
                </h2>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-[14px] font-bold text-[#241C19]">
                {customerName}
              </p>

              {customerEmail && (
                <p className="mt-3 flex items-center gap-2 text-[11px] text-[#241C19]/55">
                  <Mail
                    size={13}
                    className="shrink-0"
                  />

                  <span className="break-all">
                    {
                      customerEmail
                    }
                  </span>
                </p>
              )}

              {customerPhone && (
                <p className="mt-2 flex items-center gap-2 text-[11px] text-[#241C19]/55">
                  <Phone
                    size={13}
                    className="shrink-0"
                  />

                  {
                    customerPhone
                  }
                </p>
              )}
            </div>
          </div>

          {/* SHIPPING */}
          <div className="border-b border-[#2A211E]/8 px-6 py-6 xl:border-b-0 xl:border-r lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#A8143D]/8 text-[#A8143D]">
                <MapPin
                  size={16}
                />
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#241C19]/35">
                  Delivery
                </p>

                <h2 className="mt-0.5 text-[14px] font-bold text-[#241C19]">
                  Shipping Address
                </h2>
              </div>
            </div>

            <div className="mt-5 space-y-1 text-[11px] leading-[1.65] text-[#241C19]/60">
              <p className="font-bold text-[#241C19]">
                {text(
                  address.fullName
                )}
              </p>

              {addressLineOne && (
                <p>
                  {addressLineOne}
                </p>
              )}

              {addressLineTwo && (
                <p>
                  {addressLineTwo}
                </p>
              )}

              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                {([
                  ["City", address.city],
                  ["District", address.district],
                  ["State", address.state],
                  ["Pincode", address.postalCode ?? address.pincode],
                ] as const).map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[10px] font-semibold text-[#241C19]">{label}</p>
                    <p>{hasValue(value) ? String(value) : "—"}</p>
                  </div>
                ))}
              </div>

              <p>
                {text(
                  address.country,
                  "India"
                )}
              </p>

              {hasValue(
                address.phone
              ) && (
                <p className="pt-1 font-medium text-[#241C19]">
                  Phone:{" "}
                  {text(
                    address.phone
                  )}
                </p>
              )}
            </div>
          </div>

          {/* PAYMENT */}
          <div className="px-6 py-6 md:col-span-2 xl:col-span-1 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#A8143D]/8 text-[#A8143D]">
                <CreditCard
                  size={16}
                />
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#241C19]/35">
                  Payment
                </p>

                <h2 className="mt-0.5 text-[14px] font-bold text-[#241C19]">
                  Payment Details
                </h2>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#241C19]/35">
                Method
              </p>

              <div className="mt-2">
                <span className="inline-flex rounded-[7px] bg-[#F4EFED] px-3 py-1.5 text-[10px] font-bold text-[#241C19]">
                  {paymentMethod}
                </span>
              </div>

              <div className="mt-4">
                <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#241C19]/35">
                  Payment Status
                </p>

                <span
                  className={`mt-2 inline-flex rounded-full border px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide ${paymentState.className}`}
                >
                  {paymentState.label}
                </span>
                <p title={paymentState.hint} className="mt-1 text-[10px] text-[#241C19]/50">{paymentState.hint}</p>
                {paymentState.canSync && (
                  <button type="button" onClick={() => void checkPayment()} disabled={checkingPayment}
                    className="mt-2 block rounded-lg border border-[#8C1839]/30 px-3 py-1.5 text-[10px] font-semibold text-[#8C1839] disabled:opacity-50">
                    {checkingPayment ? "Checking Razorpay..." : "Check Payment with Razorpay"}
                  </button>
                )}
                {paymentCheckMessage && <p role="status" className="mt-2 text-[10px] text-[#241C19]/70">{paymentCheckMessage}</p>}
              </div>

              {paymentId && (
                <div className="mt-4">
                  <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#241C19]/35">
                    Payment ID
                  </p>

                  <p className="mt-1 break-all text-[11px] font-medium text-[#241C19]">
                    {paymentId}
                  </p>
                </div>
              )}

              {isValidDate(
                paidAt
              ) && (
                <div className="mt-4">
                  <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#241C19]/35">
                    Paid At
                  </p>

                  <p className="mt-1 text-[11px] font-medium text-[#241C19]">
                    {formatDate(
                      paidAt
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =================================================
            PRODUCTS
        ================================================= */}
        <div className="border-b border-[#2A211E]/8 px-6 py-6 lg:px-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A8143D]">
                Items
              </p>

              <h2 className="mt-1 text-[16px] font-bold text-[#241C19]">
                Products
              </h2>
            </div>

            <p className="text-[10px] text-[#241C19]/40">
              {items.length}{" "}
              {items.length === 1
                ? "product"
                : "products"}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-y border-[#2A211E]/8 bg-[#FBF9F8] text-left">
                  <th className="px-3 py-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#241C19]/40">
                    Product
                  </th>

                  <th className="px-3 py-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#241C19]/40">
                    Color
                  </th>

                  <th className="px-3 py-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#241C19]/40">
                    Size
                  </th>

                  <th className="px-3 py-3 text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-[#241C19]/40">
                    Qty
                  </th>

                  <th className="px-3 py-3 text-right text-[9px] font-semibold uppercase tracking-[0.12em] text-[#241C19]/40">
                    Unit
                  </th>

                  <th className="px-3 py-3 text-right text-[9px] font-semibold uppercase tracking-[0.12em] text-[#241C19]/40">
                    Discount
                  </th>

                  <th className="px-3 py-3 text-right text-[9px] font-semibold uppercase tracking-[0.12em] text-[#241C19]/40">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#2A211E]/7">
                {items.map(
                  (
                    item,
                    index
                  ) => {
                    const image =
                      text(
                        item.image ??
                          item.imageUrl ??
                          item.productImage,
                        ""
                      );

                    const quantity =
                      numberValue(
                        item.quantity
                      );

                    const unitPrice =
                      numberValue(
                        item.unitPrice ??
                          item.originalPrice ??
                          item.price
                      );

                    const finalUnitPrice =
                      numberValue(
                        item.finalUnitPrice ??
                          item.unitPrice ??
                          item.price
                      );

                    const discount =
                      numberValue(
                        item.discount ??
                          item.totalDiscount ??
                          item.automaticDiscount
                      );

                    const savedLine =
                      numberValue(
                        item.finalTotal ??
                          item.lineTotal ??
                          item.subtotal
                      );

                    const lineTotal =
                      savedLine > 0
                        ? savedLine
                        : finalUnitPrice *
                          quantity;

                    return (
                      <tr
                        key={text(
                          item._id ??
                            item.cartItemId,
                          String(
                            index
                          )
                        )}
                        className="transition hover:bg-[#FCFAF9]"
                      >
                        {/* PRODUCT */}
                        <td className="px-3 py-4">
                          <div className="flex min-w-[320px] items-center gap-3">
                            {image ? (
                              <img
                                src={
                                  image
                                }
                                alt={text(
                                  item.name ??
                                    item.productName,
                                  "Product"
                                )}
                                className="h-[62px] w-[62px] shrink-0 rounded-[11px] border border-[#2A211E]/10 bg-[#F5F1EF] object-cover"
                              />
                            ) : (
                              <div className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-[11px] bg-[#F5F1EF] text-[8px] text-[#241C19]/35">
                                No Image
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="max-w-[430px] text-[12px] font-semibold leading-[1.55] text-[#241C19]">
                                {text(
                                  item.name ??
                                    item.productName,
                                  "Product"
                                )}
                              </p>

                              {hasValue(
                                item.sku
                              ) && (
                                <p className="mt-1 text-[9px] text-[#241C19]/35">
                                  SKU:{" "}
                                  {text(
                                    item.sku
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* COLOR */}
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-2">
                            {hasValue(
                              item.colorHex
                            ) && (
                              <span
                                className="h-[14px] w-[14px] shrink-0 rounded-full border border-black/10"
                                style={{
                                  backgroundColor:
                                    text(
                                      item.colorHex
                                    ),
                                }}
                              />
                            )}

                            <span className="text-[11px] font-medium text-[#241C19]/70">
                              {text(
                                item.colorName ??
                                  item.color
                              )}
                            </span>
                          </div>
                        </td>

                        {/* SIZE */}
                        <td className="px-3 py-4 text-[11px] font-semibold text-[#241C19]">
                          {text(
                            item.sizeName ??
                              item.size
                          )}
                        </td>

                        {/* QTY */}
                        <td className="px-3 py-4 text-center">
                          <span className="inline-flex min-w-7 items-center justify-center rounded-md bg-[#F4EFED] px-2 py-1 text-[10px] font-bold text-[#241C19]">
                            {quantity}
                          </span>
                        </td>

                        {/* UNIT */}
                        <td className="px-3 py-4 text-right text-[11px] font-medium text-[#241C19]">
                          {money(
                            unitPrice
                          )}
                        </td>

                        {/* DISCOUNT */}
                        <td className="px-3 py-4 text-right text-[11px]">
                          {discount >
                          0 ? (
                            <span className="font-semibold text-[#A8143D]">
                              -
                              {money(
                                discount
                              )}
                            </span>
                          ) : (
                            <span className="text-[#241C19]/35">
                              —
                            </span>
                          )}
                        </td>

                        {/* LINE TOTAL */}
                        <td className="px-3 py-4 text-right text-[12px] font-bold text-[#241C19]">
                          {money(
                            lineTotal
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* =================================================
            BOTTOM: HISTORY + PRICE
        ================================================= */}
        <div className="grid lg:grid-cols-[1fr_390px]">
          {/* HISTORY */}
          <div className="border-b border-[#2A211E]/8 px-6 py-6 lg:border-b-0 lg:border-r lg:px-8">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A8143D]">
                Tracking
              </p>

              <h2 className="mt-1 text-[15px] font-bold text-[#241C19]">
                Status History
              </h2>
            </div>

            <div className="mt-5">
              {history.length >
              0 ? (
                <div className="space-y-0">
                  {history
                    .slice()
                    .reverse()
                    .map(
                      (
                        entry,
                        index
                      ) => {
                        const isLast =
                          index ===
                          history.length -
                            1;

                        return (
                          <div
                            key={
                              index
                            }
                            className="relative flex gap-4 pb-5 last:pb-0"
                          >
                            {/* timeline */}
                            <div className="relative flex w-3 shrink-0 justify-center">
                              <span className="relative z-10 mt-1 h-2.5 w-2.5 rounded-full bg-[#A8143D]" />

                              {!isLast && (
                                <span className="absolute left-1/2 top-3 h-full w-px -translate-x-1/2 bg-[#2A211E]/10" />
                              )}
                            </div>

                            <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-[11px] font-bold text-[#241C19]">
                                  {statusLabel(
                                    entry.status
                                  )}
                                </p>

                                {hasValue(
                                  entry.message
                                ) && (
                                  <p className="mt-1 text-[10px] leading-5 text-[#241C19]/45">
                                    {text(
                                      entry.message,
                                      ""
                                    )}
                                  </p>
                                )}
                              </div>

                              {isValidDate(
                                entry.at ??
                                  entry.createdAt
                              ) && (
                                <p className="shrink-0 text-[9px] text-[#241C19]/35">
                                  {formatDate(
                                    entry.at ??
                                      entry.createdAt
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                </div>
              ) : (
                <p className="text-[11px] text-[#241C19]/40">
                  No status history
                  available.
                </p>
              )}
            </div>
          </div>

          {/* PRICING */}
          <div className="bg-[#FCFAF9] px-6 py-6 lg:px-8">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A8143D]">
              Amount
            </p>

            <h2 className="mt-1 text-[15px] font-bold text-[#241C19]">
              Pricing Summary
            </h2>

            <div className="mt-6 space-y-3">
              {/* SUBTOTAL */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] text-[#241C19]/55">
                  Subtotal
                </span>

                <span className="text-[11px] font-semibold text-[#241C19]">
                  {money(
                    subtotal
                  )}
                </span>
              </div>

              {/* OFFER DISCOUNT */}
              {offerDiscount > 0 && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] text-[#241C19]/55">
                    Offer discount
                  </span>
                  <span className="text-[11px] font-semibold text-[#A8143D]">
                    -{money(offerDiscount)}
                  </span>
                </div>
              )}

              {/* AUTO DISCOUNT */}
              {automaticDiscount >
                0 && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] text-[#241C19]/55">
                    Automatic
                    discount
                  </span>

                  <span className="text-[11px] font-semibold text-[#A8143D]">
                    -
                    {money(
                      automaticDiscount
                    )}
                  </span>
                </div>
              )}

              {/* COUPON ONLY WHEN VALUE > 0 */}
              {couponDiscount >
                0 && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] text-[#241C19]/55">
                    Coupon discount
                  </span>

                  <span className="text-[11px] font-semibold text-[#A8143D]">
                    -
                    {money(
                      couponDiscount
                    )}
                  </span>
                </div>
              )}

              {/* TAX ONLY WHEN VALUE > 0 */}
              {taxAmount > 0 && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] text-[#241C19]/55">
                    {text(
                      order.taxName,
                      "Tax"
                    )}
                    {taxValueType === "fixed"
                      ? " (Custom Price)"
                      : taxPercentage > 0
                        ? ` (${taxPercentage}%)`
                        : ""}
                  </span>

                  <span className="text-[11px] font-semibold text-[#241C19]">
                    {money(
                      taxAmount
                    )}
                  </span>
                </div>
              )}

              {/* DELIVERY / COD CHARGE */}
              {shouldShowDeliveryCharge && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] text-[#241C19]/55">
                    {deliveryChargeLabel}
                  </span>

                  <span className="text-[11px] font-semibold text-[#241C19]">
                    {money(shippingAmount)}
                  </span>
                </div>
              )}

              {/* GRAND TOTAL */}
              <div className="mt-5 border-t border-[#2A211E]/12 pt-5">
                <div className="flex items-end justify-between gap-5">
                  <div>
                    <p className="text-[12px] font-bold text-[#241C19]">
                      Grand Total
                    </p>

                    <p className="mt-1 text-[9px] text-[#241C19]/35">
                      Final order
                      amount
                    </p>
                  </div>

                  <p className="text-[21px] font-extrabold tracking-[-0.02em] text-[#A8143D]">
                    {money(
                      grandTotal
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}