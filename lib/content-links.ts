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
  // Public content links should pass authority; preserve utility/external policies.
  if (normalized?.startsWith("/") && !normalized.startsWith("//")
    && !/^\/(?:admin|api|account|my-account|login|register|cart|checkout|wishlist)(?:[/?#]|$)/i.test(normalized)) {
    const rel = (rest.rel || "").split(/\s+/).filter((token) => token && token.toLowerCase() !== "nofollow");
    if (rel.length) rest.rel = rel.join(" ");
    else delete rest.rel;
  }
  if (rest.target === "_blank") {
    rest.rel = [...new Set((rest.rel || "").split(/\s+/).filter(Boolean).concat("noopener", "noreferrer"))].join(" ");
  }
  return { ...rest, ...(normalized ? { href: normalized } : {}) };
}

/** Called on the sanitized display DOM; the stored editor HTML is unchanged. */
export function normalizeContentAnchors(root: ParentNode, pagePath = "/") {
  for (const anchor of root.querySelectorAll("a[href]")) {
    const attributes = contentAnchorAttributes({
      href: anchor.getAttribute("href") || "",
      target: anchor.getAttribute("target") || "",
      rel: anchor.getAttribute("rel") || "",
    }, pagePath);
    if (attributes.href) anchor.setAttribute("href", attributes.href);
    else anchor.removeAttribute("href");
    if (attributes.rel) anchor.setAttribute("rel", attributes.rel);
    else anchor.removeAttribute("rel");
  }
}
