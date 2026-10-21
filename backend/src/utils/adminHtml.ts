/** Preserve the admin's original source; sanitize/isolate only at display time. */
export function prepareAdminHtml(value: unknown, maxLength: number, field: string): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") throw new Error(`${field} must be an HTML string.`);
  if (value.length > maxLength) throw new Error(`${field} is too large.`);
  return value.trim() ? value : "";
}
