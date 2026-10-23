/* eslint-disable @typescript-eslint/no-require-imports */
// Run against a production build or live deployment:
// TEST_SITE_URL=http://127.0.0.1:3127 node scripts/audit-storefront-seo.cjs
const fs = require("node:fs");
const site = (process.env.TEST_SITE_URL || "https://hivrasoft.com").replace(/\/$/, "");
const canonicalOrigin = process.env.TEST_CANONICAL_URL || "https://hivrasoft.com";
const decode = value => String(value || "").replace(/&#(?:x([\da-f]+)|(\d+));/gi, (_, hex, decimal) => String.fromCodePoint(parseInt(hex || decimal, hex ? 16 : 10)))
  .replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&apos;", "'");
async function get(path) {
  const response = await fetch(site + path, { signal: AbortSignal.timeout(60000) });
  return { response, html: await response.text() };
}
function metadata(html) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || "";
  const tags = {};
  for (const match of head.matchAll(/<meta\b([^>]*)>/gi)) {
    const attrs = {};
    for (const attr of match[1].matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[attr[1]] = decode(attr[2]);
    const key = attrs.name || attrs.property;
    if (key) (tags[key] ||= []).push(attrs.content);
  }
  return { head, tags, titles: [...head.matchAll(/<title>(.*?)<\/title>/g)].map(m => decode(m[1])), canonicals: [...head.matchAll(/<link\b(?=[^>]*rel="canonical")(?=[^>]*href="([^"]*)")[^>]*>/g)].map(m => decode(m[1])) };
}
(async () => {
  const sitemap = await get("/sitemap.xml");
  if (sitemap.response.status !== 200) throw Error("Sitemap HTTP " + sitemap.response.status);
  const urls = [...sitemap.html.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => decode(m[1]));
  if (!urls.length) throw Error("Empty sitemap");
  const rows = [];
  for (let index = 0; index < urls.length; index += 4) {
    await Promise.all(urls.slice(index, index + 4).map(async url => {
      const path = new URL(url).pathname + new URL(url).search;
      const row = { path, errors: [] };
      try {
        const { response, html } = await get(path);
        const { head, tags, titles, canonicals } = metadata(html);
        const expect = (condition, message) => { if (!condition) row.errors.push(message); };
        row.status = response.status;
        row.title = titles[0];
        row.description = tags.description?.[0];
        expect(response.status === 200, "HTTP " + response.status);
        expect(titles.length === 1, "Expected one title");
        expect(row.title?.length >= 50 && row.title.length <= 60, "Title must contain 50-60 characters");
        expect(tags.description?.length === 1, "Expected one description");
        expect(row.description?.length >= 60 && row.description.length <= 135, "Description length");
        expect(!/[\u2026]/.test(row.title + row.description), "Truncated snippet");
        expect(canonicals.length === 1 && new URL(canonicals[0]).href === new URL(path, canonicalOrigin).href, "Canonical does not match page");
        for (const key of ["og:title", "og:description", "og:url", "og:image", "twitter:title", "twitter:description", "twitter:image", "twitter:card"]) expect(tags[key]?.length === 1 && tags[key][0], "Missing/duplicate " + key);
        for (const key of ["og:title", "twitter:title"]) expect(tags[key]?.[0]?.length <= 60, key + " length");
        for (const key of ["og:description", "twitter:description"]) expect(tags[key]?.[0]?.length <= 135, key + " length");
        expect(tags["og:url"]?.[0] && new URL(tags["og:url"][0]).href === new URL(canonicals[0]).href, "Open Graph URL mismatch");
        expect(!tags.robots?.some(value => /noindex/.test(value)), "Public page is noindex");
        expect((head.match(/id="hivrasoft-gtm"/g) || []).length === 1, "GTM head snippet count");
        expect(/<body[^>]*><noscript><iframe[^>]*googletagmanager.com\/ns.html\?id=GTM-WDJS97KF/.test(html), "GTM body snippet placement");
        expect(response.headers.get("strict-transport-security")?.includes("max-age=31536000"), "HSTS missing");
        expect(![...html.matchAll(/<img\b[^>]*>/g)].some(m => !/\balt=/.test(m[0])), "Image missing alt attribute");
        for (const match of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) JSON.parse(match[1]);
      } catch (error) { row.errors.push(error.message); }
      rows.push(row);
    }));
    if ((index + 4) % 40 === 0) console.log("Checked " + Math.min(index + 4, urls.length) + "/" + urls.length);
  }
  for (const row of rows) {
    if (rows.some(other => other.path !== row.path && other.title === row.title)) row.errors.push("Duplicate title");
    if (rows.some(other => other.path !== row.path && other.description === row.description)) row.errors.push("Duplicate description");
  }
  const failed = rows.filter(row => row.errors.length);
  if (process.env.SEO_AUDIT_REPORT) fs.writeFileSync(process.env.SEO_AUDIT_REPORT, JSON.stringify({ site, checked: rows.length, failed: failed.length, rows }, null, 2));
  for (const row of failed) console.error(row.path + ": " + row.errors.join("; "));
  console.log(`${rows.length - failed.length}/${rows.length} pages passed full metadata, canonical, social, GTM and header checks`);
  if (failed.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
