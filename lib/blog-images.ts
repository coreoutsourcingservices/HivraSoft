// Resize only public Cloudinary uploads; preserve signed and other provider URLs.
export function blogImageUrl(source: string, width: number) {
  try {
    const url = new URL(source);
    if (url.protocol === "https:" && url.hostname === "aquamarine-mosquito-320960.hostingersite.com" && url.pathname.startsWith("/wp-content/uploads/")) {
      return "/_next/image?url=" + encodeURIComponent(source) + "&w=" + width + "&q=75";
    }
    if (url.hostname !== "res.cloudinary.com" || !url.pathname.includes("/image/upload/") || url.pathname.includes("/s--")) return source;
    url.pathname = url.pathname.replace("/image/upload/", "/image/upload/f_auto,q_auto,c_limit,w_" + width + "/");
    return url.href;
  } catch { return source; }
}
export function blogImageSrcSet(source: string, widths: number[]) {
  return blogImageUrl(source, widths[0]) === source ? undefined : widths.map(width => blogImageUrl(source, width) + " " + width + "w").join(", ");
}
