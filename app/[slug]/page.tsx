import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/src/components/Header/Header";
import Footer from "@/src/components/Footer/Footer";
import BlogShare from "@/src/components/Blog/BlogShare";
import { fetchBlogServer, fetchBlogsServer } from "@/lib/blog-server";
import type { BlogRecord, BlogTaxonomy } from "@/lib/blog";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
function label(value: BlogTaxonomy | string | null | undefined) {
  return typeof value === "string" ? value : value?.name || "Blog";
}
function dateText(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}
function readMinutes(html: string) {
  const words = (html || "").replace(/<[^>]*>/g, " ").replace(/&[^;]+;/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
function authorName(author: BlogRecord["author"]) {
  return typeof author === "string" ? author : author?.name || "HivraSoft";
}
export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const [response, latest] = await Promise.all([
    fetchBlogServer(slug),
    fetchBlogsServer("page=1&limit=30&sort=latest"),
  ]);
  if (!response?.blog) notFound();
  const blog = response.blog;
  const unique = new Map<string, BlogRecord>();
  for (const item of [...(response.related || []), ...(latest?.blogs || [])]) {
    if (item.slug !== blog.slug && !unique.has(item.slug)) unique.set(item.slug, item);
  }
  const related = [...unique.values()].slice(0, 10);
  const categories = [blog.category, ...(blog.tags || []), ...related.map(x => x.category)]
    .map(label).filter(v => v && v !== "Blog");
  const categoryNames = [...new Set(categories)].slice(0, 10);
  return <>
    <Header />
    <main className="min-h-screen bg-[#FBF8F5] text-[#251B19]">
      <header className="border-b border-[#251B19]/10 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-[1520px]">
          <Link href="/blog" className="text-xs font-semibold uppercase tracking-[.14em] text-[#A01543]">← Back to Blogs</Link>
          <div className="mt-6 flex flex-wrap gap-3 text-xs text-[#816C69]">
            <span>{label(blog.category)}</span><span>•</span>
            <time>{dateText(blog.publishedAt || blog.scheduledAt || blog.createdAt)}</time><span>•</span>
           
          </div>
          <h1 className="mt-4 w-full text-[clamp(2rem,4vw,4.5rem)] font-semibold leading-[1.12] tracking-tight">{blog.title}</h1>
          {blog.excerpt && <p className="mt-5 max-w-5xl text-base leading-8 text-[#786965] sm:text-lg">{blog.excerpt}</p>}
          <div className="mt-5 text-sm text-[#8E7C76]">By {authorName(blog.author)}</div>
          <div className="mt-5"><BlogShare title={blog.title} /></div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1520px] gap-8 px-4 py-9 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-12">
        <article className="min-w-0">
          {blog.featuredImage?.url && <img src={blog.featuredImage.url} alt={blog.featuredImage.alt || blog.title} className="mb-8 h-auto w-full rounded-2xl object-contain" />}
          {blog.customCss && <style>{blog.customCss}</style>}
          <div className="blog-public-content min-w-0 overflow-hidden rounded-2xl bg-white px-5 py-7 shadow-sm sm:px-9 sm:py-10" dangerouslySetInnerHTML={{ __html: blog.content || "" }} />
        </article>
        <aside className="min-w-0 space-y-6 lg:sticky lg:top-6 lg:self-start" aria-label="Related blog articles">
          <section className="rounded-2xl border border-[#251B19]/10 bg-white p-5 sm:p-6">
            <h2 className="text-xl font-semibold">Related & Latest Blogs</h2>
            <div className="mt-5 space-y-4">
              {related.map(item => <Link key={item._id || item.slug} href={`/${item.slug}`} className="group flex gap-3 border-b border-[#251B19]/10 pb-4 last:border-0 last:pb-0">
                {item.featuredImage?.url ? <img src={item.featuredImage.url} alt={item.featuredImage.alt || item.title} loading="lazy" className="h-[76px] w-[94px] shrink-0 rounded-lg object-cover" /> : <div className="h-[76px] w-[94px] shrink-0 rounded-lg bg-[#F5E9E7]" />}
                <div className="min-w-0"><p className="line-clamp-3 text-sm font-semibold leading-5 group-hover:text-[#A01543]">{item.title}</p><p className="mt-1 text-xs text-[#8E7C76]">{dateText(item.publishedAt || item.createdAt)}</p></div>
              </Link>)}
              {!related.length && <p className="text-sm text-[#8E7C76]">More blogs coming soon.</p>}
            </div>
            <Link href="/blog" className="mt-5 inline-block text-sm font-semibold text-[#A01543]">View all blogs →</Link>
          </section>
          {categoryNames.length > 0 && <section className="rounded-2xl border border-[#251B19]/10 bg-white p-5 sm:p-6"><h2 className="text-xl font-semibold">Categories & Tags</h2><div className="mt-4 flex flex-wrap gap-2">{categoryNames.map(name => <span key={name} className="rounded-full bg-[#F7EDEF] px-3 py-2 text-xs text-[#8F2447]">{name}</span>)}</div></section>}
        </aside>
      </div>
    </main>
    <Footer />
  </>;
}
