import { Router, type Request, type Response, type NextFunction } from "express";
import crypto from "node:crypto";
import User from "../models/User.model";
import Otp from "../models/Otp.model";
import { hashPassword, verifyPassword } from "../utils/password";
import { sendEmail } from "../services/mail.service";
import { activeStaff, authenticateStaff, issueStaffSession, staffCookie } from "../services/staff-session.service";
import { auditEvent } from "../services/staff-audit.service";

export const wrap = (handler: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => { Promise.resolve(handler(req, res)).catch(next); };
export function bad(message: string, status = 400): never { throw Object.assign(new Error(message), { status }); }
export const digest = (value: string) => crypto.createHash("sha256").update(value).digest("hex");
export const emailInput = (value: unknown) => {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) bad("Enter a valid email address.");
  return email;
};
export function newPassword(value: unknown, confirmation: unknown) {
  if (typeof value !== "string" || value.length < 8 || value.length > 128 || !/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) bad("Use 8–128 characters, including letters and numbers.");
  if (value !== confirmation) bad("Passwords do not match.");
  return value as string;
}
const otpHash = (email: string, purpose: string, otp: string) => {
  const secret = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error("OTP secret missing");
  return crypto.createHmac("sha256", secret).update(`${email}:${purpose}:${otp}`).digest("hex");
};
async function sendOtp(email: string, userId: unknown, purpose: "admin_register" | "admin_password_reset") {
  const otp = String(crypto.randomInt(100000, 1000000));
  let record;
  try {
    record = await Otp.findOneAndUpdate({ email, purpose, updatedAt: { $lt: new Date(Date.now() - 60_000) } }, { $set: { otpHash: otpHash(email, purpose, otp), userId, attempts: 0, expiresAt: new Date(Date.now() + 300_000) } }, { upsert: true, returnDocument: "after" });
  } catch (error) { if ((error as { code?: number }).code === 11000) bad("Wait 60 seconds before resending.", 429); throw error; }
  try { await sendEmail({ to: email, subject: "HivraSoft admin verification", html: `<p>Your verification code is <strong>${otp}</strong>.</p><p>It expires in 5 minutes.</p>` }); }
  catch { await Otp.deleteOne({ _id: record!._id, otpHash: otpHash(email, purpose, otp) }); bad("Email delivery failed. Please retry.", 503); }
}
async function consumeOtp(email: string, purpose: "admin_register" | "admin_password_reset", value: unknown) {
  if (typeof value !== "string" || !/^\d{6}$/.test(value)) bad("Enter the six-digit OTP.");
  const record = await Otp.findOneAndUpdate({ email, purpose, attempts: { $lt: 5 }, expiresAt: { $gt: new Date() } }, { $inc: { attempts: 1 } }, { returnDocument: "after", timestamps: false });
  if (!record) bad("OTP expired or attempts exhausted. Request a new code.");
  const expected = Buffer.from(record!.otpHash, "hex");
  const actual = Buffer.from(otpHash(email, purpose, value as string), "hex");
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) bad("Incorrect OTP.");
  const result = await Otp.deleteOne({ _id: record!._id, otpHash: record!.otpHash });
  if (!result.deletedCount) bad("OTP already used.");
  return record!;
}
export const authLimit = () => (_req: Request, _res: Response, next: NextFunction) => next();
const dummyHash = hashPassword("invalid-staff-password");
export const staffLogin = (superadmin = false) => wrap(async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== "string" || !username.trim() || username.length > 254 || typeof password !== "string" || !password || password.length > 256) bad("Enter email or username and password.");
  const identity = username.trim();
  const user = await User.findOne({ $or: [{ username: identity }, { email: identity.toLowerCase() }], role: superadmin ? "super_admin" : "admin" }).select("+passwordHash +sessionVersion +temporaryPasswordExpiresAt");
  const valid = await verifyPassword(password, user?.passwordHash || await dummyHash);
  if (!valid || !user || !activeStaff(user) || user.role !== (superadmin ? "super_admin" : "admin") || (user.mustChangePassword && (!user.temporaryPasswordExpiresAt || user.temporaryPasswordExpiresAt.getTime() <= Date.now()))) {
    // Only the account identified by a valid password is attributed; never log submitted credentials.
    if (valid && user) req.user = user;
    await auditEvent(req, "LOGIN", "authentication", user ? String(user._id) : "unknown", {}, false);
    res.locals.auditHandled = true;
    bad("Invalid credentials or account is not approved/active.", 401);
  }
  req.user = user!;
  user!.lastLoginAt = new Date();
  await user!.save();
  issueStaffSession(res, user!, superadmin);
  // A browser signs into one staff portal at a time, using that portal's token.
  res.clearCookie(superadmin ? "adminToken" : "superadminToken", staffCookie);
  return res.json({ success: true, mustChangePassword: user!.mustChangePassword, user: { name: user!.name, username: user!.username, role: user!.role } });
});
export const staffLogout = wrap(async (req, res) => {
  await User.updateOne({ _id: req.user!._id }, { $inc: { sessionVersion: 1 } });
  const superadmin = /^\/api\/superadmin(?:\/|$)/.test(req.originalUrl);
  res.clearCookie(superadmin ? "superadminToken" : "adminToken", staffCookie);
  return res.json({ success: true });
});
const router = Router();
router.post("/login", authLimit(), staffLogin());
export const staffRecoveryRouter = Router();
const recoveryRole = (req: Request) => /^\/api\/superadmin(?:\/|$)/.test(req.originalUrl) ? "super_admin" : "admin";
staffRecoveryRouter.post("/forgot-password/send-otp", authLimit(), wrap(async (req, res) => {
  const email = emailInput(req.body?.email);
  const user = await User.findOne({ email, role: recoveryRole(req) });
  if (user && activeStaff(user) && user.emailVerified) await sendOtp(email, user._id, "admin_password_reset");
  return res.json({ success: true, message: "If this is an active verified admin account, a code has been sent." });
}));
staffRecoveryRouter.post("/forgot-password/verify-otp", authLimit(), wrap(async (req, res) => {
  const email = emailInput(req.body?.email);
  const otp = await consumeOtp(email, "admin_password_reset", req.body?.otp);
  const token = crypto.randomBytes(32).toString("hex");
  const result = await User.updateOne({ _id: otp.userId, role: recoveryRole(req) }, { $set: { resetTokenHash: digest(token), resetTokenExpiresAt: new Date(Date.now() + 600_000) } });
  if (!result.matchedCount) bad("Invalid recovery account.");
  return res.json({ success: true, resetToken: token });
}));
staffRecoveryRouter.post("/forgot-password/reset", authLimit(), wrap(async (req, res) => {
  const password = newPassword(req.body?.newPassword, req.body?.confirmPassword);
  if (typeof req.body?.resetToken !== "string" || !/^[a-f\d]{64}$/.test(req.body.resetToken)) bad("Invalid reset session.");
  const user = await User.findOneAndUpdate({ resetTokenHash: digest(req.body.resetToken), resetTokenExpiresAt: { $gt: new Date() }, role: recoveryRole(req), isActive: true, accountStatus: "active", $or: [{ adminStatus: "approved" }, { adminStatus: { $exists: false } }] }, { $set: { passwordHash: await hashPassword(password), mustChangePassword: false }, $unset: { resetTokenHash: 1, resetTokenExpiresAt: 1, temporaryPasswordExpiresAt: 1 }, $inc: { sessionVersion: 1 } });
  if (!user) bad("Reset session expired or already used.");
  req.user = user!;
  return res.json({ success: true, message: "Password reset. Sign in with your new password." });
}));
router.use(staffRecoveryRouter);
router.get("/me", authenticateStaff, (req, res) => { const u = req.user!; res.setHeader("Cache-Control", "no-store"); res.json({ success: true, user: { id: u._id, name: u.name, email: u.email, role: u.role, mustChangePassword: u.mustChangePassword } }); });
router.post("/logout", authenticateStaff, staffLogout);
export const staffChangePassword = wrap(async (req, res) => {
  const password = newPassword(req.body?.newPassword, req.body?.confirmPassword);
  if (typeof req.body?.oldPassword !== "string" || req.body.oldPassword.length > 256) bad("Enter your current password.");
  const user = await User.findById(req.user!._id).select("+passwordHash +sessionVersion");
  if (!user || !await verifyPassword(req.body.oldPassword, user.passwordHash || await dummyHash)) bad("Current password is incorrect.");
  if (req.body.oldPassword === password) bad("Choose a different password.");
  const updated = await User.findOneAndUpdate({ _id: user!._id, passwordHash: user!.passwordHash }, { $set: { passwordHash: await hashPassword(password), mustChangePassword: false }, $unset: { temporaryPasswordExpiresAt: 1, resetTokenHash: 1, resetTokenExpiresAt: 1 }, $inc: { sessionVersion: 1 } }, { returnDocument: "after" }).select("+sessionVersion");
  if (!updated) bad("Account changed. Sign in again.", 409);
  issueStaffSession(res, updated!, req.originalUrl.split("?")[0].startsWith("/api/superadmin/"));
  return res.json({ success: true, message: "Password changed." });
});
router.post("/change-password", authenticateStaff, staffChangePassword);
export default router;
