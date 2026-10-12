import { Router, type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { Types } from "mongoose";
import User from "../models/User.model";
import AdminApplication from "../models/AdminApplication.model";
import AdminAuditLog from "../models/AdminAuditLog.model";
import { hashPassword, verifyPassword } from "../utils/password";
import { sendEmail } from "../services/mail.service";
const router = Router();
const cookieName = "superadminToken";
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
const dummyHash = hashPassword("invalid-superadmin-login");
const safe = (v: unknown) => typeof v === "string" ? v.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)) : "";
const wrap = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => { void Promise.resolve(fn(req, res)).catch(next); };
const issueToken = (id: string) => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return jwt.sign({ id, role: "super_admin" }, process.env.JWT_SECRET, { expiresIn: "8h" });
};
router.post("/login", wrap(async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== "string" || !username.trim() || username.length > 100 || typeof password !== "string" || !password || password.length > 256)
    return res.status(400).json({ message: "Enter your login ID and password." });
  const key = username.trim().toLowerCase();
  const user = await User.findOne({ $or: [{ username: key }, { email: key }], role: "super_admin" }).select("+passwordHash");
  const valid = await verifyPassword(password, user?.passwordHash || await dummyHash);
  if (!valid || !user?.isActive || user.accountStatus !== "active") return res.status(401).json({ message: "Invalid credentials or account is not active." });
  const token = issueToken(String(user._id));
  res.cookie(cookieName, token, { ...cookieOptions, maxAge: 8*60*60_000 });
  // Shares the existing Admin API authorization cookie, so ALL /api/admin modules work unchanged.
  res.cookie("accessToken", token, { ...cookieOptions, maxAge: 8*60*60_000 });
  await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
  void AdminAuditLog.create({ action: "LOGIN", module: "auth", recordId: String(user._id), recordName: "Superadmin login", performedBy: user._id,
    metadata: { actorName: user.name, actorEmail: user.email, actorUsername: user.username || "", role: "super_admin", success: true, ip: req.ip || "" } }).catch(() => undefined);
  return res.json({ success: true, user: { name: user.name, username: user.username, mustChangePassword: Boolean(user.mustChangePassword) } });
}));
async function requireSuper(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[cookieName];
    if (!token || !process.env.JWT_SECRET) return res.status(401).json({ message: "Please sign in as Superadmin." });
    const payload = jwt.verify(token, process.env.JWT_SECRET) as jwt.JwtPayload;
    if (!payload.id || payload.role !== "super_admin") return res.status(401).json({ message: "Invalid session." });
    const user = await User.findById(payload.id);
    if (!user?.isActive || user.accountStatus !== "active" || user.role !== "super_admin") return res.status(403).json({ message: "Superadmin access required." });
    req.user = user;
    next();
  } catch { return res.status(401).json({ message: "Session expired." }); }
}
router.use(requireSuper);
router.get("/me", (req, res) => res.json({ success: true, user: { name: req.user!.name, username: req.user!.username, mustChangePassword: Boolean(req.user!.mustChangePassword) } }));
router.post("/logout", (req, res) => {
  void AdminAuditLog.create({ action: "LOGOUT", module: "auth", recordId: String(req.user!._id), recordName: "Superadmin logout", performedBy: req.user!._id,
    metadata: { actorName: req.user!.name, actorEmail: req.user!.email, role: "super_admin", success: true } }).catch(() => undefined);
  res.clearCookie(cookieName, cookieOptions); res.clearCookie("accessToken", cookieOptions); return res.json({ success: true });
});
router.post("/change-password", wrap(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body || {};
  if (typeof newPassword !== "string" || newPassword.length < 12 || newPassword.length > 128 || !/[a-z]/i.test(newPassword) || !/\d/.test(newPassword) || newPassword !== confirmPassword)
    return res.status(400).json({ message: "Use 12+ characters with letters and numbers, matching confirmation." });
  const user = await User.findById(req.user!._id).select("+passwordHash");
  if (!user || typeof oldPassword !== "string" || !await verifyPassword(oldPassword, user.passwordHash || await dummyHash)) return res.status(400).json({ message: "Current password is incorrect." });
  user.passwordHash = await hashPassword(newPassword); user.mustChangePassword = false; await user.save();
  return res.json({ success: true });
}));
const fields = "name email phone username role isActive accountStatus emailVerified createdAt lastLoginAt lastActiveAt mustChangePassword";
router.get("/requests", wrap(async (req, res) => {
  const status = String(req.query.status || "pending_approval");
  const allowed = ["otp_pending", "pending_approval", "approved", "rejected", "email_failed", "processing"];
  const filter: Record<string, unknown> = { emailVerified: true, status: status === "all" ? { $ne: "otp_pending" } : allowed.includes(status) && status !== "otp_pending" ? status : "pending_approval" };
  const requests = await AdminApplication.find(filter).select("-otpHash").sort({ createdAt: -1 }).limit(200).lean();
  return res.json({ success: true, requests });
}));
router.get("/admins", wrap(async (req, res) => {
  const page = Math.max(1, Math.min(10000, Number(req.query.page) || 1));
  const limit = 30;
  const query = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 70) : "";
  const escaped = query.replace(/[.*+?^${}()|\[\]\\]/g, "\\$&");
  const filter: Record<string, unknown> = { role: "admin", emailVerified: true, adminStatus: { $nin: ["unverified", "pending_approval", "rejected"] }, ...(query ? { $or: [{ name: new RegExp(escaped, "i") }, { email: new RegExp(escaped, "i") }, { username: new RegExp(escaped, "i") }] } : {}) };
  const [admins, total] = await Promise.all([User.find(filter).select(fields).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).lean(), User.countDocuments(filter)]);
  return res.json({ success: true, admins, total, page, pages: Math.ceil(total/limit) });
}));
router.get("/admins/:id", wrap(async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id as string)) return res.status(400).json({ message: "Invalid admin ID." });
  const user = await User.findOne({ _id: req.params.id, role: "admin", emailVerified: true, adminStatus: { $nin: ["unverified", "pending_approval", "rejected"] } }).select(fields).lean();
  if (!user) return res.status(404).json({ message: "Admin not found." });
  return res.json({ success: true, user });
}));
async function record(req: Request, action: "CREATE"|"UPDATE"|"APPROVE"|"REJECT"|"SET_STATUS"|"PERMANENT_DELETE", module: string, id: string, name: string, metadata: Record<string, unknown> = {}) {
  await AdminAuditLog.create({ action, module, recordId: id, recordName: name, performedBy: req.user!._id,
    metadata: { actorName: req.user!.name, actorEmail: req.user!.email, actorUsername: req.user!.username || "", ...metadata } });
}
function tempPassword() { return crypto.randomBytes(24).toString("base64url") + "!A9"; }
function username(name: string) { return (name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 14) || "staff") + crypto.randomBytes(4).toString("hex"); }
async function deliverCredentials(name: string, email: string, login: string, password: string) {
  await sendEmail({ to: email, subject: "HivraSoft Admin account approved - Login details", html:
    `<h2>HivraSoft Admin Approval</h2><p>Hello ${safe(name)}, your Admin account was approved.</p><p>Username: <b>${safe(login)}</b></p><p>Temporary password: <b>${safe(password)}</b></p><p>Log in at <a href="${safe(process.env.ADMIN_URL || "http://localhost:3001")}">Admin Login</a>, then immediately change your password.</p>` });
}
router.post("/requests/:id/approve", wrap(async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id as string)) return res.status(400).json({ message: "Invalid request ID" });
  const app = await AdminApplication.findOneAndUpdate({ _id: req.params.id, status: "pending_approval", emailVerified: true }, { $set: { status: "processing" } }, { new: true });
  if (!app) return res.status(409).json({ message: "Request is not pending approval." });
  let user;
  try {
    const login = username(app.name); const password = tempPassword();
    user = await User.create({ name: app.name, email: app.email, phone: app.phone, username: login,
      role: "admin", emailVerified: true, isActive: false, accountStatus: "inactive",
      mustChangePassword: true, temporaryPasswordExpiresAt: new Date(Date.now() + 86400_000), passwordHash: await hashPassword(password) });
    app.userId = user._id as Types.ObjectId;
    await app.save();
    try { await deliverCredentials(app.name, app.email, login, password); }
    catch (e) {
      app.status = "email_failed"; await app.save();
      console.error("Admin approval mail failed:", e);
      return res.status(503).json({ message: "Admin created but email delivery failed. Fix SMTP then click Resend credentials." });
    }
    user.isActive = true; user.accountStatus = "active"; await user.save();
    app.status = "approved"; app.approvedAt = new Date(); await app.save();
    await record(req, "APPROVE", "staff", String(user._id), user.name, { action: "APPROVE", applicantEmail: app.email });
    return res.json({ success: true, message: "Admin approved and credentials emailed." });
  } catch (e) {
    console.error("Approve admin failed:", e);
    if (!user) { app.status = "pending_approval"; await app.save(); }
    return res.status(503).json({ message: "Approval failed. Check MongoDB state and server logs." });
  }
}));
router.post("/requests/:id/reject", wrap(async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id as string)) return res.status(400).json({ message: "Invalid request ID." });
  const app = await AdminApplication.findOneAndUpdate({ _id: req.params.id, status: "pending_approval" }, { $set: { status: "rejected" } }, { new: true });
  if (!app) return res.status(409).json({ message: "Request is not pending." });
  await record(req, "REJECT", "staff", String(app._id), app.name, { action: "REJECT", applicantEmail: app.email });
  return res.json({ success: true, message: "Application rejected." });
}));
router.post("/requests/:id/resend", wrap(async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id as string)) return res.status(400).json({ message: "Invalid request ID." });
  const app = await AdminApplication.findOneAndUpdate({ _id: req.params.id, status: "email_failed" }, { $set: { status: "processing" } }, { new: true });
  if (!app?.userId) return res.status(409).json({ message: "No failed credentials delivery for this request." });
  const user = await User.findOne({ _id: app.userId, role: "admin" });
  if (!user) return res.status(404).json({ message: "Admin account missing." });
  const password = tempPassword();
  // Admin remains inactive until email succeeds; failed retry gets a newly generated password next time.
  user.isActive = false; user.accountStatus = "inactive"; user.passwordHash = await hashPassword(password); user.mustChangePassword = true; user.temporaryPasswordExpiresAt = new Date(Date.now() + 86400_000); await user.save();
  try { await deliverCredentials(app.name, app.email, user.username || "", password); }
  catch (e) { app.status = "email_failed"; await app.save(); console.error("Resend credentials failed:", e); return res.status(503).json({ message: "Email failed. Check SMTP credentials and retry." }); }
  user.isActive = true; user.accountStatus = "active"; await user.save();
  app.status = "approved"; app.approvedAt = new Date(); await app.save();
  await record(req, "UPDATE", "staff", String(user._id), user.name, { action: "RESEND_CREDENTIALS" });
  return res.json({ success: true, message: "New credentials sent." });
}));
router.patch("/admins/:id/status", wrap(async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id as string) || !["active", "inactive", "blocked"].includes(req.body?.status)) return res.status(400).json({ message: "Invalid status or admin ID." });
  const status = req.body.status as "active" | "inactive" | "blocked";
  const user = await User.findOneAndUpdate({ _id: req.params.id, role: "admin", emailVerified: true, adminStatus: { $nin: ["unverified", "pending_approval", "rejected"] } }, { $set: { accountStatus: status, isActive: status === "active" }, $inc: { sessionVersion: 1 }, $unset: { resetTokenHash: 1, resetTokenExpiresAt: 1 } }, { new: true });
  if (!user) return res.status(404).json({ message: "Admin not found." });
  await record(req, "SET_STATUS", "staff", String(user._id), user.name, { action: "SET_STATUS", status });
  return res.json({ success: true, user: { id: user._id, name: user.name, status: user.accountStatus } });
}));
router.delete("/admins/:id", wrap(async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id as string)) return res.status(400).json({ message: "Invalid admin ID." });
  const user = await User.findOneAndDelete({ _id: req.params.id, role: "admin" });
  if (!user) return res.status(404).json({ message: "Admin not found." });
  await AdminApplication.deleteMany({ $or: [{ userId: user._id }, { email: user.email }] });
  await record(req, "PERMANENT_DELETE", "staff", String(user._id), user.name);
  return res.json({ success: true, message: "Admin deleted. Login access revoked." });
}));
router.get("/logs", wrap(async (req, res) => {
  const page = Math.max(1, Math.min(10000, Number(req.query.page) || 1)), limit = 40;
  const filter: Record<string, unknown> = {};
  if (req.query.adminId) {
    if (!Types.ObjectId.isValid(String(req.query.adminId))) return res.status(400).json({ message: "Invalid admin ID." });
    filter.performedBy = new Types.ObjectId(String(req.query.adminId));
  }
  if (typeof req.query.module === "string" && /^[a-zA-Z0-9_-]{1,70}$/.test(req.query.module)) filter.module = req.query.module;
  if (typeof req.query.action === "string" && ["CREATE", "UPDATE", "SOFT_DELETE", "RESTORE", "PERMANENT_DELETE", "LOGIN", "LOGOUT", "APPROVE", "REJECT", "SET_STATUS", "DELETE", "BLOCK", "UNBLOCK", "EXPORT"].includes(req.query.action)) filter.action = req.query.action;
  const start = req.query.from ? new Date(String(req.query.from)) : null;
  const end = req.query.to ? new Date(String(req.query.to)) : null;
  if ((start && isNaN(start.getTime())) || (end && isNaN(end.getTime())) || (start && end && start > end)) return res.status(400).json({ message: "Invalid date range." });
  if (start && !isNaN(start.getTime()) || end && !isNaN(end.getTime())) filter.createdAt = { ...(start && !isNaN(start.getTime()) ? { $gte: start } : {}), ...(end && !isNaN(end.getTime()) ? { $lte: end } : {}) };
  const [logs, total] = await Promise.all([AdminAuditLog.find(filter).populate("performedBy", "name username email role").sort({createdAt:-1}).skip((page-1)*limit).limit(limit).lean(), AdminAuditLog.countDocuments(filter)]);
  return res.json({ success: true, logs, total, page, pages: Math.ceil(total/limit) });
}));
export default router;
