import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
// A standalone rewrite can invoke Proxy again for its internal /admin destination.
// Keep its zone only when the header was stamped by this process.
const internalZoneProof = randomUUID();
export function proxy(request: NextRequest) {
 const forwarded = new Headers(request.headers);
 const internalRewrite = forwarded.get("x-admin-zone-proof") === internalZoneProof;
 forwarded.delete("x-admin-zone-proof");
 if (internalRewrite && forwarded.get("x-admin-zone") === "superadmin") {
   return NextResponse.next({ request: { headers: forwarded } });
 }
 const superadmin = /^\/superadmin(?:\/|$)/.test(request.nextUrl.pathname);
 const headers = forwarded;
 headers.set("x-admin-zone", superadmin ? "superadmin" : "admin");
 if (superadmin) { headers.set("x-admin-zone-proof", internalZoneProof); const url = request.nextUrl.clone(); url.pathname = url.pathname.replace(/^\/superadmin/, "/admin"); return NextResponse.rewrite(url, { request: { headers } }); }
 return NextResponse.next({ request: { headers } });
}
export const config = { matcher: ["/admin/:path*", "/superadmin/:path*"] };
