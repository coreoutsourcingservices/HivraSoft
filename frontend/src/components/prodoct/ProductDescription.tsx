type ProductDescriptionProps = {
  html?: string;
};

/* =========================================================
   STOREFRONT DESCRIPTION

   Use ONLY with HTML sanitized by backend
   sanitizeProductDescriptionHtml().
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
          html,
      }}
    />
  );
}
