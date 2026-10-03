import type { Request, Response } from "express";

import Product from "../models/Product.model";
import Category from "../models/Category.model";
import Order from "../models/Order.model";
import User from "../models/User.model";
import Blog from "../models/Blog.model";
import Review from "../models/Review.model";
import Banner from "../models/Banner.model";
import DiscountCode from "../models/DiscountCode.model";
import DiscountSetting from "../models/DiscountSetting.model";
import DeliveryChargeRule from "../models/DeliveryChargeRule.model";
import TaxSetting from "../models/TaxSetting.model";
import Offer from "../models/Offer.model";
import OnTrendPick from "../models/OnTrendPick.model";
import AlwaysInIt from "../models/AlwaysInIt.model";
import PrimeSelection from "../models/PrimeSelection.model";
import {
  emptyTrash,
  listTrash,
  permanentlyDeleteTrashEntity,
  restoreTrashEntity,
  trashRegistry,
  type TrashEntityType,
} from "../services/admin-trash.service";

function safeRegex(value: string) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

function adminId(req: Request): string | null {
  return req.user?._id ? String(req.user._id) : null;
}

function limitValue(value: unknown) {
  const parsed = Number(value || 5);
  return Math.min(10, Math.max(1, Number.isFinite(parsed) ? parsed : 5));
}

export async function globalAdminSearch(req: Request, res: Response) {
  try {
    const q = String(req.query.q || "").trim();
    const limit = limitValue(req.query.limit);

    if (q.length < 2) {
      return res.json({
        success: true,
        query: q,
        data: {},
        groups: [],
      });
    }

    const rx = safeRegex(q);

    const [
      products,
      categories,
      orders,
      customers,
      blogs,
      reviews,
      banners,
      discountCodes,
      automaticDiscounts,
      deliveryCharges,
      taxes,
      offers,
      onTrend,
      alwaysInIt,
      primeSelection,
    ] = await Promise.all([
      Product.find({
        $or: [
          { "colors.nameProduct": rx },
          { "colors.slugProduct": rx },
          { "colors.nameColor": rx },
          { "colors.tags": rx },
        ],
      })
        .select("colors isActive updatedAt")
        .limit(limit)
        .lean(),
      Category.find({ $or: [{ name: rx }, { slug: rx }, { description: rx }] })
        .select("name slug level parent isActive")
        .limit(limit)
        .lean(),
      Order.find({
        $or: [
          { orderNumber: rx },
          { invoiceNumber: rx },
          { "customer.name": rx },
          { "customer.email": rx },
          { "customer.phone": rx },
        ],
      })
        .select("orderNumber invoiceNumber customer total status paymentStatus createdAt")
        .limit(limit)
        .lean(),
      User.find({
        role: "customer",
        $or: [{ name: rx }, { email: rx }, { phone: rx }, { username: rx }],
      })
        .select("name email phone accountStatus isActive")
        .limit(limit)
        .lean(),
      Blog.find({ $or: [{ title: rx }, { slug: rx }, { excerpt: rx }] })
        .select("title slug status updatedAt")
        .limit(limit)
        .lean(),
      Review.find({ $or: [{ title: rx }, { comment: rx }] })
        .select("title rating userId productId createdAt")
        .limit(limit)
        .lean(),
      Banner.find({ $or: [{ title: rx }, { slug: rx }, { description: rx }] })
        .select("title slug position device isActive")
        .limit(limit)
        .lean(),
      DiscountCode.find({ code: rx })
        .select("code valueType percentage fixedAmount isActive")
        .limit(limit)
        .lean(),
      DiscountSetting.find({ name: rx })
        .select("name valueType percentage fixedAmount minAmount maxAmount isActive")
        .limit(limit)
        .lean(),
      DeliveryChargeRule.find({
        $or: [
          { paymentMethod: rx },
        ],
      })
        .select("paymentMethod minAmount maxAmount charge isActive")
        .limit(limit)
        .lean(),
      TaxSetting.find({ name: rx })
        .select("name valueType percentage fixedAmount minAmount maxAmount isActive")
        .limit(limit)
        .lean(),
      Offer.find({ $or: [{ name: rx }, { slug: rx }, { offerType: rx }] })
        .select("name slug offerType isActive")
        .limit(limit)
        .lean(),
      OnTrendPick.find({ $or: [{ name: rx }, { link: rx }] })
        .select("name link order isActive")
        .limit(limit)
        .lean(),
      AlwaysInIt.find({ $or: [{ name: rx }, { gender: rx }] })
        .select("name gender isActive")
        .limit(limit)
        .lean(),
      PrimeSelection.find({ $or: [{ name: rx }, { gender: rx }] })
        .select("name gender isActive")
        .limit(limit)
        .lean(),
    ]);

    const mappedProducts = products.map((item: any) => {
      const colors = Array.isArray(item.colors) ? item.colors : [];
      const color = colors.find((entry: any) => entry?.isDefault) || colors[0] || {};
      return {
        _id: String(item._id),
        name: color.nameProduct || "Product",
        subtitle: [color.nameColor, color.slugProduct].filter(Boolean).join(" · "),
        type: "product",
        adminUrl: `/admin/products/${item._id}/edit`,
      };
    });

    const data = {
      products: mappedProducts,
      categories: categories.map((item: any) => ({
        _id: String(item._id),
        name: item.name,
        subtitle: item.level ? `Level ${item.level} · ${item.slug}` : `Main category · ${item.slug}`,
        type: "category",
        adminUrl: "/admin/categories",
      })),
      orders: orders.map((item: any) => ({
        _id: String(item._id),
        name: item.orderNumber || `Order ${item._id}`,
        subtitle: [item.customer?.name, item.customer?.email, item.status].filter(Boolean).join(" · "),
        type: "order",
        adminUrl: `/admin/orders/${item._id}`,
      })),
      customers: customers.map((item: any) => ({
        _id: String(item._id),
        name: item.name || item.email,
        subtitle: [item.email, item.phone].filter(Boolean).join(" · "),
        type: "customer",
        adminUrl: `/admin/customers/${item._id}`,
      })),
      blogs: blogs.map((item: any) => ({
        _id: String(item._id),
        name: item.title,
        subtitle: `${item.status || "DRAFT"} · ${item.slug || ""}`,
        type: "blog",
        adminUrl: `/admin/blog/${item._id}/edit`,
      })),
      reviews: reviews.map((item: any) => ({
        _id: String(item._id),
        name: item.title || `Review · ${item.rating}/5`,
        subtitle: `${item.rating}/5 rating`,
        type: "review",
        adminUrl: "/admin/reviews",
      })),
      banners: banners.map((item: any) => ({
        _id: String(item._id),
        name: item.title,
        subtitle: [item.position, item.device].filter(Boolean).join(" · "),
        type: "banner",
        adminUrl: `/admin/banners/${item._id}/edit`,
      })),
      discountCodes: discountCodes.map((item: any) => ({
        _id: String(item._id),
        name: item.code,
        subtitle: "Discount Code",
        type: "discount_code",
        adminUrl: "/admin/extra-add/discount-code",
      })),
      automaticDiscounts: automaticDiscounts.map((item: any) => ({
        _id: String(item._id),
        name: item.name || "Automatic Discount",
        subtitle: `${item.minAmount ?? 0} - ${item.maxAmount ?? "∞"}`,
        type: "automatic_discount",
        adminUrl: "/admin/extra-add/automatic-discount",
      })),
      deliveryCharges: deliveryCharges.map((item: any) => ({
        _id: String(item._id),
        name: `${String(item.paymentMethod || "delivery").toUpperCase()} Delivery Charge`,
        subtitle: `₹${item.charge ?? 0} · ${item.minAmount ?? 0}-${item.maxAmount ?? "∞"}`,
        type: "delivery_charge",
        adminUrl: "/admin/extra-add/delivery-charge",
      })),
      taxes: taxes.map((item: any) => ({
        _id: String(item._id),
        name: item.name || "Tax",
        subtitle: item.valueType === "fixed" ? `₹${item.fixedAmount || 0}` : `${item.percentage || 0}%`,
        type: "tax",
        adminUrl: "/admin/extra-add/tax",
      })),
      offers: offers.map((item: any) => ({
        _id: String(item._id),
        name: item.name,
        subtitle: item.offerType === "buy_get" ? "Buy & Get Offer" : "Fixed Price Bundle",
        type: "offer",
        adminUrl:
          item.offerType === "buy_get"
            ? "/admin/offers/buy-get"
            : "/admin/offers/fixed-price-bundle",
      })),
      homepage: [
        ...onTrend.map((item: any) => ({
          _id: String(item._id),
          name: item.name || "ON-TREND PICKS",
          subtitle: "Homepage · On-Trend Picks",
          type: "on_trend_pick",
          adminUrl: "/admin/homepage/on-trend-picks",
        })),
        ...alwaysInIt.map((item: any) => ({
          _id: String(item._id),
          name: `${item.name || "ALWAYS IN IT"} · ${item.gender}`,
          subtitle: "Homepage · Always In It",
          type: "always_in_it",
          adminUrl: "/admin/homepage/always-in-it",
        })),
        ...primeSelection.map((item: any) => ({
          _id: String(item._id),
          name: `${item.name || "PRIME SELECTION"} · ${item.gender}`,
          subtitle: "Homepage · Prime Selection",
          type: "prime_selection",
          adminUrl: "/admin/homepage/prime-selection",
        })),
      ].slice(0, limit),
    };

    const labels: Record<string, string> = {
      products: "Products",
      categories: "Categories",
      orders: "Orders",
      customers: "Customers",
      blogs: "Blogs",
      reviews: "Reviews",
      banners: "Banners",
      discountCodes: "Discount Codes",
      automaticDiscounts: "Automatic Discounts",
      deliveryCharges: "Delivery Charges",
      taxes: "Tax / GST",
      offers: "Offers",
      homepage: "Homepage",
    };

    const groups = Object.entries(data)
      .filter(([, items]) => Array.isArray(items) && items.length > 0)
      .map(([key, items]) => ({ key, label: labels[key] || key, items }));

    return res.json({ success: true, query: q, data, groups });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to search admin data.",
    });
  }
}

export async function getAdminTrash(req: Request, res: Response) {
  try {
    const result = await listTrash({
      type: String(req.query.type || "all"),
      search: String(req.query.search || ""),
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 20),
    });
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load Trash.",
    });
  }
}

function parseTrashType(value: unknown): TrashEntityType {
  const type = String(value || "") as TrashEntityType;
  if (!(type in trashRegistry)) throw new Error("Unsupported trash type.");
  return type;
}

export async function restoreAdminTrash(req: Request, res: Response) {
  try {
    const result = await restoreTrashEntity(parseTrashType(req.params.type), String(req.params.id || ""), adminId(req));
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to restore item.",
    });
  }
}

export async function permanentlyDeleteAdminTrash(req: Request, res: Response) {
  try {
    const result = await permanentlyDeleteTrashEntity(
      parseTrashType(req.params.type),
      String(req.params.id || ""),
      adminId(req)
    );
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to permanently delete item.",
    });
  }
}

export async function emptyAdminTrash(req: Request, res: Response) {
  try {
    const type = String(req.query.type || "all");
    const result = await emptyTrash(type, adminId(req));
    return res.json({
      success: result.failed === 0,
      message:
        result.failed === 0
          ? `${result.deleted} Trash item${result.deleted === 1 ? "" : "s"} permanently deleted.`
          : `${result.deleted} deleted; ${result.failed} failed.`,
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to empty Trash.",
    });
  }
}
