// Dashboard reads can be retried safely; never replay writes through this helper.
export async function proxyDashboard(request: Request, backend = process.env.API_URL || "http://localhost:5000") {
  const target = new URL("/api/admin/dashboard", backend);
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(21000)]);
  const headers = new Headers({ Accept: "application/json" });
  for (const key of ["cookie", "authorization"]) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(target, { headers, cache: "no-store", signal });
      // Read before returning so a reset during the response body is caught too.
      const body = await response.arrayBuffer();
      return new Response(body, { status: response.status, headers: { "Content-Type": response.headers.get("content-type") || "application/json", "Cache-Control": "no-store" } });
    } catch {
      if (request.signal.aborted) return new Response(null, { status: 499 });
      if (signal.aborted) break;
    }
  }
  return Response.json({ success: false, message: "Dashboard temporarily unavailable. Please refresh in a moment." }, { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "5" } });
}
