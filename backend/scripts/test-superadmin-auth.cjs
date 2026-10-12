const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const express = require("express");
const cookieParser = require("cookie-parser");

process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
const User = require("../dist/models/User.model").default;
const { hashPassword } = require("../dist/utils/password");
const router = require("../dist/routes/superadmin.routes").default;

async function main() {
  const originalFindOne = User.findOne;
  const originalFindById = User.findById;
  const password = "test-only-superadmin-password";
  let user = { _id: "507f1f77bcf86cd799439011", username: "test-superadmin", name: "Test", role: "admin", isActive: true, accountStatus: "active", passwordHash: await hashPassword(password) };
  User.findOne = () => ({ select: async () => user });
  User.findById = async () => user;
  const app = express();
  app.use(express.json(), cookieParser());
  app.use("/api/superadmin", router);
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/superadmin`;
  const login = body => fetch(`${base}/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  try {
    assert.equal((await fetch(`${base}/me`)).status, 401);
    assert.equal((await login({ username: {}, password })).status, 400);
    assert.equal((await login({ username: user.username, password })).status, 401, "ordinary admin rejected");
    user.role = "super_admin";
    user.isActive = false;
    assert.equal((await login({ username: user.username, password })).status, 401, "inactive superadmin rejected");
    user.isActive = true;
    assert.equal((await login({ username: user.username, password: "wrong" })).status, 401);
    const response = await login({ username: user.username, password });
    assert.equal(response.status, 200);
    const setCookie = response.headers.get("set-cookie");
    assert.match(setCookie, /superadminToken=/);
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /Path=\/api\/superadmin/i);
    assert(!setCookie.includes("accessToken="), "admin session remains separate");
    const cookie = setCookie.split(";")[0];
    const authenticated = await fetch(`${base}/me`, { headers: { Cookie: cookie } });
    assert.equal(authenticated.status, 200);
    assert.equal((await authenticated.json()).user.username, user.username);
    user.role = "admin";
    assert.equal((await fetch(`${base}/me`, { headers: { Cookie: cookie } })).status, 403, "role is checked on every request");
    assert.equal((await fetch(`${base}/me`, { headers: { Cookie: "superadminToken=invalid" } })).status, 401);
    const logout = await fetch(`${base}/logout`, { method: "POST" });
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get("set-cookie"), /superadminToken=;/);
    console.log("Superadmin auth checks passed: validation, role restrictions, inactive accounts, password, session, revocation and logout.");
  } finally {
    User.findOne = originalFindOne;
    User.findById = originalFindById;
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
