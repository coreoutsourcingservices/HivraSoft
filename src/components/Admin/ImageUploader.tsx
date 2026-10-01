"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
} from "react";

export type ImageValue = {
  url: string;
  publicId: string;
};

type Props = {
  label: string;
  value: ImageValue;
  folder: string;
  disabled?: boolean;
  onUploaded: (
    image: ImageValue
  ) => void | Promise<void>;
  onRemove: () => void | Promise<void>;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export default function ImageUploader({
  label,
  value,
  folder,
  disabled = false,
  onUploaded,
  onRemove,
}: Props) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const handleFileChange =
    async (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[0];

      event.target.value = "";

      if (!file) {
        return;
      }

      setError("");

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/avif",
      ];

      if (
        !allowedTypes.includes(
          file.type
        )
      ) {
        setError(
          "Only JPG, PNG, WEBP or AVIF allowed."
        );
        return;
      }

      if (
        file.size >
        10 * 1024 * 1024
      ) {
        setError(
          "Image must be smaller than 10MB."
        );
        return;
      }

      try {
        setUploading(true);

        const formData =
          new FormData();

        formData.append(
          "image",
          file
        );

        formData.append(
          "folder",
          folder
        );

        const response =
          await fetch(
            `${API_URL}/api/uploads/image`,
            {
              method: "POST",
              credentials:
                "include",
              body: formData,
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Image upload failed."
          );
        }

        if (
          !data.image?.url ||
          !data.image?.publicId
        ) {
          throw new Error(
            "Invalid upload response."
          );
        }

        await onUploaded({
          url: data.image.url,
          publicId:
            data.image.publicId,
        });
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Image upload failed."
        );
      } finally {
        setUploading(false);
      }
    };

  return (
    <div className="rounded-2xl border border-[#211A18]/10 bg-[#FAF8F6] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold text-[#211A18]">
          {label}
        </p>

        {value.url && (
          <button
            type="button"
            disabled={
              disabled ||
              uploading
            }
            onClick={() =>
              void onRemove()
            }
            className="text-[8px] font-semibold uppercase tracking-[0.1em] text-red-500 disabled:opacity-40"
          >
            Remove
          </button>
        )}
      </div>

      {value.url ? (
        <div className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-white">
          <img
            src={value.url}
            alt={label}
            className="h-full w-full object-cover"
          />

          <button
            type="button"
            disabled={
              disabled ||
              uploading
            }
            onClick={() =>
              inputRef.current?.click()
            }
            className="absolute inset-0 flex items-center justify-center bg-black/40 text-[9px] font-semibold uppercase text-white opacity-0 transition group-hover:opacity-100 disabled:opacity-40"
          >
            {uploading
              ? "Uploading..."
              : "Replace"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={
            disabled ||
            uploading
          }
          onClick={() =>
            inputRef.current?.click()
          }
          className="flex aspect-[4/5] w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#211A18]/20 bg-white text-center transition hover:border-[#8C1839] disabled:opacity-50"
        >
          {uploading ? (
            <span className="h-7 w-7 animate-spin rounded-full border-2 border-[#211A18]/10 border-t-[#8C1839]" />
          ) : (
            <>
              <span className="text-3xl text-[#8C1839]">
                +
              </span>
              <span className="mt-2 text-[10px] font-semibold">
                Choose Image
              </span>
              <span className="mt-1 text-[8px] text-[#211A18]/40">
                JPG, PNG, WEBP, AVIF
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={
          handleFileChange
        }
        className="hidden"
      />

      {error && (
        <p className="mt-2 text-[9px] text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
