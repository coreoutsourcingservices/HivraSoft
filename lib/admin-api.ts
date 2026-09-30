import { API_URL, apiFetch } from "./api";

export type AdminDashboardData = {
  generatedAt: string;
  stats: {
    products: number;
    orders: number;
    customers: number;
    revenue: number;
    categories: number;
    banners: number;
    growth: {
      products: number;
      orders: number;
      customers: number;
      revenue: number;
    };
  };
  salesOverview: Array<{
    date: string;
    label: string;
    revenue: number;
    orders: number;
  }>;
  orderStatus: {
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customer: string;
    amount: number;
    status: string;
    date: string;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    stock: number;
    imageUrl: string;
  }>;
  status: {
    backend: string;
    mongodb: string;
    productsApi: string;
    categoriesApi: string;
    ordersApi: string;
    bannersApi: string;
  };
};

export type AdminCustomer = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email?: string;
  role: "admin" | "super_admin";
};

export async function getAdminMe() {
  const result = await apiFetch<{ success: boolean; user: AdminUser }>("/api/admin/me");
  return result.user;
}

export async function getAdminDashboard() {
  const result = await apiFetch<{ success: boolean } & AdminDashboardData>("/api/admin/dashboard");
  return {
    generatedAt: result.generatedAt,
    stats: result.stats,
    salesOverview: result.salesOverview,
    orderStatus: result.orderStatus,
    recentOrders: result.recentOrders,
    lowStockProducts: result.lowStockProducts,
    status: result.status,
  };
}

export async function getAdminCustomers() {
  const result = await apiFetch<{ success: boolean; customers: AdminCustomer[] }>("/api/admin/customers");
  return Array.isArray(result.customers) ? result.customers : [];
}

export async function setAdminCustomerActive(id: string, isActive: boolean) {
  return apiFetch<{ success: boolean; customer: AdminCustomer }>(
    `/api/admin/customers/${encodeURIComponent(id)}/status`,
    { method: "PATCH", body: { isActive } }
  );
}

export type AdminOrderQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type AdminOrdersResult = {
  orders: Record<string, unknown>[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export async function getAdminOrders(query: AdminOrderQuery = {}): Promise<AdminOrdersResult> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.paymentStatus) params.set("paymentStatus", query.paymentStatus);
  if (query.paymentMethod) params.set("paymentMethod", query.paymentMethod);
  if (query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.dateTo) params.set("dateTo", query.dateTo);
  const result = await apiFetch<{
    success: boolean;
    orders: Record<string, unknown>[];
    pagination?: { page: number; limit: number; total: number; totalPages: number };
  }>(`/api/admin/orders${params.toString() ? `?${params.toString()}` : ""}`);
  const orders = Array.isArray(result.orders) ? result.orders : [];
  return {
    orders,
    pagination: result.pagination || { page: 1, limit: query.limit || 20, total: orders.length, totalPages: 1 },
  };
}

export async function getAdminOrder(id: string) {
  const result = await apiFetch<{ success: boolean; order: Record<string, unknown> }>(
    `/api/admin/orders/${encodeURIComponent(id)}`
  );
  return result.order;
}

export async function setAdminOrderStatus(id: string, status: string, message?: string) {
  return apiFetch<{ success: boolean; order: Record<string, unknown> }>(
    `/api/admin/orders/${encodeURIComponent(id)}/status`,
    { method: "PATCH", body: { status, message } }
  );
}

async function downloadFile(url: string, filename: string) {
  const response = await fetch(url, { credentials: "include", cache: "no-store" });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || "Unable to download invoice.");
  }
  const blob = await response.blob();
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

export async function downloadAdminInvoice(id: string, orderNumber = "invoice") {
  return downloadFile(
    `${API_URL}/api/admin/orders/${encodeURIComponent(id)}/invoice`,
    `${orderNumber.replace(/[^A-Za-z0-9_-]/g, "-")}.pdf`
  );
}

export async function downloadSelectedAdminInvoices(ids: string[]) {
  const params = new URLSearchParams({ ids: ids.join(",") });
  return downloadFile(`${API_URL}/api/admin/orders/invoices?${params.toString()}`, "selected-invoices.pdf");
}

export async function getAdminCoupons() {
  const result = await apiFetch<{ success: boolean; coupons: Record<string, unknown>[] }>("/api/admin/coupons");
  return Array.isArray(result.coupons) ? result.coupons : [];
}

export async function getAdminPages() {
  const result = await apiFetch<{ success: boolean; pages: Record<string, unknown>[] }>("/api/admin/pages");
  return Array.isArray(result.pages) ? result.pages : [];
}

export async function getAdminSystemStatus() {
  return apiFetch<{
    success: boolean;
    services: Record<string, string>;
    collections: Record<string, number>;
    environment: string;
  }>("/api/admin/system-status");
}

export type AdminUserSettings = {
  profile: {
    id: string;
    name: string;
    gender: "male" | "female" | "other";
    image: { url: string; publicId: string };
  };
  personalInformation: {
    name: string;
    gender: "male" | "female" | "other";
    email: string;
    mobile: string;
  };
  accountActivity: {
    coupons: number;
    reviews: number;
    notifications: number;
    wishlist: number;
  };
};

export async function getAdminUserSettings() {
  const result = await apiFetch<{ success: boolean; settings: AdminUserSettings }>(
    "/api/admin/user-settings"
  );
  return result.settings;
}

export async function updateAdminUserSettings(input: {
  name: string;
  gender: "male" | "female" | "other";
  profileImage?: File | null;
}) {
  const form = new FormData();
  form.set("name", input.name);
  form.set("gender", input.gender);
  if (input.profileImage) form.set("profileImage", input.profileImage);

  return apiFetch<{
    success: boolean;
    message: string;
    profile: AdminUserSettings["profile"];
    personalInformation: AdminUserSettings["personalInformation"];
  }>("/api/admin/user-settings", { method: "PATCH", body: form });
}


export type CommerceTrackingStatus = "IN_CART" | "IN_WISHLIST" | "REMOVED" | "PURCHASED";

export type CommerceTrackingRow = {
  id: string;
  kind: "cart" | "wishlist";
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    photo: string;
  };
  product: {
    id: string;
    name: string;
    slug: string;
    colorName: string;
    sizeName: string;
    categoryName: string;
    price: number;
    imageUrl: string;
    colorId: string;
    sizeId: string;
  };
  quantity: number;
  addedAt: string;
  updatedAt: string;
  status: CommerceTrackingStatus;
  email: {
    reminder24HourSent: boolean;
    reminder48HourSent: boolean;
  };
};

export type CommerceTrackingQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type CommerceTrackingResult = {
  tracking: CommerceTrackingRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

async function getCommerceTracking(kind: "cart" | "wishlist", query: CommerceTrackingQuery = {}) {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.dateTo) params.set("dateTo", query.dateTo);

  const result = await apiFetch<{
    success: boolean;
    tracking?: CommerceTrackingRow[];
    pagination?: CommerceTrackingResult["pagination"];
  }>(`/api/admin/${kind}-tracking${params.toString() ? `?${params.toString()}` : ""}`);

  const tracking = Array.isArray(result.tracking) ? result.tracking : [];
  return {
    tracking,
    pagination: result.pagination || { page: 1, limit: query.limit || 20, total: tracking.length, totalPages: 1 },
  };
}

export function getAdminCartTracking(query: CommerceTrackingQuery = {}) {
  return getCommerceTracking("cart", query);
}

export function getAdminWishlistTracking(query: CommerceTrackingQuery = {}) {
  return getCommerceTracking("wishlist", query);
}
