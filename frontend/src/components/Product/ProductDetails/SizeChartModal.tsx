"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type SizeChartKind = "men" | "women-bra" | "women-panties";

type Props = {
  open: boolean;
  kind: SizeChartKind;
  onClose: () => void;
};

type ChartRow = {
  size: string;
  first: string;
  second: string;
};

const menRows: ChartRow[] = [
  { size: "S", first: "28–30", second: "30–32" },
  { size: "M", first: "30–32", second: "34–36" },
  { size: "L", first: "32–34", second: "36–38" },
  { size: "XL", first: "34–36", second: "38–40" },
  { size: "XXL", first: "36–38", second: "40–42" },
];

const pantiesRows: ChartRow[] = [
  { size: "S", first: "28–30", second: "32–34" },
  { size: "M", first: "30–32", second: "35–37" },
  { size: "L", first: "32–34", second: "38–40" },
  { size: "XL", first: "34–36", second: "41–43" },
  { size: "2XL", first: "36–38", second: "44–45" },
];

const braRows: ChartRow[] = [
  { size: "30", first: "26", second: "30" },
  { size: "30", first: "26", second: "31" },
  { size: "32", first: "28", second: "32" },
  { size: "32", first: "28", second: "33" },
  { size: "34", first: "30", second: "34" },
  { size: "34", first: "30", second: "35" },
  { size: "36", first: "32", second: "36" },
  { size: "36", first: "32", second: "37" },
  { size: "38", first: "34", second: "38" },
  { size: "38", first: "34", second: "39" },
  { size: "40", first: "36", second: "40" },
  { size: "40", first: "36", second: "41" },
];

function toCentimeters(value: string) {
  return value
    .split(/[–-]/)
    .map((part) => {
      const inches = Number(part.trim());
      return Number.isFinite(inches) ? String(Math.round(inches * 2.54)) : part.trim();
    })
    .join("–");
}

function SizeTable({
  rows,
  first,
  second,
}: {
  rows: ChartRow[];
  first: string;
  second: string;
}) {
  return (
    <div className="w-full overflow-x-auto rounded-sm border border-black">
      <table className="w-full border-collapse text-center text-[11px] sm:text-[14px]">
        <thead className="bg-black text-white">
          <tr>
            <th scope="col" rowSpan={2} className="w-[18%] border-r border-white/60 px-1.5 py-2 font-bold sm:px-3">
              Size
            </th>
            <th scope="colgroup" colSpan={2} className="border-r border-b border-white/60 px-2 py-2 font-bold tracking-wide">
              INCHES
            </th>
            <th scope="colgroup" colSpan={2} className="hidden border-b border-white/60 px-2 py-2 font-bold tracking-wide sm:table-cell">
              CM (Approx.)
            </th>
          </tr>
          <tr>
            <th scope="col" className="border-r border-white/60 px-1 py-2 font-semibold sm:px-2">{first}</th>
            <th scope="col" className="border-r border-white/60 px-1 py-2 font-semibold sm:px-2">{second}</th>
            <th scope="col" className="hidden border-r border-white/60 px-1 py-2 font-semibold sm:table-cell sm:px-2">{first}</th>
            <th scope="col" className="hidden px-1 py-2 font-semibold sm:table-cell sm:px-2">{second}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.size}-${index}`} className="even:bg-[#FAF8F8]">
              <th scope="row" className="border-r border-t border-black px-1 py-2.5 font-semibold sm:px-2">{row.size}</th>
              <td className="border-r border-t border-black px-1 py-2.5 sm:px-2">{row.first}</td>
              <td className="border-r border-t border-black px-1 py-2.5 sm:px-2">{row.second}</td>
              <td className="hidden border-r border-t border-black px-1 py-2.5 sm:table-cell sm:px-2">{toCentimeters(row.first)}</td>
              <td className="hidden border-t border-black px-1 py-2.5 sm:table-cell sm:px-2">{toCentimeters(row.second)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SizeChartModal({ open, kind, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [womenChart, setWomenChart] = useState<"women-bra" | "women-panties">(
    kind === "women-bra" ? "women-bra" : "women-panties"
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open && kind !== "men") setWomenChart(kind);
  }, [kind, open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const isMen = kind === "men";
  const activeKind = isMen ? "men" : womenChart;
  const chartHeading =
    activeKind === "men"
      ? "BRIEFS, TRUNKS, THONGS, G-STRING"
      : activeKind === "women-bra"
        ? "BRA SIZE CHART"
        : "PANTIES SIZE CHART";
  const rows = activeKind === "men" ? menRows : activeKind === "women-bra" ? braRows : pantiesRows;
  const first = activeKind === "women-bra" ? "Under Bust" : "Waist";
  const second = activeKind === "women-bra" ? "Over Bust" : "Hip";

  return createPortal(
    <div
      className="fixed inset-0 z-[25000] flex items-center justify-center bg-black/60 p-3 sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="hivrasoft-size-chart-title"
        className="relative w-full max-w-[790px] max-h-[calc(100dvh-24px)] overflow-y-auto rounded-[14px] bg-white p-5 text-[#211A18] shadow-2xl sm:p-8"
      >
        <button
          type="button"
          aria-label="Close size chart"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-[23px] text-black/50 hover:bg-black/5 hover:text-black sm:right-5 sm:top-4"
        >
          ×
        </button>

        <h2
          id="hivrasoft-size-chart-title"
          className="mx-9 text-center text-[23px] font-semibold leading-tight underline decoration-[2px] underline-offset-[8px] sm:text-[27px]"
        >
          {isMen ? "Men's Size Guide" : "Women's Size Guide"}
        </h2>

        {!isMen && (
          <div className="mx-auto mt-7 flex max-w-[350px] gap-2 rounded-full bg-[#F8EFF2] p-1" role="group" aria-label="Women's chart type">
            <button
              type="button"
              onClick={() => setWomenChart("women-bra")}
              className={`flex-1 rounded-full px-3 py-2 text-[12px] font-semibold transition ${womenChart === "women-bra" ? "bg-[#B31345] text-white" : "text-[#6C5260] hover:bg-white"}`}
            >
              Bra
            </button>
            <button
              type="button"
              onClick={() => setWomenChart("women-panties")}
              className={`flex-1 rounded-full px-3 py-2 text-[12px] font-semibold transition ${womenChart === "women-panties" ? "bg-[#B31345] text-white" : "text-[#6C5260] hover:bg-white"}`}
            >
              Panties
            </button>
          </div>
        )}

        <p className="mb-5 mt-9 text-[12px] font-bold uppercase tracking-[0.035em] text-[#444] sm:text-[15px]">
          {chartHeading}
        </p>

        <SizeTable rows={rows} first={first} second={second} />

        <div className="mt-6 rounded-lg bg-[#FCF6F8] px-4 py-4 text-[12px] leading-6 text-[#58424A] sm:text-[13px]">
          <p className="font-semibold text-[#8B2546]">How to measure</p>
          {activeKind === "women-bra" ? (
            <p>Under Bust: measure around your ribcage just below your bust. Over Bust: measure around the fullest part of your bust, keeping the tape level.</p>
          ) : (
            <p>Waist: wrap the measuring tape around your natural waist without pulling it tight. Hip: measure around the fullest part of your hips.</p>
          )}
          <p className="mt-1 text-[11px] text-black/50">All measurements are in inches. The chart is a fit guide; garment fit may vary by style.</p>
        </div>
      </section>
    </div>,
    document.body
  );
}
