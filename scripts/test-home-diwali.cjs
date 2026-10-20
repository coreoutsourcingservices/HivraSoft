/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS regression script. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function setup({ ready = true, loader = true, hidden = false, reduceMotion = false } = {}) {
  let visible = false, effect, mutation;
  const frames = [], timers = [], listeners = new Map();
  const document = {
    body: {}, visibilityState: hidden ? "hidden" : "visible",
    querySelector: () => loader ? {} : null,
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
  };
  let disconnected = false;
  const browser = {
    matchMedia: () => ({ matches: reduceMotion }),
    requestAnimationFrame: (fn) => { frames.push(fn); return frames.length; },
    cancelAnimationFrame: () => {},
    setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; },
    clearTimeout: () => {},
  };
  function load(file) {
    const context = { exports: {}, document, window: browser,
      MutationObserver: class { constructor(fn) { mutation = fn; } observe() {} disconnect() { disconnected = true; } },
      require: (name) => {
        if (name === "react") return { useState: () => [visible, (value) => { visible = value; }], useEffect: (fn) => { effect = fn; } };
        if (name === "react-dom") return { createPortal: (node) => node };
        if (name.endsWith(".module.css")) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
        if (name.startsWith("@/")) return load(path.resolve(name.slice(2) + ".ts"));
        return require(name);
      },
    };
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText, context);
    return context.exports;
  }
  const Home = load(path.resolve("src/components/Offers/HomeDiwaliCelebration.tsx")).default;
  const render = () => Home({ ready });
  assert.equal(render(), null);
  const cleanup = effect();
  return { render, cleanup, frames, timers, listeners,
    removeLoader: () => { loader = false; mutation?.(); },
    showTab: () => { document.visibilityState = "visible"; listeners.get("visibilitychange")?.(); },
    isVisible: () => visible, disconnected: () => disconnected,
  };
}

const loading = setup();
assert.equal(loading.frames.length, 0, "Rain must not start behind the root loader");
assert.equal(loading.timers.length, 0, "Five-second countdown must not run during the loader");
loading.removeLoader();
assert.equal(loading.frames.length, 1);
loading.frames[0]();
assert.equal(loading.isVisible(), true);
assert.equal(loading.timers[0].ms, 7000, "Five seconds of rain plus two seconds of settling AFTER loader removal");
assert.equal(loading.disconnected(), true);
const overlay = loading.render();
const particles = overlay.props.children.flat();
const ends = particles.map((p) => parseFloat(p.props.style["--delay"]) + parseFloat(p.props.style["--duration"]));
const starts = particles.map((p) => parseFloat(p.props.style["--delay"]));
assert.equal(Math.max(...starts), 5, "Keep emitting coins and bursts throughout the first five seconds");
assert(starts.every((time) => time <= 5), "No new particles after the five-second rain phase");
assert(ends.some((time) => time > 6.5), "Last particles keep settling after the rain stops");
assert(ends.every((time) => time <= 7), "Every particle fades before overlay cleanup");
assert(new Set(ends).size > 12, "Particles finish gradually at different times");
loading.timers[0].fn();
assert.equal(loading.isVisible(), false);
loading.cleanup();

const imageNotReady = setup({ ready: false, loader: false });
assert.equal(imageNotReady.frames.length, 0, "Wait for the actual popup image");
const background = setup({ loader: false, hidden: true });
assert.equal(background.frames.length, 0, "Background tabs must not consume the effect unseen");
background.showTab();
assert.equal(background.frames.length, 1);
background.cleanup();
const direct = setup({ loader: false });
assert.equal(direct.frames.length, 1, "Start immediately when popup and page are already visible");
direct.cleanup();
assert.equal(setup({ loader: false, reduceMotion: true }).frames.length, 0);
console.log("Homepage regression checks passed: readiness, five seconds of continuous rain, then two seconds of gradual settling.");
