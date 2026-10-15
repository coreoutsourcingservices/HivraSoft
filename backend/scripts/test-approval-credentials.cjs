require("tsx/cjs");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
process.env.SMTP_USER = "test@example.com";
process.env.SMTP_PASS = "test-only";
const express = require("express");
const User = require("../src/models/User.model.ts").default;
const Application = require("../src/models/AdminApplication.model.ts").default;
const Audit = require("../src/models/AdminAuditLog.model.ts").default;
const transporter = require("../src/config/mail.ts").default;
const { issueStaffSession } = require("../src/services/staff-session.service.ts");
const { verifyPassword } = require("../src/utils/password.ts");
const router = require("../src/routes/superadmin.routes.ts").default;

async function main() {
  const superadmin = { _id: "507f1f77bcf86cd799439011", role: "super_admin", isActive: true, accountStatus: "active", sessionVersion: 0 };
  let admin, email, failMail = false;
  const application = { _id: "507f1f77bcf86cd799439012", name: "Test Admin", email: "registered@example.com", phone: "9876543210", status: "pending_approval", emailVerified: true, save: async () => {} };
  User.findById = () => ({ select: async () => superadmin });
  Application.findOneAndUpdate = async (filter, update) => {
    if (application.status !== filter.status) return null;
    Object.assign(application, update.$set); return application;
  };
  User.create = async (data) => admin = { _id: "507f1f77bcf86cd799439013", ...data, save: async () => {} };
  User.findOne = async () => admin;
  Audit.create = async () => ({});
  transporter.sendMail = async (input) => { if (failMail) throw new Error("Simulated SMTP failure"); email = input; };
  let cookie;
  issueStaffSession({ cookie: (name, token) => { cookie = `${name}=${token}`; } }, superadmin, true);
  const app = express(); app.use(express.json(), require("cookie-parser")()); app.use("/api/superadmin", router);
  const server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve));
  const post = path => fetch(`http://127.0.0.1:${server.address().port}/api/superadmin/requests/${application._id}/${path}`, { method: "POST", headers: { Cookie: cookie } });
  const checkEmail = async () => {
    assert.equal(email.to, application.email);
    assert(email.html.includes(admin.username));
    const password = email.html.match(/Temporary password: <b>([^<]+)<\/b>/)[1];
    assert.equal(password.slice(0, -7), admin.username);
    assert.match(password.slice(-7), /^@\d{6}$/);
    assert(await verifyPassword(password, admin.passwordHash));
    assert.equal(admin.mustChangePassword, true);
    assert(admin.temporaryPasswordExpiresAt > new Date());
    assert.equal(admin.isActive, true);
    assert.equal(application.status, "approved");
  };
  try {
    assert.equal((await post("approve")).status, 200); await checkEmail();
    assert.equal((await post("approve")).status, 409, "approval cannot be replayed");
    application.status = "pending_approval"; failMail = true;
    assert.equal((await post("approve")).status, 503);
    assert.equal(admin.isActive, false); assert.equal(application.status, "email_failed");
    const login = admin.username;
    failMail = false; assert.equal((await post("resend")).status, 200); await checkEmail();
    assert.equal(admin.username, login, "resend preserves the user ID");
    console.log("Passed: approval email recipient, userid@6-digits password, hash, expiry, replay, failed delivery and resend.");
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
