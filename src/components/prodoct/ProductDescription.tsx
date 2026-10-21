import DOMPurify from "isomorphic-dompurify";

type ProductDescriptionProps = {
  html?: string;
};

/* =========================================================
   STOREFRONT DESCRIPTION

   Filter a display copy; the database keeps the admin's original HTML.
========================================================= */

export default function ProductDescription({
  html = "",
}: ProductDescriptionProps) {
  if (
    !html
  ) {
    return null;
  }

  return (
    <div
      className="
        product-description
        text-[#211A18]
      "
      dangerouslySetInnerHTML={{
        __html:
          DOMPurify.sanitize(html),
      }}
    />
  );
}
