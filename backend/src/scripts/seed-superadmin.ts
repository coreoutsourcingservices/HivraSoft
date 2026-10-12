/**
 * One-time, environment-driven superadmin provisioning.
 * Run from the backend directory with:
 *   npm run seed:superadmin
 *
 * Never upgrade an existing account to superadmin implicitly.
 * Never print supplied credentials to stdout.
 */
import "dotenv/config";
import mongoose from "mongoose";
import connectDatabase from "../config/database";
import User from "../models/User.model";
import { hashPassword } from "../utils/password";

async function seedSuperadmin(): Promise<void> {
  const email = (process.env.SUPERADMIN_SEED_EMAIL || "").trim().toLowerCase();
  const username = (process.env.SUPERADMIN_SEED_USERNAME || "").trim();
  const name = (process.env.SUPERADMIN_SEED_NAME || "").trim();
  const phone = (process.env.SUPERADMIN_SEED_PHONE || "").trim();
  const password = process.env.SUPERADMIN_SEED_PASSWORD || "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error("Set a valid SUPERADMIN_SEED_EMAIL.");
  if (!/^[A-Za-z][\w.-]{2,63}$/.test(username)) throw new Error("Set SUPERADMIN_SEED_USERNAME (3-64 characters; letters, digits, _, . or -).");
  if (name.length < 2 || name.length > 100 || !/^\+?\d{10,15}$/.test(phone)) throw new Error("Set valid SUPERADMIN_SEED_NAME and SUPERADMIN_SEED_PHONE.");
  if (password.length < 16 || password.length > 128 || !/[A-Za-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    throw new Error("SUPERADMIN_SEED_PASSWORD must be at least 16 characters with letters, digits and symbols.");
  }
  await connectDatabase();
  const found = await User.findOne({ $or: [{ email }, { username }] });
  if (found) {
    if (found.role !== "super_admin" || found.email !== email || found.username !== username) {
      throw new Error("This email or username already belongs to another account. Provisioning aborted.");
    }
    console.log("Superadmin already exists; credentials and role were not modified.");
    return;
  }
  try {
    await User.create({
      name, email, username, phone,
      role: "super_admin", adminStatus: "approved", emailVerified: true,
      isActive: true, accountStatus: "active", passwordHash: await hashPassword(password),
      mustChangePassword: false, sessionVersion: 0, approvedAt: new Date(),
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) throw new Error("Superadmin email or username was registered concurrently.");
    throw error;
  }
  console.log("Superadmin account provisioned. Store the supplied credentials securely.");
}

seedSuperadmin().catch(error => { console.error(error instanceof Error ? error.message : "Superadmin provisioning failed."); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); });
