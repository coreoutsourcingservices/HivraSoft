"use client";
import { imageAlt as resolveImageAlt } from "@/lib/image-alt";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Check, ShoppingCart, X } from "lucide-react";
import type { DirectCartInput } from "./StorefrontCommerceProvider";

export default function AddedToBagModal({ product, onClose, onViewCart }: {
  product: DirectCartInput;
  onClose: () => void;
  onViewCart: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const timer = window.setTimeout(() => closeRef.current(), 3000);
    return () => window.clearTimeout(timer);
  }, [product]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previousFocus?.focus();
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-[3px]" onClick={onClose}>
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby="added-to-bag-heading" tabIndex={-1}
        className="relative max-h-[calc(100dvh-32px)] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white p-5 text-[#281411] shadow-2xl outline-none sm:p-6"
        onClick={event => event.stopPropagation()}
        onKeyDown={event => {
          if (event.key === "Escape") onClose();
          if (event.key !== "Tab") return;
          const buttons = panel.current?.querySelectorAll<HTMLButtonElement>("button");
          if (!buttons?.length) return;
          const first = buttons[0];
          const last = buttons[buttons.length - 1];
          if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
            event.preventDefault(); last.focus();
          } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) {
            event.preventDefault(); first.focus();
          }
        }}>
        <button type="button" aria-label="Close notification" onClick={onClose} className="absolute right-3 top-3 cursor-pointer rounded-full p-2 hover:bg-black/5"><X size={20} /></button>
        <div className="flex items-center gap-4 pr-5 sm:gap-6">
          {product.image && <img src={product.image} alt={resolveImageAlt(product, product.name, "HivraSoft image")} className="h-32 w-24 shrink-0 rounded-xl bg-[#f5f2ef] object-cover sm:h-40 sm:w-40" />}
          <div className="min-w-0 py-3">
            <h2 id="added-to-bag-heading" className="flex items-center gap-3 text-lg font-bold sm:text-[22px]"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e90050] text-white"><Check size={21} /></span>Added to bag</h2>
            <p className="mt-3 text-sm leading-snug sm:text-lg">{product.name}</p>
            {product.colorName && <p className="mt-2 text-sm text-black/60">{product.colorName}</p>}
            {product.sizeLabel && <p className="mt-2 text-sm sm:text-base">Size: {product.sizeLabel}</p>}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button type="button" onClick={onViewCart} className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#ed0054] px-2 py-4 text-sm font-semibold text-[#e90050] sm:text-lg">View Cart <ShoppingCart size={22} /></button>
          <button type="button" onClick={onClose} className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ed0054] to-[#bc003e] px-2 py-4 text-sm font-semibold text-white shadow-lg shadow-pink-100 sm:text-lg">Continue Shopping <ArrowRight className="shrink-0" size={22} /></button>
        </div>
      </div>
    </div>, document.body,
  );
}
