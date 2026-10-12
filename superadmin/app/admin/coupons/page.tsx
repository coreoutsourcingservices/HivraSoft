"use client";

import { useEffect, useState } from "react";
import { getAdminCoupons } from "@/lib/admin-api";

const show = (value: unknown) => typeof value === "string" || typeof value === "number" ? String(value) : "—";

export default function AdminCouponsPage() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { getAdminCoupons().then(setItems).catch((e) => setError(e instanceof Error ? e.message : "Unable to load coupons.")).finally(() => setLoading(false)); }, []);
  return <AdminList title="Coupons" subtitle="Live data from the coupons collection." loading={loading} error={error} empty="No coupons in database yet." headers={["Code", "Type", "Value", "Status", "Expires"]} rows={items.map((x) => [show(x.code ?? x.name), show(x.type ?? x.discountType), show(x.value ?? x.discountValue), x.isActive === false ? "Inactive" : "Active", x.expiresAt ? new Date(String(x.expiresAt)).toLocaleDateString("en-IN") : "—"])} />;
}

function AdminList({ title, subtitle, loading, error, empty, headers, rows }: { title: string; subtitle: string; loading: boolean; error: string; empty: string; headers: string[]; rows: string[][] }) {
  return <section className="mx-auto max-w-[1500px] rounded-[22px] border border-[#211A18]/10 bg-white p-6"><p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#8C1839]">Admin API</p><h2 className="mt-2 text-2xl font-semibold">{title}</h2><p className="mt-1 text-xs text-[#211A18]/50">{subtitle}</p>{error && <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}{loading ? <p className="py-16 text-center text-sm text-gray-500">Loading...</p> : <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b text-[10px] uppercase tracking-wider text-gray-500">{headers.map((h) => <th key={h} className="py-3">{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i} className="border-b border-[#211A18]/5">{row.map((cell, j) => <td key={j} className="py-4">{cell}</td>)}</tr>)}</tbody></table>{!rows.length && <p className="py-12 text-center text-sm text-gray-500">{empty}</p>}</div>}</section>;
}
