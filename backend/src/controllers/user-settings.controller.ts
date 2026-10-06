import crypto from "crypto";
import type { Request, Response } from "express";
import mongoose from "mongoose";

import User from "../models/User.model";
import Otp from "../models/Otp.model";
import Review from "../models/Review.model";
import Wishlist from "../models/Wishlist.model";
import Notification from "../models/Notification.model";
import { sendOtpEmail } from "../services/mail.service";
import {
  deleteCloudinaryImage,
  uploadImageBuffer,
} from "../services/cloudinary.service";

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES || 5);
const OTP_RESEND_SECONDS = Number(process.env.OTP_RESEND_SECONDS || 60);
const MAX_OTP_ATTEMPTS = 5;

function currentUserId(req: Request): string {
  const userId = req.user?._id?.toString();
  if (!userId) throw new Error("Authentication required.");
  return userId;
}

function normalizeEmail(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(email: string, otp: string): string {
  const secret = process.env.OTP_HASH_SECRET;
  if (!secret) throw new Error("OTP_HASH_SECRET missing in .env");

  return crypto
    .createHmac("sha256", secret)
    .update(`${email}:${otp}`)
    .digest("hex");
}

function safeEqualHash(left: string, right: string): boolean {
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  const visible = local.slice(0, Math.min(2, local.length));
  const hidden = "*".repeat(Math.max(2, local.length - visible.length));
  return `${visible}${hidden}@${domain}`;
}

/**
 * GET /api/user-settings
 * Current authenticated user's settings overview.
 */
export async function getUserSettings(req: Request, res: Response) {
  try {
    const userId = currentUserId(req);
    const objectId = new mongoose.Types.ObjectId(userId);

    const [user, ratings, wishlist, notifications] = await Promise.all([
      User.findById(userId)
        .select("name email phone gender birthday anniversary avatar emailVerified createdAt updatedAt")
        .lean(),
      Review.countDocuments({ userId: objectId }),
      Wishlist.findOne({ user: objectId }).select("items").lean(),
      Notification.countDocuments({
        isActive: true,
        deletedBy: { $ne: objectId },
        $or: [
          { audience: "all" },
          { audience: { $in: ["selected", "filtered"] }, userIds: objectId },
        ],
      }),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({
      success: true,
      settings: {
        profile: {
          id: String(user._id),
          name: user.name,
          gender: (user as any).gender || "other",
          image: {
            url: user.avatar?.url || "",
            publicId: user.avatar?.publicId || "",
          },
        },
        personalInformation: {
          name: user.name,
          gender: (user as any).gender || "other",
          email: user.email,
          emailVerified: Boolean(user.emailVerified),
          mobile: user.phone,
          birthday: (user as any).birthday || null,
          anniversary: (user as any).anniversary || null,
        },
        activity: {
          ratings,
          notifications,
          wishlist: Array.isArray((wishlist as any)?.items)
            ? (wishlist as any).items.length
            : 0,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load user settings.",
    });
  }
}

/**
 * PATCH /api/user-settings/profile
 * multipart/form-data or JSON
 * Fields: name, gender, phone, profileImage
 * Email is intentionally NOT editable here; it must use email OTP endpoints.
 */
export async function updateUserProfile(req: Request, res: Response) {
  let uploadedPublicId = "";

  try {
    const userId = currentUserId(req);
    const currentUser = await User.findById(userId).select("avatar");

    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const update: Record<string, unknown> = {};

    if (req.body?.name !== undefined) {
      const name = String(req.body.name).trim();
      if (name.length < 2 || name.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Name must be between 2 and 100 characters.",
        });
      }
      update.name = name;
    }

    if (req.body?.gender !== undefined) {
      const gender = String(req.body.gender).trim().toLowerCase();
      if (!["male", "female", "other"].includes(gender)) {
        return res.status(400).json({
          success: false,
          message: "Gender must be male, female or other.",
        });
      }
      update.gender = gender;
    }

    if (req.body?.phone !== undefined) {
      const phone = String(req.body.phone).trim();
      if (!/^[0-9+()\-\s]{7,20}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid mobile number.",
        });
      }
      update.phone = phone;
    }

    for (const field of ["birthday", "anniversary"] as const) {
      if (req.body?.[field] !== undefined) {
        const raw = String(req.body[field] || "").trim();
        if (!raw) update[field] = null;
        else {
          const parsed = new Date(raw);
          if (Number.isNaN(parsed.getTime())) return res.status(400).json({ success: false, message: `Invalid ${field} date.` });
          update[field] = parsed;
        }
      }
    }

    // Do not allow email bypass without OTP verification.
    if (req.body?.email !== undefined) {
      return res.status(400).json({
        success: false,
        message: "Email cannot be changed from profile update. Use email OTP verification endpoints.",
      });
    }

    if (req.file?.buffer) {
      const uploaded = await uploadImageBuffer(
        req.file.buffer,
        "hivrasoft/user-profile"
      );
      uploadedPublicId = uploaded.public_id;
      update.avatar = {
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
      };
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Name, gender, mobile number, birthday, anniversary or profile image is required.",
      });
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true, runValidators: true }
    )
      .select("name email phone gender birthday anniversary avatar emailVerified createdAt updatedAt")
      .lean();

    if (!updated) {
      if (uploadedPublicId) {
        await deleteCloudinaryImage(uploadedPublicId).catch(() => undefined);
      }
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const oldPublicId = currentUser.avatar?.publicId || "";
    if (uploadedPublicId && oldPublicId && oldPublicId !== uploadedPublicId) {
      await deleteCloudinaryImage(oldPublicId).catch(() => undefined);
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      profile: {
        id: String(updated._id),
        name: updated.name,
        gender: (updated as any).gender || "other",
        image: {
          url: updated.avatar?.url || "",
          publicId: updated.avatar?.publicId || "",
        },
      },
      personalInformation: {
        name: updated.name,
        gender: (updated as any).gender || "other",
        email: updated.email,
        emailVerified: Boolean(updated.emailVerified),
        mobile: updated.phone,
        birthday: (updated as any).birthday || null,
        anniversary: (updated as any).anniversary || null,
      },
    });
  } catch (error) {
    if (uploadedPublicId) {
      await deleteCloudinaryImage(uploadedPublicId).catch(() => undefined);
    }

    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to update profile.",
    });
  }
}

/**
 * POST /api/user-settings/email/send-otp
 * JSON: { "email": "new@email.com" }
 */
export async function sendEmailChangeOtp(req: Request, res: Response) {
  try {
    const userId = currentUserId(req);
    const email = normalizeEmail(req.body?.email);

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "A valid new email address is required." });
    }

    const user = await User.findById(userId).select("email").lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.email.toLowerCase() === email) {
      return res.status(400).json({ success: false, message: "This email is already linked to your account." });
    }

    const emailOwner = await User.exists({ email, _id: { $ne: userId } });
    if (emailOwner) {
      return res.status(409).json({ success: false, message: "This email address is already in use." });
    }

    const existingOtp = await Otp.findOne({ email, purpose: "email_change" });
    if (existingOtp) {
      const elapsed = Date.now() - existingOtp.updatedAt.getTime();
      const waitMs = OTP_RESEND_SECONDS * 1000;
      if (elapsed < waitMs) {
        const secondsLeft = Math.ceil((waitMs - elapsed) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${secondsLeft} seconds before requesting another OTP.`,
        });
      }
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Otp.findOneAndUpdate(
      { email, purpose: "email_change" },
      {
        $set: {
          email,
          purpose: "email_change",
          otpHash: hashOtp(email, otp),
          attempts: 0,
          expiresAt,
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    try {
      await sendOtpEmail(email, otp);
    } catch (mailError) {
      await Otp.deleteOne({ email, purpose: "email_change", userId });
      throw mailError;
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent to your new email address.",
      email: maskEmail(email),
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to send email verification OTP.",
    });
  }
}

/**
 * POST /api/user-settings/email/verify-otp
 * JSON: { "email": "new@email.com", "otp": "123456" }
 */
export async function verifyEmailChangeOtp(req: Request, res: Response) {
  try {
    const userId = currentUserId(req);
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp || "").trim();

    if (!email || !isValidEmail(email) || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Valid email and 6-digit OTP are required.",
      });
    }

    const otpRecord = await Otp.findOne({
      email,
      purpose: "email_change",
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "OTP not found. Please request a new OTP." });
    }

    if (otpRecord.expiresAt.getTime() <= Date.now()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new OTP." });
    }

    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({ success: false, message: "Too many incorrect OTP attempts. Please request a new OTP." });
    }

    const suppliedHash = hashOtp(email, otp);
    if (!safeEqualHash(otpRecord.otpHash, suppliedHash)) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      const attemptsLeft = Math.max(0, MAX_OTP_ATTEMPTS - otpRecord.attempts);
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
        attemptsLeft,
      });
    }

    const existingUser = await User.exists({ email, _id: { $ne: userId } });
    if (existingUser) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(409).json({ success: false, message: "This email address is already in use." });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { email, emailVerified: true } },
      { new: true, runValidators: true }
    )
      .select("name email phone gender avatar emailVerified")
      .lean();

    await Otp.deleteOne({ _id: otpRecord._id });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Email address verified and updated successfully.",
      personalInformation: {
        name: user.name,
        gender: (user as any).gender || "other",
        email: user.email,
        emailVerified: Boolean(user.emailVerified),
        mobile: user.phone,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to verify email OTP.",
    });
  }
}
