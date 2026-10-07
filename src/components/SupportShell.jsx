import Link from "next/link";

export default function SupportShell({
  eyebrow = "Hivrasoft Support",
  title,
  description,
  children,
}) {
  return (
    <main className="min-h-screen bg-[#fffafc] text-slate-900">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top_left,_rgba(244,114,182,0.20),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(139,92,246,0.16),_transparent_35%)]" />

      <header className="relative border-b border-rose-100/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="group">
            <span className="text-xl font-black tracking-tight text-slate-950">
              HIVRA<span className="text-rose-500">SOFT</span>
            </span>
            <span className="ml-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Support
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/help"
              className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 sm:inline-flex"
            >
              Help Center
            </Link>
            <Link
              href="/contact"
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-600"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-5 pb-16 pt-12 sm:px-8 sm:pt-16">
        <div className="mb-10 max-w-3xl">
          <Link
            href="/help"
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-700"
          >
            <span aria-hidden>←</span> Back to Help Center
          </Link>

          <p className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-rose-500">
            {eyebrow}
          </p>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              {description}
            </p>
          ) : null}
        </div>

        <div className="rounded-[32px] border border-rose-100 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 lg:p-10">
          {children}
        </div>

        <div className="mt-8 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-rose-300">Still need help?</p>
            <p className="mt-1 text-sm text-slate-300">
              Our support team is available at support@hivrasoft.com.
            </p>
          </div>
          <a
            href="mailto:support@hivrasoft.com"
            className="inline-flex w-fit rounded-full bg-white px-5 py-2.5 text-sm font-black text-slate-950 transition hover:bg-rose-100"
          >
            Email Support
          </a>
        </div>
      </section>
    </main>
  );
}
