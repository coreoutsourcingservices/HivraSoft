import { NextResponse } from "next/server";

// The storefront uses the backend's unified /api/blogs API. This old
// migration-only endpoint is intentionally disabled so storage details are
// never exposed to visitors.
export async function GET() {
  return NextResponse.json({ success: false, message: "Route not found." }, { status: 404 });
}
