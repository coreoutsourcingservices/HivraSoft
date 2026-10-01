export type OrderItem = {
  id: string;
  productId?: string;
  name: string;
  slug?: string;
  image?: string;
  color?: string;
  colorHex?: string;
  size?: string;
  sku?: string;
  quantity: number;
  originalUnitPrice?: number;
  unitPrice: number;
  discount?: number;
  finalUnitPrice?: number;
  subtotal: number;
  finalTotal?: number;
};

export type ShippingAddress = {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  invoiceNumber?: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  payment?: Record<string, unknown>;
  items: OrderItem[];
  subtotal: number;
  automaticDiscount?: number;
  automaticDiscountDetails?: Record<string, unknown>;
  codeDiscount?: number;
  codeDiscountDetails?: Record<string, unknown>;
  discount: number;
  discountCode?: string;
  tax?: number;
  taxName?: string;
  taxPercentage?: number;
  taxDetails?: Record<string, unknown>;
  shipping: number;
  total: number;
  shippingAddress?: ShippingAddress;
  customer?: Record<string, unknown>;
  statusHistory?: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt?: string;
  deliveredAt?: string;
  estimatedDelivery?: string;
};

export type OrdersApiResponse = {
  success?: boolean;
  count?: number;
  orders?: unknown[];
  data?: unknown;
};
