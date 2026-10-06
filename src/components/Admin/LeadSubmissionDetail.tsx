"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");
type Kind = "send-your-bra" | "reseller-registration";

function valueText(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string") return value.replaceAll("_", " ");
  return String(value);
}

export default function LeadSubmissionDetail({ kind, id }: { kind: Kind; id: string }) {
  const [item, setItem] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { void (async()=>{ try { const r=await fetch(`${API_URL}/api/admin/${kind}/${encodeURIComponent(id)}`,{credentials:"include",cache:"no-store"}); const d=await r.json().catch(()=>({})); if(!r.ok) throw new Error(d?.message||"Unable to load record."); setItem(d?.submission || d?.registration || null); } catch(e){ setError(e instanceof Error?e.message:"Unable to load record."); } })(); },[kind,id]);
  const hidden = new Set(["_id","__v","updatedAt"]);
  return <div className="min-h-full bg-[#F8F5F2] p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-[900px]"><Link href={`/admin/${kind}`} className="text-[10px] font-semibold text-[#8C1839]">← Back to list</Link><h1 className="mt-4 text-3xl font-semibold">{kind === "send-your-bra" ? "Send Your Bra Request" : "Reseller Registration"}</h1>{error && <div className="mt-5 rounded-xl bg-red-50 p-4 text-[11px] text-red-700">{error}</div>}{!item && !error ? <p className="mt-8 text-[11px] text-[#211A18]/50">Loading...</p> : item && <div className="mt-6 grid gap-4 rounded-[24px] border border-[#211A18]/10 bg-white p-6 sm:grid-cols-2">{Object.entries(item).filter(([key])=>!hidden.has(key)).map(([key,value])=><div key={key} className={key === "anythingElse" ? "sm:col-span-2" : ""}><p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#211A18]/40">{key.replace(/([A-Z])/g," $1")}</p><p className="mt-2 break-words text-[12px] font-medium">{key === "createdAt" ? new Date(String(value)).toLocaleString("en-IN") : valueText(value)}</p></div>)}</div>}</div></div>;
}
