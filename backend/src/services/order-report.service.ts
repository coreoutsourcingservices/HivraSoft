import Order from "../models/Order.model";

export type ReportPeriod = "1_month" | "3_months" | "6_months" | "1_year" | "all";

export type ReportRange = {
  period: ReportPeriod;
  start: Date | null;
  end: Date;
  previousStart: Date | null;
  previousEnd: Date | null;
  label: string;
};

export type NormalizedOrderRow = {
  orderId: string;
  orderNumber: string;
  invoiceNumber: string;
  orderStatus: string;
  orderDate: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNote: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingStateCode: string;
  billingPostcode: string;
  billingCountry: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingStateCode: string;
  shippingPostcode: string;
  shippingCountry: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  shipping: number;
  refund: number;
  tax: number;
  total: number;
  couponCode: string;
  sku: string;
  itemNumber: string;
  itemName: string;
  quantity: number;
  itemCost: number;
  itemDiscount: number;
};

export type OrderReport = {
  range: ReportRange;
  summary: {
    totalSales: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    failedOrders: number;
    processingOrders: number;
    grossSales: number;
    discounts: number;
    refunds: number;
    netSales: number;
    shipping: number;
    taxes: number;
    cancelledValue: number;
    change: {
      totalSales: number | null;
      totalOrders: number | null;
      completedOrders: number | null;
      cancelledOrders: number | null;
    };
  };
  salesSeries: Array<{ key: string; label: string; value: number; previous?: number }>;
  orderSeries: Array<{ key: string; label: string; value: number }>;
  statusStats: Array<{ status: string; label: string; count: number; percentage: number }>;
  stateSummary: Array<{
    stateCode: string;
    state: string;
    orders: number;
    quantity: number;
    subtotal: number;
    discount: number;
    total: number;
    tax: number;
    percentage: number;
  }>;
  rows: NormalizedOrderRow[];
};

const COMPLETED = new Set(["completed", "delivered"]);
const CANCELLED = new Set(["cancelled", "canceled", "returned", "refunded"]);
const FAILED = new Set(["failed"]);

const INDIA_STATE_CODES: Record<string, string> = {
  "andaman and nicobar islands": "AN",
  "andhra pradesh": "AP",
  "arunachal pradesh": "AR",
  assam: "AS",
  bihar: "BR",
  chandigarh: "CH",
  chhattisgarh: "CG",
  "dadra and nagar haveli and daman and diu": "DH",
  delhi: "DL",
  goa: "GA",
  gujarat: "GJ",
  haryana: "HR",
  "himachal pradesh": "HP",
  "jammu and kashmir": "JK",
  jharkhand: "JH",
  karnataka: "KA",
  kerala: "KL",
  ladakh: "LA",
  lakshadweep: "LD",
  "madhya pradesh": "MP",
  maharashtra: "MH",
  manipur: "MN",
  meghalaya: "ML",
  mizoram: "MZ",
  nagaland: "NL",
  odisha: "OD",
  puducherry: "PY",
  punjab: "PB",
  rajasthan: "RJ",
  sikkim: "SK",
  "tamil nadu": "TN",
  telangana: "TS",
  tripura: "TR",
  "uttar pradesh": "UP",
  uttarakhand: "UK",
  "west bengal": "WB",
};

function money(value: unknown) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? Math.round((n + Number.EPSILON) * 100) / 100 : 0;
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function stateCode(value: unknown) {
  const state = clean(value);
  if (!state) return "";
  const direct = state.match(/^[A-Za-z]{2}$/)?.[0];
  if (direct) return direct.toUpperCase();
  return INDIA_STATE_CODES[state.toLowerCase()] || "";
}

export function normalizeReportPeriod(value: unknown): ReportPeriod {
  const raw = clean(value).toLowerCase().replace(/-/g, "_").replace(/\s+/g, "_");
  const map: Record<string, ReportPeriod> = {
    "1": "1_month",
    "1m": "1_month",
    month: "1_month",
    "1_month": "1_month",
    "1_months": "1_month",
    "3m": "3_months",
    "3_month": "3_months",
    "3_months": "3_months",
    "6m": "6_months",
    "6_month": "6_months",
    "6_months": "6_months",
    "1y": "1_year",
    year: "1_year",
    "1_year": "1_year",
    all: "all",
  };
  const period = map[raw];
  if (!period) throw new Error("Invalid report period. Use 1_month, 3_months, 6_months, 1_year or all.");
  return period;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function resolveReportRange(periodInput: unknown, now = new Date(), dateFrom?: string, dateTo?: string): ReportRange {
  if (dateFrom || dateTo) {
    if (!dateFrom || !dateTo || !/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) || !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) throw new Error("Both custom dates must be valid YYYY-MM-DD dates.");
    const start = startOfDay(new Date(`${dateFrom}T00:00:00`));
    const end = endOfDay(new Date(`${dateTo}T00:00:00`));
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end || start.getFullYear() !== Number(dateFrom.slice(0,4)) || end.getFullYear() !== Number(dateTo.slice(0,4))) throw new Error("Invalid custom report date range.");
    const duration = end.getTime() - start.getTime() + 1;
    const previousEnd = new Date(start.getTime() - 1);
    return { period: "all", start, end, previousStart: new Date(previousEnd.getTime() - duration + 1), previousEnd, label: `${dateFrom} to ${dateTo}` };
  }
  const period = normalizeReportPeriod(periodInput || "1_month");
  const end = endOfDay(now);
  if (period === "all") {
    return { period, start: null, end, previousStart: null, previousEnd: null, label: "All" };
  }

  const months = period === "1_month" ? 1 : period === "3_months" ? 3 : period === "6_months" ? 6 : 12;
  const start = startOfDay(new Date(now));
  start.setMonth(start.getMonth() - months);
  const duration = end.getTime() - start.getTime() + 1;
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration + 1);
  const labels: Record<Exclude<ReportPeriod, "all">, string> = {
    "1_month": "1 Month",
    "3_months": "3 Months",
    "6_months": "6 Months",
    "1_year": "1 Year",
  };
  return { period, start, end, previousStart, previousEnd, label: labels[period] };
}

function rangeFilter(range: ReportRange, previous = false) {
  const start = previous ? range.previousStart : range.start;
  const end = previous ? range.previousEnd : range.end;
  if (!start || !end) return {};
  return { createdAt: { $gte: start, $lte: end } };
}

function shipping(order: any) {
  return order?.shippingAddress && typeof order.shippingAddress === "object" ? order.shippingAddress : {};
}

function customer(order: any) {
  return order?.customer && typeof order.customer === "object" ? order.customer : {};
}

function payment(order: any) {
  return order?.payment && typeof order.payment === "object" ? order.payment : {};
}

function orderState(order: any) {
  const address = shipping(order);
  return clean(address.state || (order?.customer as any)?.state || "Unknown") || "Unknown";
}

function orderStateCode(order: any) {
  const address = shipping(order);
  return clean(address.stateCode) || stateCode(address.state);
}

function isCancelled(order: any) {
  return CANCELLED.has(clean(order?.status).toLowerCase());
}

function isRefund(order: any) {
  return clean(order?.status).toLowerCase() === "refunded" || clean(order?.paymentStatus).toLowerCase() === "refunded";
}

function isFailed(order: any) {
  return FAILED.has(clean(order?.status).toLowerCase()) || clean(order?.paymentStatus).toLowerCase() === "failed";
}

function isCompleted(order: any) {
  return COMPLETED.has(clean(order?.status).toLowerCase());
}

function isValidSale(order: any) {
  return !isCancelled(order) && !isFailed(order);
}

function percentageChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round((((current - previous) / Math.abs(previous)) * 100 + Number.EPSILON) * 100) / 100;
}

function summaryOf(orders: any[]) {
  const totalOrders = orders.length;
  const completedOrders = orders.filter(isCompleted).length;
  const cancelledOrders = orders.filter(isCancelled).length;
  const failedOrders = orders.filter(isFailed).length;
  const processingOrders = Math.max(0, totalOrders - completedOrders - cancelledOrders - failedOrders);
  const valid = orders.filter(isValidSale);
  const grossSales = money(valid.reduce((sum, order) => sum + money(order.subtotal), 0));
  const discounts = money(valid.reduce((sum, order) => sum + money(order.discount), 0));
  const refunds = money(orders.filter(isRefund).reduce((sum, order) => sum + money(order.total), 0));
  const shippingAmount = money(valid.reduce((sum, order) => sum + money(order.shipping), 0));
  const taxes = money(valid.reduce((sum, order) => sum + money(order.tax), 0));
  const cancelledValue = money(orders.filter((order) => isCancelled(order) && !isRefund(order)).reduce((sum, order) => sum + money(order.total), 0));
  const netSales = money(Math.max(0, grossSales - discounts - refunds));
  const totalSales = money(valid.reduce((sum, order) => sum + money(order.total), 0));
  return {
    totalSales,
    totalOrders,
    completedOrders,
    cancelledOrders,
    failedOrders,
    processingOrders,
    grossSales,
    discounts,
    refunds,
    netSales,
    shipping: shippingAmount,
    taxes,
    cancelledValue,
  };
}

function daysBetween(start: Date | null, end: Date) {
  if (!start) return 3650;
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
}

function bucketType(range: ReportRange) {
  const days = daysBetween(range.start, range.end);
  if (days <= 45) return "day" as const;
  if (days <= 220) return "week" as const;
  return "month" as const;
}

function bucketDate(date: Date, type: "day" | "week" | "month") {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  if (type === "month") {
    d.setDate(1);
    return d;
  }
  if (type === "week") {
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
  }
  return d;
}

function bucketKey(date: Date, type: "day" | "week" | "month") {
  const d = bucketDate(date, type);
  return type === "month"
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function bucketLabel(key: string, type: "day" | "week" | "month") {
  const d = new Date(type === "month" ? `${key}-01T00:00:00` : `${key}T00:00:00`);
  if (type === "month") return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  if (type === "week") return `Wk ${d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function buildSeries(currentOrders: any[], previousOrders: any[], range: ReportRange) {
  const type = bucketType(range);
  const sales = new Map<string, number>();
  const counts = new Map<string, number>();
  const previousSales = new Map<string, number>();

  for (const order of currentOrders) {
    const key = bucketKey(new Date(order.createdAt), type);
    counts.set(key, (counts.get(key) || 0) + 1);
    if (isValidSale(order)) sales.set(key, money((sales.get(key) || 0) + money(order.total)));
  }
  for (const order of previousOrders) {
    if (!isValidSale(order)) continue;
    const key = bucketKey(new Date(order.createdAt), type);
    previousSales.set(key, money((previousSales.get(key) || 0) + money(order.total)));
  }

  const currentKeys = Array.from(new Set([...sales.keys(), ...counts.keys()])).sort();
  const previousValues = Array.from(previousSales.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value);
  const salesSeries = currentKeys.map((key, index) => ({
    key,
    label: bucketLabel(key, type),
    value: money(sales.get(key) || 0),
    ...(previousValues[index] !== undefined ? { previous: previousValues[index] } : {}),
  }));
  const orderSeries = currentKeys.map((key) => ({ key, label: bucketLabel(key, type), value: counts.get(key) || 0 }));
  return { salesSeries, orderSeries };
}

function statusStatistics(orders: any[]) {
  const groups = [
    { status: "pending", label: "Pending", count: orders.filter((o) => !isCompleted(o) && !isCancelled(o) && !isFailed(o)).length },
    { status: "completed", label: "Completed", count: orders.filter(isCompleted).length },
    { status: "cancelled", label: "Cancelled", count: orders.filter(isCancelled).length },
    { status: "failed", label: "Failed", count: orders.filter(isFailed).length },
  ];
  const total = orders.length || 1;
  return groups.map((group) => ({ ...group, percentage: Math.round((group.count / total) * 10_000) / 100 }));
}

function stateStatistics(orders: any[]) {
  const map = new Map<string, { stateCode: string; state: string; orderIds: Set<string>; quantity: number; subtotal: number; discount: number; total: number; tax: number }>();
  const valid = orders.filter(isValidSale);
  for (const order of valid) {
    const state = titleCase(orderState(order));
    const key = state.toLowerCase();
    const row = map.get(key) || { stateCode: orderStateCode(order), state, orderIds: new Set<string>(), quantity: 0, subtotal: 0, discount: 0, total: 0, tax: 0 };
    const orderId = clean(order._id);
    row.orderIds.add(orderId);
    row.quantity += (Array.isArray(order.items) ? order.items : []).reduce((sum: number, item: any) => sum + Math.max(0, Number(item?.quantity || 0)), 0);
    row.subtotal = money(row.subtotal + money(order.subtotal));
    row.discount = money(row.discount + money(order.discount));
    row.total = money(row.total + money(order.total));
    row.tax = money(row.tax + money(order.tax));
    if (!row.stateCode) row.stateCode = orderStateCode(order);
    map.set(key, row);
  }
  const totalOrders = valid.length || 1;
  return [...map.values()]
    .map((row) => ({
      stateCode: row.stateCode,
      state: row.state,
      orders: row.orderIds.size,
      quantity: row.quantity,
      subtotal: row.subtotal,
      discount: row.discount,
      total: row.total,
      tax: row.tax,
      percentage: Math.round((row.orderIds.size / totalOrders) * 10_000) / 100,
    }))
    .sort((a, b) => b.orders - a.orders || b.total - a.total || a.state.localeCompare(b.state));
}

function addressText(address: any) {
  if (!address || typeof address !== "object") return "";
  return [address.homeNumber, address.officeNumber, address.addressLine1, address.addressLine2, address.landmark, address.district]
    .map(clean)
    .filter(Boolean)
    .join(", ");
}

function normalizeRows(orders: any[]): NormalizedOrderRow[] {
  const rows: NormalizedOrderRow[] = [];
  for (const order of orders) {
    const c = customer(order);
    const a = shipping(order);
    const p = payment(order);
    const items = Array.isArray(order.items) && order.items.length ? order.items : [{}];
    items.forEach((item: any, index: number) => {
      const qty = Math.max(0, Number(item?.quantity || 0));
      const itemCost = money(item?.finalUnitPrice ?? item?.unitPrice ?? item?.price ?? 0);
      rows.push({
        orderId: clean(order._id),
        orderNumber: clean(order.orderNumber || order._id),
        invoiceNumber: clean(order.invoiceNumber),
        orderStatus: clean(order.status),
        orderDate: new Date(order.createdAt),
        customerName: clean(c.name || a.fullName),
        customerEmail: clean(c.email),
        customerPhone: clean(c.phone || a.phone),
        customerNote: clean(c.note || order.customerNote),
        billingAddress: addressText(a),
        billingCity: clean(a.city),
        billingState: clean(a.state),
        billingStateCode: clean(a.stateCode) || stateCode(a.state),
        billingPostcode: clean(a.postalCode || a.pincode),
        billingCountry: clean(a.country || "India"),
        shippingAddress: addressText(a),
        shippingCity: clean(a.city),
        shippingState: clean(a.state),
        shippingStateCode: clean(a.stateCode) || stateCode(a.state),
        shippingPostcode: clean(a.postalCode || a.pincode),
        shippingCountry: clean(a.country || "India"),
        paymentMethod: clean(order.paymentMethod || p.gateway),
        paymentStatus: clean(order.paymentStatus),
        subtotal: index === 0 ? money(order.subtotal) : 0,
        discount: index === 0 ? money(order.discount) : 0,
        shipping: index === 0 ? money(order.shipping) : 0,
        refund: index === 0 && isRefund(order) ? money(order.total) : 0,
        tax: index === 0 ? money(order.tax) : 0,
        total: index === 0 ? money(order.total) : 0,
        couponCode: clean(order.discountCode),
        sku: clean(item?.sku),
        itemNumber: clean(item?.productId || item?.product || item?._id),
        itemName: clean(item?.name || item?.productName || "Product"),
        quantity: qty,
        itemCost,
        itemDiscount: money(item?.discount || 0),
      });
    });
  }
  return rows;
}

const REPORT_PROJECTION = {
  orderNumber: 1,
  invoiceNumber: 1,
  customer: 1,
  items: 1,
  subtotal: 1,
  discount: 1,
  tax: 1,
  shipping: 1,
  total: 1,
  status: 1,
  paymentStatus: 1,
  paymentMethod: 1,
  payment: 1,
  shippingAddress: 1,
  discountCode: 1,
  createdAt: 1,
};

async function loadOrders(range: ReportRange, previous = false) {
  if (previous && !range.previousStart) return [];
  return Order.find(rangeFilter(range, previous))
    .select(REPORT_PROJECTION)
    .sort({ createdAt: 1 })
    .lean();
}

export async function buildOrderReport(periodInput: unknown, includeRows = false, dateFrom?: string, dateTo?: string): Promise<OrderReport> {
  const range = resolveReportRange(periodInput || "1_month", new Date(), dateFrom, dateTo);
  const [orders, previousOrders] = await Promise.all([loadOrders(range), loadOrders(range, true)]);
  const currentSummary = summaryOf(orders as any[]);
  const previousSummary = summaryOf(previousOrders as any[]);
  const series = buildSeries(orders as any[], previousOrders as any[], range);

  return {
    range,
    summary: {
      ...currentSummary,
      change: {
        totalSales: range.previousStart ? percentageChange(currentSummary.totalSales, previousSummary.totalSales) : null,
        totalOrders: range.previousStart ? percentageChange(currentSummary.totalOrders, previousSummary.totalOrders) : null,
        completedOrders: range.previousStart ? percentageChange(currentSummary.completedOrders, previousSummary.completedOrders) : null,
        cancelledOrders: range.previousStart ? percentageChange(currentSummary.cancelledOrders, previousSummary.cancelledOrders) : null,
      },
    },
    ...series,
    statusStats: statusStatistics(orders as any[]),
    stateSummary: stateStatistics(orders as any[]),
    rows: includeRows ? normalizeRows(orders as any[]) : [],
  };
}
