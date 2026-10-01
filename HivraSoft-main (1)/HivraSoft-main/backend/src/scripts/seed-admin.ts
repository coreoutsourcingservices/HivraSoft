import "dotenv/config";
import mongoose from "mongoose";
import connectDatabase from "../config/database";
import User from "../models/User.model";
import { hashPassword } from "../utils/password";

async function seed() {
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!password) throw new Error("ADMIN_SEED_PASSWORD is required");
  await connectDatabase();
  await User.updateOne({ username: "admin" }, { $setOnInsert: {
    username: "admin", name: "Administrator", email: "admin@hivrasoft.invalid",
    phone: "not-set", role: "admin", isActive: true,
    passwordHash: await hashPassword(password),
  } }, { upsert: true, runValidators: true });
  console.log("Admin account is ready.");
}

seed().catch(() => { console.error("Admin seed failed."); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
