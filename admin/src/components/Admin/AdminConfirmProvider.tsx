"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";

export type AdminConfirmOptions = {
  title: string;
  description?: string;
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  requireText?: string;
  destructive?: boolean;
};

type PendingConfirm = {
  options: AdminConfirmOptions;
  resolve: (value: boolean) => void;
};

const EVENT_NAME = "hivrasoft-admin-confirm";

export function confirmAdminAction(options: AdminConfirmOptions): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);

  return new Promise<boolean>((resolve) => {
    window.dispatchEvent(
      new CustomEvent<PendingConfirm>(EVENT_NAME, {
        detail: { options, resolve },
      })
    );
  });
}

export default function AdminConfirmProvider() {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<PendingConfirm>;
      if (!custom.detail?.resolve) return;
      setTyped("");
      setPending(custom.detail);
    };

    window.addEventListener(EVENT_NAME, handler as EventListener);
    return () => window.removeEventListener(EVENT_NAME, handler as EventListener);
  }, []);

  useEffect(() => {
    if (!pending) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        pending.resolve(false);
        setPending(null);
        setTyped("");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pending]);

  if (!pending) return null;

  const { options } = pending;
  const required = options.requireText || "";
  const canConfirm = !required || typed === required;

  const close = (value: boolean) => {
    pending.resolve(value);
    setPending(null);
    setTyped("");
  };

  return (
    <div
      className="fixed inset-0 z-[9999] grid place-items-center bg-[#140E0C]/55 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) close(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        className="w-full max-w-md overflow-hidden rounded-[26px] border border-white/70 bg-white shadow-[0_35px_100px_rgba(28,17,14,0.35)]"
      >
        <div className="flex items-start gap-4 border-b border-black/[0.06] bg-[#FFF8F8] px-5 py-5 sm:px-6">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-100 text-red-600">
            <AlertTriangle size={21} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 id="admin-confirm-title" className="text-[18px] font-semibold tracking-[-0.02em] text-[#211A18]">
              {options.title}
            </h2>
            {options.itemName ? (
              <p className="mt-1 break-words text-[12px] font-semibold text-[#8C1839]">
                {options.itemName}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => close(false)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-black/35 transition hover:bg-black/[0.05] hover:text-black/70"
            aria-label="Close confirmation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <p className="text-[13px] leading-6 text-black/55">
            {options.description || "This action will move the item to Trash for 30 days."}
          </p>

          {required ? (
            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50/60 p-4">
              <label className="block">
                <span className="text-[11px] font-semibold text-red-700">
                  Type <strong>{required}</strong> to confirm
                </span>
                <input
                  autoFocus
                  value={typed}
                  onChange={(event) => setTyped(event.target.value)}
                  placeholder={required}
                  className="mt-2 h-11 w-full rounded-xl border border-red-200 bg-white px-3 text-[12px] font-semibold outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
                />
              </label>
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => close(false)}
              className="h-11 min-w-0 rounded-xl border border-black/[0.10] bg-white px-4 text-[11px] font-semibold text-black/65 transition hover:bg-[#F7F4F1]"
            >
              {options.cancelLabel || "Cancel"}
            </button>
            <button
              type="button"
              disabled={!canConfirm}
              onClick={() => close(true)}
              className={`h-11 min-w-0 rounded-xl px-4 text-[11px] font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                options.destructive === false
                  ? "bg-[#211A18] hover:bg-[#8C1839]"
                  : "bg-[#A51D45] hover:bg-[#8C1839]"
              }`}
            >
              {options.confirmLabel || "OK"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
