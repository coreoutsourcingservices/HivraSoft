import type { ReactNode } from "react";

// Explicit segment layout helps Next.js register the complete /admin/blog tree
// (/admin/blog, /add, /categories, /tags and /[id]/edit) consistently.
export const dynamic = "force-dynamic";

export default function AdminBlogLayout({ children }: { children: ReactNode }) {
  return children;
}
