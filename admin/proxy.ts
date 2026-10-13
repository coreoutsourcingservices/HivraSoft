import { NextResponse, type NextRequest } from "next/server";
export function proxy(request: NextRequest) {
 const superadmin = /^\/superadmin(?:\/|$)/.test(request.nextUrl.pathname);
 const headers = new Headers(request.headers);
 headers.set("x-admin-zone", superadmin ? "superadmin" : "admin");
 if (superadmin) { const url = request.nextUrl.clone(); url.pathname = url.pathname.replace(/^\/superadmin/, "/admin"); return NextResponse.rewrite(url, { request: { headers } }); }
 return NextResponse.next({ request: { headers } });
}
export const config = { matcher: ["/admin/:path*", "/superadmin/:path*"] };
