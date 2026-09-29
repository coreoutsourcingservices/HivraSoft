"use client";

import { useEffect, useState } from "react";
import { getAdminPages } from "@/lib/admin-api";

const show = (value: unknown) => typeof value === "string" || typeof value === "number" ? String(value) : "—";

export default function AdminPagesPage() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { getAdminPages().then(setItems).catch((e) => setError(e instanceof Error ? e.message : "Unable to load pages.")).finally(() => setLoading(false)); }, []);
  return <section className="mx-auto max-w-[1500px] rounded-[22px] border border-[#211A18]/10 bg-white p-6"><p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#8C1839]">Pages API</p><h2 className="mt-2 text-2xl font-semibold">Pages</h2><p className="mt-1 text-xs text-[#211A18]/50">Live data from sitepages/pages collection.</p>{error && <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}{loading ? <p className="py-16 text-center text-sm text-gray-500">Loading pages...</p> : <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b text-[10px] uppercase tracking-wider text-gray-500"><th className="py-3">Title</th><th>Slug</th><th>Status</th><th>Updated</th></tr></thead><tbody>{items.map((x, i) => <tr key={show(x._id ?? String(i))} className="border-b border-[#211A18]/5"><td className="py-4 font-medium">{show(x.title ?? x.name)}</td><td>{show(x.slug)}</td><td>{x.isActive === false || x.published === false ? "Draft" : "Published"}</td><td>{x.updatedAt ? new Date(String(x.updatedAt)).toLocaleString("en-IN") : "—"}</td></tr>)}</tbody></table>{!items.length && <p className="py-12 text-center text-sm text-gray-500">No pages in database yet.</p>}</div>}</section>;
}
