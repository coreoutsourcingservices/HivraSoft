import BlogListingShell from "@/src/components/Blog/BlogListingShell";
import { fetchBlogsServer } from "@/lib/blog-server";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ page?: string }> };
export default async function BlogPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const requested = Number(query?.page || 1);
  const page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1;
  const result = await fetchBlogsServer(`page=${page}&limit=9&sort=latest`);
  return (
    <BlogListingShell
      title="HivraSoft Journal"
      subtitle="Style stories, comfort guides and fresh inspiration."
      blogs={result?.blogs || []}
      page={page}
      totalPages={result?.pagination?.totalPages || 1}
    />
  );
}
