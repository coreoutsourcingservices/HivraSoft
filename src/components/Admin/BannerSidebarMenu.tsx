"use client";

import Link from "next/link";

import {
  usePathname,
  useSearchParams,
} from "next/navigation";

import {
  useEffect,
  useState,
} from "react";

export default function BannerSidebarMenu() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const position = searchParams.get(
    "position"
  );

  const isBannerArea =
    pathname.startsWith(
      "/admin/banners"
    );

  const [open, setOpen] =
    useState(isBannerArea);

  useEffect(() => {
    if (isBannerArea) {
      setOpen(true);
    }
  }, [isBannerArea]);

  const linkClass = (
    active: boolean
  ) =>
    `block rounded-lg px-3 py-3 text-xs transition ${
      active
        ? "bg-white/10 text-white"
        : "text-[#bbb1ac] hover:bg-white/5 hover:text-white"
    }`;

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          setOpen(
            (previous) =>
              !previous
          )
        }
        className={`flex w-full items-center justify-between rounded-xl px-4 py-4 text-left text-sm transition ${
          isBannerArea
            ? "bg-[#b51d49] text-white"
            : "text-[#ddd4cf] hover:bg-white/5"
        }`}
      >
        <span>Banners</span>

        <span
          className={`text-xs transition ${
            open
              ? "rotate-180"
              : ""
          }`}
        >
          ▼
        </span>
      </button>

      {open && (
        <div className="ml-4 mt-2 space-y-1 border-l border-white/10 pl-4">
          <Link
            href="/admin/banners"
            className={linkClass(
              isBannerArea &&
                !position
            )}
          >
            All Banners
          </Link>

          <Link
            href="/admin/banners?position=home_hero"
            className={linkClass(
              position ===
                "home_hero"
            )}
          >
            Banner
          </Link>

          <Link
            href="/admin/banners?position=home_middle"
            className={linkClass(
              position ===
                "home_middle"
            )}
          >
            Favourites for a
            limited time!
          </Link>

          <Link
            href="/admin/banners?position=home_bottom"
            className={linkClass(
              position ===
                "home_bottom"
            )}
          >
            Find your fit.
          </Link>
        </div>
      )}
    </div>
  );
}
