/* =========================================================
   CREATE CLEAN URL SLUG
========================================================= */

export const createSlug = (
  value: string
): string => {
  const slug = value
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );

  return slug || "category";
};