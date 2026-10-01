import type { Request, Response } from "express";
import mongoose from "mongoose";
import TaxSetting, { type TaxRuleAction, type TaxValueType } from "../models/TaxSetting.model";
import Product from "../models/Product.model";
import { normalizeExcludedProductIds } from "../services/tax.service";

const roundMoney = (value: number) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

function normalizePercentage(value: unknown) {
  const percentage = Number(value ?? 0);
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new Error("Tax percentage must be between 0 and 100.");
  }
  return roundMoney(percentage);
}

function normalizeMoney(value: unknown, field: string) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`${field} must be 0 or greater.`);
  }
  return roundMoney(amount);
}

function normalizeMax(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  return normalizeMoney(value, "Maximum base price");
}

function normalizeType(value: unknown): TaxValueType {
  return String(value || "").toLowerCase() === "fixed" ? "fixed" : "percentage";
}

function overlaps(aMin: number, aMax: number | null, bMin: number, bMax: number | null) {
  const aUpper = aMax === null ? Number.POSITIVE_INFINITY : aMax;
  const bUpper = bMax === null ? Number.POSITIVE_INFINITY : bMax;
  return aMin <= bUpper && bMin <= aUpper;
}

function adminObjectId(req: Request) {
  return req.user?._id && mongoose.Types.ObjectId.isValid(String(req.user._id))
    ? new mongoose.Types.ObjectId(String(req.user._id))
    : null;
}

type TaxValues = {
  name: string;
  valueType: TaxValueType;
  percentage: number;
  fixedAmount: number;
  minAmount: number;
  maxAmount: number | null;
  isActive: boolean;
  applyToAllProducts: boolean;
  excludedProducts: mongoose.Types.ObjectId[];
};

async function taxValues(body: any, current?: any): Promise<TaxValues> {
  const valueType = body?.valueType !== undefined ? normalizeType(body.valueType) : normalizeType(current?.valueType);
  const percentage = body?.percentage !== undefined
    ? normalizePercentage(body.percentage)
    : normalizePercentage(current?.percentage || 0);
  const fixedAmount = body?.fixedAmount !== undefined
    ? normalizeMoney(body.fixedAmount, "Custom tax price")
    : normalizeMoney(current?.fixedAmount || 0, "Custom tax price");
  const minAmount = body?.minAmount !== undefined
    ? normalizeMoney(body.minAmount, "Minimum base price")
    : normalizeMoney(current?.minAmount || 0, "Minimum base price");
  const maxAmount = body?.maxAmount !== undefined
    ? normalizeMax(body.maxAmount)
    : current?.maxAmount === null || current?.maxAmount === undefined
      ? null
      : normalizeMoney(current.maxAmount, "Maximum base price");

  if (maxAmount !== null && maxAmount < minAmount) {
    throw new Error("Maximum base price must be greater than or equal to minimum base price.");
  }

  const isActive = body?.isActive !== undefined ? Boolean(body.isActive) : current?.isActive !== false;
  if (isActive && valueType === "percentage" && percentage <= 0) {
    throw new Error("Active tax percentage must be greater than 0.");
  }
  if (isActive && valueType === "fixed" && fixedAmount <= 0) {
    throw new Error("Active custom tax price must be greater than 0.");
  }

  const applyToAllProducts =
    body?.applyToAllProducts !== undefined
      ? body.applyToAllProducts !== false
      : current?.applyToAllProducts !== false;

  let excludedProducts = applyToAllProducts
    ? []
    : body?.excludedProducts !== undefined
      ? normalizeExcludedProductIds(body.excludedProducts)
      : normalizeExcludedProductIds((current?.excludedProducts || []).map((item: any) => String(item)));

  if (excludedProducts.length) {
    const existing = await Product.find({ _id: { $in: excludedProducts } }).select("_id").lean();
    const allowed = new Set(existing.map((item: any) => String(item._id)));
    excludedProducts = excludedProducts.filter((id) => allowed.has(String(id)));
  }

  return {
    name: String(body?.name ?? current?.name ?? "GST").trim().slice(0, 100) || "GST",
    valueType,
    percentage,
    fixedAmount,
    minAmount,
    maxAmount,
    isActive,
    applyToAllProducts,
    excludedProducts,
  };
}

async function ensureNoActiveOverlap(values: TaxValues, excludeId?: string) {
  if (!values.isActive) return;
  const query: any = { isDeleted: { $ne: true }, isActive: true };
  if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) query._id = { $ne: excludeId };
  const active = await TaxSetting.find(query).select("minAmount maxAmount").lean();
  const conflict = active.some((item: any) =>
    overlaps(
      values.minAmount,
      values.maxAmount,
      Number(item.minAmount || 0),
      item.maxAmount === null || item.maxAmount === undefined ? null : Number(item.maxAmount)
    )
  );
  if (conflict) throw new Error("An active tax rule already overlaps this price range.");
}

function historySnapshot(action: TaxRuleAction, values: TaxValues, req: Request) {
  return {
    action,
    name: values.name,
    valueType: values.valueType,
    percentage: values.percentage,
    fixedAmount: values.fixedAmount,
    isActive: values.isActive,
    minAmount: values.minAmount,
    maxAmount: values.maxAmount,
    applyToAllProducts: values.applyToAllProducts,
    excludedProductCount: values.excludedProducts.length,
    changedAt: new Date(),
    changedBy: adminObjectId(req),
  };
}

async function taxResponse() {
  const all = await TaxSetting.find({}).sort({ minAmount: 1, createdAt: -1 }).lean();
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
    tax: rules[0] || {
      name: "GST",
      valueType: "percentage",
      percentage: 0,
      fixedAmount: 0,
      minAmount: 0,
      maxAmount: null,
      isActive: false,
      applyToAllProducts: true,
      excludedProducts: [],
      history: [],
    },
  };
}

export async function getTaxSettingAdmin(_req: Request, res: Response) {
  try {
    return res.json({ success: true, ...(await taxResponse()) });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load tax settings.",
    });
  }
}

export async function createTaxSettingAdmin(req: Request, res: Response) {
  try {
    const values = await taxValues(req.body);
    await ensureNoActiveOverlap(values);
    const rule = await TaxSetting.create({
      ...values,
      history: [historySnapshot("created", values, req)],
    });
    return res.status(201).json({
      success: true,
      message: "Tax rule created.",
      rule,
      ...(await taxResponse()),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to create tax rule.",
    });
  }
}

export async function updateTaxSettingAdmin(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid tax rule ID." });
    }

    const rule = await TaxSetting.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!rule) return res.status(404).json({ success: false, message: "Tax rule not found." });

    const values = await taxValues(req.body, rule);
    await ensureNoActiveOverlap(values, id);
    const statusOnly = req.body?.isActive !== undefined && Object.keys(req.body || {}).length === 1;

    rule.name = values.name;
    rule.valueType = values.valueType;
    rule.percentage = values.percentage;
    rule.fixedAmount = values.fixedAmount;
    rule.minAmount = values.minAmount;
    rule.maxAmount = values.maxAmount;
    rule.isActive = values.isActive;
    rule.applyToAllProducts = values.applyToAllProducts;
    rule.excludedProducts = values.excludedProducts;
    rule.history.push(historySnapshot(statusOnly ? "status_changed" : "updated", values, req) as any);
    if (rule.history.length > 100) rule.history.splice(0, rule.history.length - 100);
    await rule.save();

    return res.json({
      success: true,
      message: "Tax rule updated.",
      rule,
      ...(await taxResponse()),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to update tax rule.",
    });
  }
}

export async function deleteTaxSettingAdmin(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid tax rule ID." });
    }

    const rule = await TaxSetting.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!rule) return res.status(404).json({ success: false, message: "Tax rule not found." });

    const values = await taxValues({ isActive: false }, rule);
    rule.isActive = false;
    rule.isDeleted = true;
    rule.history.push(historySnapshot("deleted", values, req) as any);
    if (rule.history.length > 100) rule.history.splice(0, rule.history.length - 100);
    await rule.save();

    return res.json({ success: true, message: "Tax rule deleted.", ...(await taxResponse()) });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to delete tax rule.",
    });
  }
}

// Backward-compatible endpoint: update first rule, or create one when none exists.
export async function saveTaxSettingAdmin(req: Request, res: Response) {
  try {
    const existing = await TaxSetting.findOne({ isDeleted: { $ne: true } }).sort({ createdAt: 1 });
    if (!existing) return createTaxSettingAdmin(req, res);
    req.params.id = String(existing._id);
    return updateTaxSettingAdmin(req, res);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to save tax setting.",
    });
  }
}
