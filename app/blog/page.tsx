import BlogListingShell from "@/src/components/Blog/BlogListingShell";
import { fetchBlogsServer } from "@/lib/blog-server";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const result = await fetchBlogsServer("page=1&limit=50&sort=latest");
  const blogs = result?.blogs || [];

  return (
    <BlogListingShell
      title="HivraSoft Journal"
      subtitle="Guides, ideas and useful articles from HivraSoft."
      blogs={blogs}
    />
  );
}
