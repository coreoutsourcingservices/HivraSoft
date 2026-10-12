import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import jwt from "jsonwebtoken";
import User from "../models/User.model";
import { hashPassword, verifyPassword } from "../utils/password";

const router = Router();
const cookieName = "superadminToken";
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/api/superadmin" };
const dummyHash = hashPassword("invalid-superadmin-login");

router.post("/login", rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  message: { message: "Too many login attempts. Try again in 15 minutes." },
}), async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== "string" || !username.trim() || username.length > 100 || typeof password !== "string" || !password || password.length > 256) {
    return res.status(400).json({ message: "Enter your login ID and password." });
  }
  try {
    const user = await User.findOne({ username: username.trim() }).select("+passwordHash");
    const valid = await verifyPassword(password, user?.passwordHash || await dummyHash);
    if (!valid || !user?.isActive || user.accountStatus === "blocked" || user.role !== "super_admin") {
      return res.status(401).json({ message: "Incorrect login ID or password." });
    }
    if (!process.env.JWT_SECRET) throw new Error("JWT secret missing");
    const token = jwt.sign({ id: String(user._id), purpose: "superadmin_session" }, process.env.JWT_SECRET, { expiresIn: "8h", audience: "superadmin" });
    res.cookie(cookieName, token, { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 });
    return res.json({ success: true, user: { name: user.name, username: user.username } });
  } catch {
    return res.status(503).json({ message: "Login is unavailable. Please try again." });
  }
});

router.get("/me", async (req, res) => {
  const token = req.cookies?.[cookieName];
  if (!token) return res.status(401).json({ message: "Please sign in." });
  try {
    if (!process.env.JWT_SECRET) throw new Error("JWT secret missing");
    const payload = jwt.verify(token, process.env.JWT_SECRET, { audience: "superadmin" });
    if (typeof payload === "string" || payload.purpose !== "superadmin_session" || typeof payload.id !== "string") {
      return res.status(401).json({ message: "Invalid session." });
    }
    const user = await User.findById(payload.id);
    if (!user?.isActive || user.accountStatus === "blocked" || user.role !== "super_admin") {
      return res.status(403).json({ message: "Superadmin access required." });
    }
    return res.json({ success: true, user: { name: user.name, username: user.username } });
  } catch {
    return res.status(401).json({ message: "Session expired. Please sign in again." });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie(cookieName, cookieOptions);
  return res.json({ success: true });
});

export default router;
