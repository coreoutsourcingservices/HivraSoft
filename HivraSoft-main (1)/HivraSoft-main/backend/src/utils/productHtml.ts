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

/* =========================================================
   SAFE STYLE VALUE

   This intentionally blocks:
   - url(...)
   - expression(...)
   - braces
   - semicolons inside a single parsed CSS value
========================================================= */

const SAFE_STYLE_VALUE =
  /^(?!.*(?:url\s*\(|expression\s*\())[-#(),.%/\w\s]+$/i;

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

        /*
          Inline CSS whitelist.

          Deliberately no:
          - position
          - z-index
          - background-image
          - behavior
          - content
          - filter
          because those are unnecessary for product copy.
        */
        allowedStyles: {
          "*": {
            color: [
              SAFE_STYLE_VALUE,
            ],

            "background-color": [
              SAFE_STYLE_VALUE,
            ],

            "font-size": [
              SAFE_STYLE_VALUE,
            ],

            "font-weight": [
              SAFE_STYLE_VALUE,
            ],

            "font-style": [
              SAFE_STYLE_VALUE,
            ],

            "font-family": [
              SAFE_STYLE_VALUE,
            ],

            "text-decoration": [
              SAFE_STYLE_VALUE,
            ],

            "text-align": [
              SAFE_STYLE_VALUE,
            ],

            "text-transform": [
              SAFE_STYLE_VALUE,
            ],

            "line-height": [
              SAFE_STYLE_VALUE,
            ],

            "letter-spacing": [
              SAFE_STYLE_VALUE,
            ],

            margin: [
              SAFE_STYLE_VALUE,
            ],

            "margin-top": [
              SAFE_STYLE_VALUE,
            ],

            "margin-right": [
              SAFE_STYLE_VALUE,
            ],

            "margin-bottom": [
              SAFE_STYLE_VALUE,
            ],

            "margin-left": [
              SAFE_STYLE_VALUE,
            ],

            padding: [
              SAFE_STYLE_VALUE,
            ],

            "padding-top": [
              SAFE_STYLE_VALUE,
            ],

            "padding-right": [
              SAFE_STYLE_VALUE,
            ],

            "padding-bottom": [
              SAFE_STYLE_VALUE,
            ],

            "padding-left": [
              SAFE_STYLE_VALUE,
            ],

            border: [
              SAFE_STYLE_VALUE,
            ],

            "border-top": [
              SAFE_STYLE_VALUE,
            ],

            "border-right": [
              SAFE_STYLE_VALUE,
            ],

            "border-bottom": [
              SAFE_STYLE_VALUE,
            ],

            "border-left": [
              SAFE_STYLE_VALUE,
            ],

            "border-radius": [
              SAFE_STYLE_VALUE,
            ],

            width: [
              SAFE_STYLE_VALUE,
            ],

            "max-width": [
              SAFE_STYLE_VALUE,
            ],

            height: [
              SAFE_STYLE_VALUE,
            ],

            "max-height": [
              SAFE_STYLE_VALUE,
            ],

            display: [
              /^(?:block|inline|inline-block|table|table-row|table-cell|none)$/i,
            ],

            "vertical-align": [
              SAFE_STYLE_VALUE,
            ],

            "list-style-type": [
              SAFE_STYLE_VALUE,
            ],
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
