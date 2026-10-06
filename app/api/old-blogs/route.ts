import { NextResponse } from "next/server";
import { getOldBlogBySlug, getOldBlogRawData } from "@/lib/old-blog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = String(url.searchParams.get("slug") || "").trim();

  if (slug) {
    const result = getOldBlogBySlug(slug);
    if (!result) {
      return NextResponse.json({ success: false, message: "Old blog not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, source: "file", blog: result.raw });
  }

  const data = getOldBlogRawData();
  return NextResponse.json({ success: true, source: "file", ...data });
}
