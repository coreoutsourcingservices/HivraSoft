import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/src/components/Header/Header";
import Footer from "@/src/components/Footer/Footer";
import BlogShare from "@/src/components/Blog/BlogShare";
import BlogCard from "@/src/components/Blog/BlogCard";
import { fetchBlogServer } from "@/lib/blog-server";
import { getOldBlogBySlug, getOldRelatedBlogs } from "@/lib/old-blog";
import type { BlogRecord, BlogTaxonomy } from "@/lib/blog";

export const dynamic = "force-dynamic";

type BlogDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ source?: string | string[] }>;
};

function taxonomyName(value: BlogTaxonomy | string | null | undefined) {
  return typeof value === "string" ? "Blog" : value?.name || "Blog";
}

function authorName(value: BlogRecord["author"]) {
  return typeof value === "string" ? "HivraSoft" : value?.name || "HivraSoft";
}

function niceDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default async function BlogDetailPage({ params, searchParams }: BlogDetailPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const requestedSource = Array.isArray(query.source) ? query.source[0] : query.source;
  const source: "new" | "old" = requestedSource === "old" ? "old" : "new";

  let blog: BlogRecord | null = null;
  let related: BlogRecord[] = [];

  if (source === "old") {
    const old = getOldBlogBySlug(slug);
    if (!old) notFound();
    blog = old.blog;
    related = getOldRelatedBlogs(slug, 3);
  } else {
    const result = await fetchBlogServer(slug);
    if (!result?.blog) notFound();
    blog = result.blog;
    related = result.related || [];
  }

  const sourceLabel = source === "old" ? "Old Blog · JSON Archive" : "New Blog · Database";
  const sourceHref = `/blog?source=${source}`;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FBF8F5] text-[#211A18]">
        <article>
          <header className="border-b border-[#211A18]/8 px-4 py-10 sm:px-6 sm:py-14">
            <div className="mx-auto max-w-[1050px]">
              <Link href={sourceHref} className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A51D45]">← Back to {source === "old" ? "Old" : "New"} Blogs</Link>
              <div className="mt-6 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#211A18]/45">
                <span className="rounded-full bg-white px-3 py-1.5 text-[#8C1839] shadow-sm">{sourceLabel}</span>
                <span>{taxonomyName(blog.category)}</span>
                <span>•</span>
                <span>{niceDate(blog.publishedAt || blog.scheduledAt)}</span>
                <span>•</span>
                <span>{blog.readingTime || 1} min read</span>
              </div>
              <h1 className="mt-5 max-w-5xl text-4xl font-semibold leading-[1.08] sm:text-6xl">{blog.title}</h1>
              {blog.excerpt && <p className="mt-5 max-w-3xl text-base leading-8 text-[#211A18]/60 sm:text-lg">{blog.excerpt}</p>}
              <div className="mt-5 text-sm text-[#211A18]/45">By {authorName(blog.author)}</div>
              <div className="mt-6"><BlogShare title={blog.title} /></div>
            </div>
          </header>

          <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6 sm:py-14">
            {blog.featuredImage?.url && (
              <img
                src={blog.featuredImage.url}
                alt={blog.featuredImage.alt || blog.title}
                className="mb-10 aspect-[16/9] w-full rounded-[28px] object-cover shadow-[0_20px_60px_rgba(33,26,24,0.08)]"
              />
            )}

            {blog.customCss && <style>{blog.customCss}</style>}
            <div
              className="blog-public-content mx-auto max-w-[850px] rounded-[28px] border border-[#211A18]/8 bg-white p-6 shadow-[0_10px_40px_rgba(33,26,24,0.04)] sm:p-10"
              dangerouslySetInnerHTML={{ __html: blog.content || "" }}
            />
          </div>
        </article>

        {related.length > 0 && (
          <section className="border-t border-[#211A18]/8 px-4 py-12 sm:px-6 sm:py-16">
            <div className="mx-auto max-w-[1280px]">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#A51D45]">Continue Reading</p>
                  <h2 className="mt-2 text-3xl font-semibold">Related {source === "old" ? "Old" : "New"} Blogs</h2>
                </div>
                <Link href={sourceHref} className="text-[10px] font-semibold text-[#8C1839]">View all →</Link>
              </div>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {related.slice(0, 3).map((item) => <BlogCard key={`${source}-${item._id}`} blog={item} source={source} />)}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
