import type { Request, Response } from "express";
import mongoose from "mongoose";
import DiscountSetting, {
  type ExtraValueType,
  type PricingRuleAction,
} from "../models/DiscountSetting.model";
import DiscountCode, {
  type DiscountCodeAction,
  type DiscountCodeValueType,
} from "../models/DiscountCode.model";
import Product from "../models/Product.model";
import Category from "../models/Category.model";

const roundMoney = (value: number) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const ids = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((item) => String(item || "").trim())
        .filter((item) => mongoose.Types.ObjectId.isValid(item))
    )
  );
};

const percent = (value: unknown) => {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number) || number < 0 || number > 100) {
    throw new Error("Percentage must be between 0 and 100.");
  }
  return roundMoney(number);
};

const money = (value: unknown, field: string) => {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${field} must be 0 or greater.`);
  }
  return roundMoney(number);
};

const maxMoney = (value: unknown) => {
  if (value === undefined || value === null || value === "") return null;
  return money(value, "Maximum base price");
};

const valueType = (value: unknown): ExtraValueType =>
  String(value || "").toLowerCase() === "fixed" ? "fixed" : "percentage";

const codeValueType = (value: unknown): DiscountCodeValueType =>
  String(value || "").toLowerCase() === "fixed" ? "fixed" : "percentage";

const overlaps = (aMin: number, aMax: number | null, bMin: number, bMax: number | null) => {
  const aUpper = aMax === null ? Number.POSITIVE_INFINITY : aMax;
  const bUpper = bMax === null ? Number.POSITIVE_INFINITY : bMax;
  return aMin <= bUpper && bMin <= aUpper;
};

const adminObjectId = (req: Request) =>
  req.user?._id && mongoose.Types.ObjectId.isValid(String(req.user._id))
    ? new mongoose.Types.ObjectId(String(req.user._id))
    : null;

const productStock = (product: any) =>
  (Array.isArray(product?.colors) ? product.colors : []).reduce(
    (total: number, color: any) =>
      total +
      (Array.isArray(color?.sizes) ? color.sizes : []).reduce(
        (sum: number, size: any) => sum + Math.max(0, Number(size?.stock || 0)),
        0
      ),
    0
  );

const defaultProductColor = (product: any) => {
  const colors = Array.isArray(product?.colors) ? product.colors : [];
  return colors.find((color: any) => color?.isDefault) || colors[0] || null;
};

const defaultProductImage = (color: any) => {
  const images = Array.isArray(color?.images) ? color.images : [];
  return images.find((image: any) => image?.isDefault) || images[0] || null;
};

/* =========================================================
   PRODUCTS + CATEGORIES FOR ADMIN DISCOUNT PICKERS
========================================================= */

export async function getDiscountProducts(_req: Request, res: Response) {
  try {
    const [products, categories] = await Promise.all([
      Product.find({ isActive: true })
        .select("categories isColor colors isActive createdAt")
        .populate({
          path: "categories",
          select: "name slug level parent ancestors isActive sortOrder",
        })
        .sort({ createdAt: -1 })
        .lean(),
      Category.find({ isActive: true })
        .select("name slug level parent ancestors sortOrder")
        .sort({ level: 1, sortOrder: 1, name: 1 })
        .lean(),
    ]);

    const formattedProducts = products.map((product: any) => {
      const color = defaultProductColor(product);
      const image = defaultProductImage(color);
      const sizes = Array.isArray(color?.sizes) ? color.sizes : [];
      const firstActiveSize = sizes.find((size: any) => size?.isActive !== false) || sizes[0];

      return {
        _id: String(product._id),
        name: String(color?.nameProduct || "Unnamed product"),
        slug: String(color?.slugProduct || ""),
        colorName: String(color?.nameColor || ""),
        isColor: product?.isColor !== false,
        originalPrice: Number(color?.originalPrice ?? firstActiveSize?.originalPrice ?? 0),
        showPrice: Number(color?.showPrice ?? firstActiveSize?.showPrice ?? 0),
        stock: productStock(product),
        image: image
          ? { url: String(image.url || ""), publicId: String(image.publicId || "") }
          : null,
        categories: (Array.isArray(product?.categories) ? product.categories : [])
          .filter(Boolean)
          .map((category: any) => ({
            _id: String(category._id),
            name: String(category.name || "Category"),
            slug: String(category.slug || ""),
            level: Number(category.level || 0),
          })),
      };
    });

    return res.json({
      success: true,
      products: formattedProducts,
      categories: categories.map((category: any) => ({
        _id: String(category._id),
        name: String(category.name || "Category"),
        slug: String(category.slug || ""),
        level: Number(category.level || 0),
        parent: category.parent ? String(category.parent) : null,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load products for discounts.",
    });
  }
}

/* =========================================================
   AUTOMATIC DISCOUNT RULES
========================================================= */

type AutomaticValues = {
  name: string;
  valueType: ExtraValueType;
  percentage: number;
  fixedAmount: number;
  minAmount: number;
  maxAmount: number | null;
  isActive: boolean;
  excludedProducts: string[];
};

function automaticValues(body: any, current?: any): AutomaticValues {
  const type = body?.valueType !== undefined ? valueType(body.valueType) : valueType(current?.valueType);
  const percentage = body?.percentage !== undefined ? percent(body.percentage) : percent(current?.percentage || 0);
  const fixedAmount = body?.fixedAmount !== undefined
    ? money(body.fixedAmount, "Custom discount price")
    : money(current?.fixedAmount || 0, "Custom discount price");
  const minAmount = body?.minAmount !== undefined
    ? money(body.minAmount, "Minimum base price")
    : money(current?.minAmount || 0, "Minimum base price");
  const maxAmount = body?.maxAmount !== undefined
    ? maxMoney(body.maxAmount)
    : current?.maxAmount === null || current?.maxAmount === undefined
      ? null
      : money(current.maxAmount, "Maximum base price");
  if (maxAmount !== null && maxAmount < minAmount) {
    throw new Error("Maximum base price must be greater than or equal to minimum base price.");
  }

  const isActive = body?.isActive !== undefined ? Boolean(body.isActive) : current?.isActive !== false;
  if (isActive && type === "percentage" && percentage <= 0) {
    throw new Error("Active automatic discount percentage must be greater than 0.");
  }
  if (isActive && type === "fixed" && fixedAmount <= 0) {
    throw new Error("Active custom discount price must be greater than 0.");
  }

  const excludedProducts = body?.applyToAllProducts === true
    ? []
    : body?.excludedProducts !== undefined
      ? ids(body.excludedProducts)
      : (current?.excludedProducts || []).map((item: any) => String(item));

  return {
    name: String(body?.name ?? current?.name ?? "Automatic Discount").trim().slice(0, 100) || "Automatic Discount",
    valueType: type,
    percentage,
    fixedAmount,
    minAmount,
    maxAmount,
    isActive,
    excludedProducts,
  };
}

async function ensureNoAutomaticOverlap(values: AutomaticValues, excludeId?: string) {
  if (!values.isActive) return;
  const query: any = { isDeleted: { $ne: true }, isActive: true };
  if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) query._id = { $ne: excludeId };
  const active = await DiscountSetting.find(query).select("minAmount maxAmount").lean();
  const conflict = active.some((item: any) =>
    overlaps(
      values.minAmount,
      values.maxAmount,
      Number(item.minAmount || 0),
      item.maxAmount === null || item.maxAmount === undefined ? null : Number(item.maxAmount)
    )
  );
  if (conflict) throw new Error("An active automatic-discount rule already overlaps this price range.");
}

function automaticHistory(action: PricingRuleAction, values: AutomaticValues, req: Request) {
  return {
    action,
    name: values.name,
    valueType: values.valueType,
    percentage: values.percentage,
    fixedAmount: values.fixedAmount,
    isActive: values.isActive,
    minAmount: values.minAmount,
    maxAmount: values.maxAmount,
    excludedProductCount: values.excludedProducts.length,
    changedAt: new Date(),
    changedBy: adminObjectId(req),
  };
}

async function automaticResponse() {
  const all = await DiscountSetting.find({}).sort({ minAmount: 1, createdAt: -1 }).lean();
  const rules = all.filter((item: any) => item.isDeleted !== true);
  const history = all
    .flatMap((rule: any) =>
      (Array.isArray(rule.history) ? rule.history : []).map((entry: any) => ({
        ...entry,
        ruleId: String(rule._id),
      }))
    )
    .sort((a: any, b: any) => new Date(b.changedAt || 0).getTime() - new Date(a.changedAt || 0).getTime())
    .slice(0, 100);

  return {
    rules,
    history,
    discount: rules[0] || {
      name: "Automatic Discount",
      valueType: "percentage",
      percentage: 0,
      fixedAmount: 0,
      isActive: false,
      minAmount: 0,
      maxAmount: null,
      excludedProducts: [],
      history: [],
    },
  };
}

export async function getAutomaticDiscount(_req: Request, res: Response) {
  try {
    return res.json({ success: true, ...(await automaticResponse()) });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load automatic discount rules.",
    });
  }
}

export async function createAutomaticDiscount(req: Request, res: Response) {
  try {
    const values = automaticValues(req.body);
    await ensureNoAutomaticOverlap(values);
    const rule = await DiscountSetting.create({
      ...values,
      excludedProducts: values.excludedProducts,
      history: [automaticHistory("created", values, req)],
    });
    return res.status(201).json({
      success: true,
      message: "Automatic discount rule created.",
      rule,
      ...(await automaticResponse()),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to create automatic discount rule.",
    });
  }
}

export async function updateAutomaticDiscount(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid automatic discount rule ID." });
    }
    const rule = await DiscountSetting.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!rule) return res.status(404).json({ success: false, message: "Automatic discount rule not found." });

    const values = automaticValues(req.body, rule);
    await ensureNoAutomaticOverlap(values, id);
    const statusOnly =
      req.body?.isActive !== undefined && Object.keys(req.body || {}).length === 1;

    rule.name = values.name;
    rule.valueType = values.valueType;
    rule.percentage = values.percentage;
    rule.fixedAmount = values.fixedAmount;
    rule.minAmount = values.minAmount;
    rule.maxAmount = values.maxAmount;
    rule.isActive = values.isActive;
    rule.excludedProducts = values.excludedProducts.map((item) => new mongoose.Types.ObjectId(item));
    rule.history.push(automaticHistory(statusOnly ? "status_changed" : "updated", values, req) as any);
    if (rule.history.length > 100) rule.history.splice(0, rule.history.length - 100);
    await rule.save();

    return res.json({
      success: true,
      message: "Automatic discount rule updated.",
      rule,
      ...(await automaticResponse()),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to update automatic discount rule.",
    });
  }
}

export async function deleteAutomaticDiscount(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid automatic discount rule ID." });
    }
    const rule = await DiscountSetting.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!rule) return res.status(404).json({ success: false, message: "Automatic discount rule not found." });

    const values = automaticValues({ isActive: false }, rule);
    rule.isActive = false;
    rule.isDeleted = true;
    rule.history.push(automaticHistory("deleted", values, req) as any);
    if (rule.history.length > 100) rule.history.splice(0, rule.history.length - 100);
    await rule.save();

    return res.json({ success: true, message: "Automatic discount rule deleted.", ...(await automaticResponse()) });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to delete automatic discount rule.",
    });
  }
}

// Backward-compatible endpoint: update first rule, or create one when none exists.
export async function saveAutomaticDiscount(req: Request, res: Response) {
  try {
    const existing = await DiscountSetting.findOne({ isDeleted: { $ne: true } }).sort({ createdAt: 1 });
    if (!existing) return createAutomaticDiscount(req, res);
    req.params.id = String(existing._id);
    return updateAutomaticDiscount(req, res);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to save automatic discount.",
    });
  }
}

/* =========================================================
   DISCOUNT CODES
========================================================= */

type CodeValues = {
  code: string;
  valueType: DiscountCodeValueType;
  percentage: number;
  fixedAmount: number;
  minAmount: number;
  maxAmount: number | null;
  isActive: boolean;
  appliesToAllProducts: boolean;
  productIds: string[];
  startsAt: Date | null;
  endsAt: Date | null;
};

function codeValues(body: any, current?: any): CodeValues {
  const code = String(body?.code ?? current?.code ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) {
    throw new Error("Code must be 3-40 characters using letters, numbers, _ or -.");
  }

  const type = body?.valueType !== undefined ? codeValueType(body.valueType) : codeValueType(current?.valueType);
  const percentage = body?.percentage !== undefined ? percent(body.percentage) : percent(current?.percentage || 0);
  const fixedAmount = body?.fixedAmount !== undefined
    ? money(body.fixedAmount, "Custom discount price")
    : money(current?.fixedAmount || 0, "Custom discount price");
  const minAmount = body?.minAmount !== undefined
    ? money(body.minAmount, "Minimum base price")
    : money(current?.minAmount || 0, "Minimum base price");
  const maxAmount = body?.maxAmount !== undefined
    ? maxMoney(body.maxAmount)
    : current?.maxAmount === null || current?.maxAmount === undefined
      ? null
      : money(current.maxAmount, "Maximum base price");
  if (maxAmount !== null && maxAmount < minAmount) {
    throw new Error("Maximum base price must be greater than or equal to minimum base price.");
  }

  const isActive = body?.isActive !== undefined ? Boolean(body.isActive) : current?.isActive !== false;
  if (isActive && type === "percentage" && percentage <= 0) {
    throw new Error("Active discount percentage must be greater than 0.");
  }
  if (isActive && type === "fixed" && fixedAmount <= 0) {
    throw new Error("Active custom discount price must be greater than 0.");
  }

  const appliesToAllProducts =
    body?.appliesToAllProducts !== undefined
      ? Boolean(body.appliesToAllProducts)
      : current?.appliesToAllProducts !== false;
  const productIds = appliesToAllProducts
    ? []
    : body?.productIds !== undefined
      ? ids(body.productIds)
      : (current?.productIds || []).map((item: any) => String(item));
  if (!appliesToAllProducts && productIds.length === 0) {
    throw new Error("Select at least one product or choose all products.");
  }

  const startsAt = body?.startsAt !== undefined
    ? body.startsAt ? new Date(body.startsAt) : null
    : current?.startsAt ? new Date(current.startsAt) : null;
  const endsAt = body?.endsAt !== undefined
    ? body.endsAt ? new Date(body.endsAt) : null
    : current?.endsAt ? new Date(current.endsAt) : null;
  if (startsAt && Number.isNaN(startsAt.getTime())) throw new Error("Invalid start date.");
  if (endsAt && Number.isNaN(endsAt.getTime())) throw new Error("Invalid end date.");
  if (startsAt && endsAt && endsAt < startsAt) throw new Error("End date must be after start date.");

  return {
    code,
    valueType: type,
    percentage,
    fixedAmount,
    minAmount,
    maxAmount,
    isActive,
    appliesToAllProducts,
    productIds,
    startsAt,
    endsAt,
  };
}

function codeHistory(action: DiscountCodeAction, values: CodeValues, req: Request) {
  return {
    action,
    code: values.code,
    valueType: values.valueType,
    percentage: values.percentage,
    fixedAmount: values.fixedAmount,
    minAmount: values.minAmount,
    maxAmount: values.maxAmount,
    isActive: values.isActive,
    appliesToAllProducts: values.appliesToAllProducts,
    productCount: values.productIds.length,
    changedAt: new Date(),
    changedBy: adminObjectId(req),
  };
}

async function codesResponse() {
  const all = await DiscountCode.find({}).sort({ createdAt: -1 }).lean();
  const codes = all.filter((item: any) => item.isDeleted !== true);
  const history = all
    .flatMap((item: any) =>
      (Array.isArray(item.history) ? item.history : []).map((entry: any) => ({
        ...entry,
        codeId: String(item._id),
      }))
    )
    .sort((a: any, b: any) => new Date(b.changedAt || 0).getTime() - new Date(a.changedAt || 0).getTime())
    .slice(0, 100);
  return { codes, history };
}

export async function listDiscountCodes(_req: Request, res: Response) {
  try {
    return res.json({ success: true, ...(await codesResponse()) });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load discount codes.",
    });
  }
}

export async function createDiscountCode(req: Request, res: Response) {
  try {
    const values = codeValues(req.body);
    const existing = await DiscountCode.findOne({ code: values.code });
    if (existing && existing.isDeleted !== true) {
      return res.status(409).json({ success: false, message: "This discount code already exists." });
    }

    let created;
    if (existing) {
      existing.valueType = values.valueType;
      existing.percentage = values.percentage;
      existing.fixedAmount = values.fixedAmount;
      existing.minAmount = values.minAmount;
      existing.maxAmount = values.maxAmount;
      existing.isActive = values.isActive;
      existing.isDeleted = false;
      existing.appliesToAllProducts = values.appliesToAllProducts;
      existing.productIds = values.productIds.map((item) => new mongoose.Types.ObjectId(item));
      existing.startsAt = values.startsAt;
      existing.endsAt = values.endsAt;
      existing.history.push(codeHistory("created", values, req) as any);
      if (existing.history.length > 100) existing.history.splice(0, existing.history.length - 100);
      created = await existing.save();
    } else {
      created = await DiscountCode.create({
        ...values,
        productIds: values.productIds,
        history: [codeHistory("created", values, req)],
      });
    }

    return res.status(201).json({
      success: true,
      message: "Discount code created.",
      code: created,
      ...(await codesResponse()),
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: "This discount code already exists." });
    }
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to create discount code.",
    });
  }
}

export async function updateDiscountCode(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid discount code ID." });
    }

    const item = await DiscountCode.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!item) return res.status(404).json({ success: false, message: "Discount code not found." });

    const values = codeValues(req.body, item);
    if (values.code !== item.code) {
      const duplicate = await DiscountCode.findOne({ code: values.code, _id: { $ne: id }, isDeleted: { $ne: true } })
        .select("_id")
        .lean();
      if (duplicate) return res.status(409).json({ success: false, message: "This discount code already exists." });
    }

    const statusOnly = req.body?.isActive !== undefined && Object.keys(req.body || {}).length === 1;
    item.code = values.code;
    item.valueType = values.valueType;
    item.percentage = values.percentage;
    item.fixedAmount = values.fixedAmount;
    item.minAmount = values.minAmount;
    item.maxAmount = values.maxAmount;
    item.isActive = values.isActive;
    item.appliesToAllProducts = values.appliesToAllProducts;
    item.productIds = values.productIds.map((productId) => new mongoose.Types.ObjectId(productId));
    item.startsAt = values.startsAt;
    item.endsAt = values.endsAt;
    item.history.push(codeHistory(statusOnly ? "status_changed" : "updated", values, req) as any);
    if (item.history.length > 100) item.history.splice(0, item.history.length - 100);
    await item.save();

    return res.json({
      success: true,
      message: "Discount code updated.",
      code: item,
      ...(await codesResponse()),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to update discount code.",
    });
  }
}

export async function deleteDiscountCode(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid discount code ID." });
    }

    const item = await DiscountCode.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!item) return res.status(404).json({ success: false, message: "Discount code not found." });

    const values = codeValues({ isActive: false }, item);
    item.isActive = false;
    item.isDeleted = true;
    item.history.push(codeHistory("deleted", values, req) as any);
    if (item.history.length > 100) item.history.splice(0, item.history.length - 100);
    await item.save();

    return res.json({ success: true, message: "Discount code deleted.", ...(await codesResponse()) });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to delete discount code.",
    });
  }
}
