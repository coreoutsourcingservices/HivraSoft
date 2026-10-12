"use client";

import {
  useMemo,
  useRef,
  type ChangeEvent,
} from "react";

type HtmlDescriptionEditorProps = {
  value: string;

  onChange: (
    value: string
  ) => void;

  disabled?: boolean;
};

/* =========================================================
   HTML SNIPPETS

   %TEXT% = currently selected textarea text.
   If nothing is selected, defaultText is used.
========================================================= */

const snippets = [
  {
    label:
      "Heading",

    template:
      '<h2 style="font-size:24px;font-weight:700;line-height:1.3;margin:0 0 14px;color:#211A18;">%TEXT%</h2>',

    defaultText:
      "Product Heading",
  },

  {
    label:
      "Paragraph",

    template:
      '<p style="font-size:15px;line-height:1.7;margin:0 0 16px;color:#4B4542;">%TEXT%</p>',

    defaultText:
      "Write product details here.",
  },

  {
    label:
      "Bold",

    template:
      "<strong>%TEXT%</strong>",

    defaultText:
      "Important text",
  },

  {
    label:
      "Color",

    template:
      '<span style="color:#8C1839;font-weight:600;">%TEXT%</span>',

    defaultText:
      "Highlighted text",
  },

  {
    label:
      "Box",

    template:
      '<div style="padding:18px;background-color:#FAF8F6;border:1px solid #E8E0DB;border-radius:12px;margin:16px 0;">%TEXT%</div>',

    defaultText:
      "Special product information",
  },

  {
    label:
      "List",

    template:
      '<ul style="margin:12px 0;padding-left:22px;line-height:1.8;"><li>%TEXT%</li><li>Second point</li><li>Third point</li></ul>',

    defaultText:
      "First point",
  },

  {
    label:
      "Link",

    template:
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer" style="color:#8C1839;text-decoration:underline;">%TEXT%</a>',

    defaultText:
      "Read more",
  },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function HtmlDescriptionEditor({
  value,
  onChange,
  disabled = false,
}: HtmlDescriptionEditorProps) {
  const textareaRef =
    useRef<HTMLTextAreaElement | null>(
      null
    );

  /* =========================================================
     INSERT SNIPPET AT CURSOR / SELECTION
  ========================================================= */

  const insertSnippet =
    (
      template: string,
      defaultText: string
    ) => {
      const textarea =
        textareaRef.current;

      if (
        !textarea ||
        disabled
      ) {
        return;
      }

      const start =
        textarea.selectionStart ??
        value.length;

      const end =
        textarea.selectionEnd ??
        value.length;

      const selected =
        value.slice(
          start,
          end
        );

      const text =
        selected ||
        defaultText;

      const html =
        template.replace(
          "%TEXT%",
          text
        );

      const nextValue =
        `${value.slice(0, start)}${html}${value.slice(end)}`;

      onChange(
        nextValue
      );

      window.requestAnimationFrame(
        () => {
          textarea.focus();

          const cursor =
            start +
            html.length;

          textarea.setSelectionRange(
            cursor,
            cursor
          );
        }
      );
    };

  /* =========================================================
     SAFE ADMIN PREVIEW

     sandbox WITHOUT allow-scripts means scripts cannot execute.
     CSP allows inline CSS, but blocks JS and external frames.
  ========================================================= */

  const previewDocument =
    useMemo(
      () => `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; font-src 'none'; media-src 'none'; frame-src 'none'; script-src 'none'; connect-src 'none';"
    />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: white;
        color: #211A18;
        font-family: Arial, Helvetica, sans-serif;
      }

      body {
        padding: 20px;
      }

      img {
        max-width: 100%;
        height: auto;
      }

      table {
        max-width: 100%;
        border-collapse: collapse;
      }
    </style>
  </head>

  <body>
    ${value || '<p style="color:#999;font-size:14px;">HTML preview will appear here.</p>'}
  </body>
</html>
      `,
      [
        value,
      ]
    );

  /* =========================================================
     CHANGE
  ========================================================= */

  const handleChange =
    (
      event:
        ChangeEvent<HTMLTextAreaElement>
    ) => {
      onChange(
        event.target.value
      );
    };

  return (
    <div
      className="
        overflow-hidden
        rounded-[14px]
        border
        border-[#211A18]/12
        bg-[#FAF8F6]
      "
    >
      {/* TOOLBAR */}

      <div
        className="
          flex
          flex-wrap
          gap-2
          border-b
          border-[#211A18]/10
          bg-white
          p-3
        "
      >
        {snippets.map(
          (
            snippet
          ) => (
            <button
              key={
                snippet.label
              }
              type="button"
              disabled={
                disabled
              }
              onClick={() =>
                insertSnippet(
                  snippet.template,
                  snippet.defaultText
                )
              }
              className="
                rounded-[8px]
                border
                border-[#211A18]/10
                bg-[#FAF8F6]
                px-3
                py-2
                text-[8px]
                font-semibold
                uppercase
                tracking-[0.08em]
                text-[#211A18]
                transition
                hover:border-[#8C1839]/30
                hover:bg-[#FFF6F8]
                hover:text-[#8C1839]
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              {
                snippet.label
              }
            </button>
          )
        )}
      </div>

      {/* HELP */}

      <div
        className="
          border-b
          border-[#211A18]/10
          bg-[#FFFDFC]
          px-4
          py-3
        "
      >
        <p
          className="
            text-[9px]
            leading-5
            text-[#211A18]/55
          "
        >
          HTML tags aur inline CSS likh sakte ho.
          Example:
          {" "}
          <code
            className="
              rounded
              bg-[#211A18]/5
              px-1.5
              py-1
              text-[#8C1839]
            "
          >
            {'<p style="color:#8C1839;font-size:16px;">Text</p>'}
          </code>
        </p>
      </div>

      {/* HTML SOURCE */}

      <div
        className="
          grid
          grid-cols-1
          xl:grid-cols-2
        "
      >
        <div
          className="
            border-b
            border-[#211A18]/10
            xl:border-b-0
            xl:border-r
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-[#211A18]/8
              bg-white
              px-4
              py-3
            "
          >
            <p
              className="
                text-[8px]
                font-semibold
                uppercase
                tracking-[0.13em]
                text-[#211A18]/45
              "
            >
              HTML Source
            </p>

            <p
              className="
                text-[8px]
                text-[#211A18]/30
              "
            >
              {
                value.length
              } chars
            </p>
          </div>

          <textarea
            ref={
              textareaRef
            }
            value={
              value
            }
            disabled={
              disabled
            }
            onChange={
              handleChange
            }
            spellCheck={
              false
            }
            rows={
              18
            }
            placeholder={`<h2 style="font-size:24px;color:#211A18;">Product Details</h2>

<p style="font-size:15px;line-height:1.7;color:#4B4542;">
  Premium quality product description...
</p>

<ul style="padding-left:22px;line-height:1.8;">
  <li>Feature one</li>
  <li>Feature two</li>
</ul>`}
            className="
              min-h-[390px]
              w-full
              resize-y
              bg-[#171312]
              p-4
              font-mono
              text-[11px]
              leading-6
              text-[#F7F0EA]
              outline-none
              placeholder:text-white/20
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          />
        </div>

        {/* PREVIEW */}

        <div
          className="
            bg-white
          "
        >
          <div
            className="
              border-b
              border-[#211A18]/8
              bg-white
              px-4
              py-3
            "
          >
            <p
              className="
                text-[8px]
                font-semibold
                uppercase
                tracking-[0.13em]
                text-[#211A18]/45
              "
            >
              Preview
            </p>
          </div>

          <iframe
            title="Product description preview"
            sandbox=""
            srcDoc={
              previewDocument
            }
            className="
              min-h-[390px]
              w-full
              bg-white
            "
          />
        </div>
      </div>
    </div>
  );
}
