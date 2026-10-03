"use client";

<<<<<<< HEAD
import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import Header from "@/src/components/Header/Header";
import AccountSidebar from "../components/AccountSidebar";
import {
  ArrowRight,
  Heart,
=======
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Download,
  Heart,
  MapPin,
>>>>>>> aman
  Package,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  XCircle,
} from "lucide-react";

<<<<<<< HEAD
/* =========================================================
   WINDOW WIDTH
========================================================= */
function useWindowWidth() {
  const [width, setWidth] = useState(1440);

  useEffect(() => {
    const updateWidth = () => setWidth(window.innerWidth);
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  return width;
}
=======
import Header from "@/src/components/Header/Header";
import AccountSidebar from "@/app/account/components/AccountSidebar";

import {
  cancelMyOrder,
  getMyOrders,
  userInvoiceUrl,
} from "@/lib/orders";

import type { Order } from "@/types/order";

/* =========================================================
   HELPERS
========================================================= */
>>>>>>> aman

function formatPrice(value: number | undefined) {
  const price = Number(value || 0);

  return `₹${price.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

<<<<<<< HEAD
=======
function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function normalizeStatus(value?: string) {
  return String(value || "confirmed")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "_");
}

function formatStatus(value?: string) {
  const status = normalizeStatus(value);

  const map: Record<string, string> = {
    pending: "Pending",
    pending_payment: "Payment Pending",
    confirmed: "Confirmed",
    processing: "Processing",
    shipped: "Shipped",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
    canceled: "Cancelled",
    returned: "Returned",
    refunded: "Refunded",
  };

  return (
    map[status] ||
    status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase(),
      )
  );
}

function formatPaymentMethod(value?: string) {
  const method = String(value || "")
    .trim()
    .toLowerCase();

  if (method === "cod") {
    return "Cash on Delivery";
  }

  if (
    method === "razorpay" ||
    method === "online"
  ) {
    return "Online Payment";
  }

  return value || "Payment";
}

function getStatusTheme(value?: string) {
  const status = normalizeStatus(value);

  if (status === "delivered") {
    return {
      bg: "#EAF7EF",
      border: "#CAE6D4",
      color: "#176337",
    };
  }

  if (
    status === "cancelled" ||
    status === "canceled"
  ) {
    return {
      bg: "#FFF0F0",
      border: "#F0CCCC",
      color: "#962828",
    };
  }

  if (
    status === "shipped" ||
    status === "out_for_delivery"
  ) {
    return {
      bg: "#EEF4FF",
      border: "#D2E0F7",
      color: "#315B92",
    };
  }

  if (status === "processing") {
    return {
      bg: "#FFF7E9",
      border: "#EEDDBD",
      color: "#7B551C",
    };
  }

  return {
    bg: "#FFF0F3",
    border: "#F0C9D1",
    color: "#A90D3B",
  };
}

function hasCancellationRequest(order: Order) {
  return (order.statusHistory || []).some(
    (entry) =>
      String(entry?.status || "")
        .trim()
        .toLowerCase() ===
      "cancellation_requested",
  );
}

function canRequestCancellation(order: Order) {
  if (hasCancellationRequest(order)) {
    return false;
  }

  return [
    "pending",
    "pending_payment",
    "confirmed",
  ].includes(normalizeStatus(order.status));
}

function getAddress(order: Order) {
  const address = order.shippingAddress;

  if (!address) return "";

  return [
    address.addressLine1,
    address.addressLine2,
    address.landmark,
    address.city,
    address.district,
    address.state,
    address.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

/* =========================================================
   PRICE BREAKDOWN
========================================================= */

function OrderPriceBreakdown({
  order,
}: {
  order: Order;
}) {
  const automaticDiscount = Number(
    order.automaticDiscount || 0,
  );

  const codeDiscount = Number(
    order.codeDiscount || 0,
  );

  const fallbackDiscount = Number(
    order.discount || 0,
  );

  const knownDiscount =
    automaticDiscount + codeDiscount;

  const otherDiscount = Math.max(
    0,
    fallbackDiscount - knownDiscount,
  );

  return (
    <div className="border-t border-[#EEE5E1] bg-[#FFFDFC] px-4 py-4 sm:px-5">
      <div className="mx-auto max-w-[520px] sm:ml-auto sm:mr-0">
        <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#211A18]">
          Price Details
        </div>

        <div className="space-y-3 text-[12px]">
          <PriceRow
            label="Items Subtotal"
            value={formatPrice(order.subtotal)}
          />

          {automaticDiscount > 0 && (
            <PriceRow
              label="Automatic Discount"
              value={`- ${formatPrice(
                automaticDiscount,
              )}`}
              discount
            />
          )}

          {codeDiscount > 0 && (
            <PriceRow
              label={
                order.discountCode
                  ? `Coupon (${order.discountCode})`
                  : "Coupon Discount"
              }
              value={`- ${formatPrice(
                codeDiscount,
              )}`}
              discount
            />
          )}

          {otherDiscount > 0 && (
            <PriceRow
              label="Other Discount"
              value={`- ${formatPrice(
                otherDiscount,
              )}`}
              discount
            />
          )}

          <PriceRow
            label={
              order.taxPercentage
                ? `${order.taxName || "Tax"} (${order.taxPercentage}%)`
                : order.taxName || "Tax"
            }
            value={`+ ${formatPrice(
              order.tax || 0,
            )}`}
          />

          <PriceRow
            label="Delivery Charge"
            value={
              Number(order.shipping || 0) > 0
                ? `+ ${formatPrice(
                    order.shipping,
                  )}`
                : "FREE"
            }
          />

          <div className="border-t border-dashed border-[#DCCFCC] pt-3">
            <PriceRow
              label="Total Paid / Payable"
              value={formatPrice(order.total)}
              total
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceRow({
  label,
  value,
  discount = false,
  total = false,
}: {
  label: string;
  value: string;
  discount?: boolean;
  total?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span
        className={
          total
            ? "font-bold text-[#171313]"
            : "font-medium text-[#332D2B]"
        }
      >
        {label}
      </span>

      <span
        className={[
          "shrink-0 text-right",
          total
            ? "font-serif text-[18px] font-semibold text-[#111111]"
            : discount
              ? "font-semibold text-[#15803D]"
              : "font-semibold text-[#171313]",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

>>>>>>> aman
/* =========================================================
   PAGE
========================================================= */
export default function OrdersPage() {
<<<<<<< HEAD
  const width = useWindowWidth();

  const isMobile = width <= 760;
  const isSmallMobile = width <= 480;
  const isTablet = width <= 1023;
  const isCompactDesktop = width <= 1180;
  const isMediumDesktop = width <= 1350;

  /*
   * IMPORTANT:
   * Order API abhi backend me available nahi hai.
   * Isliye yahan koi random / fake order data nahi rakha gaya.
   * API ready hone par totalOrders, totalSpend, averageOrder aur
   * order list ko backend response se fill karna hai.
   */
  const totalOrders = 0;
  const totalSpend = 0;
  const averageOrder = 0;

  /* =======================================================
     LAYOUT
  ======================================================= */
  const pageWrapperStyle: CSSProperties = {
    width: "100%",
    minHeight: "calc(100vh - 105px)",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#FDFCFB",
    overflowX: "hidden",
  };

  const layoutStyle: CSSProperties = {
    width: "100%",
    maxWidth: "1600px",
    margin: "0 auto",
    flex: 1,
    minHeight: 0,
    alignItems: "start",
    ...(isTablet
      ? { display: "block" }
      : {
          display: "grid",
          gridTemplateColumns: "280px minmax(0, 1fr)",
        }),
  };

  const contentStyle: CSSProperties = {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: isMobile
      ? "14px 12px 28px"
      : isTablet
        ? "18px 18px 34px"
        : isMediumDesktop
          ? "18px 20px 40px"
          : "20px 28px 45px",
  };

  /* =======================================================
     HERO
  ======================================================= */
  const heroGridStyle: CSSProperties = {
    width: "100%",
    display: "grid",
    gridTemplateColumns: isCompactDesktop
      ? "1fr"
      : "minmax(0, 1.7fr) minmax(330px, 1fr)",
    gap: "18px",
  };

  const heroStyle: CSSProperties = {
    position: "relative",
    minWidth: 0,
    minHeight: isMobile ? "150px" : "165px",
    padding: isMobile ? "22px 20px" : "25px 30px",
    overflow: "hidden",
    borderRadius: "12px",
    boxSizing: "border-box",
    background: `
      radial-gradient(circle at 84% 28%, rgba(255,255,255,.90) 0 7%, rgba(255,255,255,0) 22%),
      radial-gradient(circle at 94% 80%, rgba(223,154,165,.22) 0 7%, rgba(223,154,165,0) 20%),
      linear-gradient(90deg, #FAEDEB 0%, #FBEFED 54%, #F7E4E5 100%)
    `,
  };

  const breadcrumbStyle: CSSProperties = {
    position: "relative",
    zIndex: 2,
    fontSize: "10px",
    color: "#796E69",
    letterSpacing: "0.5px",
  };

  const heroTitleStyle: CSSProperties = {
    position: "relative",
    zIndex: 2,
    margin: "14px 0 0",
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: isMobile ? "37px" : "44px",
    lineHeight: 1,
    fontWeight: 400,
    color: "#292321",
  };

  const heroSubtitleStyle: CSSProperties = {
    position: "relative",
    zIndex: 2,
    margin: "12px 0 0",
    maxWidth: "430px",
    fontSize: "12px",
    lineHeight: 1.55,
    color: "#6E6662",
  };

  const heroQuoteStyle: CSSProperties = {
    position: "absolute",
    zIndex: 2,
    top: "31px",
    right: "18%",
    fontFamily: '"Segoe Print", "Comic Sans MS", cursive',
    fontSize: "18px",
    lineHeight: 1.12,
    color: "#B76572",
    transform: "rotate(-7deg)",
    display: isMediumDesktop ? "none" : "block",
  };

  /* =======================================================
     SUMMARY
  ======================================================= */
  const summaryStyle: CSSProperties = {
    minWidth: 0,
    minHeight: isMobile ? "auto" : "165px",
    padding: isMobile ? "16px" : "20px",
    boxSizing: "border-box",
    border: "1px solid #EEE8E5",
    borderRadius: "12px",
    backgroundColor: "#FFFFFF",
  };

  const summaryTopStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  };

  const summaryTitleWrapStyle: CSSProperties = {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: "13px",
  };

  const summaryIconStyle: CSSProperties = {
    width: "48px",
    height: "48px",
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    backgroundColor: "#FCEAEA",
    color: "#C86D72",
  };

  const summaryTitleStyle: CSSProperties = {
    fontFamily: "Georgia, serif",
    fontSize: "17px",
    whiteSpace: "nowrap",
    color: "#292321",
  };

  const summaryStatusStyle: CSSProperties = {
    padding: "8px 13px",
    borderRadius: "8px",
    backgroundColor: "#F9F5F3",
    color: "#8B7773",
    fontSize: "9px",
    whiteSpace: "nowrap",
  };

  const summaryStatsStyle: CSSProperties = {
    marginTop: "22px",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  };

  const summaryStatStyle: CSSProperties = {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 8px",
  };

  const summaryValueStyle: CSSProperties = {
    fontFamily: "Georgia, serif",
    fontSize: isMobile ? "15px" : "18px",
    whiteSpace: "nowrap",
    color: "#292321",
  };

  const summaryLabelStyle: CSSProperties = {
    marginTop: "6px",
    fontSize: isMobile ? "8px" : "9px",
    color: "#918986",
    textAlign: "center",
    whiteSpace: isSmallMobile ? "normal" : "nowrap",
  };

  /* =======================================================
     EMPTY STATE
  ======================================================= */
  const emptySectionStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    minHeight: isMobile ? "450px" : "500px",
    marginTop: "18px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    padding: isMobile ? "34px 18px" : "48px 30px",
    border: "1px solid #EEE7E4",
    borderRadius: "12px",
    background: "linear-gradient(180deg, #FFFFFF 0%, #FFFCFB 100%)",
  };

  const emptyContentStyle: CSSProperties = {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: "620px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  };

  const emptyArtworkStyle: CSSProperties = {
    position: "relative",
    width: isMobile ? "190px" : "225px",
    height: isMobile ? "165px" : "190px",
    marginBottom: isMobile ? "8px" : "12px",
  };

  const glowStyle: CSSProperties = {
    position: "absolute",
    width: isMobile ? "135px" : "156px",
    height: isMobile ? "135px" : "156px",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -47%)",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(248,202,205,.50) 0%, rgba(248,202,205,.17) 46%, rgba(248,202,205,0) 72%)",
  };

  const packageCardStyle: CSSProperties = {
    position: "absolute",
    width: isMobile ? "105px" : "122px",
    height: isMobile ? "92px" : "108px",
    left: "50%",
    top: "53%",
    transform: "translate(-50%, -50%) rotate(-3deg)",
    display: "grid",
    placeItems: "center",
    borderRadius: "16px",
    border: "1px solid #F0C6CA",
    background: "linear-gradient(145deg, #F8D6D8 0%, #EFAEB6 100%)",
    boxShadow: "0 18px 38px rgba(157, 51, 72, 0.14)",
    color: "#A6163D",
  };

  const tapeStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: "50%",
    width: "26px",
    height: "100%",
    transform: "translateX(-50%)",
    backgroundColor: "rgba(255,255,255,0.32)",
  };

  const bubbleStyle: CSSProperties = {
    position: "absolute",
    width: "42px",
    height: "42px",
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 9px 24px rgba(176, 64, 82, 0.13)",
    color: "#D85B70",
  };

  const emptyTitleStyle: CSSProperties = {
    margin: 0,
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: isMobile ? "27px" : "32px",
    lineHeight: 1.15,
    fontWeight: 400,
    color: "#2E2725",
  };

  const emptyTextStyle: CSSProperties = {
    maxWidth: "430px",
    margin: "12px auto 0",
    fontSize: isMobile ? "12px" : "13px",
    lineHeight: 1.7,
    color: "#7C7470",
  };

  const startShoppingStyle: CSSProperties = {
    minWidth: isSmallMobile ? "100%" : "230px",
    minHeight: "46px",
    marginTop: "24px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "0 22px",
    boxSizing: "border-box",
    border: "1px solid #A90D3B",
    borderRadius: "8px",
    background: "linear-gradient(180deg, #B90C42 0%, #A70939 100%)",
    boxShadow: "0 10px 24px rgba(169, 9, 57, 0.18)",
    color: "#FFFFFF",
    fontSize: "12px",
    fontWeight: 600,
    textDecoration: "none",
  };

  const helperRowStyle: CSSProperties = {
    marginTop: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: isMobile ? "13px" : "20px",
    flexWrap: "wrap",
  };

  const helperItemStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    color: "#9A8B87",
    fontSize: "10px",
  };

  /* =======================================================
     FOOTER
  ======================================================= */
  const footerStyle: CSSProperties = {
    width: "100%",
    minHeight: "72px",
    marginTop: "auto",
    borderTop: "1px solid #EEE8E5",
    backgroundColor: "#FFFFFF",
    display: isSmallMobile
      ? "none"
      : "grid",
    gridTemplateColumns: isMobile
      ? "repeat(2, minmax(0, 1fr))"
      : isCompactDesktop
        ? "repeat(4, minmax(0, 1fr))"
        : "repeat(5, minmax(0, 1fr))",
  };

  const benefitStyle: CSSProperties = {
    minWidth: 0,
    minHeight: "72px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "13px",
    padding: "12px 20px",
    boxSizing: "border-box",
    borderRight: "1px solid #EEE8E5",
    color: "#4F4643",
  };

  const benefitTitleStyle: CSSProperties = {
    display: "block",
    fontFamily: "Georgia, serif",
    fontSize: "10px",
    fontWeight: 400,
    color: "#292321",
  };

  const benefitTextStyle: CSSProperties = {
    display: "block",
    marginTop: "4px",
    fontSize: "8px",
    color: "#A19995",
  };

  const quoteBenefitStyle: CSSProperties = {
    display: isCompactDesktop ? "none" : "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px",
    fontFamily: '"Segoe Print", "Comic Sans MS", cursive',
    fontSize: "19px",
    color: "#765F5B",
  };
=======
  const [orders, setOrders] = useState<Order[]>(
    [],
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [cancelError, setCancelError] =
    useState("");

  const [cancellingId, setCancellingId] =
    useState("");

  const [
    expandedOrderId,
    setExpandedOrderId,
  ] = useState<string>("");

  /* =======================================================
     LOAD
  ======================================================= */

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const rows = await getMyOrders();

      /*
       * Different DB order = different card.
       * Same order ke saare products ek card ke andar.
       */
      const uniqueOrders = Array.from(
        new Map(
          rows.map((order) => [
            order.id || order.orderNumber,
            order,
          ]),
        ).values(),
      );

      /*
       * Latest order first.
       */
      uniqueOrders.sort((a, b) => {
        const aTime = new Date(
          a.createdAt || 0,
        ).getTime();

        const bTime = new Date(
          b.createdAt || 0,
        ).getTime();

        return bTime - aTime;
      });

      setOrders(uniqueOrders);
    } catch (loadError) {
      console.error(
        "LOAD ORDERS ERROR:",
        loadError,
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load your orders.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  /* =======================================================
     TOTALS
  ======================================================= */

  const totalOrders = orders.length;

  const totalSpend = useMemo(() => {
    return orders
      .filter((order) => {
        const status = normalizeStatus(
          order.status,
        );

        return ![
          "cancelled",
          "canceled",
          "refunded",
        ].includes(status);
      })
      .reduce(
        (sum, order) =>
          sum + Number(order.total || 0),
        0,
      );
  }, [orders]);

  const averageOrder =
    totalOrders > 0
      ? totalSpend / totalOrders
      : 0;

  /* =======================================================
     CANCEL
  ======================================================= */

  async function requestCancellation(
    order: Order,
  ) {
    if (
      cancellingId ||
      !canRequestCancellation(order)
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Request cancellation for order ${order.orderNumber}?`,
    );

    if (!confirmed) return;

    try {
      setCancellingId(order.id);
      setCancelError("");

      const updated = await cancelMyOrder(
        order.id,
        "Cancellation requested by customer",
      );

      setOrders((current) =>
        current.map((item) =>
          item.id === order.id
            ? updated
            : item,
        ),
      );
    } catch (cancelRequestError) {
      setCancelError(
        cancelRequestError instanceof Error
          ? cancelRequestError.message
          : "Unable to request cancellation.",
      );
    } finally {
      setCancellingId("");
    }
  }
>>>>>>> aman

  return (
    <>
      <Header />

<<<<<<< HEAD
      <div style={pageWrapperStyle}>
        <main style={layoutStyle}>
          <AccountSidebar />

          <section style={contentStyle}>
            <div style={heroGridStyle}>
              <section style={heroStyle}>
                <div style={breadcrumbStyle}>
                  MY ACCOUNT &gt; Orders
                </div>

                <h1 style={heroTitleStyle}>
                  My Orders
                </h1>

                <p style={heroSubtitleStyle}>
                  Track, manage and relive your favorite finds.
                  Your shopping journey will appear here.
                </p>

                <div style={heroQuoteStyle}>
=======
      <div className="min-h-[calc(100vh-105px)] bg-[#FDFCFB]">
        <div className="mx-auto flex w-full max-w-[1600px]">
          {/* COMMON SIDEBAR */}
          <AccountSidebar />

          {/* CONTENT */}
          <main className="min-w-0 flex-1 px-3 pb-8 pt-4 sm:px-5 lg:px-7 lg:pb-12">
            {/* =================================================
                TOP
            ================================================= */}

            <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-[minmax(0,1.7fr)_minmax(330px,1fr)]">
              <section
                className="
                  relative
                  min-h-[150px]
                  overflow-hidden
                  rounded-[12px]
                  px-5
                  py-6
                  sm:min-h-[165px]
                  sm:px-[30px]
                "
                style={{
                  background: `
                    radial-gradient(circle at 84% 28%, rgba(255,255,255,.90) 0 7%, rgba(255,255,255,0) 22%),
                    radial-gradient(circle at 94% 80%, rgba(223,154,165,.22) 0 7%, rgba(223,154,165,0) 20%),
                    linear-gradient(90deg, #FAEDEB 0%, #FBEFED 54%, #F7E4E5 100%)
                  `,
                }}
              >
                <div className="text-[10px] font-semibold tracking-[0.5px] text-[#282221]">
                  MY ACCOUNT &gt; Orders
                </div>

                <h1 className="mt-[14px] font-serif text-[37px] font-normal leading-none text-[#171313] sm:text-[44px]">
                  My Orders
                </h1>

                <p className="mt-3 max-w-[430px] text-[12px] font-medium leading-[1.55] text-[#332E2C]">
                  Track, manage and relive your
                  favorite finds. Your shopping
                  journey will appear here.
                </p>

                <div className="absolute right-[18%] top-[31px] hidden rotate-[-7deg] font-['Segoe_Print','Comic_Sans_MS',cursive] text-[18px] leading-[1.12] text-[#A64055] 2xl:block">
>>>>>>> aman
                  Good
                  <br />
                  Things
                  <br />
                  Take
                  <br />
                  Style ♡
                </div>
              </section>

<<<<<<< HEAD
              <section style={summaryStyle}>
                <div style={summaryTopStyle}>
                  <div style={summaryTitleWrapStyle}>
                    <div style={summaryIconStyle}>
                      <Package size={23} strokeWidth={1.5} />
                    </div>

                    <span style={summaryTitleStyle}>
=======
              {/* SUMMARY */}

              <section className="min-h-[165px] rounded-[12px] border border-[#E7DEDA] bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-[13px]">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#FCEAEA] text-[#AD2348]">
                      <Package
                        size={23}
                        strokeWidth={1.5}
                      />
                    </div>

                    <span className="whitespace-nowrap font-serif text-[17px] font-medium text-[#171313]">
>>>>>>> aman
                      Order Summary
                    </span>
                  </div>

<<<<<<< HEAD
                  <span style={summaryStatusStyle}>
                    No orders yet
                  </span>
                </div>

                <div style={summaryStatsStyle}>
                  <div
                    style={{
                      ...summaryStatStyle,
                      borderRight: "1px solid #ECE7E4",
                    }}
                  >
                    <strong style={summaryValueStyle}>
                      {totalOrders}
                    </strong>
                    <span style={summaryLabelStyle}>
                      Total Orders
                    </span>
                  </div>

                  <div
                    style={{
                      ...summaryStatStyle,
                      borderRight: "1px solid #ECE7E4",
                    }}
                  >
                    <strong style={summaryValueStyle}>
                      {formatPrice(totalSpend)}
                    </strong>
                    <span style={summaryLabelStyle}>
                      Total Spend
                    </span>
                  </div>

                  <div style={summaryStatStyle}>
                    <strong style={summaryValueStyle}>
                      {formatPrice(averageOrder)}
                    </strong>
                    <span style={summaryLabelStyle}>
                      Average Order
                    </span>
                  </div>
=======
                  <span className="whitespace-nowrap rounded-[8px] bg-[#F7F2F0] px-[13px] py-2 text-[9px] font-semibold text-[#211B19]">
                    {loading
                      ? "Loading..."
                      : `${totalOrders} Order${
                          totalOrders === 1
                            ? ""
                            : "s"
                        }`}
                  </span>
                </div>

                <div className="mt-[22px] grid grid-cols-3">
                  <SummaryStat
                    value={String(totalOrders)}
                    label="Total Orders"
                  />

                  <SummaryStat
                    value={formatPrice(totalSpend)}
                    label="Total Spend"
                    bordered
                  />

                  <SummaryStat
                    value={formatPrice(
                      averageOrder,
                    )}
                    label="Average Order"
                  />
>>>>>>> aman
                </div>
              </section>
            </div>

<<<<<<< HEAD
            {/* EMPTY ORDER UI */}
            <section style={emptySectionStyle}>
              <div
                style={{
                  position: "absolute",
                  width: isMobile ? "140px" : "220px",
                  height: isMobile ? "140px" : "220px",
                  left: isMobile ? "-70px" : "-95px",
                  bottom: isMobile ? "-58px" : "-100px",
                  borderRadius: "50%",
                  background: "rgba(244, 214, 210, 0.22)",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  width: isMobile ? "115px" : "190px",
                  height: isMobile ? "115px" : "190px",
                  right: isMobile ? "-56px" : "-82px",
                  top: isMobile ? "-45px" : "-80px",
                  borderRadius: "50%",
                  background: "rgba(244, 214, 210, 0.18)",
                }}
              />

              <div style={emptyContentStyle}>
                <div style={emptyArtworkStyle}>
                  <div style={glowStyle} />

                  <div
                    style={{
                      ...bubbleStyle,
                      left: isMobile ? "5px" : "8px",
                      top: isMobile ? "20px" : "24px",
                    }}
                  >
                    <Heart size={19} strokeWidth={1.7} />
                  </div>

                  <div
                    style={{
                      ...bubbleStyle,
                      right: isMobile ? "4px" : "6px",
                      top: isMobile ? "4px" : "10px",
                      width: "34px",
                      height: "34px",
                    }}
                  >
                    <Sparkles size={16} strokeWidth={1.7} />
                  </div>

                  <div style={packageCardStyle}>
                    <div style={tapeStyle} />
                    <Package
                      size={isMobile ? 54 : 62}
                      strokeWidth={1.25}
                    />
                  </div>
                </div>

                <h2 style={emptyTitleStyle}>
                  No orders yet
                </h2>

                <p style={emptyTextStyle}>
                  You haven&apos;t placed any orders yet. Once you
                  shop, your ordered products and delivery status
                  will appear here automatically.
                </p>

                <Link href="/" style={startShoppingStyle}>
                  <ShoppingBag size={17} strokeWidth={1.8} />
                  Start Shopping
                  <ArrowRight size={16} strokeWidth={1.8} />
                </Link>

                <div style={helperRowStyle}>
                  <span style={helperItemStyle}>
                    <ShieldCheck size={14} strokeWidth={1.7} />
                    Secure checkout
                  </span>

                  <span style={helperItemStyle}>
                    <Truck size={14} strokeWidth={1.7} />
                    Easy tracking
                  </span>

                  <span style={helperItemStyle}>
                    <RefreshCcw size={14} strokeWidth={1.7} />
                    Easy returns
                  </span>
                </div>
              </div>
            </section>
          </section>
        </main>

        <footer style={footerStyle}>
          <div style={benefitStyle}>
            <Truck size={25} strokeWidth={1.4} />
            <div>
              <strong style={benefitTitleStyle}>
                Free Shipping
              </strong>
              <span style={benefitTextStyle}>
                on orders above ₹1,499
              </span>
            </div>
          </div>

          <div style={benefitStyle}>
            <RefreshCcw size={24} strokeWidth={1.4} />
            <div>
              <strong style={benefitTitleStyle}>
                Easy Returns
              </strong>
              <span style={benefitTextStyle}>
                Hassle free within 7 days
              </span>
            </div>
          </div>

          <div style={benefitStyle}>
            <ShieldCheck size={25} strokeWidth={1.4} />
            <div>
              <strong style={benefitTitleStyle}>
                Secure Payments
              </strong>
              <span style={benefitTextStyle}>
                Safe and trusted
              </span>
            </div>
          </div>

          <div style={benefitStyle}>
            <Sparkles size={24} strokeWidth={1.4} />
            <div>
              <strong style={benefitTitleStyle}>
                Thoughtfully Made
              </strong>
              <span style={benefitTextStyle}>
                For a kinder tomorrow
              </span>
            </div>
          </div>

          <div style={quoteBenefitStyle}>
            Style a kinder tomorrow ♡
          </div>
        </footer>
=======
            {cancelError && (
              <div className="mt-4 flex items-center gap-2 rounded-[9px] border border-[#F0C8CE] bg-[#FFF5F6] px-4 py-3 text-[11px] font-semibold text-[#8D1836]">
                <AlertCircle size={16} />
                {cancelError}
              </div>
            )}

            {/* =================================================
                LOADING
            ================================================= */}

            {loading && (
              <div className="mt-[18px] flex min-h-[180px] items-center justify-center rounded-[12px] border border-[#E9DFDB] bg-white text-center text-[#171313]">
                <div>
                  <Package
                    className="mx-auto"
                    size={30}
                  />

                  <p className="mt-3 text-[13px] font-semibold">
                    Loading your orders...
                  </p>
                </div>
              </div>
            )}

            {/* =================================================
                ERROR
            ================================================= */}

            {!loading && error && (
              <div className="mt-[18px] flex min-h-[180px] items-center justify-center rounded-[12px] border border-[#E9DFDB] bg-white px-5 text-center">
                <div>
                  <AlertCircle
                    className="mx-auto"
                    size={30}
                  />

                  <p className="mt-3 text-[13px] font-semibold text-[#171313]">
                    {error}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      void loadOrders()
                    }
                    className="mt-4 inline-flex h-10 items-center gap-2 rounded-[7px] border border-[#DCCFCC] bg-white px-4 text-[11px] font-bold text-[#171313]"
                  >
                    <RefreshCcw size={14} />
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* =================================================
                ORDERS
            ================================================= */}

            {!loading &&
              !error &&
              orders.length > 0 && (
                <section className="mt-[18px] grid gap-[14px]">
                  {orders.map((order) => {
                    const theme =
                      getStatusTheme(
                        order.status,
                      );

                    const pendingCancellation =
                      hasCancellationRequest(
                        order,
                      );

                    const cancelled =
                      [
                        "cancelled",
                        "canceled",
                      ].includes(
                        normalizeStatus(
                          order.status,
                        ),
                      );

                    const expanded =
                      expandedOrderId ===
                      order.id;

                    const deliveryAddress =
                      getAddress(order);

                    return (
                      <article
                        key={order.id}
                        className="overflow-hidden rounded-[12px] border border-[#E9DFDB] bg-white shadow-[0_8px_30px_rgba(72,45,40,0.035)]"
                      >
                        {/* ORDER HEADER */}

                        <div className="flex flex-col justify-between gap-4 border-b border-[#EEE5E1] bg-gradient-to-r from-[#FFF9F8] to-[#FFFDFD] px-4 py-4 sm:px-5 md:flex-row md:items-center">
                          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 sm:gap-x-9">
                            <OrderMeta
                              label="Order Number"
                              value={`#${order.orderNumber}`}
                            />

                            <OrderMeta
                              label="Order Date"
                              value={formatDate(
                                order.createdAt,
                              )}
                            />

                            <OrderMeta
                              label="Payment"
                              value={formatPaymentMethod(
                                order.paymentMethod,
                              )}
                            />
                          </div>

                          <div className="flex flex-col items-start gap-2 md:items-end">
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-[7px] text-[9px] font-bold"
                              style={{
                                background:
                                  theme.bg,
                                borderColor:
                                  theme.border,
                                color:
                                  theme.color,
                              }}
                            >
                              {cancelled ? (
                                <XCircle
                                  size={13}
                                />
                              ) : normalizeStatus(
                                  order.status,
                                ) ===
                                "delivered" ? (
                                <CheckCircle2
                                  size={13}
                                />
                              ) : (
                                <Clock3
                                  size={13}
                                />
                              )}

                              {formatStatus(
                                order.status,
                              )}
                            </span>

                            {pendingCancellation &&
                              !cancelled && (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#8D1836]">
                                  <Clock3
                                    size={13}
                                  />
                                  Your order is
                                  waiting to be
                                  cancelled
                                </span>
                              )}
                          </div>
                        </div>

                        {/* ITEMS */}

                        <div className="px-4 sm:px-5">
                          {order.items.map(
                            (item) => (
                              <div
                                key={item.id}
                                className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-3 border-b border-[#F0E9E6] py-4 sm:grid-cols-[92px_minmax(0,1fr)_auto] sm:gap-4"
                              >
                                {item.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={
                                      item.image
                                    }
                                    alt={
                                      item.name
                                    }
                                    className="h-[88px] w-[72px] rounded-[10px] border border-[#EEE4E0] object-cover sm:h-[108px] sm:w-[92px]"
                                  />
                                ) : (
                                  <div className="grid h-[88px] w-[72px] place-items-center rounded-[10px] border border-[#EEE4E0] bg-[#F8F4F2] text-[#A31A40] sm:h-[108px] sm:w-[92px]">
                                    <Package
                                      size={30}
                                    />
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <h3 className="font-serif text-[14px] font-medium leading-[1.35] text-[#171313] sm:text-[16px]">
                                    {item.name}
                                  </h3>

                                  <p className="mt-1.5 text-[11px] font-medium leading-[1.55] text-[#393230]">
                                    {item.color &&
                                      `Color: ${item.color}`}

                                    {item.color &&
                                      item.size &&
                                      " • "}

                                    {item.size &&
                                      `Size: ${item.size}`}
                                  </p>

                                  <p className="mt-1 text-[11px] font-medium text-[#393230]">
                                    Quantity:{" "}
                                    {
                                      item.quantity
                                    }
                                  </p>

                                  <div className="mt-2 font-serif text-[14px] font-semibold text-[#171313] sm:hidden">
                                    {formatPrice(
                                      item.finalTotal ??
                                        item.subtotal,
                                    )}
                                  </div>
                                </div>

                                <div className="hidden text-right font-serif text-[15px] font-semibold text-[#171313] sm:block">
                                  {formatPrice(
                                    item.finalTotal ??
                                      item.subtotal,
                                  )}
                                </div>
                              </div>
                            ),
                          )}
                        </div>

                        {/* TOTAL + CLICK PRICE DETAILS */}

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedOrderId(
                              expanded
                                ? ""
                                : order.id,
                            )
                          }
                          className="flex w-full items-center justify-between gap-5 border-0 bg-white px-4 py-[15px] text-left sm:px-5"
                        >
                          <div>
                            <div className="text-[11px] font-semibold text-[#312B29]">
                              Order Total
                            </div>

                            <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-[#A90D3B]">
                              {expanded
                                ? "Hide Price Details"
                                : "View Price Details"}

                              {expanded ? (
                                <ChevronUp
                                  size={14}
                                />
                              ) : (
                                <ChevronDown
                                  size={14}
                                />
                              )}
                            </div>
                          </div>

                          <strong className="font-serif text-[18px] font-semibold text-[#111111] sm:text-[20px]">
                            {formatPrice(
                              order.total,
                            )}
                          </strong>
                        </button>

                        {/* PRICE BREAKUP */}

                        {expanded && (
                          <OrderPriceBreakdown
                            order={order}
                          />
                        )}

                        {/* ADDRESS / ACTIONS */}

                        <div className="grid gap-4 border-t border-[#EEE6E2] bg-[#FFFCFB] px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                          <div className="flex min-w-0 items-start gap-2.5 text-[11px] font-medium leading-[1.55] text-[#241F1D]">
                            {deliveryAddress ? (
                              <>
                                <MapPin
                                  size={16}
                                  className="mt-0.5 shrink-0"
                                />

                                <div>
                                  <strong className="mb-0.5 block text-[#171313]">
                                    Delivery
                                    Address
                                  </strong>

                                  {
                                    deliveryAddress
                                  }
                                </div>
                              </>
                            ) : (
                              <>
                                <CalendarDays
                                  size={16}
                                  className="shrink-0"
                                />

                                Ordered on{" "}
                                {formatDate(
                                  order.createdAt,
                                )}
                              </>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 lg:justify-end">
                            {order.invoiceNumber && (
                              <a
                                href={userInvoiceUrl(
                                  order.id,
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-[7px] border border-[#DCCFCC] bg-white px-4 text-[10px] font-bold text-[#1C1716] no-underline"
                              >
                                <Download
                                  size={14}
                                />
                                Invoice
                              </a>
                            )}

                            {pendingCancellation &&
                            !cancelled ? (
                              <span className="inline-flex min-h-10 items-center gap-2 rounded-[7px] border border-[#E5C8CE] bg-[#FFF7F8] px-4 text-[10px] font-bold text-[#8D1836]">
                                <Clock3
                                  size={14}
                                />
                                Waiting to be
                                cancelled
                              </span>
                            ) : canRequestCancellation(
                                order,
                              ) ? (
                              <button
                                type="button"
                                disabled={
                                  cancellingId ===
                                  order.id
                                }
                                onClick={() =>
                                  void requestCancellation(
                                    order,
                                  )
                                }
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-[7px] border border-[#E2BDC5] bg-[#FFF6F7] px-4 text-[10px] font-bold text-[#A40B38] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <RotateCcw
                                  size={14}
                                />

                                {cancellingId ===
                                order.id
                                  ? "Requesting..."
                                  : "Cancel Order"}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </section>
              )}

            {/* EMPTY */}

            {!loading &&
              !error &&
              orders.length === 0 && (
                <section className="relative mt-[18px] flex min-h-[430px] items-center justify-center overflow-hidden rounded-[12px] border border-[#E7DDDA] bg-gradient-to-b from-white to-[#FFFCFB] px-5 py-10">
                  <div className="relative z-10 flex w-full max-w-[620px] flex-col items-center text-center">
                    <div className="relative mb-3 grid h-[150px] w-[180px] place-items-center">
                      <div className="absolute h-[140px] w-[140px] rounded-full bg-[#F8CACD]/30" />

                      <div className="relative grid h-[105px] w-[115px] place-items-center rounded-[16px] border border-[#F0C6CA] bg-gradient-to-br from-[#F8D6D8] to-[#EFAEB6] text-[#A6163D] shadow-lg">
                        <Package
                          size={56}
                          strokeWidth={
                            1.25
                          }
                        />
                      </div>

                      <Heart className="absolute left-0 top-4 text-[#D85B70]" />

                      <Sparkles className="absolute right-0 top-0 text-[#D85B70]" />
                    </div>

                    <h2 className="font-serif text-[28px] text-[#171313] sm:text-[32px]">
                      No orders yet
                    </h2>

                    <p className="mt-3 max-w-[430px] text-[12px] font-medium leading-6 text-[#302A28] sm:text-[13px]">
                      You haven&apos;t
                      placed any orders
                      yet. Once you shop,
                      your ordered products
                      and delivery status
                      will appear here.
                    </p>

                    <Link
                      href="/"
                      className="mt-6 inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[8px] bg-[#A90D3B] px-6 text-[12px] font-semibold text-white no-underline"
                    >
                      <ShoppingBag
                        size={17}
                      />
                      Start Shopping
                      <ArrowRight
                        size={16}
                      />
                    </Link>

                    <div className="mt-7 flex flex-wrap justify-center gap-5 text-[10px] font-semibold text-[#332D2B]">
                      <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck
                          size={14}
                        />
                        Secure checkout
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <Truck
                          size={14}
                        />
                        Easy tracking
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <RefreshCcw
                          size={14}
                        />
                        Easy returns
                      </span>
                    </div>
                  </div>
                </section>
              )}
          </main>
        </div>
>>>>>>> aman
      </div>
    </>
  );
}
<<<<<<< HEAD
=======

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function SummaryStat({
  value,
  label,
  bordered = false,
}: {
  value: string;
  label: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={[
        "flex min-w-0 flex-col items-center justify-center px-2 text-center",
        bordered
          ? "border-x border-[#ECE7E4]"
          : "",
      ].join(" ")}
    >
      <strong className="whitespace-nowrap font-serif text-[15px] text-[#111111] sm:text-[18px]">
        {value}
      </strong>

      <span className="mt-1.5 text-[8px] font-semibold text-[#302927] sm:text-[9px]">
        {label}
      </span>
    </div>
  );
}

function OrderMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.6px] text-[#746A66]">
        {label}
      </span>

      <span className="block break-words text-[12px] font-semibold leading-[1.4] text-[#171313]">
        {value}
      </span>
    </div>
  );
}
>>>>>>> aman
