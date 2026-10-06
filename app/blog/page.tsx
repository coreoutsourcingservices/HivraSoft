import BlogListingShell from "@/src/components/Blog/BlogListingShell";
import { fetchBlogsServer } from "@/lib/blog-server";
import { getOldBlogs } from "@/lib/old-blog";

export const dynamic = "force-dynamic";

type BlogPageProps = {
  searchParams: Promise<{
    source?: string | string[];
  }>;
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const query = await searchParams;
  const requestedSource = Array.isArray(query.source) ? query.source[0] : query.source;
  const source: "new" | "old" = requestedSource === "old" ? "old" : "new";

  if (source === "old") {
    const blogs = getOldBlogs();
    return (
      <BlogListingShell
        title="Old Blogs"
        subtitle="Our WordPress archive. These posts come from the static migration data file and do not depend on MongoDB."
        blogs={blogs}
        source="old"
        total={blogs.length}
      />
    );
  }

  const result = await fetchBlogsServer("page=1&limit=50&sort=latest");
  const blogs = result?.blogs || [];

  return (
    <BlogListingShell
      title="New Blogs"
      subtitle="Fresh HivraSoft articles published from the admin panel and loaded live from the database."
      blogs={blogs}
      source="new"
      total={result?.pagination?.total ?? blogs.length}
    />
  );
}
