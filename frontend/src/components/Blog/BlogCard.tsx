import Link from "next/link";
import type { BlogRecord, BlogTaxonomy } from "@/lib/blog";

function taxName(value: BlogTaxonomy | string | null | undefined) { return typeof value === "string" ? "Blog" : value?.name || "Blog"; }
function authorName(value: BlogRecord["author"]) { return typeof value === "string" ? "HivraSoft" : value?.name || "HivraSoft"; }
function niceDate(value?: string | null) { if (!value) return ""; const d = new Date(value); return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }); }

export default function BlogCard({ blog }: { blog: BlogRecord }) {
  return <article className="group overflow-hidden rounded-[24px] border border-[#211A18]/10 bg-white shadow-[0_10px_30px_rgba(33,26,24,0.04)]">
    <Link href={`/${blog.slug}`} className="block aspect-[16/10] overflow-hidden bg-[#F0E9E5]">
      {blog.featuredImage?.url ? <img src={blog.featuredImage.url} alt={blog.featuredImage.alt || blog.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"/> : <div className="flex h-full items-center justify-center text-xs text-[#211A18]/35">HivraSoft Blog</div>}
    </Link>
    <div className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#A51D45]"><span>{taxName(blog.category)}</span><span className="text-[#211A18]/20">•</span><span className="text-[#211A18]/40">{niceDate(blog.publishedAt || blog.scheduledAt)}</span></div>
      <Link href={`/${blog.slug}`}><h2 className="mt-3 text-xl font-semibold leading-snug text-[#211A18] transition group-hover:text-[#A51D45]">{blog.title}</h2></Link>
      {blog.excerpt && <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#211A18]/55">{blog.excerpt}</p>}
      </div>
  </article>;
}
