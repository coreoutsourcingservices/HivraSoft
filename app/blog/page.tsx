import BlogListingShell from "@/src/components/Blog/BlogListingShell";
import { fetchBlogsServer } from "@/lib/blog-server";
import StructuredData from "@/src/components/Storefront/StructuredData";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { STATIC_SEO } from "@/lib/seo-pages";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ page?: string }> };
export async function generateMetadata({ searchParams }: PageProps) {
  const requested = Number((await searchParams).page || 1);
  const page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1;
  return pageMetadata({ ...STATIC_SEO["/blog"], path: page > 1 ? `/blog?page=${page}` : "/blog", title: page > 1 ? `HivraSoft Journal - Page ${page}` : STATIC_SEO["/blog"].title });
}
export default async function BlogPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const requested = Number(query?.page || 1);
  const page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1;
  const result = await fetchBlogsServer(`page=${page}&limit=9&sort=latest`);
  return (
    <>
    <StructuredData data={{
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": absoluteUrl(page > 1 ? `/blog?page=${page}` : "/blog") + "#webpage",
      url: absoluteUrl(page > 1 ? `/blog?page=${page}` : "/blog"),
      name: "HivraSoft Journal",
      mainEntity: {
        "@type": "ItemList",
        itemListElement: (result?.blogs || []).map((blog, index) => ({
          "@type": "ListItem", position: (page - 1) * 9 + index + 1,
          name: blog.title, url: absoluteUrl("/" + blog.slug),
        })),
      },
    }} />
    <BlogListingShell
      title="HivraSoft Journal"
      subtitle="Style stories, comfort guides and fresh inspiration."
      blogs={result?.blogs || []}
      page={page}
      totalPages={result?.pagination?.totalPages || 1}
    />
    </>
  );
}
