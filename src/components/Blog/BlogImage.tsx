"use client";
import { imageAlt as resolveImageAlt } from "@/lib/image-alt";
import { useState, type ImgHTMLAttributes } from "react";
type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "alt"> & {
  originalSrc: string;
  alt: string;
};
// Keep the description on the actual image, including after an optimizer fallback.
export default function BlogImage({ originalSrc, src, srcSet, alt, title, ...props }: Props) {
  const [failedSource, setFailedSource] = useState<string>();
  const fallback = failedSource === src;
  const imageAlt = alt?.trim() || title?.trim() || "HivraSoft blog image";
  return <img {...props} alt={resolveImageAlt(imageAlt, "HivraSoft image")} title={title} src={fallback ? originalSrc : src}
    srcSet={fallback ? undefined : srcSet} onError={() => setFailedSource(String(src))} />;
}
