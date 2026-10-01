"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  getBannerSectionLabel,
} from "@/lib/banner";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

interface MediaItem {
  url: string;
  publicId: string;
  title: string;
  linkType:
    | "none"
    | "custom"
    | "category"
    | "product";
  poster?: {
    url: string;
    publicId: string;
  };
}

interface Banner {
  _id: string;
  title: string;
  slug: string;
  mediaType:
    | "image"
    | "video";
  images: MediaItem[];
  videos: MediaItem[];
  position: string;
  device: string;
  sortOrder: number;
  isActive: boolean;
}

export default function BannerListPage() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const position =
    searchParams.get(
      "position"
    );

  const [banners, setBanners] =
    useState<Banner[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [deletingId, setDeletingId] =
    useState<string | null>(
      null
    );

  const loadBanners =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              `${API_URL}/api/banners`,
              {
                credentials:
                  "include",
                cache:
                  "no-store",
              }
            );

          const result =
            await response.json();

          if (!response.ok) {
            throw new Error(
              result.message ||
                "Unable to load banners."
            );
          }

          setBanners(
            result.data || []
          );
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load banners."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  const filtered =
    position
      ? banners.filter(
          banner =>
            banner.position ===
            position
        )
      : banners;

  const pageTitle =
    position
      ? getBannerSectionLabel(
          position
        )
      : "All Banners";

  const handleDelete = async (
    banner: Banner
  ) => {
    const confirmed =
      window.confirm(
        `Delete "${banner.title}"? Cloudinary media will also be deleted.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        banner._id
      );

      const response =
        await fetch(
          `${API_URL}/api/banners/${banner._id}`,
          {
            method: "DELETE",
            credentials:
              "include",
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to delete banner."
        );
      }

      setBanners(
        previous =>
          previous.filter(
            item =>
              item._id !==
              banner._id
          )
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete banner."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f4f0] px-8 py-14">
      <div className="mx-auto max-w-[1450px]">
        <div className="mb-9 flex items-end justify-between gap-5">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-[#b51d49]">
              Homepage Management
            </p>
            <h1 className="text-4xl font-semibold text-[#17110f]">
              {pageTitle}
            </h1>
            <p className="mt-3 text-sm text-[#706763]">
              Each image/video can have its own content and link.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/admin/banners/new${
                  position
                    ? `?position=${position}`
                    : ""
                }`
              )
            }
            className="rounded-2xl bg-[#b51d49] px-8 py-5 text-sm font-bold text-white"
          >
            + ADD NEW BANNER
          </button>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-[#e5ddd7] bg-white">
          <div className="flex items-center justify-between border-b border-[#eee7e2] px-8 py-7">
            <div>
              <h2 className="text-2xl font-semibold text-[#17110f]">
                {pageTitle}
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Banner media list.
              </p>
            </div>

            <span className="rounded-full bg-[#f6f0ed] px-5 py-2 text-xs font-bold text-[#b51d49]">
              {filtered.length} BANNERS
            </span>
          </div>

          {loading && (
            <div className="p-20 text-center text-sm text-gray-500">
              Loading banners...
            </div>
          )}

          {!loading &&
            error && (
              <div className="p-20 text-center text-sm text-red-500">
                {error}
              </div>
            )}

          {!loading &&
            !error &&
            filtered.length ===
              0 && (
              <div className="flex min-h-[300px] flex-col items-center justify-center">
                <h3 className="text-xl font-semibold">
                  No banners found
                </h3>
                <p className="mt-3 text-sm text-gray-500">
                  Create your first banner.
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            filtered.length > 0 && (
              <div className="space-y-4 p-6">
                {filtered.map(
                  banner => {
                    const media =
                      banner.mediaType ===
                      "image"
                        ? banner.images
                        : banner.videos;

                    const first =
                      media[0];

                    return (
                      <div
                        key={banner._id}
                        className="flex items-center justify-between gap-6 rounded-[20px] border border-[#ece5e0] bg-[#fdfbf9] p-4"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-5">
                          <div className="h-[92px] w-[155px] shrink-0 overflow-hidden rounded-2xl border bg-[#f5f1ee]">
                            {!first && (
                              <div className="flex h-full items-center justify-center text-xs text-gray-400">
                                NO MEDIA
                              </div>
                            )}

                            {first &&
                              banner.mediaType ===
                                "image" && (
                                <img
                                  src={first.url}
                                  alt={
                                    first.title ||
                                    banner.title
                                  }
                                  className="h-full w-full object-cover"
                                />
                              )}

                            {first &&
                              banner.mediaType ===
                                "video" && (
                                <video
                                  src={first.url}
                                  poster={
                                    first.poster
                                      ?.url
                                  }
                                  muted
                                  className="h-full w-full object-cover"
                                />
                              )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="truncate text-base font-bold text-[#17110f]">
                                {banner.title}
                              </h3>

                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                  banner.isActive
                                    ? "bg-green-50 text-green-600"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {banner.isActive
                                  ? "ACTIVE"
                                  : "INACTIVE"}
                              </span>
                            </div>

                            <p className="mt-2 text-xs text-gray-400">
                              /{banner.slug}
                            </p>

                            <p className="mt-2 text-xs font-medium text-[#b51d49]">
                              {getBannerSectionLabel(
                                banner.position
                              )}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              {media.length} {banner.mediaType}(s) • each media has own link/content • {banner.device}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/admin/banners/${banner._id}/edit`
                              )
                            }
                            className="rounded-xl border border-[#dfd6d1] px-5 py-3 text-xs font-bold"
                          >
                            EDIT
                          </button>

                          <button
                            type="button"
                            disabled={
                              deletingId ===
                              banner._id
                            }
                            onClick={() =>
                              handleDelete(
                                banner
                              )
                            }
                            className="rounded-xl border border-red-200 px-5 py-3 text-xs font-bold text-red-500 disabled:opacity-50"
                          >
                            {deletingId ===
                            banner._id
                              ? "DELETING..."
                              : "DELETE"}
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
