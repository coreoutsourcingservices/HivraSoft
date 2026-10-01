import Header from "@/src/components/Header/Header";
import Footer from "@/src/components/Footer/Footer";
import BlogCard from "./BlogCard";
import type { BlogRecord } from "@/lib/blog";

export default function BlogListingShell({ title, subtitle, blogs }: { title: string; subtitle?: string; blogs: BlogRecord[] }) {
  return <><Header/><main className="min-h-[70vh] bg-[#FBF8F5]"><section className="border-b border-[#211A18]/8 px-4 py-14 sm:px-6 sm:py-20"><div className="mx-auto max-w-[1280px]"><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A51D45]">HivraSoft Journal</p><h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight text-[#211A18] sm:text-6xl">{title}</h1>{subtitle&&<p className="mt-4 max-w-2xl text-base leading-7 text-[#211A18]/55">{subtitle}</p>}</div></section><section className="px-4 py-10 sm:px-6 sm:py-14"><div className="mx-auto max-w-[1280px]">{blogs.length?<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{blogs.map((blog)=><BlogCard key={blog._id} blog={blog}/>)}</div>:<div className="rounded-[24px] border border-[#211A18]/10 bg-white p-16 text-center text-sm text-[#211A18]/45">No published blogs found.</div>}</div></section></main><Footer/></>;
}
