"use client";

import Link from "next/link";
import {
  Check,
  ChevronRight,
  CircleCheckBig,
  Copy,
  Home,
  MapPin,
  PackageCheck,
  ReceiptText,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

type OrderItem = {
  id: string;
  name: string;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
  price: number;
};

type OrderData = {
  orderId: string;
  email: string;
  paymentMethod: string;
  paymentStatus: "Paid" | "Pending" | "COD";
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  expectedDelivery: string;
  address: {
    name: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: OrderItem[];
};

/*
  Replace this demo object with your API response.
  Example:
  const order = await fetch(`${API_URL}/api/orders/${orderId}`).then(r => r.json())
*/
const demoOrder: OrderData = {
  orderId: "HVR-2026-100184",
  email: "customer@example.com",
  paymentMethod: "Razorpay",
  paymentStatus: "Paid",
  subtotal: 2598,
  shipping: 0,
  discount: 300,
  total: 2298,
  expectedDelivery: "5–7 business days",
  address: {
    name: "Customer Name",
    phone: "+91 98XXXXXX10",
    line1: "House No. 24, Example Road",
    line2: "Near City Centre",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110001",
  },
  items: [
    {
      id: "1",
      name: "Premium Cotton T-Shirt",
      image:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=80",
      quantity: 1,
      size: "M",
      color: "Black",
      price: 1299,
    },
    {
      id: "2",
      name: "Everyday Comfort Bottom",
      image:
        "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=500&q=80",
      quantity: 1,
      size: "L",
      color: "Wine",
      price: 999,
    },
  ],
};

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0 },
};

export default function ThankYouPage() {
  const [copied, setCopied] = useState(false);
  const order = demoOrder;

  const copyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(order.orderId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F8F5F2] text-[#211A18]">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ y: [0, -18, 0], rotate: [0, 4, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#B01E4B]/10 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 18, 0], x: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-20 top-52 h-80 w-80 rounded-full bg-[#D4A278]/15 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#6F7E5F]/10 blur-3xl"
        />
      </div>

      <div className="relative mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        {/* Success hero */}
        <motion.section
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.55 }}
          className="relative overflow-hidden rounded-[30px] border border-white/80 bg-[#211A18] px-5 py-8 text-white shadow-[0_30px_90px_rgba(45,29,23,0.18)] sm:px-8 md:px-12 md:py-12"
        >
          <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-[#B01E4B]/35 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-36 w-64 rounded-full bg-[#D8B090]/10 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <motion.div
                initial={{ scale: 0.7, opacity: 0, rotate: -8 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 180, damping: 14 }}
                className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[#F2D8E0] text-[#8C1839] shadow-[0_12px_35px_rgba(0,0,0,0.2)]"
              >
                <CircleCheckBig size={34} strokeWidth={2.2} />
              </motion.div>

              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/65">
                <Sparkles size={13} />
                Order confirmed
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl md:text-5xl">
                Thank you for your order.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60 md:text-base">
                Your order has been received successfully. We&apos;ll send updates to{" "}
                <span className="font-semibold text-white">{order.email}</span> as your
                package moves through processing and delivery.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#F4DCE3] px-5 text-sm font-bold text-[#68142F] transition hover:-translate-y-0.5 hover:bg-white"
                >
                  <Home size={17} />
                  Continue Shopping
                </Link>

                <Link
                  href="/account/orders"
                  className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-5 text-sm font-bold text-white transition hover:bg-white/[0.12]"
                >
                  <PackageCheck size={17} />
                  View My Orders
                </Link>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.18, duration: 0.5 }}
              className="rounded-[24px] border border-white/10 bg-white/[0.07] p-5 backdrop-blur-xl md:p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                    Order ID
                  </div>
                  <div className="mt-1 text-lg font-semibold">{order.orderId}</div>
                </div>

                <button
                  type="button"
                  onClick={copyOrderId}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/[0.12] hover:text-white"
                  aria-label="Copy order ID"
                  title="Copy order ID"
                >
                  {copied ? <Check size={17} /> : <Copy size={17} />}
                </button>
              </div>

              <div className="my-5 h-px bg-white/10" />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <InfoStat label="Payment" value={order.paymentStatus} />
                <InfoStat label="Total" value={money(order.total)} />
                <InfoStat label="Method" value={order.paymentMethod} />
                <InfoStat label="Delivery" value={order.expectedDelivery} />
              </div>

              {copied && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 rounded-xl bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200"
                >
                  Order ID copied.
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.section>

        {/* Timeline */}
        <motion.section
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ delay: 0.12, duration: 0.55 }}
          className="mt-6 rounded-[26px] border border-black/[0.06] bg-white/90 p-5 shadow-[0_20px_60px_rgba(45,29,23,0.06)] backdrop-blur md:p-7"
        >
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F8E8ED] text-[#8C1839]">
              <Truck size={19} />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.02em]">
                What happens next?
              </h2>
              <p className="mt-1 text-sm text-black/45">
                We&apos;ll keep you informed from confirmation to delivery.
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <StepCard
              number="01"
              title="Order Confirmed"
              description="Your order is saved and confirmed in our system."
              active
            />
            <StepCard
              number="02"
              title="Packed & Shipped"
              description="We prepare the items and share shipment tracking."
            />
            <StepCard
              number="03"
              title="Delivered"
              description="Your order reaches the selected delivery address."
            />
          </div>
        </motion.section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          {/* Items */}
          <motion.section
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ delay: 0.18, duration: 0.55 }}
            className="rounded-[26px] border border-black/[0.06] bg-white p-5 shadow-[0_20px_60px_rgba(45,29,23,0.06)] md:p-7"
          >
            <div className="flex items-center justify-between gap-4 border-b border-black/[0.06] pb-5">
              <div>
                <h2 className="text-lg font-semibold">Order Summary</h2>
                <p className="mt-1 text-xs text-black/40">
                  {order.items.length} item{order.items.length === 1 ? "" : "s"} in this order
                </p>
              </div>
              <ShoppingBag className="text-[#8C1839]" size={21} />
            </div>

            <div className="divide-y divide-black/[0.06]">
              {order.items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.22 + index * 0.08, duration: 0.4 }}
                  className="flex gap-4 py-5"
                >
                  <div className="h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#F1ECE8] sm:h-28 sm:w-24">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-sm font-semibold sm:text-base">
                      {item.name}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.size && <Pill>Size {item.size}</Pill>}
                      {item.color && <Pill>{item.color}</Pill>}
                      <Pill>Qty {item.quantity}</Pill>
                    </div>

                    <div className="mt-3 text-sm font-bold">
                      {money(item.price * item.quantity)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <div className="space-y-6">
            {/* Price breakdown */}
            <motion.section
              initial="hidden"
              animate="show"
              variants={fadeUp}
              transition={{ delay: 0.24, duration: 0.55 }}
              className="rounded-[26px] border border-black/[0.06] bg-white p-5 shadow-[0_20px_60px_rgba(45,29,23,0.06)] md:p-6"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#F8E8ED] text-[#8C1839]">
                  <ReceiptText size={19} />
                </div>
                <h2 className="text-lg font-semibold">Payment Summary</h2>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <PriceRow label="Subtotal" value={money(order.subtotal)} />
                <PriceRow
                  label="Shipping"
                  value={order.shipping === 0 ? "Free" : money(order.shipping)}
                />
                <PriceRow
                  label="Discount"
                  value={`-${money(order.discount)}`}
                  accent
                />
              </div>

              <div className="my-5 h-px bg-black/[0.06]" />

              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-black/40">Total Paid</div>
                  <div className="mt-1 text-2xl font-semibold tracking-[-0.03em]">
                    {money(order.total)}
                  </div>
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  {order.paymentStatus}
                </span>
              </div>
            </motion.section>

            {/* Address */}
            <motion.section
              initial="hidden"
              animate="show"
              variants={fadeUp}
              transition={{ delay: 0.3, duration: 0.55 }}
              className="rounded-[26px] border border-black/[0.06] bg-white p-5 shadow-[0_20px_60px_rgba(45,29,23,0.06)] md:p-6"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#F8E8ED] text-[#8C1839]">
                  <MapPin size={19} />
                </div>
                <h2 className="text-lg font-semibold">Delivery Address</h2>
              </div>

              <div className="mt-5 rounded-2xl bg-[#FAF7F4] p-4">
                <div className="text-sm font-bold">{order.address.name}</div>
                <div className="mt-2 text-sm leading-6 text-black/50">
                  {order.address.line1}
                  {order.address.line2 ? (
                    <>
                      <br />
                      {order.address.line2}
                    </>
                  ) : null}
                  <br />
                  {order.address.city}, {order.address.state} - {order.address.pincode}
                  <br />
                  {order.address.phone}
                </div>
              </div>
            </motion.section>
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.5 }}
          className="mt-6 flex flex-col gap-4 rounded-[26px] border border-[#8C1839]/10 bg-[#FFF5F8] p-5 sm:flex-row sm:items-center sm:justify-between md:p-7"
        >
          <div>
            <h2 className="text-lg font-semibold">Need help with this order?</h2>
            <p className="mt-1 text-sm text-black/45">
              Visit your orders page for tracking, order details and support.
            </p>
          </div>

          <Link
            href="/account/orders"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#8C1839] px-5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(140,24,57,0.2)] transition hover:-translate-y-0.5 hover:bg-[#74132F]"
          >
            Manage Order
            <ChevronRight size={17} />
          </Link>
        </motion.section>
      </div>
    </main>
  );
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.06] p-3">
      <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  active = false,
}: {
  number: string;
  title: string;
  description: string;
  active?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[20px] border p-4 ${
        active
          ? "border-[#8C1839]/15 bg-[#FFF5F8]"
          : "border-black/[0.06] bg-[#FAF8F6]"
      }`}
    >
      <div
        className={`grid h-8 w-8 place-items-center rounded-xl text-[10px] font-black ${
          active ? "bg-[#8C1839] text-white" : "bg-white text-black/45"
        }`}
      >
        {number}
      </div>
      <div className="mt-4 text-sm font-bold">{title}</div>
      <p className="mt-1 text-xs leading-5 text-black/42">{description}</p>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[#F4F0ED] px-2.5 py-1 text-[10px] font-semibold text-black/50">
      {children}
    </span>
  );
}

function PriceRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-black/45">{label}</span>
      <span className={accent ? "font-semibold text-emerald-700" : "font-semibold"}>
        {value}
      </span>
    </div>
  );
}
