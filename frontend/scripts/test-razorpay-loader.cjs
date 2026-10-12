const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const code = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, "../lib/razorpay-loader.ts"), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

function setup() {
  const scripts = [];
  const timers = new Map();
  let nextTimer = 0;
  const window = {
    setTimeout(callback) { timers.set(++nextTimer, callback); return nextTimer; },
    clearTimeout(id) { timers.delete(id); },
  };
  const document = {
    querySelector() { return scripts[0] ?? null; },
    createElement() {
      const script = new EventTarget();
      script.remove = () => { scripts.splice(scripts.indexOf(script), 1); };
      return script;
    },
    body: { appendChild(script) { scripts.push(script); } },
  };
  const context = { exports: {}, window, document };
  vm.runInNewContext(code, context);
  return { ...context.exports, window, document, scripts, timers };
}

async function main() {
  const env = setup();
  const first = env.loadRazorpayScript();
  assert.equal(env.loadRazorpayScript(), first, "Concurrent loads share a request");
  assert.equal(env.scripts.length, 1);
  env.scripts[0].dispatchEvent(new Event("error"));
  assert.equal(await first, false);
  assert.equal(env.scripts.length, 0, "Failed tag is removed");
  assert.equal(env.timers.size, 0);

  const retry = env.loadRazorpayScript();
  env.window.Razorpay = function () {};
  env.scripts[0].dispatchEvent(new Event("load"));
  assert.equal(await retry, true, "A failed load can be retried successfully");
  assert.equal(await env.loadRazorpayScript(), true);
  assert.equal(env.scripts.length, 1);

  const stalled = setup();
  stalled.document.body.appendChild(stalled.document.createElement("script"));
  const waiting = stalled.loadRazorpayScript();
  assert.equal(stalled.scripts.length, 1, "Existing script is reused");
  [...stalled.timers.values()][0]();
  assert.equal(await waiting, false, "A stalled existing tag times out");
  assert.equal(stalled.scripts.length, 0);

  const invalid = setup();
  const loading = invalid.loadRazorpayScript();
  invalid.scripts[0].dispatchEvent(new Event("load"));
  assert.equal(await loading, false, "Load without Razorpay API is rejected");

  assert.equal(env.razorpayFailureMessage({ error: { description: "Gateway declined" } }), "Gateway declined");
  const domainError = "Payment blocked as website does not match registered website(s)";
  assert.equal(env.razorpayFailureMessage({ error: { description: domainError } }), domainError);
  assert.equal(env.razorpayFailureMessage(null), "Payment failed. Please try again.");
  assert.equal(env.razorpayFailureMessage({ error: { description: " " } }), "Payment failed. Please try again.");
  console.log("Razorpay loader and error regression checks passed");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
