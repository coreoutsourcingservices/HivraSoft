import type { Request, Response } from "express";
import mongoose from "mongoose";
import { softDeleteEntity } from "../services/admin-trash.service";
import OnTrendPick, {
  type HomepageChangeAction,
  type IHomepageImage,
} from "../models/OnTrendPick.model";
import AlwaysInIt, { type HomepageGender } from "../models/AlwaysInIt.model";
import PrimeSelection, {
  type IPrimeHotspot,
  type IPrimeProductSelection,
  type PrimeSelectionAction,
} from "../models/PrimeSelection.model";
import Product from "../models/Product.model";
import Category from "../models/Category.model";

const HISTORY_LIMIT = 100;

const adminObjectId = (req: Request) =>
  req.user?._id && mongoose.Types.ObjectId.isValid(String(req.user._id))
    ? new mongoose.Types.ObjectId(String(req.user._id))
    : null;

const objectIdOrNull = (value: unknown, field: string) => {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const id = String(value).trim();
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error(`${field} is invalid.`);
  return new mongoose.Types.ObjectId(id);
};

const boolValue = (value: unknown, fallback = true) => {
  if (value === undefined) return fallback;
  if (typeof value === "string") return value.toLowerCase() !== "false" && value !== "0";
  return Boolean(value);
};

const normalizeGender = (value: unknown): HomepageGender => {
  const gender = String(value || "").trim().toLowerCase();
  if (gender !== "men" && gender !== "women") {
    throw new Error("Gender must be men or women.");
  }
  return gender;
};

const normalizeImage = (value: unknown, field = "Image"): IHomepageImage => {
  const image = (value || {}) as Record<string, unknown>;
  const url = String(image.url || "").trim();
  const publicId = String(image.publicId || "").trim();
  if (!url || !publicId) throw new Error(`${field} url and publicId are required.`);
  return { url, publicId };
};

const normalizeOrder = (value: unknown, fallback = 0) => {
  const order = value === undefined ? fallback : Number(value);
  if (!Number.isFinite(order) || order < 0) throw new Error("Order must be 0 or greater.");
  return Math.floor(order);
};

const normalizePosition = (value: unknown, field: string) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 100) {
    throw new Error(`${field} must be between 0 and 100.`);
  }
  return Math.round(number * 100) / 100;
};

async function ensureReferences(productId: mongoose.Types.ObjectId | null, categoryId: mongoose.Types.ObjectId | null) {
  if (productId && categoryId) {
    throw new Error("Select either a product or a category, not both.");
  }

  if (productId) {
    const exists = await Product.exists({ _id: productId });
    if (!exists) throw new Error("Selected product does not exist.");
  }

  if (categoryId) {
    const exists = await Category.exists({ _id: categoryId });
    if (!exists) throw new Error("Selected category does not exist.");
  }
}

async function normalizeProductIds(value: unknown) {
  const raw = Array.isArray(value) ? value : [];
  const unique = Array.from(
    new Set(raw.map((item) => String(item || "").trim()).filter(Boolean))
  );

  for (const id of unique) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error(`Invalid product ID: ${id}`);
  }

  if (unique.length === 0) return [] as mongoose.Types.ObjectId[];

  const existing = await Product.find({ _id: { $in: unique } }).select("_id").lean();
  const existingIds = new Set(existing.map((item: any) => String(item._id)));
  const missing = unique.find((id) => !existingIds.has(id));
  if (missing) throw new Error(`Product not found: ${missing}`);

  return unique.map((id) => new mongoose.Types.ObjectId(id));
}

async function normalizeProductSelections(
  value: unknown,
  fallbackProductIds: unknown[] = []
): Promise<IPrimeProductSelection[]> {
  const rawSelections = Array.isArray(value) ? value : [];
  const legacyIds = Array.isArray(fallbackProductIds) ? fallbackProductIds : [];

  const requested = rawSelections.length > 0
    ? rawSelections.map((item: any) => ({
        productId: String(item?.productId?._id || item?.productId || "").trim(),
        colorId: String(item?.colorId?._id || item?.colorId || "").trim(),
        colorSlug: String(item?.colorSlug || "").trim(),
      }))
    : legacyIds.map((item: any) => ({
        productId: String(item?._id || item || "").trim(),
        colorId: "",
        colorSlug: "",
      }));

  const uniqueByProduct = new Map<string, { productId: string; colorId: string; colorSlug: string }>();
  for (const item of requested) {
    if (!item.productId) continue;
    if (!mongoose.Types.ObjectId.isValid(item.productId)) {
      throw new Error(`Invalid product ID: ${item.productId}`);
    }
    uniqueByProduct.set(item.productId, item);
  }

  if (uniqueByProduct.size === 0) return [];

  const ids = [...uniqueByProduct.keys()];
  const products = await Product.find({ _id: { $in: ids } })
    .select("colors isActive")
    .lean();

  const productMap = new Map(products.map((product: any) => [String(product._id), product]));
  const missing = ids.find((id) => !productMap.has(id));
  if (missing) throw new Error(`Product not found: ${missing}`);

  const result: IPrimeProductSelection[] = [];

  for (const [productId, requestedSelection] of uniqueByProduct.entries()) {
    const product: any = productMap.get(productId);
    const colors = Array.isArray(product?.colors) ? product.colors : [];
    if (colors.length === 0) {
      throw new Error(`Selected product ${productId} has no colors.`);
    }

    let color = requestedSelection.colorId
      ? colors.find((item: any) => String(item?._id || "") === requestedSelection.colorId)
      : null;

    if (!color && requestedSelection.colorSlug) {
      color = colors.find(
        (item: any) => String(item?.slugColor || "") === requestedSelection.colorSlug
      );
    }

    if (!color) {
      color = colors.find((item: any) => item?.isDefault === true) || colors[0];
    }

    if (!color?._id) {
      throw new Error(`Unable to resolve a color for product ${productId}.`);
    }

    result.push({
      productId: new mongoose.Types.ObjectId(productId),
      colorId: new mongoose.Types.ObjectId(String(color._id)),
      colorName: String(color?.nameColor || "Color"),
      colorSlug: String(color?.slugColor || ""),
    });
  }

  return result;
}

async function normalizeHotspot(value: any): Promise<IPrimeHotspot> {
  const rawProductIds =
    Array.isArray(value?.productIds) && value.productIds.length > 0
      ? value.productIds
      : value?.productId
        ? [value.productId]
        : [];

  const productSelections = await normalizeProductSelections(
    value?.productSelections,
    rawProductIds
  );
  const productIds = productSelections.map((item) => item.productId);
  const categoryId = objectIdOrNull(value?.categoryId, "Category ID");

  if (productSelections.length > 0 && categoryId) {
    throw new Error("Select either products or a category for one hotspot, not both.");
  }
  if (productSelections.length === 0 && !categoryId) {
    throw new Error("Every hotspot must have at least one product or a category.");
  }
  if (categoryId) {
    const exists = await Category.exists({ _id: categoryId });
    if (!exists) throw new Error("Selected category does not exist.");
  }

  return {
    x: normalizePosition(value?.x, "Hotspot X"),
    y: normalizePosition(value?.y, "Hotspot Y"),
    productSelections,
    productIds,
    productId: null,
    categoryId,
    isActive: boolValue(value?.isActive, true),
  };
}

async function normalizeHotspots(value: unknown) {
  if (!Array.isArray(value)) return [] as IPrimeHotspot[];
  const result: IPrimeHotspot[] = [];
  for (const item of value) result.push(await normalizeHotspot(item));
  return result;
}

const trimHistory = (history: any[]) => {
  if (history.length > HISTORY_LIMIT) history.splice(0, history.length - HISTORY_LIMIT);
};

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

const orderHomepageCategories = (categories: any[]) => {
  const rows = categories.map((category: any) => ({
    _id: String(category._id),
    name: String(category.name || "Category"),
    slug: String(category.slug || ""),
    level: Number(category.level || 0),
    parent: category.parent ? String(category.parent) : null,
    sortOrder: Number(category.sortOrder || 0),
  }));

  const ids = new Set(rows.map((row) => row._id));
  const children = new Map<string | null, typeof rows>();

  for (const row of rows) {
    const parentKey = row.parent && ids.has(row.parent) ? row.parent : null;
    const bucket = children.get(parentKey) || [];
    bucket.push(row);
    children.set(parentKey, bucket);
  }

  for (const bucket of children.values()) {
    bucket.sort((a, b) =>
      a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
    );
  }

  const ordered: Array<{
    _id: string;
    name: string;
    slug: string;
    level: number;
    parent: string | null;
  }> = [];

  const walk = (parent: string | null, depth: number) => {
    for (const row of children.get(parent) || []) {
      ordered.push({
        _id: row._id,
        name: row.name,
        slug: row.slug,
        level: depth,
        parent: row.parent,
      });
      walk(row._id, depth + 1);
    }
  };

  walk(null, 0);
  return ordered;
};

export async function getHomepageAdminOptions(_req: Request, res: Response) {
  try {
    const [products, categories] = await Promise.all([
      Product.find({ isActive: true })
        .select("categories isColor colors isActive createdAt")
        .populate({ path: "categories", select: "name slug level parent isActive sortOrder" })
        .sort({ createdAt: -1 })
        .lean(),
      Category.find({ isActive: true })
        .select("name slug level parent sortOrder")
        .sort({ level: 1, sortOrder: 1, name: 1 })
        .lean(),
    ]);

    const formattedProducts = products.map((product: any) => {
      const color = defaultProductColor(product);
      const image = defaultProductImage(color);
      const sizes = Array.isArray(color?.sizes) ? color.sizes : [];
      const firstSize = sizes.find((size: any) => size?.isActive !== false) || sizes[0];
      const colorOptions = (Array.isArray(product?.colors) ? product.colors : []).map((item: any) => {
        const itemImage = defaultProductImage(item);
        const itemStock = (Array.isArray(item?.sizes) ? item.sizes : []).reduce(
          (sum: number, size: any) =>
            sum + (size?.isActive === false ? 0 : Math.max(0, Number(size?.stock || 0))),
          0
        );
        return {
          _id: String(item?._id || ""),
          name: String(item?.nameColor || "Color"),
          slug: String(item?.slugColor || ""),
          hex: String(item?.hex || "#D9D9D9"),
          isDefault: item?.isDefault === true,
          stock: itemStock,
          image: itemImage
            ? { url: String(itemImage.url || ""), publicId: String(itemImage.publicId || "") }
            : null,
        };
      });

      return {
        _id: String(product._id),
        name: String(color?.nameProduct || "Unnamed product"),
        slug: String(color?.slugProduct || ""),
        colorName: String(color?.nameColor || ""),
        originalPrice: Number(color?.originalPrice ?? firstSize?.originalPrice ?? 0),
        showPrice: Number(color?.showPrice ?? firstSize?.showPrice ?? 0),
        stock: productStock(product),
        image: image ? { url: String(image.url || ""), publicId: String(image.publicId || "") } : null,
        colors: colorOptions,
        categories: (Array.isArray(product.categories) ? product.categories : []).filter(Boolean).map((category: any) => ({
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
      categories: orderHomepageCategories(categories),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load homepage options.",
    });
  }
}

/* =========================================================
   ON TREND PICKS
========================================================= */

type OnTrendValues = {
  image: IHomepageImage;
  link: string;
  productId: mongoose.Types.ObjectId | null;
  categoryId: mongoose.Types.ObjectId | null;
  order: number;
  isActive: boolean;
};

async function onTrendValues(body: any, current?: any): Promise<OnTrendValues> {
  const image = body?.image !== undefined ? normalizeImage(body.image) : normalizeImage(current?.image);
  const link = String(body?.link ?? current?.link ?? "").trim();
  const productId = body?.productId !== undefined
    ? objectIdOrNull(body.productId, "Product ID")
    : objectIdOrNull(current?.productId, "Product ID");
  const categoryId = body?.categoryId !== undefined
    ? objectIdOrNull(body.categoryId, "Category ID")
    : objectIdOrNull(current?.categoryId, "Category ID");

  const redirectCount = [Boolean(link), Boolean(productId), Boolean(categoryId)].filter(Boolean).length;
  if (redirectCount > 1) throw new Error("Use only one redirect: link, product, or category.");
  await ensureReferences(productId, categoryId);

  return {
    image,
    link,
    productId,
    categoryId,
    order: normalizeOrder(body?.order, Number(current?.order || 0)),
    isActive: boolValue(body?.isActive, current?.isActive !== false),
  };
}

function onTrendHistory(action: HomepageChangeAction, values: OnTrendValues, req: Request) {
  return {
    action,
    image: values.image,
    link: values.link,
    productId: values.productId,
    categoryId: values.categoryId,
    order: values.order,
    isActive: values.isActive,
    changedAt: new Date(),
    changedBy: adminObjectId(req),
  };
}

async function onTrendAdminPayload() {
  const all = await OnTrendPick.find({}).sort({ order: 1, createdAt: 1 }).lean();
  const items = all.filter((item: any) => item.isDeleted !== true);
  const history = all
    .flatMap((item: any) => (Array.isArray(item.history) ? item.history : []).map((entry: any) => ({ ...entry, itemId: String(item._id), name: "ON TREND PICKS" })))
    .sort((a: any, b: any) => new Date(b.changedAt || 0).getTime() - new Date(a.changedAt || 0).getTime())
    .slice(0, 200);
  return { items, history };
}

export async function getPublicOnTrendPicks(_req: Request, res: Response) {
  try {
    const items = await OnTrendPick.find({ isDeleted: { $ne: true }, isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .select("name image link productId categoryId order isActive")
      .populate({ path: "productId", select: "categories colors isActive" })
      .populate({ path: "categoryId", select: "name slug images isActive" })
      .lean();
    return res.json({ success: true, name: "ON TREND PICKS", items });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to load on-trend picks." });
  }
}

export async function getAdminOnTrendPicks(_req: Request, res: Response) {
  try {
    return res.json({ success: true, ...(await onTrendAdminPayload()) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to load on-trend picks." });
  }
}

export async function getAdminOnTrendHistory(_req: Request, res: Response) {
  try {
    const { history } = await onTrendAdminPayload();
    return res.json({ success: true, history });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to load history." });
  }
}

export async function createAdminOnTrendPick(req: Request, res: Response) {
  try {
    const values = await onTrendValues(req.body);
    const item = await OnTrendPick.create({
      name: "ON TREND PICKS",
      ...values,
      history: [onTrendHistory("created", values, req)],
    });
    return res.status(201).json({ success: true, message: "On-trend pick created.", item, ...(await onTrendAdminPayload()) });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to create on-trend pick." });
  }
}

export async function updateAdminOnTrendPick(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid item ID." });
    const item = await OnTrendPick.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!item) return res.status(404).json({ success: false, message: "On-trend pick not found." });

    const values = await onTrendValues(req.body, item);
    const statusOnly = req.body?.isActive !== undefined && Object.keys(req.body || {}).length === 1;
    item.image = values.image;
    item.link = values.link;
    item.productId = values.productId;
    item.categoryId = values.categoryId;
    item.order = values.order;
    item.isActive = values.isActive;
    item.history.push(onTrendHistory(statusOnly ? "status_changed" : "updated", values, req) as any);
    trimHistory(item.history as any[]);
    await item.save();

    return res.json({ success: true, message: "On-trend pick updated.", item, ...(await onTrendAdminPayload()) });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to update on-trend pick." });
  }
}

export async function deleteAdminOnTrendPick(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid item ID." });
    const result = await softDeleteEntity("on_trend_pick", id, req.user?._id ? String(req.user._id) : null);
    return res.json({ success: true, message: result.message, ...(await onTrendAdminPayload()) });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to delete on-trend pick." });
  }
}

/* =========================================================
   ALWAYS IN IT
========================================================= */

type AlwaysValues = {
  gender: HomepageGender;
  mainImage: IHomepageImage;
  productIds: mongoose.Types.ObjectId[];
  isActive: boolean;
};

async function alwaysValues(body: any, current?: any): Promise<AlwaysValues> {
  const productIds = body?.productIds !== undefined
    ? await normalizeProductIds(body.productIds)
    : await normalizeProductIds((current?.productIds || []).map((id: any) => String(id)));

  if (productIds.length === 0) {
    throw new Error("At least one product is required for Always In It.");
  }

  return {
    gender: body?.gender !== undefined ? normalizeGender(body.gender) : normalizeGender(current?.gender),
    mainImage: body?.mainImage !== undefined ? normalizeImage(body.mainImage, "Main image") : normalizeImage(current?.mainImage, "Main image"),
    productIds,
    isActive: boolValue(body?.isActive, current?.isActive !== false),
  };
}

function alwaysHistory(action: HomepageChangeAction, values: AlwaysValues, req: Request) {
  return {
    action,
    gender: values.gender,
    mainImage: values.mainImage,
    productIds: values.productIds,
    isActive: values.isActive,
    changedAt: new Date(),
    changedBy: adminObjectId(req),
  };
}

async function ensureUniqueGender(model: any, gender: HomepageGender, excludeId?: string) {
  const query: any = { gender, isDeleted: { $ne: true } };
  if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) query._id = { $ne: excludeId };
  const exists = await model.exists(query);
  if (exists) throw new Error(`${gender === "men" ? "Men" : "Women"} already has a record. Edit the existing record instead.`);
}

async function alwaysAdminPayload() {
  const all = await AlwaysInIt.find({}).sort({ gender: 1, createdAt: 1 }).lean();
  const items = all.filter((item: any) => item.isDeleted !== true);
  const history = all
    .flatMap((item: any) => (Array.isArray(item.history) ? item.history : []).map((entry: any) => ({ ...entry, itemId: String(item._id), name: "ALWAYS IN IT" })))
    .sort((a: any, b: any) => new Date(b.changedAt || 0).getTime() - new Date(a.changedAt || 0).getTime())
    .slice(0, 200);
  return { items, history };
}

export async function getPublicAlwaysInIt(req: Request, res: Response) {
  try {
    const query: any = { isDeleted: { $ne: true }, isActive: true };
    if (req.query.gender !== undefined) query.gender = normalizeGender(req.query.gender);
    const items = await AlwaysInIt.find(query)
      .sort({ gender: 1 })
      .select("name gender mainImage productIds isActive")
      .populate({ path: "productIds", select: "categories colors isActive" })
      .lean();
    return res.json({ success: true, name: "ALWAYS IN IT", items });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to load Always In It." });
  }
}

export async function getAdminAlwaysInIt(_req: Request, res: Response) {
  try {
    return res.json({ success: true, ...(await alwaysAdminPayload()) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to load Always In It." });
  }
}

export async function getAdminAlwaysHistory(_req: Request, res: Response) {
  try {
    const { history } = await alwaysAdminPayload();
    return res.json({ success: true, history });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to load history." });
  }
}

export async function createAdminAlwaysInIt(req: Request, res: Response) {
  try {
    const values = await alwaysValues(req.body);
    await ensureUniqueGender(AlwaysInIt, values.gender);
    const item = await AlwaysInIt.create({
      name: "ALWAYS IN IT",
      ...values,
      history: [alwaysHistory("created", values, req)],
    });
    return res.status(201).json({ success: true, message: "Always In It record created.", item, ...(await alwaysAdminPayload()) });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to create Always In It." });
  }
}

export async function updateAdminAlwaysInIt(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid item ID." });
    const item = await AlwaysInIt.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!item) return res.status(404).json({ success: false, message: "Always In It record not found." });
    const values = await alwaysValues(req.body, item);
    await ensureUniqueGender(AlwaysInIt, values.gender, id);
    const statusOnly = req.body?.isActive !== undefined && Object.keys(req.body || {}).length === 1;
    item.gender = values.gender;
    item.mainImage = values.mainImage;
    item.productIds = values.productIds;
    item.isActive = values.isActive;
    item.history.push(alwaysHistory(statusOnly ? "status_changed" : "updated", values, req) as any);
    trimHistory(item.history as any[]);
    await item.save();
    return res.json({ success: true, message: "Always In It record updated.", item, ...(await alwaysAdminPayload()) });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to update Always In It." });
  }
}

export async function deleteAdminAlwaysInIt(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid item ID." });
    const result = await softDeleteEntity("always_in_it", id, req.user?._id ? String(req.user._id) : null);
    return res.json({ success: true, message: result.message, ...(await alwaysAdminPayload()) });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to delete Always In It." });
  }
}

/* =========================================================
   PRIME SELECTION
========================================================= */

type PrimeValues = {
  gender: HomepageGender;
  mainImage: IHomepageImage;
  hotspots: IPrimeHotspot[];
  isActive: boolean;
};

async function primeValues(body: any, current?: any): Promise<PrimeValues> {
  return {
    gender: body?.gender !== undefined ? normalizeGender(body.gender) : normalizeGender(current?.gender),
    mainImage: body?.mainImage !== undefined ? normalizeImage(body.mainImage, "Main image") : normalizeImage(current?.mainImage, "Main image"),
    hotspots: body?.hotspots !== undefined ? await normalizeHotspots(body.hotspots) : await normalizeHotspots(current?.hotspots || []),
    isActive: boolValue(body?.isActive, current?.isActive !== false),
  };
}

function primeHistory(action: PrimeSelectionAction, values: PrimeValues, req: Request) {
  return {
    action,
    gender: values.gender,
    mainImage: values.mainImage,
    hotspots: values.hotspots.map((hotspot) => ({
      x: hotspot.x,
      y: hotspot.y,
      productSelections: hotspot.productSelections,
      productIds: hotspot.productIds,
      productId: null,
      categoryId: hotspot.categoryId,
      isActive: hotspot.isActive,
    })),
    isActive: values.isActive,
    changedAt: new Date(),
    changedBy: adminObjectId(req),
  };
}

async function primeAdminPayload() {
  const all = await PrimeSelection.find({}).sort({ gender: 1, createdAt: 1 }).lean();
  const items = all.filter((item: any) => item.isDeleted !== true);
  const history = all
    .flatMap((item: any) => (Array.isArray(item.history) ? item.history : []).map((entry: any) => ({ ...entry, itemId: String(item._id), name: "PRIME SELECTION" })))
    .sort((a: any, b: any) => new Date(b.changedAt || 0).getTime() - new Date(a.changedAt || 0).getTime())
    .slice(0, 200);
  return { items, history };
}

export async function getPublicPrimeSelection(req: Request, res: Response) {
  try {
    const query: any = { isDeleted: { $ne: true }, isActive: true };
    if (req.query.gender !== undefined) query.gender = normalizeGender(req.query.gender);
    const items = await PrimeSelection.find(query)
      .sort({ gender: 1 })
      .select("name gender mainImage hotspots isActive")
      .populate({ path: "hotspots.productSelections.productId", match: { isActive: true }, select: "categories colors isActive" })
      .populate({ path: "hotspots.productIds", match: { isActive: true }, select: "categories colors isActive" })
      .populate({ path: "hotspots.productId", match: { isActive: true }, select: "categories colors isActive" })
      .populate({ path: "hotspots.categoryId", match: { isActive: true }, select: "name slug images isActive" })
      .lean();

    // Public response exposes `products` so the user frontend can open one hotspot
    // and show every product attached to that + symbol. Legacy productId is merged in.
    const publicItems = items.map((item: any) => ({
      ...item,
      hotspots: (Array.isArray(item.hotspots) ? item.hotspots : [])
        .filter((hotspot: any) => hotspot?.isActive !== false)
        .map((hotspot: any) => {
          const selections = Array.isArray(hotspot.productSelections)
            ? hotspot.productSelections.filter((selection: any) => selection?.productId)
            : [];

          let products = selections.map((selection: any) => {
            const product = selection.productId;
            const colors = Array.isArray(product?.colors) ? product.colors : [];
            const selectedColor =
              colors.find((color: any) => String(color?._id || "") === String(selection.colorId || "")) ||
              colors.find((color: any) => String(color?.slugColor || "") === String(selection.colorSlug || "")) ||
              colors.find((color: any) => color?.isDefault === true) ||
              colors[0] ||
              null;

            return {
              ...product,
              selectedColorId: selection.colorId ? String(selection.colorId) : null,
              selectedColorName: String(selection.colorName || selectedColor?.nameColor || ""),
              selectedColorSlug: String(selection.colorSlug || selectedColor?.slugColor || ""),
              selectedColor,
            };
          });

          if (products.length === 0) {
            products = Array.isArray(hotspot.productIds)
              ? hotspot.productIds.filter(Boolean)
              : [];
          }

          if (hotspot.productId) {
            const legacyId = String(hotspot.productId?._id || hotspot.productId);
            const alreadyAdded = products.some(
              (product: any) => String(product?._id || product) === legacyId
            );
            if (!alreadyAdded) products.unshift(hotspot.productId);
          }

          return { ...hotspot, products };
        })
        .filter((hotspot: any) => hotspot.categoryId || hotspot.products.length > 0),
    }));

    return res.json({ success: true, name: "PRIME SELECTION", items: publicItems });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to load Prime Selection." });
  }
}

export async function getAdminPrimeSelection(_req: Request, res: Response) {
  try {
    return res.json({ success: true, ...(await primeAdminPayload()) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to load Prime Selection." });
  }
}

export async function getAdminPrimeHistory(_req: Request, res: Response) {
  try {
    const { history } = await primeAdminPayload();
    return res.json({ success: true, history });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to load history." });
  }
}

export async function createAdminPrimeSelection(req: Request, res: Response) {
  try {
    const values = await primeValues(req.body);
    await ensureUniqueGender(PrimeSelection, values.gender);
    const item = await PrimeSelection.create({
      name: "PRIME SELECTION",
      ...values,
      history: [primeHistory("created", values, req)],
    });
    return res.status(201).json({ success: true, message: "Prime Selection created.", item, ...(await primeAdminPayload()) });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to create Prime Selection." });
  }
}

export async function updateAdminPrimeSelection(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid item ID." });
    const item = await PrimeSelection.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!item) return res.status(404).json({ success: false, message: "Prime Selection not found." });
    const beforeHotspots = await normalizeHotspots(item.hotspots || []);
    const values = await primeValues(req.body, item);
    await ensureUniqueGender(PrimeSelection, values.gender, id);
    const statusOnly = req.body?.isActive !== undefined && Object.keys(req.body || {}).length === 1;

    const hotspotFingerprint = (list: IPrimeHotspot[]) => JSON.stringify(
      list.map((hotspot) => ({
        x: hotspot.x,
        y: hotspot.y,
        productSelections: (hotspot.productSelections || [])
          .map((selection) => ({
            productId: String(selection.productId),
            colorId: selection.colorId ? String(selection.colorId) : "",
            colorSlug: selection.colorSlug || "",
          }))
          .sort((a, b) => a.productId.localeCompare(b.productId)),
        productIds: (hotspot.productIds || []).map((id) => String(id)).sort(),
        categoryId: hotspot.categoryId ? String(hotspot.categoryId) : null,
        isActive: hotspot.isActive,
      }))
    );

    let action: PrimeSelectionAction = statusOnly ? "status_changed" : "updated";
    if (!statusOnly && req.body?.hotspots !== undefined && hotspotFingerprint(beforeHotspots) !== hotspotFingerprint(values.hotspots)) {
      action = values.hotspots.length > beforeHotspots.length
        ? "hotspot_added"
        : values.hotspots.length < beforeHotspots.length
          ? "hotspot_deleted"
          : "hotspot_updated";
    }

    item.gender = values.gender;
    item.mainImage = values.mainImage;
    item.hotspots = values.hotspots as any;
    item.isActive = values.isActive;
    item.history.push(primeHistory(action, values, req) as any);
    trimHistory(item.history as any[]);
    await item.save();
    return res.json({ success: true, message: "Prime Selection updated.", item, ...(await primeAdminPayload()) });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to update Prime Selection." });
  }
}

export async function deleteAdminPrimeSelection(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid item ID." });
    const result = await softDeleteEntity("prime_selection", id, req.user?._id ? String(req.user._id) : null);
    return res.json({ success: true, message: result.message, ...(await primeAdminPayload()) });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to delete Prime Selection." });
  }
}

export async function addPrimeHotspot(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid Prime Selection ID." });
    const item = await PrimeSelection.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!item) return res.status(404).json({ success: false, message: "Prime Selection not found." });
    const hotspot = await normalizeHotspot(req.body);
    item.hotspots.push(hotspot as any);
    const values = await primeValues({}, item);
    item.history.push(primeHistory("hotspot_added", values, req) as any);
    trimHistory(item.history as any[]);
    await item.save();
    return res.status(201).json({ success: true, message: "Hotspot added.", item, ...(await primeAdminPayload()) });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to add hotspot." });
  }
}

export async function updatePrimeHotspot(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    const hotspotId = String(req.params.hotspotId || "");
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(hotspotId)) {
      return res.status(400).json({ success: false, message: "Invalid Prime Selection or hotspot ID." });
    }
    const item = await PrimeSelection.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!item) return res.status(404).json({ success: false, message: "Prime Selection not found." });
    const hotspotDoc = (item.hotspots as any).id(hotspotId);
    if (!hotspotDoc) return res.status(404).json({ success: false, message: "Hotspot not found." });
    const hotspot = await normalizeHotspot({
      x: req.body?.x ?? hotspotDoc.x,
      y: req.body?.y ?? hotspotDoc.y,
      productSelections: req.body?.productSelections !== undefined
        ? req.body.productSelections
        : Array.isArray(hotspotDoc.productSelections)
          ? hotspotDoc.productSelections
          : [],
      productIds: req.body?.productIds !== undefined
        ? req.body.productIds
        : (Array.isArray(hotspotDoc.productIds) && hotspotDoc.productIds.length > 0
            ? hotspotDoc.productIds
            : hotspotDoc.productId
              ? [hotspotDoc.productId]
              : []),
      productId: null,
      categoryId: req.body?.categoryId !== undefined ? req.body.categoryId : hotspotDoc.categoryId,
      isActive: req.body?.isActive !== undefined ? req.body.isActive : hotspotDoc.isActive,
    });
    hotspotDoc.set(hotspot);
    const values = await primeValues({}, item);
    item.history.push(primeHistory("hotspot_updated", values, req) as any);
    trimHistory(item.history as any[]);
    await item.save();
    return res.json({ success: true, message: "Hotspot updated.", item, ...(await primeAdminPayload()) });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to update hotspot." });
  }
}

export async function deletePrimeHotspot(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    const hotspotId = String(req.params.hotspotId || "");
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(hotspotId)) {
      return res.status(400).json({ success: false, message: "Invalid Prime Selection or hotspot ID." });
    }
    const item = await PrimeSelection.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!item) return res.status(404).json({ success: false, message: "Prime Selection not found." });
    const hotspotDoc = (item.hotspots as any).id(hotspotId);
    if (!hotspotDoc) return res.status(404).json({ success: false, message: "Hotspot not found." });
    hotspotDoc.deleteOne();
    const values = await primeValues({}, item);
    item.history.push(primeHistory("hotspot_deleted", values, req) as any);
    trimHistory(item.history as any[]);
    await item.save();
    return res.json({ success: true, message: "Hotspot deleted.", item, ...(await primeAdminPayload()) });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to delete hotspot." });
  }
}
