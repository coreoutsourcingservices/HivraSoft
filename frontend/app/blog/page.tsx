import BlogListingShell from "@/src/components/Blog/BlogListingShell";
import { fetchBlogsServer } from "@/lib/blog-server";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ page?: string }> };
export async function generateMetadata({ searchParams }: PageProps) {
  const requested=Number((await searchParams).page || 1);
  const page=Number.isSafeInteger(requested)&&requested>1?requested:1;
  return pageMetadata({path:page>1?`/blog?page=${page}`:"/blog",title:`Style, Innerwear & Comfort Guides${page>1?` - Page ${page}`:""}`,description:"Explore the HivraSoft journal for innerwear tips, fit advice, everyday comfort guides and style inspiration. Discover useful articles to help you shop confidently."});
}
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
