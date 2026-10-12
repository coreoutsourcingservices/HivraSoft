import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Home, Search, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#FFFAF8] text-[#301923]">
      {/* Decorative layers only; no changes to global site styles. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_78%_38%,rgba(165,29,69,0.12),transparent_50%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 top-32 h-72 w-72 rounded-full border border-[#A51D45]/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-16 h-80 w-80 rounded-full border border-[#A51D45]/10"
      />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8 sm:py-8">
        <Link href="/" aria-label="HivraSoft homepage" className="inline-flex items-center">
          <Image
            src="/images/logos/hivra-soft-logo.png"
            alt="HivraSoft"
            width={165}
            height={55}
            className="h-auto w-32 sm:w-40"
            priority
          />
        </Link>
        <Link
          href="/contact"
          className="rounded-full border border-[#A51D45]/20 bg-white/80 px-4 py-2 text-xs font-semibold text-[#8E1D43] transition hover:border-[#A51D45]/50 hover:bg-white sm:text-sm"
        >
          Need help?
        </Link>
      </header>

      <section className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-5 pb-20 pt-10 sm:px-8 md:min-h-[650px] md:grid-cols-2 md:gap-12 md:pb-24 md:pt-8">
        <div className="mx-auto w-full max-w-xl text-center md:mx-0 md:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#A51D45]/15 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#9B244B] shadow-sm sm:text-xs">
            <span className="h-2 w-2 rounded-full bg-[#A51D45]" />
            Error 404 · Page not found
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
            Oops! This page
            <span className="block font-serif italic text-[#A51D45]">slipped away.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base leading-8 text-[#725F67] md:mx-0 lg:text-lg">
            We couldn&apos;t find the page you were looking for. It may have moved,
            or the address might need a second look.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#9B2149] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(155,33,73,0.18)] transition hover:bg-[#771635] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9B2149]"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              Back to homepage
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/search"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#E7CDD6] bg-white px-6 py-3 text-sm font-semibold text-[#862143] transition hover:border-[#A51D45] hover:bg-[#FFF4F7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9B2149]"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Search products
            </Link>
          </div>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-sm md:justify-start">
            <span className="text-[#8B7B80]">Or browse:</span>
            <Link href="/women" className="font-semibold text-[#9B2149] underline-offset-4 hover:underline">
              Women
            </Link>
            <Link href="/men" className="font-semibold text-[#9B2149] underline-offset-4 hover:underline">
              Men
            </Link>
            <Link href="/new-launch" className="font-semibold text-[#9B2149] underline-offset-4 hover:underline">
              New arrivals
            </Link>
          </div>
        </div>

        <div className="relative mx-auto flex h-[300px] w-full max-w-lg items-center justify-center sm:h-[385px] md:h-[480px]">
          <div aria-hidden="true" className="absolute h-[270px] w-[270px] rounded-full bg-gradient-to-br from-[#F8DDE6] via-[#FFEFF2] to-[#FFF7EC] blur-[2px] sm:h-[355px] sm:w-[355px] md:h-[430px] md:w-[430px]" />
          <div aria-hidden="true" className="absolute h-[230px] w-[230px] rounded-full border border-white/90 sm:h-[305px] sm:w-[305px] md:h-[380px] md:w-[380px]" />
          <div aria-hidden="true" className="relative -translate-x-2 -translate-y-5 select-none bg-gradient-to-br from-[#A51D45] to-[#6C1735] bg-clip-text text-[105px] font-black leading-none tracking-[-0.12em] text-transparent drop-shadow-[0_12px_12px_rgba(112,23,54,0.1)] sm:text-[155px] md:text-[180px]">
            404
          </div>
          <div className="absolute bottom-1 right-0 flex max-w-[245px] items-center gap-3 rounded-2xl border border-[#F2DFE4] bg-white/95 px-4 py-3 shadow-[0_20px_45px_rgba(88,30,49,0.10)] sm:bottom-7 sm:right-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0F4] text-[#A51D45]">
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-left">
              <span className="block text-sm font-bold text-[#3F2230]">Lost your way?</span>
              <span className="block text-xs leading-5 text-[#8C7780]">Your next favorite is just a click away.</span>
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
