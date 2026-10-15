require("tsx/cjs");
const assert = require("node:assert/strict");
const { relatedCategoryScope } = require("../src/utils/related-categories.ts");
const categories = [
  { _id: "men", slug: "men" }, { _id: "women", slug: "women" },
  { _id: "briefs", parent: "men" }, { _id: "trunks", parent: "men" },
  { _id: "bra", parent: "women" }, { _id: "panties", parent: "women" },
  { _id: "nested", parent: "briefs", ancestors: ["men", "briefs"] },
  { _id: "accessories", slug: "accessories" }, { _id: "belt", parent: "accessories" },
];
assert.deepEqual(relatedCategoryScope(["nested"], categories), {
  allowedIds: ["men", "briefs", "trunks", "nested"], excludedIds: ["women", "bra", "panties"],
});
assert.deepEqual(relatedCategoryScope(["bra"], categories), {
  allowedIds: ["women", "bra", "panties"], excludedIds: ["men", "briefs", "trunks", "nested"],
});
assert.deepEqual(relatedCategoryScope(["men", "accessories"], categories).allowedIds, ["men", "briefs", "trunks", "nested"]);
assert.deepEqual(relatedCategoryScope(["belt"], categories), { allowedIds: ["accessories", "belt"], excludedIds: [] });
assert.equal(relatedCategoryScope(["men", "women"], categories), null);
assert.equal(relatedCategoryScope([], categories), null);
assert.equal(relatedCategoryScope(["missing"], categories), null);
assert.equal(relatedCategoryScope(["x"], [{ _id: "x", parent: "y" }, { _id: "y", parent: "x" }]), null);
console.log("Passed: nested Men/Women department matching, fallback scope, mixed/unknown categories and cycles.");
