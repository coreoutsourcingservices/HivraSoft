"use client";

import { confirmAdminAction } from "@/src/components/Admin/AdminConfirmProvider";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Copy, Edit3, Plus, Search, Trash2 } from "lucide-react";
import { deleteAdminBlog, duplicateAdminBlog, getAdminBlogs, type BlogRecord, type BlogTaxonomy } from "@/lib/blog";

function nameOf(value: BlogTaxonomy | string | null | undefined) {
  return typeof value === "string" ? "—" : value?.name || "—";
}
function authorName(value: BlogRecord["author"]) {
  return typeof value === "string" ? "—" : value?.name || value?.email || "Admin";
}
function date(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminBlogList() {
  const [blogs, setBlogs] = useState<BlogRecord[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = await getAdminBlogs({ search: search.trim(), status, page, limit: 15 });
      setBlogs(result.blogs || []);
      setPagination(result.pagination || { page, limit: 15, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load blogs.");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { void load(); }, [load]);

  async function remove(blog: BlogRecord) {
    const confirmed = await confirmAdminAction({
      title: "Delete Blog?",
      itemName: blog.title,
      description: "The blog will move to Trash for 30 days. Its uploaded media will be preserved until permanent deletion.",
      confirmLabel: "Move to Trash",
    });
    if (!confirmed) return;
    try {
      setBusyId(blog._id);
      await deleteAdminBlog(blog._id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to delete blog.");
    } finally { setBusyId(""); }
  }

  async function duplicate(blog: BlogRecord) {
    try {
      setBusyId(blog._id);
      const result = await duplicateAdminBlog(blog._id);
      window.location.href = `/admin/blog/${result.blog._id}/edit`;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to duplicate blog.");
      setBusyId("");
    }
  }

  return (
    <div className="min-h-full bg-[#F8F5F2] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#A51D45]">Content Management</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#211A18]">Blogs</h1>
            <p className="mt-2 text-sm text-[#211A18]/50">Create, edit, publish and manage website blogs from one place.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/blog" target="_blank" className="inline-flex h-11 items-center justify-center rounded-xl border border-[#211A18]/10 bg-white px-4 text-[10px] font-semibold text-[#211A18]">View Blogs</Link>
            <Link href="/admin/blog/add" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#A51D45] px-5 text-[11px] font-semibold text-white">
              <Plus size={16}/> Add New Blog
            </Link>
          </div>
        </div>

        <div className="mb-4 grid gap-3 rounded-[20px] border border-[#211A18]/10 bg-white p-4 md:grid-cols-[1fr_220px]">
          <label className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#211A18]/35"/>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search title, slug or excerpt..." className="field pl-9"/>
          </label>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="field">
            <option value="">All status</option>
            <option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="SCHEDULED">Scheduled</option><option value="PRIVATE">Private</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-[22px] border border-[#211A18]/10 bg-white">
          <div className="flex items-center justify-between border-b border-[#211A18]/10 px-5 py-4">
            <div className="text-[11px] font-semibold text-[#211A18]">Blog Library</div>
            <div className="text-[9px] font-semibold text-[#211A18]/40">{pagination.total} BLOGS</div>
          </div>
          {loading ? <div className="p-16 text-center text-sm text-[#211A18]/45">Loading blogs...</div> : error ? <div className="p-16 text-center text-sm text-red-600">{error}</div> : blogs.length === 0 ? <div className="p-16 text-center text-sm text-[#211A18]/45">No blogs found.</div> : (
            <div className="overflow-x-auto">
              <table className="min-w-[1180px] w-full text-left">
                <thead className="bg-[#FAF8F6] text-[8px] uppercase tracking-[0.08em] text-[#211A18]/40"><tr>
                  <th className="px-4 py-3">Image</th><th className="px-4 py-3">Blog</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Author</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Published</th><th className="px-4 py-3">Updated</th><th className="px-4 py-3">Views</th><th className="px-4 py-3 text-right">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-[#211A18]/7">
                  {blogs.map((blog) => <tr key={blog._id} className="text-[10px] text-[#211A18]/70">
                    <td className="px-4 py-3"><div className="h-12 w-16 overflow-hidden rounded-lg bg-[#F2ECE8]">{blog.featuredImage?.url ? <img src={blog.featuredImage.url} alt={blog.featuredImage.alt || blog.title} className="h-full w-full object-cover"/> : null}</div></td>
                    <td className="max-w-[300px] px-4 py-3"><Link href={`/admin/blog/${blog._id}/edit`} className="font-semibold text-[#211A18] hover:text-[#A51D45]">{blog.title}</Link><div className="mt-1 truncate text-[9px] text-[#211A18]/40">/{blog.slug}</div></td>
                    <td className="px-4 py-3">{nameOf(blog.category)}</td><td className="px-4 py-3">{authorName(blog.author)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[8px] font-semibold ${blog.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>{blog.status}</span></td>
                    <td className="px-4 py-3">{date(blog.publishedAt || blog.scheduledAt)}</td><td className="px-4 py-3">{date(blog.updatedAt)}</td><td className="px-4 py-3 font-semibold">{blog.views || 0}</td>
                    <td className="px-4 py-3"><div className="flex justify-end gap-2">
                      {blog.status === "PUBLISHED" && <Link href={`/blog/${blog.slug}`} target="_blank" className="rounded-lg border border-[#211A18]/10 px-2.5 py-2 text-[8px] font-semibold">Preview</Link>}
                      <Link href={`/admin/blog/${blog._id}/edit`} title="Edit" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#211A18]/10"><Edit3 size={13}/></Link>
                      <button disabled={busyId === blog._id} onClick={() => void duplicate(blog)} title="Duplicate" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#211A18]/10 disabled:opacity-40"><Copy size={13}/></button>
                      <button disabled={busyId === blog._id} onClick={() => void remove(blog)} title="Delete" className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 text-red-600 disabled:opacity-40"><Trash2 size={13}/></button>
                    </div></td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-[#211A18]/10 px-5 py-4 text-[9px] text-[#211A18]/45">
            <span>Page {pagination.page} of {pagination.totalPages}</span><div className="flex gap-2"><button className="rounded-lg border border-[#211A18]/10 px-3 py-2 disabled:opacity-30" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1,p-1))}>Previous</button><button className="rounded-lg border border-[#211A18]/10 px-3 py-2 disabled:opacity-30" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p+1)}>Next</button></div>
          </div>
        </div>
      </div>
    </div>
  );
}
