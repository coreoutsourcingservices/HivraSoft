/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS regression script. */
require("tsx/cjs");
const assert = require("node:assert/strict");
const { assertDiscountCodeCombination } = require("../src/services/discount-code-policy.ts");

assert.throws(() => assertDiscountCodeCombination("DIWALI1", "HIVRA20", true), /cannot be combined/);
assert.throws(() => assertDiscountCodeCombination(" diwali ", "SAVE10", true), /cannot be combined/);
assert.doesNotThrow(() => assertDiscountCodeCombination("DIWALI1", "DIWALI2", true));
assert.doesNotThrow(() => assertDiscountCodeCombination("DIWALI1", "HIVRA20", false));
assert.doesNotThrow(() => assertDiscountCodeCombination("HIVRA20", "DIWALI1", true));
assert.doesNotThrow(() => assertDiscountCodeCombination("", "HIVRA20", false));
console.log("Discount exclusivity passed: regular coupons blocked, slab upgrades and expired offers allowed.");
