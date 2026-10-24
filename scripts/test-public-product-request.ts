import assert from "node:assert/strict";
import { requestPublicProduct } from "../lib/public-product-request";

(async () => {
  let calls = 0;
  const temporary: typeof fetch = async (_url, init) => {
    calls++;
    assert.equal(init?.next?.revalidate, 30);
    return calls === 1 ? new Response("", { status: 503 }) : Response.json({ product: { id: "valid" } });
  };
  assert.equal((await requestPublicProduct("https://example.com/product", temporary)).status, 200);
  assert.equal(calls, 2);

  calls = 0;
  const missing: typeof fetch = async () => { calls++; return new Response("", { status: 404 }); };
  assert.equal((await requestPublicProduct("https://example.com/missing", missing)).status, 404);
  assert.equal(calls, 1);

  calls = 0;
  const network: typeof fetch = async () => { if (++calls === 1) throw new TypeError("fetch failed"); return Response.json({ product: {} }); };
  assert.equal((await requestPublicProduct("https://example.com/product", network)).status, 200);
  assert.equal(calls, 2);

  calls = 0;
  const down: typeof fetch = async () => { calls++; return new Response("", { status: 503 }); };
  await assert.rejects(() => requestPublicProduct("https://example.com/product", down), /HTTP 503/);
  assert.equal(calls, 2);

  calls = 0;
  const forbidden: typeof fetch = async () => { calls++; return new Response("", { status: 403 }); };
  await assert.rejects(() => requestPublicProduct("https://example.com/product", forbidden), /HTTP 403/);
  assert.equal(calls, 1);
  console.log("PASS: temporary product API failures retry, successful reads cache briefly, real 404 remains 404, and persistent errors do not become missing products.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
