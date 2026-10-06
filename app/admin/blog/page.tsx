import AdminBlogList from "@/src/components/Admin/AdminBlogList";

// Keep the route itself as a Server Component. The interactive table lives in
// AdminBlogList, which is a Client Component. This makes /admin/blog register
// cleanly in the App Router while preserving all existing client-side actions.
export const dynamic = "force-dynamic";

export default function AdminBlogsPage() {
  return <AdminBlogList />;
}
