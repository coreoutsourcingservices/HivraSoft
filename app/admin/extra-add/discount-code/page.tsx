"use client";

import { confirmAdminAction } from "@/src/components/Admin/AdminConfirmProvider";

import { useEffect, useState } from "react";
import DiscountProductSelector from "@/src/components/Admin/DiscountProductSelector";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
type ValueType = "percentage" | "fixed";

type DiscountCodeItem = {
  _id: string;
  code: string;
  valueType?: ValueType;
  percentage: number;
  fixedAmount?: number;
  minAmount?: number;
  maxAmount?: number | null;
  isActive: boolean;
  appliesToAllProducts: boolean;
  productIds: string[];
};

type HistoryItem = {
  _id?: string;
  codeId?: string;
  action?: string;
  code?: string;
  valueType?: ValueType;
  percentage?: number;
  fixedAmount?: number;
  minAmount?: number;
  maxAmount?: number | null;
  isActive?: boolean;
  productCount?: number;
  changedAt?: string;
};

async function readJson(response: Response) { try { return await response.json(); } catch { return {}; } }
function money(value: number) { return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`; }
function dateTime(value?: string) { if (!value) return "—"; const d = new Date(value); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }

export default function DiscountCodePage() {
  const [codes, setCodes] = useState<DiscountCodeItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [editingId, setEditingId] = useState("");
  const [code, setCode] = useState("");
  const [valueType, setValueType] = useState<ValueType>("percentage");
  const [percentage, setPercentage] = useState("10");
  const [fixedAmount, setFixedAmount] = useState("0");
  const [minAmount, setMinAmount] = useState("0");
  const [maxAmount, setMaxAmount] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [appliesToAllProducts, setAppliesToAllProducts] = useState(true);
  const [productIds, setProductIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadCodes() {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/discounts/codes`, { credentials: "include", cache: "no-store" });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to load discount codes.");
      setCodes(Array.isArray(data?.codes) ? data.codes : []);
      setHistory(Array.isArray(data?.history) ? data.history : []);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load discount codes."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadCodes(); }, []);

  function resetForm() {
    setEditingId(""); setCode(""); setValueType("percentage"); setPercentage("10"); setFixedAmount("0");
    setMinAmount("0"); setMaxAmount(""); setIsActive(true); setAppliesToAllProducts(true); setProductIds([]);
  }

  function editCode(item: DiscountCodeItem) {
    setEditingId(item._id);
    setCode(item.code);
    setValueType(item.valueType === "fixed" ? "fixed" : "percentage");
    setPercentage(String(item.percentage ?? 0));
    setFixedAmount(String(item.fixedAmount ?? 0));
    setMinAmount(String(item.minAmount ?? 0));
    setMaxAmount(item.maxAmount === null || item.maxAmount === undefined ? "" : String(item.maxAmount));
    setIsActive(item.isActive === true);
    setAppliesToAllProducts(item.appliesToAllProducts !== false);
    setProductIds(Array.isArray(item.productIds) ? item.productIds.map(String) : []);
    setError(""); setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveCode() {
    try {
      setSaving(true); setError(""); setSuccess("");
      const normalizedCode = code.trim().toUpperCase();
      if (!/^[A-Z0-9_-]{3,40}$/.test(normalizedCode)) throw new Error("Code must be 3-40 characters using letters, numbers, _ or -.");
      const pct = Number(percentage), fixed = Number(fixedAmount), min = Number(minAmount), max = maxAmount.trim() === "" ? null : Number(maxAmount);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) throw new Error("Discount percentage must be between 0 and 100.");
      if (!Number.isFinite(fixed) || fixed < 0) throw new Error("Custom discount price must be 0 or greater.");
      if (!Number.isFinite(min) || min < 0) throw new Error("Minimum base price must be 0 or greater.");
      if (max !== null && (!Number.isFinite(max) || max < min)) throw new Error("Maximum base price must be greater than or equal to minimum base price.");
      if (isActive && valueType === "percentage" && pct <= 0) throw new Error("Active discount percentage must be greater than 0.");
      if (isActive && valueType === "fixed" && fixed <= 0) throw new Error("Active custom discount price must be greater than 0.");
      if (!appliesToAllProducts && productIds.length === 0) throw new Error("Select at least one product or turn All Products on.");

      const response = await fetch(editingId ? `${API_URL}/api/admin/discounts/codes/${editingId}` : `${API_URL}/api/admin/discounts/codes`, {
        method: editingId ? "PATCH" : "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalizedCode, valueType, percentage: pct, fixedAmount: fixed, minAmount: min, maxAmount: max, isActive, appliesToAllProducts, productIds: appliesToAllProducts ? [] : productIds }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to save discount code.");
      setSuccess(data?.message || "Discount code saved."); resetForm(); await loadCodes();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save discount code."); }
    finally { setSaving(false); }
  }

  async function toggleCode(item: DiscountCodeItem) {
    try {
      setBusyId(item._id); setError(""); setSuccess("");
      const response = await fetch(`${API_URL}/api/admin/discounts/codes/${item._id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !item.isActive }) });
      const data = await readJson(response); if (!response.ok) throw new Error(data?.message || "Unable to update discount code.");
      setSuccess(data?.message || "Discount code updated."); await loadCodes();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to update discount code."); } finally { setBusyId(""); }
  }

  async function deleteCode(item: DiscountCodeItem) {
    const confirmed = await confirmAdminAction({
      title: "Delete Discount Code?",
      itemName: item.code,
      description: "The discount code will be moved to Trash for 30 days and will stop applying immediately.",
      confirmLabel: "Move to Trash",
    });
    if (!confirmed) return;
    try {
      setBusyId(item._id); setError(""); setSuccess("");
      const response = await fetch(`${API_URL}/api/admin/discounts/codes/${item._id}`, { method: "DELETE", credentials: "include" });
      const data = await readJson(response); if (!response.ok) throw new Error(data?.message || "Unable to delete discount code.");
      setSuccess(data?.message || "Discount code deleted."); if (editingId === item._id) resetForm(); await loadCodes();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to delete discount code."); } finally { setBusyId(""); }
  }

  return <div className="mx-auto w-full max-w-[1500px]">
    <section className="rounded-[30px] bg-[#211A18] px-7 py-8 text-white md:px-8 md:py-9"><p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#E7AE72]">Extra Add</p><h2 className="mt-4 text-[30px] font-semibold">Discount Code</h2><p className="mt-3 max-w-3xl text-[13px] leading-6 text-white/65">Set a minimum and maximum cart base price for each code. Use percentage or a custom ₹ discount price, then edit/delete/activate/deactivate it anytime.</p></section>
    {(error || success) && <div className={`mt-5 rounded-[16px] border px-4 py-3 text-[12px] ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error || success}</div>}

    <div className="mt-6 grid gap-5 xl:grid-cols-[500px_1fr]">
      <section className="h-fit rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
        <div className="flex items-center justify-between"><div><h3 className="text-[18px] font-semibold">{editingId ? "Edit Code" : "Add Code"}</h3><p className="mt-1 text-[10px] text-[#211A18]/45">Base price is cart subtotal before discounts/tax.</p></div>{editingId && <button type="button" onClick={resetForm} className="rounded-xl border px-3 py-2 text-[10px] font-semibold">Cancel edit</button>}</div>
        <label className="mt-5 block"><span className="text-[12px] font-semibold">Code</span><input value={code} maxLength={40} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))} placeholder="HIVRA10" className="mt-3 h-12 w-full rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4 text-[13px] uppercase outline-none" /></label>
        <label className="mt-4 block"><span className="text-[12px] font-semibold">Discount type</span><select value={valueType} onChange={(e) => setValueType(e.target.value as ValueType)} className="mt-3 h-12 w-full rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4 text-[13px]"><option value="percentage">Percentage (%)</option><option value="fixed">Custom price (₹)</option></select></label>
        {valueType === "percentage" ? <NumberInput label="Discount percentage" value={percentage} onChange={setPercentage} /> : <MoneyInput label="Custom discount price" value={fixedAmount} onChange={setFixedAmount} placeholder="100" />}
        <div className="mt-4 grid grid-cols-2 gap-3"><MoneyInput label="Min base price" value={minAmount} onChange={setMinAmount} placeholder="0" /><MoneyInput label="Max base price" value={maxAmount} onChange={setMaxAmount} placeholder="No limit" /></div>
        <div className="mt-5 space-y-3"><ToggleRow label="All Products" description="ON = code works on all products." checked={appliesToAllProducts} onChange={(v) => { setAppliesToAllProducts(v); if (v) setProductIds([]); }} /><ToggleRow label="Active" description="Only active codes can be applied." checked={isActive} onChange={setIsActive} /></div>
        <button type="button" onClick={() => void saveCode()} disabled={saving} className="mt-5 h-14 w-full rounded-[14px] bg-[#A51D45] text-[12px] font-semibold uppercase text-white disabled:opacity-50">{saving ? "Saving..." : editingId ? "Update Discount Code" : "Create Discount Code"}</button>
      </section>
      <DiscountProductSelector selectedIds={productIds} onChange={setProductIds} disabled={appliesToAllProducts} title="Products for this code" description="Turn All Products off and select exact products for this code." emptySelectionText="No individual products selected." />
    </div>

    <section className="mt-6 rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6"><div className="flex items-center justify-between border-b pb-5"><div><h3 className="text-[18px] font-semibold">Discount Codes</h3><p className="mt-1 text-[11px] text-[#211A18]/40">Edit, delete and active/inactive actions are available here.</p></div><span className="rounded-full bg-[#F2EEEA] px-3 py-1.5 text-[10px] font-semibold">{codes.length} codes</span></div>{loading ? <div className="py-10 text-center text-[12px] text-[#211A18]/40">Loading...</div> : codes.length === 0 ? <div className="py-10 text-center text-[12px] text-[#211A18]/40">No discount code created yet.</div> : <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[980px] border-separate border-spacing-y-2 text-left text-[11px]"><thead className="text-[9px] uppercase text-[#211A18]/40"><tr><th className="px-3 py-2">Code</th><th className="px-3 py-2">Value</th><th className="px-3 py-2">Range</th><th className="px-3 py-2">Products</th><th className="px-3 py-2">Status</th><th className="px-3 py-2 text-right">Actions</th></tr></thead><tbody>{codes.map((item) => <tr key={item._id} className="bg-[#FAF8F6]"><td className="rounded-l-[14px] px-3 py-3 font-semibold">{item.code}</td><td className="px-3 py-3 font-semibold">{item.valueType === "fixed" ? money(item.fixedAmount || 0) : `${item.percentage || 0}%`}</td><td className="px-3 py-3">{money(item.minAmount || 0)} – {item.maxAmount === null || item.maxAmount === undefined ? "No limit" : money(item.maxAmount)}</td><td className="px-3 py-3">{item.appliesToAllProducts ? "All Products" : `${item.productIds?.length || 0} selected`}</td><td className="px-3 py-3">{item.isActive ? "Active" : "Inactive"}</td><td className="rounded-r-[14px] px-3 py-3"><div className="flex justify-end gap-2"><button type="button" onClick={() => editCode(item)} className="rounded-xl border bg-white px-3 py-2 text-[10px] font-semibold">Edit</button><button type="button" disabled={busyId === item._id} onClick={() => void toggleCode(item)} className="rounded-xl border bg-white px-3 py-2 text-[10px] font-semibold disabled:opacity-40">{item.isActive ? "Disable" : "Enable"}</button><button type="button" disabled={busyId === item._id} onClick={() => void deleteCode(item)} className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-semibold text-red-600 disabled:opacity-40">Delete</button></div></td></tr>)}</tbody></table></div>}</section>

    <section className="mt-6 rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6"><h3 className="text-[18px] font-semibold">Discount Code History</h3><p className="mt-1 text-[11px] text-[#211A18]/40">Create, edit, active/inactive and delete changes.</p>{history.length === 0 ? <div className="py-8 text-center text-[12px] text-[#211A18]/40">No history yet.</div> : <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-[11px]"><thead className="text-[9px] uppercase text-[#211A18]/40"><tr><th className="px-3 py-3">Changed</th><th className="px-3 py-3">Action</th><th className="px-3 py-3">Code</th><th className="px-3 py-3">Value</th><th className="px-3 py-3">Range</th><th className="px-3 py-3">Status</th></tr></thead><tbody>{history.map((h, i) => <tr key={h._id || `${h.codeId}-${i}`} className="border-t"><td className="px-3 py-3">{dateTime(h.changedAt)}</td><td className="px-3 py-3 capitalize">{String(h.action || "updated").replaceAll("_", " ")}</td><td className="px-3 py-3 font-semibold">{h.code || "—"}</td><td className="px-3 py-3">{h.valueType === "fixed" ? money(h.fixedAmount || 0) : `${h.percentage || 0}%`}</td><td className="px-3 py-3">{money(h.minAmount || 0)} – {h.maxAmount === null || h.maxAmount === undefined ? "No limit" : money(h.maxAmount)}</td><td className="px-3 py-3">{h.isActive ? "Active" : "Inactive"}</td></tr>)}</tbody></table></div>}</section>
  </div>;
}

function MoneyInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) { return <label className="block"><span className="text-[12px] font-semibold">{label}</span><div className="mt-3 flex h-12 items-center rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4"><span className="mr-2 text-[12px]">₹</span><input type="number" min={0} step="0.01" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-[13px] outline-none" /></div></label>; }
function NumberInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) { return <label className="mt-4 block"><span className="text-[12px] font-semibold">{label}</span><div className="mt-3 flex h-12 items-center rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4"><input type="number" min={0} max={100} step="0.01" value={value} onChange={(e) => onChange(e.target.value)} className="min-w-0 flex-1 bg-transparent text-[13px] outline-none" /><span>%</span></div></label>; }
function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) { return <label className="flex cursor-pointer items-center justify-between rounded-[16px] bg-[#FAF8F6] px-4 py-4"><span><span className="block text-[12px] font-semibold">{label}</span><span className="mt-1 block text-[10px] text-[#211A18]/45">{description}</span></span><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#A51D45]" /></label>; }
