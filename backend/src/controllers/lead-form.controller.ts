import type { Request, Response } from "express";
import mongoose from "mongoose";
import SendYourBraSubmission, { type BraCondition, type BraHandoverPreference } from "../models/SendYourBraSubmission.model";
import ResellerRegistration, { type ExpectedOrderQuantity, type SellingPlatform } from "../models/ResellerRegistration.model";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function pageParams(req: Request) {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  return { page, limit, skip: (page - 1) * limit };
}

const BRA_CONDITIONS = new Set<BraCondition>([
  "old_faded",
  "stretched",
  "broken_hooks_or_straps",
  "minor_tears",
  "good_no_longer_needed",
  "mixed_condition",
]);
const HANDOVER = new Set<BraHandoverPreference>(["courier", "pickup_information", "team_guide"]);
const SELLING_PLATFORMS = new Set<SellingPlatform>([
  "whatsapp_instagram",
  "meesho_glowroad",
  "online_store",
  "offline_local_market",
  "multiple_platforms",
]);
const ORDER_QUANTITIES = new Set<ExpectedOrderQuantity>(["20_49", "50_99", "100_199", "200_plus"]);

export async function submitSendYourBra(req: Request, res: Response) {
  try {
    const fullName = clean(req.body?.fullName || req.body?.name);
    const whatsappNumber = clean(req.body?.whatsappNumber || req.body?.whatsapp || req.body?.phone);
    const city = clean(req.body?.city);
    const pinCode = clean(req.body?.pinCode || req.body?.pincode || req.body?.postalCode);
    const numberOfBras = Number(req.body?.numberOfBras || req.body?.bras);
    const condition = clean(req.body?.condition).toLowerCase() as BraCondition;
    const anythingElse = clean(req.body?.anythingElse || req.body?.note || req.body?.message);
    const handoverPreference = clean(req.body?.handoverPreference || req.body?.option || req.body?.preference).toLowerCase() as BraHandoverPreference;

    if (!fullName || !whatsappNumber || !city || !pinCode) {
      return res.status(400).json({ success: false, message: "Full name, WhatsApp number, city and PIN code are required." });
    }
    if (!/^[0-9+()\-\s]{7,20}$/.test(whatsappNumber)) {
      return res.status(400).json({ success: false, message: "Enter a valid WhatsApp number." });
    }
    if (!/^\d{4,10}$/.test(pinCode)) {
      return res.status(400).json({ success: false, message: "Enter a valid PIN code." });
    }
    if (!Number.isInteger(numberOfBras) || numberOfBras < 1 || numberOfBras > 5) {
      return res.status(400).json({ success: false, message: "Number of bras must be between 1 and 5." });
    }
    if (!BRA_CONDITIONS.has(condition)) {
      return res.status(400).json({ success: false, message: "Please select a valid bra condition." });
    }
    if (!HANDOVER.has(handoverPreference)) {
      return res.status(400).json({ success: false, message: "Please choose courier, pickup information or team guidance." });
    }

    const submission = await SendYourBraSubmission.create({
      fullName,
      whatsappNumber,
      city,
      pinCode,
      numberOfBras,
      condition,
      anythingElse,
      handoverPreference,
    });

    return res.status(201).json({ success: true, message: "Your request has been submitted successfully.", submission });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to submit request." });
  }
}

export async function listSendYourBraAdmin(req: Request, res: Response) {
  try {
    const { page, limit, skip } = pageParams(req);
    const search = clean(req.query.search);
    const query: Record<string, unknown> = search
      ? { $or: [
          { fullName: { $regex: search, $options: "i" } },
          { whatsappNumber: { $regex: search, $options: "i" } },
          { city: { $regex: search, $options: "i" } },
          { pinCode: { $regex: search, $options: "i" } },
        ] }
      : {};
    const [submissions, total] = await Promise.all([
      SendYourBraSubmission.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      SendYourBraSubmission.countDocuments(query),
    ]);
    return res.json({ success: true, count: submissions.length, submissions, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to load submissions." });
  }
}

export async function getSendYourBraAdmin(req: Request, res: Response) {
  try {
    const id = clean(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid submission ID." });
    const submission = await SendYourBraSubmission.findById(id).lean();
    if (!submission) return res.status(404).json({ success: false, message: "Submission not found." });
    return res.json({ success: true, submission });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to load submission." });
  }
}

export async function submitResellerRegistration(req: Request, res: Response) {
  try {
    const fullName = clean(req.body?.fullName || req.body?.name);
    const mobileNumber = clean(req.body?.mobileNumber || req.body?.mobile || req.body?.phone);
    const emailAddress = clean(req.body?.emailAddress || req.body?.email).toLowerCase();
    const city = clean(req.body?.city);
    const sellingPlatform = clean(req.body?.sellingPlatform).toLowerCase() as SellingPlatform;
    const expectedOrderQuantity = clean(req.body?.expectedOrderQuantity || req.body?.orderQuantity).toLowerCase() as ExpectedOrderQuantity;

    if (!fullName || !mobileNumber || !emailAddress || !city) {
      return res.status(400).json({ success: false, message: "Full name, mobile number, email and city are required." });
    }
    if (!/^[0-9+()\-\s]{7,20}$/.test(mobileNumber)) return res.status(400).json({ success: false, message: "Enter a valid mobile number." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) return res.status(400).json({ success: false, message: "Enter a valid email address." });
    if (!SELLING_PLATFORMS.has(sellingPlatform)) return res.status(400).json({ success: false, message: "Please select a valid selling platform." });
    if (!ORDER_QUANTITIES.has(expectedOrderQuantity)) return res.status(400).json({ success: false, message: "Please select a valid expected order quantity." });

    const registration = await ResellerRegistration.create({ fullName, mobileNumber, emailAddress, city, sellingPlatform, expectedOrderQuantity });
    return res.status(201).json({ success: true, message: "Reseller registration submitted successfully.", registration });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to submit reseller registration." });
  }
}

export async function listResellerRegistrationsAdmin(req: Request, res: Response) {
  try {
    const { page, limit, skip } = pageParams(req);
    const search = clean(req.query.search);
    const query: Record<string, unknown> = search
      ? { $or: [
          { fullName: { $regex: search, $options: "i" } },
          { mobileNumber: { $regex: search, $options: "i" } },
          { emailAddress: { $regex: search, $options: "i" } },
          { city: { $regex: search, $options: "i" } },
        ] }
      : {};
    const [registrations, total] = await Promise.all([
      ResellerRegistration.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ResellerRegistration.countDocuments(query),
    ]);
    return res.json({ success: true, count: registrations.length, registrations, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to load reseller registrations." });
  }
}

export async function getResellerRegistrationAdmin(req: Request, res: Response) {
  try {
    const id = clean(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid registration ID." });
    const registration = await ResellerRegistration.findById(id).lean();
    if (!registration) return res.status(404).json({ success: false, message: "Registration not found." });
    return res.json({ success: true, registration });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unable to load reseller registration." });
  }
}
