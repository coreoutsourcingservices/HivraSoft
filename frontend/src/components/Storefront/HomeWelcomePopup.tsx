"use client";

import { useEffect, useState } from "react";

/** Fallback is a real promotional image supplied by the original Prahlad project. */
const PRAHLAD_IMAGE = "/images/auth/signup-side.png";
const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

function bannerImageSrc(value?: string) {
  const image = value?.trim();
  if (!image) return PRAHLAD_IMAGE;
  if (/^(https?:)?\/\//i.test(image) || image.startsWith("data:")) return image;
  // Relative files saved by the backend must be loaded from the backend port.
  if (/^\/?(?:uploads|upload|media)\//i.test(image)) {
    return `${BACKEND_URL}/${image.replace(/^\/+/, "")}`;
  }
  return image.startsWith("/") ? image : `/${image}`;
}

/**
 * Main branch's image-based homepage popup. An eligible admin Favourites/limited
 * banner is shown when present. Missing or failed image => Prahlad's own image.
 * No extra account/login/profile launcher is rendered by this component.
 */
export default function HomeWelcomePopup({
  imageUrl,
  imageAlt,
  href = "/new-launch",
  newTab = false,
}: {
  imageUrl?: string;
  imageAlt?: string;
  href?: string;
  newTab?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;

  const source = imageFailed ? PRAHLAD_IMAGE : bannerImageSrc(imageUrl);
  const usingPrahladImage = imageFailed || !imageUrl?.trim();

  return (
    <div
      role="presentation"
      onClick={() => setOpen(false)}
      className="fixed inset-0 z-[60000] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-[2px]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Favourites for a limited time"
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-[430px]"
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close favourites popup"
          className="absolute -right-2 -top-2 z-10 grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white text-[27px] leading-none text-[#211A18] shadow-lg transition hover:bg-[#EC477C] hover:text-white"
        >
          ×
        </button>
        <a
          href={usingPrahladImage ? "/new-launch" : href}
          target={!usingPrahladImage && newTab ? "_blank" : undefined}
          rel={!usingPrahladImage && newTab ? "noopener noreferrer" : undefined}
          aria-label="Explore HivraSoft favourites"
          onClick={() => setOpen(false)}
          className="block aspect-square w-full overflow-hidden rounded-[22px] border border-white/40 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.38)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={source}
            alt={usingPrahladImage ? "HivraSoft Prahlad - Feel Good Everyday" : (imageAlt || "HivraSoft favourites")}
            className="h-full w-full object-contain object-center"
            loading="eager"
            onError={() => {
              if (!usingPrahladImage) setImageFailed(true);
            }}
          />
        </a>
      </div>
    </div>
  );
}
