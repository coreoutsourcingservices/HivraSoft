import type { Request, Response } from "express";
import mongoose from "mongoose";
import { softDeleteEntity } from "../services/admin-trash.service";
import DeliveryChargeRule, { type DeliveryPaymentMethod } from "../models/DeliveryChargeRule.model";
import { normalizeDeliveryPaymentMethod } from "../services/delivery-charge.service";

const money = (value: unknown, field: string) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${field} must be 0 or greater.`);
  }
  return Math.round((number + Number.EPSILON) * 100) / 100;
};

function maxMoney(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  return money(value, "Maximum amount");
}

function overlaps(aMin: number, aMax: number | null, bMin: number, bMax: number | null) {
  const aUpper = aMax === null ? Number.POSITIVE_INFINITY : aMax;
  const bUpper = bMax === null ? Number.POSITIVE_INFINITY : bMax;
  return aMin <= bUpper && bMin <= aUpper;
}

async function ensureNoActiveOverlap(input: {
  paymentMethod: DeliveryPaymentMethod;
  minAmount: number;
  maxAmount: number | null;
  excludeId?: string;
}) {
  const query: any = { paymentMethod: input.paymentMethod, isActive: true, isDeleted: { $ne: true } };
  if (input.excludeId && mongoose.Types.ObjectId.isValid(input.excludeId)) {
    query._id = { $ne: input.excludeId };
  }

  const active = await DeliveryChargeRule.find(query).select("minAmount maxAmount").lean();
  const conflict = active.some((item: any) =>
    overlaps(
      input.minAmount,
      input.maxAmount,
      Number(item.minAmount || 0),
      item.maxAmount === null || item.maxAmount === undefined ? null : Number(item.maxAmount)
    )
  );

  if (conflict) {
    throw new Error(`An active ${input.paymentMethod.toUpperCase()} delivery-charge rule already overlaps this price range.`);
  }
}

function historySnapshot(
  action: "created" | "updated" | "status_changed" | "deleted",
  values: { paymentMethod: DeliveryPaymentMethod; minAmount: number; maxAmount: number | null; charge: number; isActive: boolean },
  req: Request
) {
  const adminId = req.user?._id && mongoose.Types.ObjectId.isValid(String(req.user._id))
    ? new mongoose.Types.ObjectId(String(req.user._id))
    : null;

  return {
    action,
    ...values,
    changedAt: new Date(),
    changedBy: adminId,
  };
}

export async function listDeliveryChargeRules(_req: Request, res: Response) {
  try {
    const all = await DeliveryChargeRule.find({}).sort({ paymentMethod: 1, minAmount: 1, createdAt: -1 }).lean();
    const rules = all.filter((item: any) => item.isDeleted !== true);
    const history = all
      .flatMap((rule: any) =>
        (Array.isArray(rule.history) ? rule.history : []).map((item: any) => ({
          ...item,
          ruleId: String(rule._id),
        }))
      )
      .sort((a: any, b: any) => new Date(b.changedAt || 0).getTime() - new Date(a.changedAt || 0).getTime())
      .slice(0, 100);
    return res.json({ success: true, rules, history });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load delivery charges.",
    });
  }
}

export async function createDeliveryChargeRule(req: Request, res: Response) {
  try {
    const paymentMethod = normalizeDeliveryPaymentMethod(req.body?.paymentMethod);
    const minAmount = money(req.body?.minAmount ?? 0, "Minimum amount");
    const maxAmount = maxMoney(req.body?.maxAmount);
    const charge = money(req.body?.charge ?? 0, "Delivery charge");
    const isActive = req.body?.isActive !== false;

    if (maxAmount !== null && maxAmount < minAmount) {
      throw new Error("Maximum amount must be greater than or equal to minimum amount.");
    }

    if (isActive) {
      await ensureNoActiveOverlap({ paymentMethod, minAmount, maxAmount });
    }

    const values = { paymentMethod, minAmount, maxAmount, charge, isActive };
    const rule = await DeliveryChargeRule.create({
      ...values,
      history: [historySnapshot("created", values, req)],
    });

    return res.status(201).json({ success: true, message: "Delivery charge rule created.", rule });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to create delivery charge rule.",
    });
  }
}

export async function updateDeliveryChargeRule(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid delivery charge rule ID." });
    }

    const rule = await DeliveryChargeRule.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!rule) return res.status(404).json({ success: false, message: "Delivery charge rule not found." });

    const oldActive = rule.isActive;
    const paymentMethod = req.body?.paymentMethod !== undefined
      ? normalizeDeliveryPaymentMethod(req.body.paymentMethod)
      : rule.paymentMethod;
    const minAmount = req.body?.minAmount !== undefined
      ? money(req.body.minAmount, "Minimum amount")
      : Number(rule.minAmount || 0);
    const maxAmount = req.body?.maxAmount !== undefined
      ? maxMoney(req.body.maxAmount)
      : (rule.maxAmount === null || rule.maxAmount === undefined ? null : Number(rule.maxAmount));
    const charge = req.body?.charge !== undefined
      ? money(req.body.charge, "Delivery charge")
      : Number(rule.charge || 0);
    const isActive = req.body?.isActive !== undefined ? Boolean(req.body.isActive) : rule.isActive;

    if (maxAmount !== null && maxAmount < minAmount) {
      throw new Error("Maximum amount must be greater than or equal to minimum amount.");
    }

    if (isActive) {
      await ensureNoActiveOverlap({ paymentMethod, minAmount, maxAmount, excludeId: id });
    }

    rule.paymentMethod = paymentMethod;
    rule.minAmount = minAmount;
    rule.maxAmount = maxAmount;
    rule.charge = charge;
    rule.isActive = isActive;

    const values = { paymentMethod, minAmount, maxAmount, charge, isActive };
    const action = oldActive !== isActive && Object.keys(req.body || {}).length === 1 && req.body?.isActive !== undefined
      ? "status_changed"
      : "updated";
    rule.history.push(historySnapshot(action, values, req) as any);
    if (rule.history.length > 50) rule.history.splice(0, rule.history.length - 50);
    await rule.save();

    return res.json({ success: true, message: "Delivery charge rule updated.", rule });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to update delivery charge rule.",
    });
  }
}

export async function deleteDeliveryChargeRule(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid delivery charge rule ID." });
    }
    const result = await softDeleteEntity("delivery_charge", id, req.user?._id ? String(req.user._id) : null);
    return res.json({ success: true, message: result.message });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to delete delivery charge rule.",
    });
  }
}
