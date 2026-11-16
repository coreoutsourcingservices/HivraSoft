import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { requestPublicBlog } from "../lib/blog-server";
import { productSeo } from "../lib/seo";
import type { ApiProduct } from "../src/services/products";

async function main() {
  let calls = 0;
  const recovered: typeof fetch = async () => ++calls === 1 ? new Response(null, { status: 503 }) : Response.json({ blog: {} });
  assert.equal((await requestPublicBlog("https://example.com/blog", recovered)).status, 200);
  assert.equal(calls, 2);
  for (const status of [404, 403, 503]) {
    calls = 0;
    const mock: typeof fetch = async () => { calls++; return new Response(null, { status }); };
    if (status === 404) assert.equal((await requestPublicBlog("https://example.com/blog", mock)).status, 404);
    else await assert.rejects(() => requestPublicBlog("https://example.com/blog", mock), new RegExp(`HTTP ${status}`));
    assert.equal(calls, status === 503 ? 2 : 1);
  }
  calls = 0;
  await assert.rejects(() => requestPublicBlog("https://example.com/blog", async () => { calls++; throw new TypeError("network down"); }), /network down/);
  assert.equal(calls, 2);
  const product = { name: "Test brief", colors: [{ slugProduct: "blue-brief", nameProduct: "Blue Brief", isDefault: true, isActive: true, sizes: [] }, { slugProduct: "red-brief", nameProduct: "Red Brief", isActive: true, sizes: [] }] } as unknown as ApiProduct;
  assert.equal(productSeo(product, "legacy-brief").input.path, "/product/blue-brief");
  assert.equal(productSeo(product, "red-brief").input.path, "/product/red-brief");
  assert.equal(productSeo(product, "legacy-brief").schema.url, "https://hivrasoft.com/product/blue-brief");
  const aliases = JSON.parse(readFileSync("data/storefront-link-aliases.json", "utf8"));
  assert.equal(aliases["/privacy-policy"], "/privacy");
  assert.equal(aliases["/terms-condition"], "/terms");
  const { default: config } = await import("../next.config.mjs");
  const redirects = await config.redirects!();
  for (const source of ["/privacy-policy", "/terms-condition"]) assert(redirects.some((rule) => rule.source === source && rule.destination === aliases[source] && rule.permanent));
  console.log("PASS: blog outages do not become 404; real 404 and 403 preserved; variant canonical and legal redirects verified");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
