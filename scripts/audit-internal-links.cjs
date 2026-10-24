const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const { Parser } = createRequire(require.resolve("sanitize-html"))("htmlparser2");

const base = new URL(process.argv[2] || "http://127.0.0.1:3105");
const output = process.argv[3] || ".local/internal-link-audit.json";
const canonical = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://hivrasoft.com");
const hostname = (url) => url.hostname.toLowerCase().replace(/^www\./, "");
const isInternal = (url) => (hostname(url) === hostname(canonical) && url.port === canonical.port) || url.origin === base.origin;
const responses = new Map();
const rechecks = [];
async function request(route, redirects = []) {
  if (redirects.length > 5) throw new Error("Too many redirects");
  const response = await fetch(new URL(route, base), { redirect: "manual", signal: AbortSignal.timeout(25000), headers: { "User-Agent": "Googlebot" } });
  if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
    const target = new URL(response.headers.get("location"), new URL(route, base));
    await response.body?.cancel();
    if (!isInternal(target)) return { status: response.status, redirects, externalRedirect: target.href, html: "" };
    return request(target.pathname + target.search, redirects.concat(route));
  }
  return { status: response.status, redirects, html: (response.headers.get("content-type") || "").includes("text/html") || route === "/sitemap.xml" ? await response.text() : "" };
}
function cachedRequest(route) {
  if (!responses.has(route)) responses.set(route, (async () => {
    const read = () => request(route).catch((error) => ({ error: error.message, html: "" }));
    const initial = await read();
    if (!initial.error && initial.status < 400) return initial;
    const result = await read();
    rechecks.push({ path: route, initialStatus: initial.status, initialError: initial.error, finalStatus: result.status, finalError: result.error });
    return result;
  })());
  return responses.get(route);
}
async function parallel(items, fn) {
  const queue = [...items];
  await Promise.all(Array.from({ length: 3 }, async () => { while (queue.length) await fn(queue.shift()); }));
}
(async () => {
  const sitemap = await cachedRequest("/sitemap.xml");
  if (sitemap.status !== 200) throw new Error("Sitemap unavailable: " + (sitemap.error || sitemap.status));
  const routes = new Set(["/"]);
  for (const match of sitemap.html.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const url = new URL(match[1].replace(/&amp;/g, "&"));
    routes.add(url.pathname + url.search);
  }
  if (fs.existsSync(".next/server/app-paths-manifest.json")) {
    const manifest = JSON.parse(fs.readFileSync(".next/server/app-paths-manifest.json", "utf8"));
    for (const name of Object.keys(manifest)) {
      if (!name.endsWith("/page") || name.startsWith("/admin") || name.startsWith("/_") || name.includes("[")) continue;
      const route = name.slice(0, -5) || "/";
      const file = "app" + (route === "/" ? "" : route) + "/page.tsx";
      const source = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
      if (source.length < 250 && /notFound\(\)/.test(source)) continue;
      routes.add(route);
    }
  }
  // Do not silently miss categories when the sitemap is temporarily incomplete.
  const api = (process.env.API_URL || "https://backend.hivrasoft.com").replace(/\/+$/, "");
  const categoryResponse = await fetch(api + "/api/categories/tree?active=true", { signal: AbortSignal.timeout(20000) });
  if (!categoryResponse.ok) throw new Error("Category discovery HTTP " + categoryResponse.status);
  const categoryData = await categoryResponse.json();
  function visitCategories(nodes, prefix = "") {
    for (const node of nodes) {
      if (node.isActive === false) continue;
      const route = prefix + "/" + node.slug;
      routes.add(route);
      visitCategories(node.children || [], route);
    }
  }
  visitCategories(categoryData.categories || []);
  const links = new Map();
  const pages = [];
  let skipped = 0;
  await parallel(routes, async (route) => {
    const result = await cachedRequest(route);
    pages.push({ path: route, status: result.status, error: result.error, htmlBytes: Buffer.byteLength(result.html || "") });
    if (!result.html || result.status !== 200) return;
    const parser = new Parser({
      onopentag(name, attributes) {
        if (name !== "a" || !attributes.href) return;
        const href = attributes.href.trim();
        if (!href || href.startsWith("#")) { skipped++; return; }
        try {
          const url = new URL(href, new URL(route, canonical));
          if (!/^https?:$/.test(url.protocol) || !isInternal(url) || url.pathname.startsWith("/api/")) { skipped++; return; }
          const target = url.pathname + url.search;
          const item = links.get(target) || { path: target, occurrences: 0, sources: new Set() };
          item.occurrences++;
          item.sources.add(route);
          links.set(target, item);
        } catch { skipped++; }
      },
    }, { decodeEntities: true });
    parser.write(result.html); parser.end();
  });
  const checked = [];
  await parallel(links.values(), async (link) => {
    const result = await cachedRequest(link.path);
    checked.push({ ...link, sources: [...link.sources], status: result.status, error: result.error, redirects: result.redirects || [], externalRedirect: result.externalRedirect });
  });
  const broken = checked.filter((r) => r.error || r.status >= 400 || r.externalRedirect);
  const failedPages = pages.filter((r) => r.error || r.status !== 200);
  const legacyAliases = require("../data/storefront-link-aliases.json");
  const legacyLinksInHtml = checked.filter((r) => legacyAliases[r.path.split("?")[0]]);
  const oversizedPages = pages.filter((r) => r.htmlBytes > 300000);
  const report = { rechecks, legacyLinksInHtml, maxHtmlBytes: Math.max(...pages.map((r) => r.htmlBytes)), oversizedPages, pages: pages.sort((a, b) => a.path.localeCompare(b.path)), pagesCrawled: pages.length, internalLinkOccurrences: checked.reduce((n, r) => n + r.occurrences, 0), uniqueInternalUrls: checked.length, checked: checked.length, skipped, failedPages, broken, links: checked.sort((a, b) => a.path.localeCompare(b.path)) };
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ ...report, links: undefined, pages: undefined }, null, 2));
  console.log("Report: " + output);
  if (broken.length || failedPages.length || oversizedPages.length || legacyLinksInHtml.length) process.exitCode = 1;
})().catch((error) => { console.error(error); process.exitCode = 1; });
