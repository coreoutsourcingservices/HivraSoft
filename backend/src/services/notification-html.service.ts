import sanitizeHtml from "sanitize-html";

export function sanitizeNotificationHtml(value: unknown) {
  return sanitizeHtml(String(value ?? ""), {
    allowedTags: ["div","p","span","strong","b","em","i","u","s","br","h1","h2","h3","h4","h5","h6","ul","ol","li","a","blockquote","hr","pre","code","table","thead","tbody","tfoot","tr","td","th","img"],
    allowedAttributes: {
      "*": ["style", "class"],
      a: ["href","target","rel","style","class"],
      img: ["src","alt","title","width","height","style","class","data-width","data-align"],
      td: ["colspan","rowspan","style","class"],
      th: ["colspan","rowspan","style","class"],
    },
    allowedSchemes: ["http","https","mailto","tel"],
    allowedStyles: {
      "*": {
        color: [/^#[0-9a-fA-F]{3,8}$/, /^rgb(a)?\(/, /^[a-zA-Z]+$/],
        background: [/^#[0-9a-fA-F]{3,8}$/, /^rgb(a)?\(/, /^[a-zA-Z]+$/],
        "background-color": [/^#[0-9a-fA-F]{3,8}$/, /^rgb(a)?\(/, /^[a-zA-Z]+$/],
        "font-size": [/^\d+(px|rem|em|%)$/],
        "font-family": [/^[a-zA-Z0-9 ,"'-]+$/],
        "font-weight": [/^(normal|bold|[1-9]00)$/],
        "font-style": [/^(normal|italic)$/],
        "text-align": [/^(left|right|center|justify)$/],
        "text-decoration": [/^[a-zA-Z -]+$/],
        margin: [/^[0-9 .%a-zA-Z-]+$/],
        "margin-left": [/^[0-9 .%a-zA-Z-]+$/],
        "margin-right": [/^[0-9 .%a-zA-Z-]+$/],
        "margin-top": [/^[0-9 .%a-zA-Z-]+$/],
        "margin-bottom": [/^[0-9 .%a-zA-Z-]+$/],
        padding: [/^[0-9 .%a-zA-Z-]+$/],
        border: [/^[0-9 .#a-zA-Z(),-]+$/],
        "border-radius": [/^[0-9 .%a-zA-Z-]+$/],
        display: [/^(block|inline|inline-block|flex|grid|table)$/],
        width: [/^[0-9.]+(px|%|rem|em)$/],
        "max-width": [/^[0-9.]+(px|%|rem|em)$/],
        height: [/^[0-9.]+(px|%|rem|em|auto)$/],
        "line-height": [/^[0-9.]+(px|rem|em|%)?$/],
      },
    },
    transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }) },
  }).trim();
}
