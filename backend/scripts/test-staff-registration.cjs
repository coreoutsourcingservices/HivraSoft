const assert = require("node:assert/strict");
const express = require("express");
const crypto = require("node:crypto");
process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
process.env.SMTP_USER = "test@example.com";
process.env.SMTP_PASS = "test-only";
require("tsx/cjs");
const User = require("../src/models/User.model.ts").default;
const Application = require("../src/models/AdminApplication.model.ts").default;
const Otp = require("../src/models/Otp.model.ts").default;
const transporter = require("../src/config/mail.ts").default;
let record, application, sentOtp, failMail = false;
User.exists = async () => false;
Application.exists = async () => false;
Application.findOneAndUpdate = async (filter, update) => application = update.$set;
Otp.findOneAndUpdate = async (filter, update) => {
  if (update.$set) {
    if (record && Date.now() - record.updatedAt < 60000) throw Object.assign(new Error("Duplicate"), { code: 11000 });
    return record = { _id: "challenge", ...update.$set, email: filter.email, updatedAt: Date.now() };
  }
  if (!record || record.attempts >= 5 || record.expiresAt <= new Date()) return null;
  record.attempts++;
  return record;
};
Otp.updateOne = async (_, update) => Object.assign(record, update.$set);
Otp.deleteOne = async () => { record = undefined; return { deletedCount: 1 }; };
transporter.sendMail = async input => { if (failMail) throw new Error("Test SMTP unavailable"); sentOtp = input.html.match(/\b\d{6}\b/)[0]; };
const app = express();
app.use(express.json(), require("../src/routes/staff-registration.routes.ts").default);
async function main() {
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const post = async (path, body) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { status: response.status, data: await response.json() };
  };
  const input = { name: "Test Admin", email: "test@example.com", phone: "9876543210" };
  try {
    for (let i = 0; i < 25; i++) assert.equal((await post("/verify-otp", {})).status, 400, "no request-count rate limit");
    const signup = await post("/signup", input);
    assert.equal(signup.status, 200);
    assert.equal(application, undefined, "no application before OTP verification");
    assert.notEqual(record.email, input.email, "email is opaque in OTP storage");
    assert.equal((await post("/signup", input)).status, 429);
    const session = { registrationToken: signup.data.registrationToken };
    assert.equal((await post("/verify-otp", { ...session, otp: sentOtp === "000000" ? "000001" : "000000" })).status, 400);
    assert.equal(application, undefined);
    assert.equal((await post("/verify-otp", { ...session, otp: sentOtp })).status, 200);
    assert.equal(application.status, "pending_approval");
    assert.equal(application.emailVerified, true);
    assert.equal((await post("/verify-otp", { ...session, otp: sentOtp })).status, 400, "replay rejected");
    failMail = true;
    assert.equal((await post("/signup", input)).status, 503);
    assert.equal(record, undefined, "failed delivery removes challenge");
    failMail = false;
    const fresh = await post("/register/send-otp", input);
    record.expiresAt = new Date(0);
    assert.equal((await post("/register/verify-otp", { registrationToken: fresh.data.registrationToken, otp: sentOtp })).status, 400);
    console.log("Passed: delayed persistence, opaque OTP storage, cooldown, wrong/expired OTP, verification, replay and SMTP failure.");
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
