
"use client";

import { useState } from "react";

import Header from "@/src/components/Header/Header";

import SizeChartModal, {
  type SizeChartKind,
} from "@/src/components/Product/ProductDetails/SizeChartModal";

const charts: Array<{
  id: SizeChartKind;
  title: string;
  subtitle: string;
  symbol: string;
}> = [
  {
    id: "men",
    title: "Men's Underwear",
    subtitle: "Briefs, trunks, thongs & G-strings",
    symbol: "M",
  },
  {
    id: "women-bra",
    title: "Women's Bras",
    subtitle: "Bra and sports bra size chart",
    symbol: "B",
  },
  {
    id: "women-panties",
    title: "Women's Panties",
    subtitle: "Panties, hipsters & thongs",
    symbol: "W",
  },
];

export default function SizeGuidePage() {
  const [selectedChart, setSelectedChart] =
    useState<SizeChartKind | null>(null);

  return (
    <>
      <Header />

      <main
        className="
          min-h-screen
          bg-[#FCF8F8]
          px-4 pb-20 pt-12
          text-[#211A18]
          sm:px-6 sm:pt-16
        "
      >
        <div className="mx-auto max-w-[1000px]">
          <p
            className="
              text-center
              text-[11px]
              font-bold uppercase
              tracking-[0.24em]
              text-[#B31345]
            "
          >
            Find your perfect fit
          </p>

          <h1
            className="
              mt-3 text-center
              text-[30px]
              font-semibold
              sm:text-[42px]
            "
          >
            Size Guide
          </h1>

          <p
            className="
              mx-auto mt-3 max-w-xl
              text-center text-[13px]
              leading-6 text-black/55
            "
          >
            Choose a category to see its size chart.
            Measurements are in inches.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {charts.map((chart) => (
              <button
                key={chart.id}
                type="button"
                onClick={() => setSelectedChart(chart.id)}
                className="
                  group rounded-2xl
                  border border-[#E7D4DC]
                  bg-white p-7 text-left
                  shadow-[0_10px_30px_rgba(0,0,0,0.04)]
                  transition
                  hover:-translate-y-1
                  hover:border-[#B31345]
                  hover:shadow-lg
                "
              >
                <span
                  className="
                    flex h-12 w-12
                    items-center justify-center
                    rounded-xl bg-[#FCE7ED]
                    font-serif text-[26px]
                    italic text-[#B31345]
                  "
                >
                  {chart.symbol}
                </span>

                <h2 className="mt-5 text-[18px] font-semibold">
                  {chart.title}
                </h2>

                <p className="mt-1 text-[12px] leading-5 text-black/50">
                  {chart.subtitle}
                </p>

                <span
                  className="
                    mt-6 inline-flex
                    items-center gap-2
                    text-[12px] font-semibold
                    text-[#B31345]
                  "
                >
                  View Size Chart
                  <span aria-hidden="true">→</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>

      <SizeChartModal
        open={selectedChart !== null}
        kind={selectedChart || "men"}
        onClose={() => setSelectedChart(null)}
      />
    </>
  );
}
