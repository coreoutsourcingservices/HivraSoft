"use client";

import dynamic from "next/dynamic";
import { apiFetch } from "@/lib/api";
import type { BlogImage } from "@/lib/blog";

const WordEditor = dynamic(() => import("./WordBlogEditor"), {
  ssr: false,
  loading: () => <p className="p-4 text-sm">Loading editor...</p>,
});

type Props = {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  folder: string;
};

export default function DescriptionEditor({ value, onChange, disabled, folder }: Props) {
  async function uploadImage(file: File): Promise<BlogImage> {
    const body = new FormData();
    body.set("image", file);
    body.set("folder", folder);
    body.set("imageName", file.name.replace(/\.[^.]+$/, "") || "description-image");
    const result = await apiFetch<{ image: BlogImage }>("/api/uploads/image", { method: "POST", body });
    return result.image;
  }

  return <WordEditor placeholder="Write description..." value={value} onChange={onChange} disabled={disabled} onImageUpload={uploadImage} />;
}
