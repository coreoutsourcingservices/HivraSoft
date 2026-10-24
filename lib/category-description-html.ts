import DOMPurify from "isomorphic-dompurify";
import { normalizeContentAnchors } from "./content-links";

// Same display sanitization as product descriptions; stored API HTML stays unchanged.
const descriptionTags = [
  "div", "section", "article", "p", "br", "span", "h1", "h2", "h3",
  "h4", "h5", "h6", "strong", "b", "em", "i", "u", "s", "del",
  "ul", "ol", "li", "blockquote", "hr", "a", "img", "figure",
  "figcaption", "pre", "code", "table", "thead", "tbody", "tfoot", "tr", "th", "td",
];
const descriptionAttributes = [
  "style", "href", "target", "rel", "title", "src", "alt", "width",
  "height", "loading", "id", "cellpadding", "cellspacing", "colspan", "rowspan", "scope",
];
const decorativeProperties = new Set([
  "color", "background", "background-color", "background-image", "box-shadow",
  "font-size", "font-family", "font-weight", "font-style", "text-align",
  "text-decoration", "text-transform", "list-style-type", "line-height",
  "letter-spacing", "margin", "margin-top", "margin-bottom", "margin-left",
  "margin-right", "padding", "padding-top", "padding-bottom", "padding-left",
  "padding-right", "border", "border-top", "border-bottom", "border-left",
  "border-right", "border-radius", "border-collapse", "border-spacing", "width",
  "max-width", "min-width", "height", "max-height", "min-height", "display",
  "vertical-align", "flex-wrap", "flex-direction", "justify-content", "align-items",
  "gap", "row-gap", "column-gap", "overflow", "overflow-x", "overflow-y",
]);
export function cleanCategoryDescriptionHtml(html?: string, categoryName?: string, pagePath = "/"): string {
  if (!html || typeof html !== "string") return "";
  const root = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: descriptionTags,
    ALLOWED_ATTR: descriptionAttributes,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    RETURN_DOM: true,
  }) as HTMLElement;
  for (const element of Array.from(root.querySelectorAll("[style]"))) {
    const original = element.getAttribute("style") || "";
    const safe = original.split(";").map((entry) => {
      const separator = entry.indexOf(":");
      if (separator < 0) return "";
      const property = entry.slice(0, separator).trim().toLowerCase();
      const value = entry.slice(separator + 1).trim();
      if (!decorativeProperties.has(property) || !value || value.length > 300) return "";
      if (/(?:url|expression|var|attr|image-set|paint)\s*\(|@import|\\|[{}<>;!]/i.test(value)) return "";
      if (!/^[a-z0-9#(),.%\s+\-\/'"]+$/i.test(value)) return "";
      return `${property}:${value}`;
    }).filter(Boolean).join(";");
    if (safe) element.setAttribute("style", safe);
    else element.removeAttribute("style");
  }
  for (const image of root.querySelectorAll("img")) {
    image.setAttribute("loading", "lazy");
    image.setAttribute("alt", image.getAttribute("alt") || image.getAttribute("title") || categoryName || "Category details");
  }
  normalizeContentAnchors(root, pagePath);
  // DOMPurify normalizes attribute quotes and encodes unsafe characters.
  return root.innerHTML;
}
