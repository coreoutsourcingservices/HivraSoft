"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Image as ImageIcon, Loader2, Search, Upload, X } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const GALLERY_PAGE_SIZE = 50;

export type MediaLibraryImage = {
  publicId: string;
  url: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  createdAt?: string;
  folder?: string;
  name?: string;
  alt?: string;
};

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

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (images: MediaLibraryImage[]) => void;
};

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

export default function MediaLibraryPicker({ open, onClose, onSelect }: Props) {
  const [images, setImages] = useState<MediaLibraryImage[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
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
    if (!open) return;
    setSelected([]);
    setPage(1);
    void loadImages();
  }, [open, loadImages]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return images;
    return images.filter((image) =>
      [image.name, image.alt, image.publicId, image.folder]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [images, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / GALLERY_PAGE_SIZE));
  const pageStart = (page - 1) * GALLERY_PAGE_SIZE;
  const pagedImages = filtered.slice(pageStart, pageStart + GALLERY_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length || uploading) return;
    setUploading(true);
    setError("");
    try {
      const uploaded: MediaLibraryImage[] = [];
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

        const image = data?.image;
        if (image?.url && image?.publicId) {
          uploaded.push({
            publicId: String(image.publicId),
            url: String(image.url),
            width: Number(image.width || 0),
            height: Number(image.height || 0),
            format: String(image.format || ""),
            name: String(image.name || file.name.replace(/\.[^/.]+$/, "")),
            alt: String(image.alt || image.name || file.name.replace(/\.[^/.]+$/, "")),
            folder: "hivrasoft/media-library/products",
            createdAt: String(image.createdAt || new Date().toISOString()),
          });
        }
      }

      if (uploaded.length) {
        setImages((current) => {
          const map = new Map<string, MediaLibraryImage>();
          [...uploaded, ...current].forEach((image) => map.set(image.publicId, image));
          return sortLatestFirst(Array.from(map.values()));
        });
        setSelected(uploaded.map((image) => image.publicId));
        setPage(1);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload images.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (!open) return null;

  const confirmSelection = () => {
    const chosen = images.filter((image) => selected.includes(image.publicId));
    if (!chosen.length) return;
    onSelect(chosen);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm md:p-6">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-black/5 px-5 py-4 md:px-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8C1839]">Media Library</p>
            <h2 className="mt-1 text-xl font-semibold text-[#211A18]">Choose product photos</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-black/10 text-black/55 hover:bg-black/5" aria-label="Close gallery">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-black/5 bg-[#FCFAF8] p-4 md:flex-row md:items-center md:px-7">
          <div className="relative min-w-0 flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/35" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search gallery..." className="h-11 w-full rounded-xl border border-black/10 bg-white pl-10 pr-4 text-sm outline-none focus:border-black/25" />
          </div>
          <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(event) => void uploadFiles(event.target.files)} />
          <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-xs font-semibold text-[#211A18] hover:bg-black/[0.03] disabled:opacity-50">
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {uploading ? "Uploading..." : "Upload New"}
          </button>
        </div>

        {error && <div className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:mx-7">{error}</div>}

        <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-7">
          {loading ? (
            <div className="grid min-h-64 place-items-center text-sm text-black/45"><Loader2 size={24} className="mb-3 animate-spin" />Loading gallery...</div>
          ) : filtered.length === 0 ? (
            <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-black/10 text-center text-sm text-black/45">
              <div><ImageIcon size={28} className="mx-auto mb-3" />No images found.</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {pagedImages.map((image) => {
                  const active = selected.includes(image.publicId);
                  return (
                    <button key={image.publicId} type="button" onClick={() => setSelected((current) => current.includes(image.publicId) ? current.filter((id) => id !== image.publicId) : [...current, image.publicId])} className={`group relative overflow-hidden rounded-2xl border bg-[#F7F3EF] text-left transition ${active ? "border-[#8C1839] ring-2 ring-[#8C1839]/15" : "border-black/5 hover:border-black/15"}`}>
                      <div className="aspect-square overflow-hidden bg-[#F3EEE8]"><img src={image.url} alt={image.alt || image.name || "Gallery image"} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" /></div>
                      <span className={`absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border shadow-sm ${active ? "border-[#8C1839] bg-[#8C1839] text-white" : "border-white/70 bg-white/85 text-transparent"}`}><Check size={14} /></span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-black/5 bg-[#FCFAF8] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-black/45">
                  Showing {filtered.length ? pageStart + 1 : 0}–{Math.min(pageStart + GALLERY_PAGE_SIZE, filtered.length)} of {filtered.length} · latest first
                </span>
                <div className="flex items-center gap-2">
                  <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="h-9 rounded-xl border border-black/10 bg-white px-3 text-xs font-semibold text-black/60 disabled:opacity-35">Previous</button>
                  <span className="min-w-16 text-center text-xs font-semibold text-black/55">{page} / {totalPages}</span>
                  <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="h-9 rounded-xl border border-black/10 bg-white px-3 text-xs font-semibold text-black/60 disabled:opacity-35">Next</button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-black/5 bg-white px-5 py-4 md:px-7">
          <span className="text-xs text-black/45">{selected.length} image{selected.length === 1 ? "" : "s"} selected</span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="h-10 rounded-xl border border-black/10 px-4 text-xs font-semibold text-black/60">Cancel</button>
            <button type="button" disabled={!selected.length} onClick={confirmSelection} className="h-10 rounded-xl bg-[#211A18] px-5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Use Selected Images</button>
          </div>
        </div>
      </div>
    </div>
  );
}
