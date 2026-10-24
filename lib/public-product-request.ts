/** Public product reads can briefly fail upstream; never turn those failures into "not found". */
export async function requestPublicProduct(url: string, request: typeof fetch = fetch): Promise<Response> {
  let failure: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await request(url, {
        method: "GET",
        signal: AbortSignal.timeout(10_000),
        next: { revalidate: 30, tags: ["storefront-products"] },
        headers: { Accept: "application/json" },
      });
      if (response.ok || response.status === 404) return response;
      const status = response.status;
      await response.body?.cancel();
      const error = new Error("Product API returned HTTP " + status);
      if (status < 500) throw error;
      failure = error;
    } catch (error) {
      // Only network/timeouts and server failures warrant a second request.
      if (error instanceof Error && /^Product API returned HTTP 4/.test(error.message)) throw error;
      failure = error;
    }
  }
  throw failure instanceof Error ? failure : new Error("Product API unavailable");
}
