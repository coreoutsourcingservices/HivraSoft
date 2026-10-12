import { Router } from "express";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import AdminApplication from "../models/AdminApplication.model";
import User from "../models/User.model";
import Otp from "../models/Otp.model";
import { sendOtpEmail } from "../services/mail.service";
const router = Router();
const secret = () => {
  const value = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET;
  if (!value) throw new Error("OTP secret missing");
  return value;
};
const hash = (value: string) => crypto.createHmac("sha256", secret()).update(value).digest("hex");
router.post(["/signup", "/register/send-otp"], async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const phone = typeof req.body?.phone === "string" ? req.body.phone.replace(/[\s()-]/g, "") : "";
  if (name.length < 2 || name.length > 100 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\+?\d{10,15}$/.test(phone))
    return res.status(400).json({ message: "Enter a valid name, email and mobile number." });
  try {
    if (await User.exists({ $or: [{ email }, { phone }] }) || await AdminApplication.exists({ email, status: { $ne: "otp_pending" } })) return res.status(409).json({ message: "An account or submitted application already exists." });
    // Store no applicant details before verification; the browser holds a signed session.
    const key = hash(`signup-email:${email}`), otp = String(crypto.randomInt(100000, 1000000)), challenge = crypto.randomBytes(24).toString("hex");
    const otpHash = hash(`${challenge}:${otp}`);
    const record = await Otp.findOneAndUpdate({ email: key, purpose: "admin_register", updatedAt: { $lt: new Date(Date.now() - 60_000) } }, { $set: { otpHash, attempts: 0, expiresAt: new Date(Date.now() + 300_000) } }, { upsert: true, returnDocument: "after" });
    try { await sendOtpEmail(email, otp); }
    catch (error) {
      await Otp.deleteOne({ _id: record!._id, otpHash });
      console.error("Admin OTP delivery failed:", error);
      return res.status(503).json({ message: "OTP email could not be delivered. Please retry shortly or contact support." });
    }
    await Otp.updateOne({ _id: record!._id, otpHash }, { $set: { expiresAt: new Date(Date.now() + 300_000) } }, { timestamps: false });
    const registrationToken = jwt.sign({ purpose: "admin_signup", name, email, phone, challenge }, secret(), { expiresIn: "5m" });
    return res.json({ success: true, registrationToken, message: "OTP sent. Check your inbox and spam folder. Valid for five minutes." });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return res.status(429).json({ message: "Wait 60 seconds before requesting another OTP." });
    console.error("Admin signup failed:", error);
    return res.status(503).json({ message: "Registration unavailable. Please retry." });
  }
});
router.post(["/verify-otp", "/register/verify-otp"], async (req, res) => {
  if (typeof req.body?.registrationToken !== "string" || typeof req.body?.otp !== "string" || !/^\d{6}$/.test(req.body.otp)) return res.status(400).json({ message: "Enter the six-digit OTP from your registration session." });
  let payload: jwt.JwtPayload;
  try {
    const decoded = jwt.verify(req.body.registrationToken, secret(), { algorithms: ["HS256"] });
    if (typeof decoded === "string" || decoded.purpose !== "admin_signup") throw new Error("Invalid session");
    payload = decoded;
  } catch { return res.status(400).json({ message: "Registration session expired. Request a new OTP." }); }
  try {
    const record = await Otp.findOneAndUpdate({ email: hash(`signup-email:${payload.email}`), purpose: "admin_register", attempts: { $lt: 5 }, expiresAt: { $gt: new Date() } }, { $inc: { attempts: 1 } }, { returnDocument: "after", timestamps: false });
    if (!record) return res.status(400).json({ message: "OTP expired or attempts exhausted. Request a new OTP." });
    const expected = Buffer.from(hash(`${payload.challenge}:${req.body.otp}`), "hex"), actual = Buffer.from(record.otpHash, "hex");
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return res.status(400).json({ message: "Incorrect OTP." });
    if (await User.exists({ $or: [{ email: payload.email }, { phone: payload.phone }] })) return res.status(409).json({ message: "Account already exists." });
    const app = await AdminApplication.findOneAndUpdate({ email: payload.email, status: "otp_pending" }, { $set: { name: payload.name, phone: payload.phone, status: "pending_approval", emailVerified: true }, $unset: { otpHash: 1, otpExpiresAt: 1, otpSentAt: 1 } }, { upsert: true, returnDocument: "after" });
    if (!app) throw new Error("Unable to save verified application");
    await Otp.deleteOne({ _id: record._id, otpHash: record.otpHash });
    return res.json({ success: true, status: "pending_approval", message: "Email verified. Superadmin approval is pending." });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return res.status(409).json({ message: "Application already submitted." });
    console.error("Admin verification failed:", error); return res.status(503).json({ message: "Verification unavailable. Please retry." });
  }
});
export default router;
