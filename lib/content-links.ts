import { SITE_URL } from "./seo";
import legacyLinks from "@/data/storefront-link-aliases.json";
const linkAliases: Record<string, string> = legacyLinks;

/** Use canonical local URLs for same-site anchors without changing external links. */
export function normalizeContentHref(href: string, pagePath = "/", siteUrl = SITE_URL): string | undefined {
  const value = href.trim();
  if (!value) return undefined;
  if (value.startsWith("#")) return value;
  try {
    const site = new URL(siteUrl);
    const url = new URL(value, new URL(pagePath, site));
    if (url.protocol === "mailto:" || url.protocol === "tel:") return value;
    if (!/^https?:$/.test(url.protocol)) return undefined;
    const hostname = (host: string) => host.toLowerCase().replace(/^www\./, "");
    if (hostname(url.hostname) !== hostname(site.hostname) || url.port !== site.port) return value;
    const pathname = url.pathname.replace(/\/+$/, "") || "/";
    return (linkAliases[pathname] || pathname) + url.search + url.hash;
  } catch { return undefined; }
}

export function contentAnchorAttributes(attributes: Record<string, string>, pagePath = "/"): Record<string, string> {
  const { href, ...rest } = attributes;
  const normalized = href ? normalizeContentHref(href, pagePath) : undefined;
  if (rest.target === "_blank") {
    rest.rel = [...new Set((rest.rel || "").split(/\s+/).filter(Boolean).concat("noopener", "noreferrer"))].join(" ");
  }
  return { ...rest, ...(normalized ? { href: normalized } : {}) };
}

/** Called on the sanitized display DOM; the stored editor HTML is unchanged. */
export function normalizeContentAnchors(root: ParentNode, pagePath = "/") {
  for (const anchor of root.querySelectorAll("a[href]")) {
    const href = normalizeContentHref(anchor.getAttribute("href") || "", pagePath);
    if (href) anchor.setAttribute("href", href);
    else anchor.removeAttribute("href");
    if (anchor.getAttribute("target") === "_blank") {
      const rel = contentAnchorAttributes({ target: "_blank", rel: anchor.getAttribute("rel") || "" }).rel;
      anchor.setAttribute("rel", rel);
    }
  }
}
