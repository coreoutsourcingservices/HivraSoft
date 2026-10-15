import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

// Standalone hosting can invoke Proxy again for an internal rewrite destination.
// Only this process may preserve the selected portal through that second pass.
const internalZoneProof = randomUUID();
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  const internalRewrite = headers.get("x-admin-zone-proof") === internalZoneProof;
  headers.delete("x-admin-zone-proof");
  if (internalRewrite && ["admin", "superadmin"].includes(headers.get("x-admin-zone") || "")) {
    return NextResponse.next({ request: { headers } });
  }
  const pathname = request.nextUrl.pathname;
  if (/\.(?:svg|png|jpe?g|webp|avif|gif|ico|css|js|woff2?|ttf|mp4|pdf)$/i.test(pathname) || /^\/(?:campaigns|chatbot)(?:\/|$)/.test(pathname)) return NextResponse.next();
  if (/^\/admin(?:\/|$)/.test(pathname)) {
    const url = request.nextUrl.clone(); url.pathname = pathname.replace(/^\/admin/, "") || "/";
    return NextResponse.redirect(url);
  }
  const superadmin = /^\/superadmin(?:\/|$)/.test(pathname);
  const path = superadmin ? pathname.replace(/^\/superadmin/, "") : pathname;
  if (superadmin && !/^\/(?:staff(?:\/|$)|audit-logs(?:\/|$)|change-password(?:\/|$))/.test(path) && path !== "" && path !== "/") {
    return NextResponse.redirect(new URL("/superadmin", request.url));
  }
  if (!superadmin && /^\/(?:staff|audit-logs)(?:\/|$)/.test(path)) {
    return new NextResponse("Superadmin access required.", { status: 403 });
  }
  headers.set("x-admin-zone", superadmin ? "superadmin" : "admin");
  headers.set("x-admin-zone-proof", internalZoneProof);
  const url = request.nextUrl.clone();
  url.pathname = `/admin${path === "/" ? "" : path}`;
  if (superadmin && (path === "" || path === "/")) url.pathname = "/admin/staff";
  return NextResponse.rewrite(url, { request: { headers } });
}
export const config = { matcher: ["/((?!api(?:/|$)|_next(?:/|$)|admin-static(?:/|$)|images(?:/|$)|favicon.ico$|icon.png$|apple-icon.png$|register$).*)"] };
