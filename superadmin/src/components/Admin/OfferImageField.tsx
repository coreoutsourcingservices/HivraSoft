"use client";

import { useRef, useState } from "react";
import { ExternalLink, ImagePlus, Loader2, X } from "lucide-react";

export type OfferImage = { url: string; publicId: string };

type Props = {
  value: OfferImage | null;
  onChange: (image: OfferImage | null) => void;
  offerType: "buy_get" | "fixed_price_bundle";
  disabled?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
};

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
  .replace(/\/+$/, "").replace(/\/api$/i, "");

// Only images accepted by the backend's Multer uploader, up to 10 MB.
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export default function OfferImageField({
  value,
  onChange,
  offerType,
  disabled = false,
  onUploadingChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const locked = disabled || uploading;

  async function uploadFile(file: File) {
    if (locked) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setError("Select a JPG, PNG, WEBP or AVIF image.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Image must be 10 MB or smaller.");
      return;
    }

    setUploading(true);
    onUploadingChange?.(true);
    setError("");
    try {
      const form = new FormData();
      form.append("image", file);
      form.append("folder", offerType === "buy_get" ? "offers/buy-get" : "offers/fixed-price-bundle");
      // Use a unique Cloudinary public ID on every replacement; don't overwrite old files.
      form.append("imageName", `offer-${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${file.name}`);

      const response = await fetch(`${API_URL}/api/uploads/image`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || "Could not upload image to Cloudinary.");
      }
      const url = payload?.image?.url;
      const publicId = payload?.image?.publicId;
      if (typeof url !== "string" || !url || typeof publicId !== "string" || !publicId) {
        throw new Error("Cloudinary did not return the image URL and public ID.");
      }
      onChange({ url, publicId });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Cloudinary upload failed.");
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-[16px] border border-[#211A18]/10 bg-[#FAF8F6] p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[12px] font-semibold text-[#211A18]">Offer Image (Cloudinary)</p>
          <p className="mt-1 text-[10px] text-[#211A18]/45">Upload an optional banner image for this offer.</p>
        </div>
        {value?.url ? <span className="text-[9px] font-semibold text-emerald-700">Uploaded</span> : null}
      </div>

      <button
        type="button"
        disabled={locked}
        onClick={() => inputRef.current?.click()}
        className="mt-3 flex min-h-[145px] w-full items-center justify-center overflow-hidden rounded-[14px] border border-dashed border-[#211A18]/20 bg-white text-[#211A18]/50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {value?.url ? (
          <div className="relative w-full">
            <img src={value.url} alt="Offer image preview" className="max-h-[250px] w-full object-contain" />
            <span className="absolute inset-x-0 bottom-0 bg-black/65 px-3 py-2 text-center text-[10px] font-semibold text-white">
              {uploading ? "Uploading..." : "Click to replace image"}
            </span>
          </div>
        ) : (
          <span className="flex flex-col items-center gap-2 p-6 text-[11px] font-semibold">
            {uploading ? <Loader2 size={23} className="animate-spin" /> : <ImagePlus size={23} />}
            {uploading ? "Uploading to Cloudinary..." : "Click to upload offer image"}
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        disabled={locked}
        className="hidden"
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected) void uploadFile(selected);
        }}
      />
      <p className="mt-2 text-[9px] text-[#211A18]/40">JPG, PNG, WEBP or AVIF, max 10 MB. Image is saved with the offer when you click Add/Update Offer.</p>

      {value?.url && value.publicId ? (
        <div className="mt-3 space-y-3">
          <label className="block text-[10px] font-semibold text-[#211A18]/65">
            Image URL
            <input value={value.url} readOnly onFocus={(event) => event.target.select()} className="mt-1.5 h-10 w-full rounded-[10px] border border-[#211A18]/10 bg-white px-3 text-[10px] font-normal text-[#211A18]/70" />
          </label>
          <label className="block text-[10px] font-semibold text-[#211A18]/65">
            Cloudinary Public ID
            <input value={value.publicId} readOnly onFocus={(event) => event.target.select()} className="mt-1.5 h-10 w-full rounded-[10px] border border-[#211A18]/10 bg-white px-3 text-[10px] font-normal text-[#211A18]/70" />
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <a href={value.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#A51D45]">
              View image <ExternalLink size={12} />
            </a>
            <button
              type="button"
              disabled={locked}
              onClick={() => { onChange(null); setError(""); }}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 disabled:opacity-50"
            >
              <X size={12} /> Remove from offer
            </button>
          </div>
        </div>
      ) : null}
      {error ? <p role="alert" className="mt-3 text-[10px] text-red-600">{error}</p> : null}
    </div>
  );
}
