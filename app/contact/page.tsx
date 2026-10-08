"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <main className="min-h-screen bg-[#fffafc] px-5 py-12 text-slate-900 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <Link href="/help" className="text-sm font-bold text-rose-600">
          ← Back to Help Center
        </Link>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-[32px] bg-slate-950 p-8 text-white sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-rose-300">
              Contact Hivrasoft
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight">
              Tell us how we can help.
            </h1>
            <p className="mt-5 text-sm leading-7 text-slate-300">
              For order-related queries, include your Order ID so our team can
              understand your request faster.
            </p>

            <div className="mt-10 space-y-4">
              <a
                href="mailto:support@hivrasoft.com"
                className="block rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-rose-300">Email</p>
                <p className="mt-1 font-black">support@hivrasoft.com</p>
              </a>

              <a
                href="https://hivrasoft.com"
                className="block rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-rose-300">Website</p>
                <p className="mt-1 font-black">hivrasoft.com</p>
              </a>
            </div>
          </section>

          <section className="rounded-[32px] border border-rose-100 bg-white p-8 shadow-[0_30px_90px_rgba(15,23,42,0.08)] sm:p-10">
            <h2 className="text-2xl font-black">Send us a message</h2>
            <p className="mt-2 text-sm text-slate-500">
              This UI is ready. Connect the submit handler to your email/API backend.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Name</span>
                <input
                  required
                  placeholder="Your name"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Email</span>
                <input
                  required
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-bold text-slate-700">Order ID (optional)</span>
                <input
                  placeholder="Example: HVS-10245"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-bold text-slate-700">Message</span>
                <textarea
                  required
                  rows={6}
                  placeholder="Tell us what happened..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                />
              </label>

              <button
                type="submit"
                className="rounded-2xl bg-rose-500 px-6 py-3.5 font-black text-white transition hover:bg-rose-600 sm:col-span-2"
              >
                Send Message
              </button>
            </form>

            {sent && (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                Form design is working. Add your backend/API endpoint to actually
                send this message.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
