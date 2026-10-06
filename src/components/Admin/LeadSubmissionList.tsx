"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

type Kind = "send-your-bra" | "reseller-registration";
type Row = Record<string, any> & { _id: string; createdAt: string };

const labels = {
  "send-your-bra": { title: "Send Your Bra Requests", itemKey: "submissions" },
  "reseller-registration": { title: "Reseller Registrations", itemKey: "registrations" },
} as const;

export default function LeadSubmissionList({ kind }: { kind: Kind }) {
  const meta = labels[kind];
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true); setError("");
      const response = await fetch(`${API_URL}/api/admin/${kind}?limit=100&search=${encodeURIComponent(search.trim())}`, { credentials: "include", cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Unable to load data.");
      setRows(Array.isArray(data?.[meta.itemKey]) ? data[meta.itemKey] : []);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load data."); }
    finally { setLoading(false); }
  }

  useEffect(() => { const timer = window.setTimeout(() => void load(), 250); return () => window.clearTimeout(timer); }, [search, kind]);

  return <div className="min-h-full bg-[#F8F5F2] p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-[1450px]">
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#A51D45]">Customer Forms</p><h1 className="mt-2 text-3xl font-semibold text-[#211A18]">{meta.title}</h1></div><div className="relative w-full md:w-[330px]"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#211A18]/35" size={15}/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search name, phone, city..." className="h-12 w-full rounded-xl border border-[#211A18]/10 bg-white pl-11 pr-4 text-[11px] outline-none"/></div></div>
    {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] text-red-700">{error}</div>}
    <section className="overflow-hidden rounded-[22px] border border-[#211A18]/10 bg-white"><div className="flex items-center justify-between border-b border-[#211A18]/8 px-5 py-4"><span className="text-[11px] font-semibold">{meta.title}</span><span className="text-[9px] text-[#211A18]/40">{rows.length} records</span></div>
      <div className="overflow-x-auto"><table className="min-w-full text-left"><thead className="bg-[#FAF8F6] text-[9px] uppercase tracking-[0.08em] text-[#211A18]/45"><tr>{kind === "send-your-bra" ? <><th className="px-5 py-3">Name</th><th className="px-5 py-3">WhatsApp</th><th className="px-5 py-3">City</th><th className="px-5 py-3">Bras</th><th className="px-5 py-3">Condition</th></> : <><th className="px-5 py-3">Name</th><th className="px-5 py-3">Mobile</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Platform</th><th className="px-5 py-3">Quantity</th></>}<th className="px-5 py-3">Submitted</th><th className="px-5 py-3 text-right">Action</th></tr></thead>
      <tbody>{loading ? <tr><td colSpan={7} className="px-5 py-12 text-center text-[11px] text-[#211A18]/40">Loading...</td></tr> : rows.length === 0 ? <tr><td colSpan={7} className="px-5 py-12 text-center text-[11px] text-[#211A18]/40">No records found.</td></tr> : rows.map((row) => <tr key={row._id} className="border-t border-[#211A18]/7 text-[11px]">
        {kind === "send-your-bra" ? <><td className="px-5 py-4 font-semibold">{row.fullName}</td><td className="px-5 py-4">{row.whatsappNumber}</td><td className="px-5 py-4">{row.city}</td><td className="px-5 py-4">{row.numberOfBras}</td><td className="px-5 py-4">{String(row.condition||"").replaceAll("_"," ")}</td></> : <><td className="px-5 py-4 font-semibold">{row.fullName}</td><td className="px-5 py-4">{row.mobileNumber}</td><td className="px-5 py-4">{row.emailAddress}</td><td className="px-5 py-4">{String(row.sellingPlatform||"").replaceAll("_"," ")}</td><td className="px-5 py-4">{String(row.expectedOrderQuantity||"").replaceAll("_","-")}</td></>}
        <td className="px-5 py-4 text-[#211A18]/50">{new Date(row.createdAt).toLocaleString("en-IN")}</td><td className="px-5 py-4 text-right"><Link href={`/admin/${kind}/${row._id}`} className="rounded-lg border border-[#211A18]/10 px-3 py-2 text-[9px] font-semibold">View</Link></td></tr>)}</tbody></table></div>
    </section>
  </div></div>;
}
