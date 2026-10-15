import { Router } from "express";
import { Types } from "mongoose";
import User from "../models/User.model";
import AdminAuditLog from "../models/AdminAuditLog.model";
import { hashPassword } from "../utils/password";
import { temporaryStaffPassword } from "../utils/staff-password";
import { sendEmail } from "../services/mail.service";
import { authenticateStaff, requireSuperadmin } from "../services/staff-session.service";
import { authLimit, bad, staffChangePassword, staffLogin, staffLogout, wrap } from "./staff-auth.routes";
import { auditEvent } from "../services/staff-audit.service";

const router = Router();
const fields = "name username email phone role emailVerified isActive accountStatus adminStatus createdAt approvedAt approvedBy lastLoginAt credentialDelivery credentialIssuedAt mustChangePassword";
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const html = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const pageNumber = (value: unknown, fallback: number, max: number) => Math.min(max, Math.max(1, Number.isFinite(Number(value)) ? Math.floor(Number(value)) : fallback));
router.post("/login", authLimit(), staffLogin(true));
router.use(authenticateStaff, requireSuperadmin);
router.get("/me", (req, res) => { res.setHeader("Cache-Control", "no-store"); res.json({ success: true, user: { name: req.user!.name, username: req.user!.username, mustChangePassword: req.user!.mustChangePassword } }); });
router.post("/logout", staffLogout);
router.post("/change-password", staffChangePassword);
router.get("/dashboard", wrap(async (_req, res) => {
  const [pending, approved, blocked, rejected] = await Promise.all([
    User.countDocuments({ role: "admin", adminStatus: "pending_approval" }), User.countDocuments({ role: "admin", isActive: true, accountStatus: "active" }), User.countDocuments({ role: "admin", accountStatus: "blocked" }), User.countDocuments({ role: "admin", adminStatus: "rejected" }),
  ]);
  res.json({ pending, approved, blocked, rejected });
}));
router.get("/admins", wrap(async (req, res) => {
  const page = pageNumber(req.query.page, 1, 100000), limit = pageNumber(req.query.limit, 20, 100);
  const filter: Record<string, unknown> = { role: "admin" };
  const status = String(req.query.status || "");
  if (["unverified", "pending_approval", "approved", "rejected"].includes(status)) filter.adminStatus = status;
  if (["active", "inactive", "blocked"].includes(status)) filter.accountStatus = status;
  const search = String(req.query.search || "").slice(0, 100);
  if (search) filter.$or = ["name", "email", "username", "phone"].map(key => ({ [key]: new RegExp(escapeRegex(search), "i") }));
  const [items, total] = await Promise.all([User.find(filter).select(fields).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(), User.countDocuments(filter)]);
  res.json({ items, total, page, limit });
}));
router.param("id", (req, res, next, id) => { if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid admin ID." }); next(); });
router.get("/admins/:id", wrap(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: "admin" }).select(fields).lean();
  if (!user) bad("Admin not found.", 404);
  res.json({ user });
}));
router.post("/admins/:id/approve", wrap(async (req, res) => {
  const password = temporaryStaffPassword(`admin_${String(req.params.id)}`), issuedAt = new Date();
  const user = await User.findOneAndUpdate({ _id: req.params.id, role: "admin", adminStatus: "pending_approval", emailVerified: true }, { $set: { adminStatus: "approved", isActive: true, accountStatus: "active", approvedAt: issuedAt, approvedBy: req.user!._id, username: `admin_${String(req.params.id)}`, passwordHash: await hashPassword(password), mustChangePassword: true, temporaryPasswordExpiresAt: new Date(Date.now() + 86400_000), credentialDelivery: "sending", credentialIssuedAt: issuedAt }, $inc: { sessionVersion: 1 } }, { returnDocument: "after" });
  if (!user) bad("Request already processed or not verified.", 409);
  const delivery = await deliver(user!, password, issuedAt);
  await auditEvent(req, "APPROVE", "admins", String(user!._id), {
    recordName: user!.name, previous: { adminStatus: "pending_approval" },
    updated: { adminStatus: "approved", accountStatus: "active", credentialDelivery: delivery },
  });
  res.locals.auditHandled = true;
  res.json({ success: true, delivery, message: delivery === "sent" ? "Approved. Credentials sent." : "Approved, but email failed. Retry credentials delivery." });
}));
async function deliver(user: { _id: Types.ObjectId; name: string; email: string; username?: string }, password: string, issuedAt: Date) {
  let delivery: "sent" | "failed" = "sent";
  try {
    const url = `${(process.env.ADMIN_URL || "http://localhost:3001").replace(/\/$/, "")}/`;
    await sendEmail({ to: user.email, subject: "HivraSoft admin access approved", html: `<p>Hello ${html(user.name)},</p><p>Your admin access is approved.</p><p>Username: <strong>${html(user.username || "")}</strong></p><p>Temporary password: <strong>${html(password)}</strong></p><p><a href="${html(url)}">Sign in to HivraSoft Admin</a></p><p>This password expires in 24 hours. You must change it before using the dashboard.</p>` });
  } catch { delivery = "failed"; }
  await User.updateOne({ _id: user._id, credentialIssuedAt: issuedAt }, { $set: { credentialDelivery: delivery } });
  return delivery;
}
router.post("/admins/:id/retry-credentials", authLimit(), wrap(async (req, res) => {
  const account = await User.findOne({ _id: req.params.id, role: "admin" }).select("username");
  if (!account?.username) bad("Admin user ID not found.", 404);
  const password = temporaryStaffPassword(account!.username!), issuedAt = new Date();
  const user = await User.findOneAndUpdate({ _id: req.params.id, role: "admin", adminStatus: "approved", isActive: true, accountStatus: "active", mustChangePassword: true, credentialIssuedAt: { $lt: new Date(Date.now() - 120_000) } }, { $set: { passwordHash: await hashPassword(password), temporaryPasswordExpiresAt: new Date(Date.now() + 86400_000), credentialDelivery: "sending", credentialIssuedAt: issuedAt }, $inc: { sessionVersion: 1 } }, { returnDocument: "after" });
  if (!user) bad("Retry after two minutes. Only active accounts awaiting their first password change are eligible.", 409);
  const delivery = await deliver(user!, password, issuedAt);
  await auditEvent(req, "UPDATE", "admins", String(user!._id), {
    recordName: user!.name, updated: { credentialDelivery: delivery, sessionRevoked: true },
  });
  res.locals.auditHandled = true;
  res.json({ success: true, delivery, message: delivery === "sent" ? "New credentials sent; previous password revoked." : "Delivery failed. Retry after two minutes." });
}));
router.post("/admins/:id/reject", wrap(async (req, res) => {
  const user = await User.findOneAndUpdate({ _id: req.params.id, role: "admin", adminStatus: "pending_approval" }, { $set: { adminStatus: "rejected", isActive: false, accountStatus: "inactive" }, $inc: { sessionVersion: 1 } });
  if (!user) bad("Request already processed.", 409);
  await auditEvent(req, "REJECT", "admins", String(user!._id), {
    recordName: user!.name, previous: { adminStatus: "pending_approval" },
    updated: { adminStatus: "rejected", accountStatus: "inactive" },
  });
  res.locals.auditHandled = true;
  res.json({ success: true });
}));
router.patch("/admins/:id/status", wrap(async (req, res) => {
  const status = req.body?.status;
  if (!["active", "inactive", "blocked"].includes(status)) bad("Invalid status.");
  const user = await User.findOneAndUpdate({ _id: req.params.id, role: "admin", $or: [{ adminStatus: "approved" }, { adminStatus: { $exists: false } }] }, { $set: { accountStatus: status, isActive: status === "active" }, $inc: { sessionVersion: 1 }, $unset: { resetTokenHash: 1, resetTokenExpiresAt: 1 } }, { returnDocument: "after" });
  if (!user) bad("Approved admin not found.", 404);
  await auditEvent(req, status === "blocked" ? "BLOCK" : status === "active" ? "UNBLOCK" : "UPDATE", "admins", String(user!._id), {
    recordName: user!.name, updated: { accountStatus: status, isActive: status === "active", allSessionsRevoked: true },
  });
  res.locals.auditHandled = true;
  res.json({ success: true });
}));
router.get("/activity", wrap(async (req, res) => {
  const page = pageNumber(req.query.page, 1, 100000), limit = pageNumber(req.query.limit, 25, 100);
  const filter: Record<string, unknown> = {};
  if (req.query.adminId) { if (!Types.ObjectId.isValid(String(req.query.adminId))) bad("Invalid admin ID."); filter.performedBy = req.query.adminId; }
  if (req.query.action) filter.action = String(req.query.action).slice(0, 40);
  if (req.query.module) filter.module = String(req.query.module).slice(0, 80);
  if (req.query.from || req.query.to) {
    const range: Record<string, Date> = {};
    for (const [key, operator] of [["from", "$gte"], ["to", "$lte"]]) if (req.query[key]) { const date = new Date(String(req.query[key])); if (Number.isNaN(date.getTime())) bad("Invalid date range."); range[operator] = date; }
    filter.createdAt = range;
  }
  const search = String(req.query.search || "").slice(0, 100);
  if (search) filter.$or = ["actor.name", "actor.username", "actor.email"].map(key => ({ [key]: new RegExp(escapeRegex(search), "i") }));
  if (req.query.export === "csv") {
    const quote = (value: unknown) => { let s = String(value ?? ""); if (/^[=+@\-\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="admin-activity.csv"');
    res.write("Time UTC,Time Asia/Kolkata,Admin ID,Name,Username,Email,Role,Action,Module,Record,Status,IP,Details\r\n");
    for await (const log of AdminAuditLog.find(filter).sort({ createdAt: -1, _id: -1 }).lean().cursor()) {
      if (res.destroyed) break;
      res.write([log.createdAt.toISOString(), log.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }), log.performedBy, log.actor?.name, log.actor?.username, log.actor?.email, log.actor?.role, log.action, log.module, log.recordId, log.status, log.ip, JSON.stringify(log.metadata)].map(quote).join(",") + "\r\n");
    }
    await auditEvent(req, "EXPORT", "activity", "collection");
    return res.end();
  }
  const [items, total] = await Promise.all([AdminAuditLog.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(), AdminAuditLog.countDocuments(filter)]);
  res.json({ items, total, page, limit });
}));
export default router;
