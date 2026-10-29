import { prepareAdminHtml } from "./adminHtml";

export function prepareProductDescriptionHtml(value?: string | null): string {
  return prepareAdminHtml(value, 100_000, "Product description HTML");
}

export function prepareProductShortDescriptionHtml(value?: string | null): string {
  return prepareAdminHtml(value, 100_000, "Product short description HTML");
}
