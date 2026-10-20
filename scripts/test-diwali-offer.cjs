/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS regression script. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function loadTs(file) {
  const source = fs.readFileSync(file, "utf8");
  const context = { exports: {}, require: (relative) => loadTs(path.resolve(path.dirname(file), relative + ".ts")) };
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, context);
  return context.exports;
}
const { getDiwaliOffers, getDiwaliProgress, getRegularCouponCode, isDiwaliCode } = loadTs(path.join(__dirname, "../lib/diwali-offer.ts"));
const now = Date.parse("2026-10-20T12:00:00Z");
const code = (name, minAmount, overrides = {}) => ({
  _id: name, code: name, minAmount, maxAmount: null,
  appliesToAllProducts: true, productIds: [], startsAt: null, endsAt: null, ...overrides,
});
const offers = [code("DIWALI1", 1499), code("DIWALI2", 1999), code("DIWALI", 2499), code("HIVRA20", 999)];
const select = (subtotal, codes = offers, products = ["p1"]) => getDiwaliOffers(codes, subtotal, products, now);

assert.equal(select(1498.99).matched, null);
assert.equal(select(1498.99).next.code, "DIWALI1");
for (const [amount, expected] of [[1499, "DIWALI1"], [1998.99, "DIWALI1"], [1999, "DIWALI2"], [2498.99, "DIWALI2"], [2499, "DIWALI"], [5000, "DIWALI"]]) {
  assert.equal(select(amount).matched.code, expected, `Correct slab at ₹${amount}`);
}
assert.equal(select(5000, []).matched, null, "No active API offers means no eligibility");
assert.equal(select(2499, [code("DIWALI3", 1499, { maxAmount: 1999 })]).matched, null);
assert.equal(select(1999, [code("DIWALI3", 1499, { maxAmount: 1999 })]).matched.code, "DIWALI3");
assert.equal(select(2499, [code("DIWALI", 1499, { startsAt: "2026-10-21T00:00:00Z" })]).matched, null);
assert.equal(select(2499, [code("DIWALI", 1499, { endsAt: "2026-10-19T00:00:00Z" })]).matched, null);
const scoped = [code("DIWALI1", 1499, { appliesToAllProducts: false, productIds: ["p2"] })];
assert.equal(select(1499, scoped).matched, null);
assert.equal(select(1499, scoped, ["p2"]).matched.code, "DIWALI1");
assert.equal(select(1499, [code("DIWALI1", NaN)]).matched, null);
assert.equal(isDiwaliCode(" diwali3 "), true);
assert.equal(isDiwaliCode("NOTDIWALI"), false);
assert.equal(isDiwaliCode("DIWALI20OFF"), false);
const progress = (amount) => getDiwaliProgress(offers, amount, ["p1"], now);
assert.equal(progress(1098).remaining, 401, "Reference cart needs ₹401 before GST");
assert.equal(progress(1098).target.minAmount, 1499);
assert.equal(progress(1498).matched, null, "GST cannot make a ₹1,498 purchase eligible");
assert.equal(progress(1499).remaining, 0);
assert.equal(progress(1499).percentage, 100);
assert.equal(progress(1999).matched.code, "DIWALI2");
assert.equal(progress(2499).matched.code, "DIWALI");
assert.equal(progress(9999).percentage, 100, "Progress remains capped above the highest slab");
assert.equal(progress(0).percentage, 0);
assert.equal(progress(-1).target, null);
assert.equal(getRegularCouponCode("DIWALI1"), "", "Internal Diwali code is hidden from coupon controls");
assert.equal(getRegularCouponCode("HIVRA20"), "HIVRA20", "Normal coupon controls are independent");
assert.equal(getRegularCouponCode(""), "");
console.log("Diwali checks passed: subtotal slabs, progress, dates, product scope and separate coupon controls.");
