import sanitizeHtml from "sanitize-html";

/* =========================================================
   PRODUCT DESCRIPTION HTML SANITIZER

   Goal:
   - HTML tags DB me preserve hon.
   - Safe inline CSS preserve ho.
   - script / iframe / event handlers remove hon.
   - javascript: URLs remove hon.

   IMPORTANT:
   Admin input ko raw HTML ke roop me directly storefront
   par render mat karo. DB me sanitized HTML hi save karo.
========================================================= */

const MAX_DESCRIPTION_LENGTH =
  100_000;

/* Explicit safe CSS values also allow product cards, background gradients,
   shadows, flex layout, table spacing. No url(), JS or CSS injection. */
const cssLength = String.raw`(?:auto|0|-?\d+(?:\.\d+)?(?:px|rem|em|%|vw|vh)?)`;
const cssSpacing = new RegExp(`^${cssLength}(?:\\s+${cssLength}){0,3}$`, "i");
const cssDimension = /^(?:auto|0|\d+(?:\.\d+)?(?:px|rem|em|%|vw|vh))$/i;
const cssColor = /^(?:#[0-9a-f]{3,8}|rgba?\([0-9.,%\s]+\)|hsla?\([0-9.,%\s]+\)|[a-z]+)$/i;
const cssGradient = /^(?!.*(?:url|expression|var|attr|image-set)\s*\()(?:repeating-)?(?:linear|radial)-gradient\([a-z0-9#(),.%\s+\-]+\)$/i;
const cssShadow = /^(?!.*(?:url|expression|var|attr|image-set)\s*\()[a-z0-9#(),.%\s+\-]+$/i;
const cssBorder = /^(?:none|0|\d+(?:\.\d+)?(?:px|rem|em)?\s+(?:solid|dashed|dotted|double)\s+(?:#[0-9a-f]{3,8}|rgba?\([0-9.,%\s]+\)|[a-z]+))$/i;
const cssBorderRadius = /^(?:0|\d+(?:\.\d+)?(?:px|rem|em|%))(?:\s+(?:0|\d+(?:\.\d+)?(?:px|rem|em|%))){0,3}$/i;


/* =========================================================
   SANITIZE
========================================================= */

export const sanitizeProductDescriptionHtml =
  (
    html:
      | string
      | undefined
      | null
  ): string => {
    const value =
      String(
        html ||
        ""
      ).trim();

    if (
      !value
    ) {
      return "";
    }

    if (
      value.length >
      MAX_DESCRIPTION_LENGTH
    ) {
      throw new Error(
        "Product description HTML is too large."
      );
    }

    return sanitizeHtml(
      value,
      {
        allowedTags: [
          "div",
          "section",
          "article",

          "p",
          "br",
          "span",

          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",

          "strong",
          "b",
          "em",
          "i",
          "u",
          "s",

          "ul",
          "ol",
          "li",

          "blockquote",
          "hr",

          "a",
          "img",

          "figure",
          "figcaption",

          "table",
          "thead",
          "tbody",
          "tfoot",
          "tr",
          "th",
          "td",
        ],

        allowedAttributes: {
          "*": [
            "style",
          ],

          a: [
            "href",
            "target",
            "rel",
            "title",
          ],

          img: [
            "src",
            "alt",
            "title",
            "width",
            "height",
            "loading",
          ],

          table: [
            "cellpadding",
            "cellspacing",
          ],

          td: [
            "colspan",
            "rowspan",
          ],

          th: [
            "colspan",
            "rowspan",
            "scope",
          ],
        },

        allowedSchemes: [
          "http",
          "https",
          "mailto",
          "tel",
        ],

        allowedSchemesByTag: {
          img: [
            "http",
            "https",
            "data",
          ],
        },

        allowProtocolRelative:
          false,

        // Safe decorative CSS; prevent network URLs and executable CSS.
        allowedStyles: {
          "*": {
            color: [cssColor],
            background: [cssColor, cssGradient],
            "background-color": [cssColor],
            "background-image": [cssGradient],
            "box-shadow": [cssShadow],
            "font-size": [/^\d+(?:\.\d+)?(?:px|rem|em|%)$/],
            "font-family": [/^[a-z0-9 ,\-\'"]+$/i],
            "font-weight": [/^(normal|bold|bolder|lighter|[1-9]00)$/],
            "font-style": [/^(normal|italic|oblique)$/],
            "text-align": [/^(left|right|center|justify|start|end)$/],
            "text-decoration": [/^(?:none|underline|line-through|overline)$/],
            "text-transform": [/^(?:none|uppercase|lowercase|capitalize)$/],
            "list-style-type": [/^(?:none|disc|circle|square|decimal|lower-alpha|upper-alpha|lower-roman|upper-roman)$/],
            "line-height": [/^[\d.]+(?:px|rem|em|%)?$/],
            "letter-spacing": [new RegExp(`^${cssLength}$`, "i")],
            margin: [cssSpacing],
            "margin-top": [cssSpacing],
            "margin-bottom": [cssSpacing],
            "margin-left": [cssSpacing, /^auto$/],
            "margin-right": [cssSpacing, /^auto$/],
            padding: [cssSpacing],
            "padding-top": [cssSpacing],
            "padding-bottom": [cssSpacing],
            "padding-left": [cssSpacing],
            "padding-right": [cssSpacing],
            "border-radius": [cssBorderRadius],
            border: [cssBorder],
            "border-top": [cssBorder],
            "border-bottom": [cssBorder],
            "border-left": [cssBorder],
            "border-right": [cssBorder],
            "border-collapse": [/^(separate|collapse)$/],
            "border-spacing": [cssSpacing],
            width: [cssDimension],
            "max-width": [cssDimension],
            "min-width": [cssDimension],
            height: [cssDimension],
            "max-height": [cssDimension],
            "min-height": [cssDimension],
            display: [/^(?:block|inline|inline-block|flex|inline-flex|grid|inline-grid|none|table|table-cell)$/],
            "vertical-align": [/^(?:top|middle|bottom|baseline|sub|super)$/],
            "flex-wrap": [/^(?:wrap|nowrap|wrap-reverse)$/],
            "flex-direction": [/^(?:row|column|row-reverse|column-reverse)$/],
            "justify-content": [/^(?:flex-start|flex-end|center|space-between|space-around|space-evenly)$/],
            "align-items": [/^(?:stretch|flex-start|flex-end|center|baseline)$/],
            gap: [cssSpacing],
            "row-gap": [cssSpacing],
            "column-gap": [cssSpacing],
            overflow: [/^(?:hidden|auto|scroll|visible)$/],
            "overflow-x": [/^(?:hidden|auto|scroll|visible)$/],
            "overflow-y": [/^(?:hidden|auto|scroll|visible)$/],
          },
        },

        /*
          Force safe rel for external links.
        */
        transformTags: {
          a: (
            tagName,
            attribs
          ) => {
            return {
              tagName,

              attribs: {
                ...attribs,

                rel:
                  "noopener noreferrer nofollow",
              },
            };
          },
        },
      }
    );
  };
