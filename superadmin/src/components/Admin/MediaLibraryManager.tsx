"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Image as ImageIcon,
  Loader2,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { confirmAdminAction } from "./AdminConfirmProvider";
import type { MediaLibraryImage } from "./MediaLibraryPicker";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const GALLERY_PAGE_SIZE = 50;

function sortLatestFirst(images: MediaLibraryImage[]) {
  const timestamp = (value?: string) => {
    const parsed = value ? new Date(value).getTime() : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  };

  return [...images].sort((a, b) => {
    const timeDiff = timestamp(b.createdAt) - timestamp(a.createdAt);
    if (timeDiff !== 0) return timeDiff;
    return b.publicId.localeCompare(a.publicId);
  });
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function uniqueUploadName(file: File, index: number) {
  const base = file.name.replace(/\.[^/.]+$/, "").trim() || "image";
  return `${base}-${Date.now()}-${index + 1}`;
}

function bytesLabel(bytes?: number) {
  const value = Number(bytes || 0);
  if (!value) return "—";
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function dateLabel(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function MediaLibraryManager() {
  const [images, setImages] = useState<MediaLibraryImage[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [page, setPage] = useState(1);
  const [draftName, setDraftName] = useState("");
  const [draftAlt, setDraftAlt] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const loadImages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const allImages: MediaLibraryImage[] = [];
      let nextCursor = "";
      let page = 0;

      do {
        const params = new URLSearchParams({ limit: "50", prefix: "hivrasoft" });
        if (nextCursor) params.set("nextCursor", nextCursor);

        const response = await fetch(`${API_URL}/api/uploads/images?${params.toString()}`, {
          credentials: "include",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        const data = await readJson(response);
        if (!response.ok) throw new Error(data?.message || "Unable to load gallery.");

        if (Array.isArray(data?.images)) allImages.push(...data.images);
        nextCursor = typeof data?.nextCursor === "string" ? data.nextCursor : "";
        page += 1;
      } while (nextCursor && page < 50);

      const unique = new Map<string, MediaLibraryImage>();
      allImages.forEach((image) => unique.set(image.publicId, image));
      setImages(sortLatestFirst(Array.from(unique.values())));
      setPage(1);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load gallery.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadImages();
  }, [loadImages]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return images;
    return images.filter((image) =>
      [image.name, image.alt, image.publicId, image.folder]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [images, search]);

  const selectedImage = useMemo(
    () => images.find((image) => image.publicId === selectedId) || null,
    [images, selectedId]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / GALLERY_PAGE_SIZE));
  const pageStart = (page - 1) * GALLERY_PAGE_SIZE;
  const pagedImages = filtered.slice(pageStart, pageStart + GALLERY_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openDetails = (image: MediaLibraryImage) => {
    setSelectedId(image.publicId);
    setDraftName(image.name || "");
    setDraftAlt(image.alt || image.name || "");
    setError("");
    setSuccess("");
  };

  const closeDetails = () => {
    if (saving) return;
    setSelectedId("");
    setDraftName("");
    setDraftAlt("");
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length || uploading) return;
    setUploading(true);
    setError("");
    setSuccess("");
    let uploadedCount = 0;
    try {
      for (const [index, file] of Array.from(files).entries()) {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("folder", "media-library/products");
        formData.append("imageName", uniqueUploadName(file, index));

        const response = await fetch(`${API_URL}/api/uploads/image`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        const data = await readJson(response);
        if (!response.ok) throw new Error(data?.message || `Unable to upload ${file.name}.`);
        uploadedCount += 1;
      }

      setSuccess(`${uploadedCount} image${uploadedCount === 1 ? "" : "s"} uploaded to Gallery.`);
      await loadImages();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload images.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const moveToTrash = async (image: MediaLibraryImage) => {
    if (deletingId) return;
    const confirmed = await confirmAdminAction({
      title: "Move image to Trash?",
      itemName: image.name || image.publicId,
      description: "You can restore it for 30 days. Deleting it permanently from Trash (or after 30 days) also removes it from Cloudinary.",
      confirmLabel: "OK - Move to Trash",
      cancelLabel: "Cancel",
    });
    if (!confirmed) return;
    setDeletingId(image.publicId);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${API_URL}/api/uploads/image/trash`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: image.publicId }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to move image to Trash.");
      setImages((current) => current.filter((item) => item.publicId !== image.publicId));
      if (selectedId === image.publicId) setSelectedId("");
      setSuccess("Image moved to Trash. Restore it within 30 days from Admin → Trash.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to move image to Trash.");
    } finally {
      setDeletingId("");
    }
  };

  const saveDetails = async () => {
    if (!selectedImage || saving) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/api/uploads/image`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicId: selectedImage.publicId,
          name: draftName,
          alt: draftAlt,
        }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to update image details.");

      setImages((current) =>
        current.map((image) =>
          image.publicId === selectedImage.publicId
            ? {
                ...image,
                ...(data?.image || {}),
                name: draftName.trim(),
                alt: draftAlt.trim(),
              }
            : image
        )
      );
      setSuccess("Image name and ALT text updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update image details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-8 md:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C1839]">Admin Media</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#211A18]">Gallery</h1>
          <p className="mt-1 text-sm text-[#211A18]/50">
            Upload images once and reuse them while adding or editing products.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadImages()}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-xs font-semibold text-[#211A18]"
          >
            <RefreshCw size={15} /> Refresh
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(event) => void uploadFiles(event.target.files)}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#211A18] px-5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {uploading ? "Uploading..." : "Upload Images"}
          </button>
        </div>
      </div>

      {(error || success) && (
        <div
          className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {error || success}
        </div>
      )}

      <div className="relative mt-6">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/35" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search gallery..."
          className="h-11 w-full rounded-xl border border-black/10 bg-white pl-10 pr-4 text-sm outline-none focus:border-black/25"
        />
      </div>

      {loading ? (
        <div className="mt-6 grid min-h-72 place-items-center rounded-2xl border border-black/5 bg-white text-sm text-black/45">
          <div className="text-center">
            <Loader2 size={25} className="mx-auto mb-3 animate-spin" />
            Loading gallery...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 grid min-h-72 place-items-center rounded-2xl border border-dashed border-black/10 bg-white text-center text-sm text-black/45">
          <div>
            <ImageIcon size={30} className="mx-auto mb-3" />
            No images found.
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {pagedImages.map((image) => (
              <div key={image.publicId} className="group relative aspect-square overflow-hidden rounded-2xl border border-black/5 bg-[#F3EEE8] text-left shadow-[0_8px_30px_rgba(33,26,24,0.04)] transition hover:-translate-y-0.5 hover:border-[#8C1839]/25 hover:shadow-[0_12px_34px_rgba(33,26,24,0.08)]">
                <img src={image.url} alt={image.alt || image.name || "Gallery image"} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]" />
                <button type="button" onClick={() => openDetails(image)} aria-label="Open image details" className="absolute inset-0 z-10 h-full w-full focus-visible:outline-[#8C1839]" />
                <span className="pointer-events-none absolute right-12 top-2 z-10 grid h-8 w-8 place-items-center rounded-full border border-white/70 bg-white/90 text-[#211A18] opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-within:opacity-100"><Pencil size={14}/></span>
                <button type="button" onClick={() => void moveToTrash(image)} disabled={Boolean(deletingId)} title="Move to Trash" aria-label="Move image to Trash" className="absolute right-2 top-2 z-20 grid h-8 w-8 place-items-center rounded-full border border-red-100 bg-white/95 text-red-600 opacity-0 shadow-sm transition hover:bg-red-50 group-hover:opacity-100 group-focus-within:opacity-100 disabled:opacity-50">{deletingId === image.publicId ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}</button>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-black/45">
              Showing {filtered.length ? pageStart + 1 : 0}–{Math.min(pageStart + GALLERY_PAGE_SIZE, filtered.length)} of {filtered.length} · 50 photos per page · latest first
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="h-9 rounded-xl border border-black/10 px-4 text-xs font-semibold text-black/60 disabled:cursor-not-allowed disabled:opacity-35"
              >
                Previous
              </button>
              <span className="min-w-20 text-center text-xs font-semibold text-[#211A18]/65">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                className="h-9 rounded-xl border border-black/10 px-4 text-xs font-semibold text-black/60 disabled:cursor-not-allowed disabled:opacity-35"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {selectedImage && (
        <div className="fixed inset-0 z-[140] flex justify-end bg-black/35 backdrop-blur-[1px]" onMouseDown={closeDetails}>
          <aside
            className="flex h-full w-full max-w-[470px] flex-col bg-[#FAF8F6] shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/5 bg-white px-5 py-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#8C1839]">Gallery Image</p>
                <h2 className="mt-1 text-lg font-semibold text-[#211A18]">Image details</h2>
              </div>
              <button
                type="button"
                onClick={closeDetails}
                className="grid h-10 w-10 place-items-center rounded-full border border-black/10 text-black/55 hover:bg-black/5"
                aria-label="Close image details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
                <div className="aspect-square bg-[#F3EEE8]">
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.alt || selectedImage.name || "Gallery image"}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-black/5 bg-white p-4">
                <label className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#211A18]/50">
                  Image name
                </label>
                <input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  maxLength={200}
                  placeholder="Enter image name"
                  className="mt-2 h-11 w-full rounded-xl border border-black/10 bg-[#FAF8F6] px-3 text-sm text-[#211A18] outline-none focus:border-[#8C1839]/40"
                />

                <label className="mt-4 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#211A18]/50">
                  ALT text
                </label>
                <textarea
                  value={draftAlt}
                  onChange={(event) => setDraftAlt(event.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="Describe this image for SEO and accessibility"
                  className="mt-2 w-full resize-none rounded-xl border border-black/10 bg-[#FAF8F6] px-3 py-3 text-sm leading-5 text-[#211A18] outline-none focus:border-[#8C1839]/40"
                />

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveDetails()}
                  className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#211A18] px-4 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Pencil size={14} />}
                  {saving ? "Saving..." : "Save Name & ALT"}
                </button>
              </div>

              <button type="button" disabled={Boolean(deletingId)} onClick={() => void moveToTrash(selectedImage)} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-xs font-semibold text-red-700 disabled:opacity-50"><Trash2 size={14}/> Move to Trash</button>
              <div className="mt-4 rounded-2xl border border-black/5 bg-white p-4 text-xs text-[#211A18]/60">
                <div className="grid grid-cols-2 gap-3">
                  <Detail label="Dimensions" value={selectedImage.width && selectedImage.height ? `${selectedImage.width} × ${selectedImage.height}` : "—"} />
                  <Detail label="File size" value={bytesLabel(selectedImage.bytes)} />
                  <Detail label="Format" value={(selectedImage.format || "—").toUpperCase()} />
                  <Detail label="Folder" value={selectedImage.folder || "—"} />
                </div>
                <div className="mt-4 flex gap-2 border-t border-black/5 pt-4">
                  <CalendarDays size={14} className="mt-0.5 shrink-0 text-black/35" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-black/35">Uploaded</p>
                    <p className="mt-1 break-words text-[11px] text-[#211A18]/65">{dateLabel(selectedImage.createdAt)}</p>
                  </div>
                </div>
                <div className="mt-4 border-t border-black/5 pt-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-black/35">Public ID</p>
                  <p className="mt-1 break-all text-[10px] leading-4 text-[#211A18]/55">{selectedImage.publicId}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-[#FAF8F6] p-3">
      <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-black/35">{label}</p>
      <p className="mt-1 truncate text-[11px] font-medium text-[#211A18]/70" title={value}>
        {value}
      </p>
    </div>
  );
}
