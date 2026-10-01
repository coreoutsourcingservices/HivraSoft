"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import Header from "@/src/components/Header/Header";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

async function api(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || "Request failed.");
  return data;
}

const money = (value: unknown) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function CheckoutPage() {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  useEffect(() => {
    api("/api/cart")
      .then((data) => setCart(data.cart))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function placeOrder(event: FormEvent) {
    event.preventDefault();
    setPlacing(true); setError("");
    try {
      const result = await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({ shippingAddress: form, paymentMethod: "cod" }),
      });
      setOrder(result.order);
      setCart(null);
    } catch (e: any) {
      setError(e.message || "Unable to place order.");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FDFCFB] px-4 py-8 md:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#a31340]">Secure Checkout</p>
              <h1 className="mt-2 font-serif text-4xl text-[#211A18]">Complete your order</h1>
            </div>
            <Link href="/account/card" className="text-[10px] font-semibold text-[#a31340]">← Back to cart</Link>
          </div>

          {loading && <div className="rounded-2xl border border-[#211A18]/10 bg-white p-8 text-sm">Loading checkout...</div>}

          {order && (
            <div className="rounded-2xl border border-[#2f8a53]/20 bg-white p-8 text-center">
              <CheckCircle2 className="mx-auto text-[#2f8a53]" size={46} />
              <h2 className="mt-4 font-serif text-3xl text-[#211A18]">Order placed</h2>
              <p className="mt-2 text-[12px] text-[#6e625e]">Order {order.orderNumber} • Total {money(order.total)}</p>
              <p className="mt-1 text-[10px] text-[#6e625e]">Discounts and applicable tax are saved inside this order.</p>
              <Link href="/account/orders" className="mt-6 inline-flex h-11 items-center rounded-xl bg-[#a31340] px-6 text-[10px] font-semibold uppercase text-white">View orders</Link>
            </div>
          )}

          {!loading && !order && cart && (
            <form onSubmit={placeOrder} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <section className="rounded-2xl border border-[#211A18]/10 bg-white p-6">
                <h2 className="font-serif text-2xl text-[#211A18]">Shipping address</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {[
                    ["fullName", "Full name"], ["phone", "Phone"], ["addressLine1", "Address line 1"], ["addressLine2", "Address line 2"],
                    ["city", "City"], ["state", "State"], ["postalCode", "PIN code"], ["country", "Country"],
                  ].map(([key, label]) => (
                    <label key={key} className="text-[10px] font-semibold text-[#211A18]">
                      {label}
                      <input
                        required={!["addressLine2"].includes(key)}
                        value={(form as any)[key]}
                        onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))}
                        className="mt-2 h-11 w-full rounded-xl border border-[#211A18]/10 bg-[#FAF8F6] px-3 text-[11px] font-normal outline-none focus:border-[#a31340]/40"
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-5 rounded-xl bg-[#F5FBF7] p-4 text-[10px] text-[#506458]">
                  <strong className="block text-[#2f8a53]">Cash on Delivery</strong>
                  Payment status stays pending until your payment is confirmed.
                </div>
                {error && <p className="mt-4 rounded-xl bg-[#fff0f2] p-3 text-[10px] text-[#a31340]">{error}</p>}
              </section>

              <aside className="h-max rounded-2xl border border-[#211A18]/10 bg-white p-6 lg:sticky lg:top-24">
                <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-[#a31340]" /><h2 className="font-serif text-xl">Order summary</h2></div>
                <div className="mt-5 space-y-3 text-[11px] text-[#6e625e]">
                  {(cart.items || []).filter((item: any) => item.available).map((item: any) => (
                    <div key={item._id} className="flex justify-between gap-4 border-b border-[#211A18]/8 pb-3">
                      <span>{item.product?.name} × {item.quantity}</span>
                      <span className="font-semibold text-[#211A18]">{money(item.discount?.finalLineTotal ?? item.subtotal)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between"><span>Subtotal</span><strong>{money(cart.subtotal)}</strong></div>
                  {Number(cart.automaticDiscount || 0) > 0 && <div className="flex justify-between text-[#2f8a53]"><span>Automatic discount ({cart.discountSummary?.automatic?.percentage || 0}%)</span><strong>-{money(cart.automaticDiscount)}</strong></div>}
                  {Number(cart.codeDiscount || 0) > 0 && <div className="flex justify-between text-[#a31340]"><span>Code {cart.appliedDiscountCode}</span><strong>-{money(cart.codeDiscount)}</strong></div>}
                  {Number(cart.tax || 0) > 0 && <div className="flex justify-between"><span>{cart.taxSummary?.name || "Tax"} ({cart.taxSummary?.percentage || 0}%)</span><strong>+{money(cart.tax)}</strong></div>}
                  <div className="flex justify-between"><span>Shipping</span><strong className="text-[#2f8a53]">FREE</strong></div>
                </div>
                <div className="mt-5 flex items-end justify-between border-t border-[#211A18]/10 pt-4"><span className="text-[12px] font-semibold">Total</span><strong className="font-serif text-2xl">{money(cart.total)}</strong></div>
                <button disabled={placing || !cart.items?.length} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#a31340] text-[10px] font-semibold uppercase text-white disabled:opacity-50">
                  {placing && <Loader2 size={14} className="animate-spin" />}{placing ? "Placing order..." : "Place order"}
                </button>
              </aside>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
