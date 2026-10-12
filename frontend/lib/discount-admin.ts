const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || "Request failed.");
  return data;
}

export const getDiscountProducts = () => request("/api/admin/discounts/products");
export const getAutomaticDiscount = () => request("/api/admin/discounts/automatic");
export const saveAutomaticDiscount = (payload: unknown) =>
  request("/api/admin/discounts/automatic", { method: "PUT", body: JSON.stringify(payload) });
export const getDiscountCodes = () => request("/api/admin/discounts/codes");
export const createDiscountCode = (payload: unknown) =>
  request("/api/admin/discounts/codes", { method: "POST", body: JSON.stringify(payload) });
export const updateDiscountCode = (id: string, payload: unknown) =>
  request(`/api/admin/discounts/codes/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) });
export const deleteDiscountCode = (id: string) =>
  request(`/api/admin/discounts/codes/${encodeURIComponent(id)}`, { method: "DELETE" });


export const getTaxSetting = () => request("/api/admin/tax");
export const saveTaxSetting = (payload: unknown) =>
  request("/api/admin/tax", { method: "PUT", body: JSON.stringify(payload) });
