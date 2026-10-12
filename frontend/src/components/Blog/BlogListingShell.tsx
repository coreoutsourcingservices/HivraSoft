import Link from "next/link";
import Header from "@/src/components/Header/Header";
import Footer from "@/src/components/Footer/Footer";
import BlogCard from "./BlogCard";
import type { BlogRecord } from "@/lib/blog";

type Props = { title: string; subtitle?: string; blogs: BlogRecord[]; page?: number; totalPages?: number };
export default function BlogListingShell({ title, subtitle, blogs, page = 1, totalPages = 1 }: Props) {
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => Math.max(1, Math.min(page - 2, totalPages - 4)) + i);
  return <><Header /><main className="min-h-[70vh] bg-[#FBF8F5] text-[#251B19]">
    <section className="border-b border-[#251B19]/10 px-4 py-10 sm:px-6 sm:py-14"><div className="mx-auto max-w-[1520px]">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#A01543]">Hivra Soft Journal</p>
      <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">{title}</h1>
      {subtitle && <p className="mt-3 text-base text-[#776A66]">{subtitle}</p>}
    </div></section>
    <section className="px-4 py-9 sm:px-6 sm:py-12"><div className="mx-auto max-w-[1520px]">
      {blogs.length ? <div className="grid gap-x-5 gap-y-10 md:grid-cols-2 xl:grid-cols-3">{blogs.slice(0, 9).map(blog => <BlogCard key={blog._id || blog.slug} blog={blog} />)}</div> : <p className="rounded-xl bg-white p-12 text-center">No published blogs found.</p>}
      {totalPages > 1 && <nav aria-label="Blog pagination" className="mt-12 flex flex-wrap items-center justify-center gap-2">
        {page > 1 && <Link href={page === 2 ? "/blog" : `/blog?page=${page - 1}`} className="rounded-lg border bg-white px-4 py-2">← Previous</Link>}
        {pages.map(n => <Link key={n} href={n === 1 ? "/blog" : `/blog?page=${n}`} aria-current={n === page ? "page" : undefined} className={`rounded-lg border px-4 py-2 ${n === page ? "border-[#98123F] bg-[#98123F] text-white" : "bg-white"}`}>{n}</Link>)}
        {page < totalPages && <Link href={`/blog?page=${page + 1}`} className="rounded-lg border bg-white px-4 py-2">Next →</Link>}
      </nav>}
    </div></section>
  </main><Footer /></>;
}
