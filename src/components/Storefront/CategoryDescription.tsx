import sanitizeHtml from "sanitize-html";

/** Render a safe copy; keep the original editor HTML in the API. */
export default function CategoryDescription({ title, html }: { title: string; html: string }) {
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
      a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, rel: "noopener noreferrer" } }),
    },
  });
  return <section className="mx-auto max-w-[1500px] px-6 py-8 text-[#211A18]">
    <h1 className="mb-4 text-2xl font-semibold">{title}</h1>
    <div className="space-y-3 text-sm leading-7 [&_img]:h-auto [&_img]:max-w-full [&_table]:max-w-full [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6" dangerouslySetInnerHTML={{ __html: safe }} />
  </section>;
}
