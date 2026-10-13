import "dotenv/config";
import mongoose from "mongoose";
import connectDatabase from "../config/database";
import User from "../models/User.model";
import { hashPassword } from "../utils/password";
async function seed() {
  const { SUPERADMIN_SEED_NAME, SUPERADMIN_SEED_EMAIL, SUPERADMIN_SEED_USERNAME, SUPERADMIN_SEED_PHONE, SUPERADMIN_SEED_PASSWORD } = process.env;
  if (!SUPERADMIN_SEED_NAME || !SUPERADMIN_SEED_EMAIL || !SUPERADMIN_SEED_USERNAME || !SUPERADMIN_SEED_PHONE || !SUPERADMIN_SEED_PASSWORD || SUPERADMIN_SEED_PASSWORD.length < 16)
    throw new Error("Set SUPERADMIN_SEED_* variables in backend/.env (password >=16 chars).");
  await connectDatabase();
  if (await User.exists({ $or: [{ role: "super_admin" }, { email: SUPERADMIN_SEED_EMAIL.toLowerCase() }, { username: SUPERADMIN_SEED_USERNAME.toLowerCase() }] })) {
    console.log("Account already exists; password was NOT overwritten."); return;
  }
  await User.create({ name: SUPERADMIN_SEED_NAME, email: SUPERADMIN_SEED_EMAIL.toLowerCase(), username: SUPERADMIN_SEED_USERNAME.toLowerCase(), phone: SUPERADMIN_SEED_PHONE, role: "super_admin", emailVerified: true, isActive: true, accountStatus: "active", passwordHash: await hashPassword(SUPERADMIN_SEED_PASSWORD), mustChangePassword: true, temporaryPasswordExpiresAt: new Date(Date.now() + 86400_000) });
  console.log("Superadmin account created. Please change its temporary password after login.");
}
seed().catch(e => { console.error("Seed failed:", e.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
