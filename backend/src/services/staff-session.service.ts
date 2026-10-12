import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import User, { type IUser } from "../models/User.model";

export const activeStaff = (user: IUser) => ["admin", "super_admin"].includes(user.role) && user.isActive && user.accountStatus === "active" && (!user.adminStatus || user.adminStatus === "approved");
export const staffCookie = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
export function issueStaffSession(res: Response, user: IUser, superadmin = false) {
  if (!process.env.JWT_SECRET) throw new Error("JWT secret missing");
  const token = jwt.sign({ id: String(user._id), role: user.role, sessionVersion: user.sessionVersion || 0, purpose: "staff_session" }, process.env.JWT_SECRET, { expiresIn: "8h" });
  res.cookie(superadmin ? "superadminToken" : "accessToken", token, { ...staffCookie, maxAge: 8 * 60 * 60_000 });
}
export async function readStaffSession(req: Request) {
  const token = req.cookies?.superadminToken || req.cookies?.accessToken || String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token || !process.env.JWT_SECRET) return null;
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (typeof payload === "string" || payload.purpose !== "staff_session" || typeof payload.id !== "string") return null;
  const user = await User.findById(payload.id).select("+sessionVersion");
  if (!user || !activeStaff(user) || payload.sessionVersion !== (user.sessionVersion || 0)) return null;
  return user;
}
export async function authenticateStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await readStaffSession(req);
    if (!user) return res.status(401).json({ message: "Please sign in again." });
    req.user = user;
    if (user.mustChangePassword && !["/api/admin/me", "/api/admin/change-password", "/api/admin/logout"].includes(req.originalUrl.split("?")[0])) return res.status(403).json({ message: "Change your temporary password first.", mustChangePassword: true });
    if (res.locals.auditSnapshot) await res.locals.auditSnapshot();
    next();
  } catch { return res.status(401).json({ message: "Session expired. Please sign in again." }); }
}
export function requireSuperadmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "super_admin") return res.status(403).json({ message: "Superadmin access required." });
  next();
}
