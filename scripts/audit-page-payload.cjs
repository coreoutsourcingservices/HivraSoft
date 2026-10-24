// Audit actual production HTTP responses, including every URL in the sitemap.
// Usage: node scripts/audit-page-payload.cjs http://127.0.0.1:3105 [.local/page-audit.json]
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const https = require("node:https");
const zlib = require("node:zlib");
const base = new URL(process.argv[2] || "http://127.0.0.1:3105");
const output = process.argv[3] || ".local/page-audit.json";
function request(route, redirects = 0) {
  return new Promise((resolve, reject) => {
    const url = new URL(route, base);
    const req = (url.protocol === "https:" ? https : http).get(url, {
      headers: { "Accept-Encoding": "gzip, br", "User-Agent": "Googlebot" },
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", async () => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects < 5) {
          const destination = new URL(res.headers.location, url);
          // Follow the same route on the tested server, never production hosts.
          try { resolve(await request(destination.pathname + destination.search, redirects + 1)); } catch (error) { reject(error); }
          return;
        }
        try {
          const wire = Buffer.concat(chunks);
          const html = res.headers["content-encoding"] === "br" ? zlib.brotliDecompressSync(wire)
            : res.headers["content-encoding"] === "gzip" ? zlib.gunzipSync(wire) : wire;
          resolve({ status: res.statusCode, bytes: html.length, transferredBytes: wire.length, html: html.toString() });
        } catch (error) { reject(error); }
      });
      res.on("error", reject);
    });
    req.setTimeout(25000, () => req.destroy(new Error("HTTP response timed out")));
    req.on("error", reject);
  });
}
(async () => {
  const manifest = JSON.parse(fs.readFileSync(".next/server/app-paths-manifest.json", "utf8"));
  const routes = new Set(Object.keys(manifest).filter((p) => p.endsWith("/page") && !p.startsWith("/admin") && !p.startsWith("/_"))
    .map((p) => p.slice(0, -5) || "/").filter((p) => !p.includes("[")));
  for (const p of ["/women", "/men", "/accessories"]) routes.add(p);
  // Some legacy routes are deliberately retired with notFound().
  const expectedNotFound = new Set();
  for (const route of routes) {
    const file = "app" + (route === "/" ? "" : route) + "/page.tsx";
    if (fs.existsSync(file)) {
      const source = fs.readFileSync(file, "utf8");
      if (source.length < 250 && /notFound\(\)/.test(source)) expectedNotFound.add(route);
    }
  }
  const discoveryErrors = [];
  try {
    const sitemap = await request("/sitemap.xml");
    if (sitemap.status !== 200) throw new Error("Sitemap HTTP " + sitemap.status);
    for (const match of sitemap.html.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const url = new URL(match[1].replace(/&amp;/g, "&"));
      routes.add(url.pathname + url.search);
    }
  } catch (error) { discoveryErrors.push(error.message); }
  const queue = [...routes].sort();
  const results = [];
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const route = queue.shift();
      try {
        const result = await request(route);
        const row = { path: route, status: result.status, expectedStatus: expectedNotFound.has(route) ? 404 : 200, htmlBytes: result.bytes, transferredBytes: result.transferredBytes, within300KB: result.bytes <= 300000 };
        results.push(row);
        console.log(JSON.stringify(row));
      } catch (error) { results.push({ path: route, error: error.message }); }
    }
  }));
  const missing = await request("/page-payload-audit-missing-route");
  const report = { budgetBytes: 300000, discoveryErrors, missingRouteStatus: missing.status, results: results.sort((a, b) => a.path.localeCompare(b.path)) };
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
  const failures = results.filter((r) => r.error || r.status !== r.expectedStatus || !r.within300KB);
  console.log("Checked " + results.length + " pages; " + failures.length + " require attention. Report: " + output);
  if (failures.length || discoveryErrors.length || missing.status !== 404) process.exitCode = 1;
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
