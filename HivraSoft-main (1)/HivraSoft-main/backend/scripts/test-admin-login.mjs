import assert from "node:assert/strict";

const api = process.env.TEST_API_URL || "http://localhost:5000";
const site = process.env.TEST_SITE_URL || "http://localhost:3000";
const password = process.env.ADMIN_SEED_PASSWORD;
assert.ok(password, "Set ADMIN_SEED_PASSWORD to test the seeded account");
const login = (value) => fetch(`${api}/api/admin/login`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "admin", password: value }),
});
assert.equal((await fetch(`${api}/api/admin/me`)).status, 401);
assert.equal((await login("wrong-password")).status, 401);
const response = await login(password);
assert.equal(response.status, 200);
const cookie = response.headers.get("set-cookie");
assert.ok(cookie.includes("HttpOnly"));
const headers = { Cookie: cookie.split(";")[0] };
const session = await fetch(`${api}/api/admin/me`, { headers });
assert.equal(session.status, 200);
assert.equal((await session.json()).user.role, "admin");
assert.ok((await (await fetch(`${site}/admin`, { headers })).text()).includes("Welcome to HivraSoft"));
for (const path of ["/admin", "/admin/products"]) {
  const html = await (await fetch(`${site}${path}`)).text();
  assert.ok(html.includes("Admin sign in"));
  assert.ok(!html.includes(password));
}
const logout = await fetch(`${api}/api/auth/logout`, { method: "POST", headers });
assert.equal(logout.status, 200);
assert.ok(logout.headers.get("set-cookie").includes("accessToken=;"));
console.log("PASS: anonymous access, invalid password, admin session, dashboard, protected pages, logout");
