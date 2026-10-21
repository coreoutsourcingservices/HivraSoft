/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS regression script. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
const offers = [1499, 1999, 2499].map((minAmount, i) => ({
  _id: String(i), code: `DIWALI${i + 1}`, minAmount, maxAmount: null,
  startsAt: null, endsAt: null, appliesToAllProducts: true, productIds: [],
}));

let effects, setters, timers, stateIndex;
function load(file) {
  const context = { exports: {}, window: {
    matchMedia: () => ({ matches: false }),
    setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; },
    clearTimeout: () => {},
  }, require: (name) => {
    if (name === "react") return { ...React,
      useState: () => { const index = stateIndex++; return [[offers, false, true][index], (value) => setters.push({ index, value })]; },
      useRef: (current) => ({ current }),
      useEffect: (fn) => effects.push(fn),
    };
    if (name === "next/link") return ({ children, ...props }) => React.createElement("a", props, children);
    if (name === "@/lib/api") return { apiFetch: async () => ({ codes: offers }) };
    if (name.endsWith(".module.css")) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (name.startsWith("@/")) return load(path.join(root, name.slice(2) + ".ts"));
    if (name.startsWith(".")) return load(path.resolve(path.dirname(file), name + ".ts"));
    return require(name);
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, context);
  return context.exports;
}

const { default: DiwaliOffer } = load(path.join(root, "src/components/Offers/DiwaliOffer.tsx"));
function render(overrides = {}) {
  effects = []; setters = []; timers = []; stateIndex = 0;
  const tree = DiwaliOffer({ subtotal: 1499, productIds: ["p1"], appliedCode: "", paymentMethod: "online", ...overrides });
  return renderToStaticMarkup(tree);
}

let html = render({ subtotal: 1098 });
assert(html.includes("₹401"), "Reference subtotal shows ₹401 remaining");
assert(html.includes("Shop More"));
assert(html.includes("₹1,098 / ₹1,499"));
assert(!html.includes("DIWALI1"), "Internal codes never appear in the card");

html = render({ subtotal: 1498, appliedCode: "DIWALI1" });
assert(!html.includes("You are eligible"), "A stored coupon alone cannot unlock a below-threshold cart");
html = render({ appliedCode: "HIVRA20" });
assert(html.includes("You are eligible for the offer!"), "A regular coupon preserves campaign eligibility");
assert(!html.includes("Remove your current"));
assert(!html.includes("HIVRA20"));
html = render({ appliedCode: "DIWALI1" });
assert(!html.includes("DIWALI1"));
assert(!html.includes("Remove"));

html = render({ paymentMethod: "cod" });
assert(html.includes("Please select Pay Online"));
assert(!html.includes("You are eligible"));
assert.equal(effects.at(-1)(), undefined, "COD does not start celebrations");

const applied = [];
render({ onAutoApply: async (code) => { applied.push(code); } });
effects[0](); effects[2]();
assert.deepEqual(applied, ["DIWALI1"], "Matching offer auto-applies");
render({ appliedCode: "HIVRA20", onAutoApply: async (code) => { applied.push(code); } });
effects[0](); effects[2]();
assert.deepEqual(applied, ["DIWALI1", "DIWALI1"], "Qualifying Diwali offer replaces a regular coupon instead of combining");

render();
const cleanup = effects.at(-1)();
assert.equal(timers[0].ms, 0);
timers[0].fn();
assert.equal(setters.at(-1).value, true);
assert(timers[1].ms >= 5000, "Celebration stays visible for at least five seconds");
timers[1].fn();
assert.equal(setters.at(-1).value, false);
cleanup();
console.log("Diwali UI checks passed: hidden codes, separate coupons, COD/online messaging, progress and five-second celebration.");

if (process.env.DIWALI_PREVIEW_PATH) {
  const css = fs.readFileSync(path.join(root, "src/components/Offers/DiwaliOffer.module.css"), "utf8");
  const examples = [
    ["Cart · ₹1,098 purchase subtotal", { subtotal: 1098, paymentMethod: undefined }],
    ["Cart · ₹1,499 purchase subtotal", { subtotal: 1499, paymentMethod: undefined, appliedCode: "DIWALI1" }],
    ["Checkout · online payment", { subtotal: 1999, paymentMethod: "online", compact: true, appliedCode: "HIVRA20" }],
    ["Checkout · cash on delivery", { subtotal: 2499, paymentMethod: "cod", compact: true }],
  ];
  fs.writeFileSync(process.env.DIWALI_PREVIEW_PATH, '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Diwali component review</title><style>body{font-family:Arial,sans-serif;background:#faf6f3;margin:0;padding:28px}main{display:grid;grid-template-columns:repeat(2,minmax(0,430px));gap:26px;max-width:900px;margin:auto}article{min-width:0;background:#fff;border-radius:18px;padding:18px}h2{font-size:13px;color:#5b4540}*{box-sizing:border-box}@media(max-width:650px){body{padding:14px}main{grid-template-columns:minmax(0,1fr)}article{padding:12px}}' + css + '</style><main>' + examples.map(([title, props]) => '<article><h2>' + title + '</h2>' + render(props) + '</article>').join("") + '</main></html>');
}
