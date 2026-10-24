// Audit only anchors present on one page; linked pages are checked, never crawled.
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const { Parser } = createRequire(require.resolve("sanitize-html"))("htmlparser2");
const page = new URL(process.argv[2] || "http://localhost:3000/men/brief");
const output = process.argv[3] || ".local/page-links.json";
const canonical = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://hivrasoft.com");
const host = (url) => url.hostname.toLowerCase().replace(/^www\./, "");
const internal = (url) => url.origin === page.origin || (host(url) === host(canonical) && url.port === canonical.port);
async function get(url) {
  return fetch(url, { signal: AbortSignal.timeout(30000) });
}
(async () => {
  const response = await get(page);
  if (!response.ok) throw Error("Page HTTP " + response.status);
  const anchors = [];
  const parser = new Parser({
    onopentag(tag, attrs) {
      if (tag !== "a" || !attrs.href) return;
      try {
        const url = new URL(attrs.href, page);
        if (!/^https?:$/.test(url.protocol)) return;
        anchors.push({ href: attrs.href, url: url.href, internal: internal(url), rel: attrs.rel || "", fragmentOnly: attrs.href.startsWith("#") });
      } catch {}
    },
  });
  parser.end(await response.text());
  const links = new Map();
  for (const anchor of anchors.filter((a) => a.internal && !a.fragmentOnly)) {
    const target = new URL(anchor.url);
    target.hash = "";
    const key = target.pathname + target.search;
    const item = links.get(key) || { path: key, occurrences: 0, nofollow: false };
    item.occurrences++;
    item.nofollow ||= /\bnofollow\b/i.test(anchor.rel);
    links.set(key, item);
  }
  const queue = [...links.values()];
  const checked = [];
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const item = queue.shift();
      try {
        const result = await get(new URL(item.path, page));
        checked.push({ ...item, status: result.status, finalUrl: result.url });
        await result.body?.cancel();
      } catch (error) { checked.push({ ...item, error: error.message }); }
    }
  }));
  const report = {
    page: page.href,
    scope: "Only links in this page's HTML, including its header and footer; no site crawl.",
    internalOccurrences: anchors.filter((a) => a.internal).length,
    uniqueInternalUrls: links.size,
    externalOccurrences: anchors.filter((a) => !a.internal).length,
    nofollowInternal: checked.filter((a) => a.nofollow),
    broken: checked.filter((a) => a.error || a.status >= 400),
    links: checked.sort((a, b) => a.path.localeCompare(b.path)),
  };
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ ...report, links: undefined }, null, 2));
  console.log("Report: " + output);
  if (report.broken.length) process.exitCode = 1;
})().catch((error) => { console.error(error); process.exitCode = 1; });
