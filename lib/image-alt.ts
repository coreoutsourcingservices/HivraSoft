function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}
function text(value: unknown): string {
  return typeof value === "string" ? value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "";
}
/** Preserve supplied descriptions; skip missing and whitespace-only values. */
export function imageAlt(...values: unknown[]): string {
  for (const value of values) {
    const data = record(value);
    const candidate = typeof value === "string" ? text(value)
      : [data.alt, data.altText, data.imageAlt, data.title, data.name].map(text).find(Boolean);
    if (candidate) return candidate;
  }
  return "HivraSoft image";
}
/** Resolve metadata for the displayed image, rather than another product variant. */
export function productImageAlt(product: unknown, source: unknown, ...fallbacks: unknown[]): string {
  const data = record(product);
  const url = text(source);
  const direct = url && url === data.image1 ? data.image1Alt : url && url === data.image2 ? data.image2Alt : undefined;
  if (text(direct)) return imageAlt(direct);
  const arrays = [data.images, data.mainImages, ...(Array.isArray(data.colors) ? data.colors.map(color => record(color).images) : [])];
  for (const images of arrays) {
    if (!Array.isArray(images)) continue;
    const match = images.find(image => record(image).url === url);
    const description = record(match);
    const supplied = [description.alt, description.altText, description.title].map(text).find(Boolean);
    if (supplied) return supplied;
  }
  return imageAlt(...fallbacks, data.nameProduct, data.name, "HivraSoft product");
}
