import type { Request, Response, NextFunction } from "express";
import AdminAuditLog from "../models/AdminAuditLog.model";
// Does not capture request payloads, cookies or credentials. Runs after authentication middleware.
export function auditAdminMutations(req: Request, res: Response, next: NextFunction) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  res.once("finish", () => {
    const user = req.user;
    if (req.originalUrl.startsWith("/api/superadmin/") || !user || !["admin", "super_admin"].includes(user.role) || /\/(login|logout|send-otp|verify-otp|reset)(\/|$)/.test(req.path)) return;
    const segments = req.originalUrl.split("?")[0].split("/").filter(Boolean);
    const mod = (segments[1] === "admin" ? segments[2] : segments[1]) || "admin";
    const action = req.method === "POST" ? "CREATE" : req.method === "DELETE" ? "SOFT_DELETE" : "UPDATE";
    void AdminAuditLog.create({
      action, module: mod, recordId: String(segments.slice(2).join("/") || "action"),
      recordName: `${req.method} ${req.originalUrl.split("?")[0]}`.slice(0, 250),
      performedBy: user._id,
      metadata: { actorName: user.name, actorEmail: user.email, actorUsername: user.username || "", role: user.role,
        statusCode: res.statusCode, success: res.statusCode < 400, ip: req.ip || "" },
    }).catch(err => console.error("Admin audit log failed:", err));
  });
  next();
}
