import sanitizeHtml from "sanitize-html";
import { contentAnchorAttributes } from "@/lib/content-links";

/** Render a safe copy; keep the original editor HTML in the API. */
export default function CategoryDescription({ title, html, pagePath = "/", heading: Heading = "h2" }: { title: string; html: string; pagePath?: string; heading?: "h1" | "h2" }) {
  const safe = sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "h1", "h2", "sub", "sup"],
    allowedAttributes: {
      "*": ["style"],
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      td: ["colspan", "rowspan"], th: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedStyles: {
      "*": {
        color: [/^(?:#[0-9a-f]{3,8}|[a-z]+|rgba?\([0-9.,% ]+\))$/i],
        "background-color": [/^(?:#[0-9a-f]{3,8}|[a-z]+|rgba?\([0-9.,% ]+\))$/i],
        "text-align": [/^(left|right|center|justify)$/],
        "font-size": [/^\d+(?:\.\d+)?(?:px|pt|em|rem|%)$/],
        "font-weight": [/^(?:normal|bold|[1-9]00)$/],
        "text-decoration": [/^(?:underline|line-through|none)$/],
      },
    },
    transformTags: {
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, alt: attribs.alt || title, loading: "lazy" } }),
      a: (tagName, attribs) => ({ tagName, attribs: contentAnchorAttributes(attribs, pagePath) }),
    },
  });
  // Editors can save empty markup such as <p><br></p> or non-breaking spaces.
  const text = sanitizeHtml(safe, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;|&#0*160;|&#x0*a0;/gi, " ").trim();
  if (!text && !/<(?:img|hr)\b/i.test(safe)) return null;

  return <section className="mx-auto max-w-[1500px] bg-white px-6 py-8 text-[#211A18]">
    <Heading className="mb-4 text-2xl font-semibold text-[#211A18]">{title}</Heading>
    <div className="space-y-3 text-sm leading-7 [&_img]:h-auto [&_img]:max-w-full [&_table]:max-w-full [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6" dangerouslySetInnerHTML={{ __html: safe }} />
  </section>;
}
