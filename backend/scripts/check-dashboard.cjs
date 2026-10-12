require("dotenv").config({ quiet: true });
require("tsx/cjs");
const mongoose = require("mongoose");
const { getAdminDashboard } = require("../src/controllers/admin.controller.ts");
async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000, socketTimeoutMS: 20000 });
  const started = Date.now();
  let status = 200;
  await getAdminDashboard({}, { status(value) { status = value; return this; }, json(data) { console.log({ status, elapsedMs: Date.now()-started, success: data.success, error: data.success ? undefined : data.message }); return this; } });
}
main().catch(error=>{console.error("Dashboard diagnostic failed:", error.name);process.exitCode=1;}).finally(()=>mongoose.disconnect());
