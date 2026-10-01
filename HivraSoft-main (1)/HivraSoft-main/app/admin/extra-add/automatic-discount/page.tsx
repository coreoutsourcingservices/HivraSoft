"use client";

import { useEffect, useState } from "react";
import DiscountProductSelector from "@/src/components/Admin/DiscountProductSelector";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
type ValueType = "percentage" | "fixed";

type AutomaticRule = {
  _id: string;
  name?: string;
  valueType?: ValueType;
  percentage: number;
  fixedAmount?: number;
  minAmount: number;
  maxAmount: number | null;
  isActive: boolean;
  excludedProducts?: string[];
};

type HistoryItem = {
  _id?: string;
  ruleId?: string;
  action?: string;
  name?: string;
  valueType?: ValueType;
  percentage?: number;
  fixedAmount?: number;
  minAmount?: number;
  maxAmount?: number | null;
  isActive?: boolean;
  excludedProductCount?: number;
  changedAt?: string;
};

async function readJson(response: Response) {
  try { return await response.json(); } catch { return {}; }
}

function money(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function dateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function AutomaticDiscountPage() {
  const [rules, setRules] = useState<AutomaticRule[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [editingId, setEditingId] = useState("");
  const [valueType, setValueType] = useState<ValueType>("percentage");
  const [percentage, setPercentage] = useState("5");
  const [fixedAmount, setFixedAmount] = useState("0");
  const [minAmount, setMinAmount] = useState("0");
  const [maxAmount, setMaxAmount] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [applyToAllProducts, setApplyToAllProducts] = useState(true);
  const [excludedProducts, setExcludedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadRules() {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/discounts/automatic`, {
        credentials: "include", cache: "no-store",
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to load automatic discount rules.");
      setRules(Array.isArray(data?.rules) ? data.rules : []);
      setHistory(Array.isArray(data?.history) ? data.history : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load automatic discount rules.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadRules(); }, []);

  function resetForm() {
    setEditingId("");
    setValueType("percentage");
    setPercentage("5");
    setFixedAmount("0");
    setMinAmount("0");
    setMaxAmount("");
    setIsActive(true);
    setApplyToAllProducts(true);
    setExcludedProducts([]);
  }

  function editRule(rule: AutomaticRule) {
    const excluded = Array.isArray(rule.excludedProducts) ? rule.excludedProducts.map(String) : [];
    setEditingId(rule._id);
    setValueType(rule.valueType === "fixed" ? "fixed" : "percentage");
    setPercentage(String(rule.percentage ?? 0));
    setFixedAmount(String(rule.fixedAmount ?? 0));
    setMinAmount(String(rule.minAmount ?? 0));
    setMaxAmount(rule.maxAmount === null || rule.maxAmount === undefined ? "" : String(rule.maxAmount));
    setIsActive(rule.isActive === true);
    setExcludedProducts(excluded);
    setApplyToAllProducts(excluded.length === 0);
    setError(""); setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveRule() {
    try {
      setSaving(true); setError(""); setSuccess("");
      const pct = Number(percentage);
      const fixed = Number(fixedAmount);
      const min = Number(minAmount);
      const max = maxAmount.trim() === "" ? null : Number(maxAmount);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) throw new Error("Discount percentage must be between 0 and 100.");
      if (!Number.isFinite(fixed) || fixed < 0) throw new Error("Custom discount price must be 0 or greater.");
      if (!Number.isFinite(min) || min < 0) throw new Error("Minimum base price must be 0 or greater.");
      if (max !== null && (!Number.isFinite(max) || max < min)) throw new Error("Maximum base price must be greater than or equal to minimum base price.");
      if (isActive && valueType === "percentage" && pct <= 0) throw new Error("Active discount percentage must be greater than 0.");
      if (isActive && valueType === "fixed" && fixed <= 0) throw new Error("Active custom discount price must be greater than 0.");

      const response = await fetch(
        editingId ? `${API_URL}/api/admin/discounts/automatic/${editingId}` : `${API_URL}/api/admin/discounts/automatic`,
        {
          method: editingId ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Automatic Discount", valueType, percentage: pct, fixedAmount: fixed,
            minAmount: min, maxAmount: max, isActive, applyToAllProducts,
            excludedProducts: applyToAllProducts ? [] : excludedProducts,
          }),
        }
      );
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to save automatic discount rule.");
      setSuccess(data?.message || "Automatic discount rule saved.");
      resetForm();
      await loadRules();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save automatic discount rule.");
    } finally { setSaving(false); }
  }

  async function toggleRule(rule: AutomaticRule) {
    try {
      setBusyId(rule._id); setError(""); setSuccess("");
      const response = await fetch(`${API_URL}/api/admin/discounts/automatic/${rule._id}`, {
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to update automatic discount rule.");
      setSuccess(data?.message || "Automatic discount rule updated.");
      await loadRules();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update automatic discount rule.");
    } finally { setBusyId(""); }
  }

  async function deleteRule(rule: AutomaticRule) {
    if (!window.confirm("Delete this automatic discount rule?")) return;
    try {
      setBusyId(rule._id); setError(""); setSuccess("");
      const response = await fetch(`${API_URL}/api/admin/discounts/automatic/${rule._id}`, {
        method: "DELETE", credentials: "include",
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to delete automatic discount rule.");
      setSuccess(data?.message || "Automatic discount rule deleted.");
      if (editingId === rule._id) resetForm();
      await loadRules();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete automatic discount rule.");
    } finally { setBusyId(""); }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <section className="rounded-[30px] bg-[#211A18] px-7 py-8 text-white md:px-8 md:py-9">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#E7AE72]">Extra Add</p>
        <h2 className="mt-4 text-[30px] font-semibold tracking-[-0.03em]">Automatic Discount</h2>
        <p className="mt-3 max-w-3xl text-[13px] leading-6 text-white/65">Create price-range rules. A rule starts from Minimum and applies up to Maximum. Leave Maximum blank for no upper limit. Use percentage or a custom ₹ discount price.</p>
      </section>

      {(error || success) && <div className={`mt-5 rounded-[16px] border px-4 py-3 text-[12px] ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error || success}</div>}

      <div className="mt-6 grid gap-5 xl:grid-cols-[440px_1fr]">
        <section className="h-fit rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div><h3 className="text-[18px] font-semibold text-[#211A18]">{editingId ? "Edit Rule" : "Add Rule"}</h3><p className="mt-1 text-[10px] text-[#211A18]/45">Base price is cart subtotal before discounts and tax.</p></div>
            {editingId && <button type="button" onClick={resetForm} className="rounded-xl border border-[#211A18]/10 px-3 py-2 text-[10px] font-semibold text-[#211A18]/60">Cancel edit</button>}
          </div>

          <label className="mt-5 block"><span className="text-[12px] font-semibold text-[#211A18]">Discount type</span><select value={valueType} onChange={(e) => setValueType(e.target.value as ValueType)} className="mt-3 h-12 w-full rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4 text-[13px] outline-none"><option value="percentage">Percentage (%)</option><option value="fixed">Custom price (₹)</option></select></label>

          {valueType === "percentage" ? <NumberInput label="Discount percentage" value={percentage} onChange={setPercentage} suffix="%" /> : <MoneyInput label="Custom discount price" value={fixedAmount} onChange={setFixedAmount} placeholder="50" />}

          <div className="mt-4 grid grid-cols-2 gap-3"><MoneyInput label="Min base price" value={minAmount} onChange={setMinAmount} placeholder="0" /><MoneyInput label="Max base price" value={maxAmount} onChange={setMaxAmount} placeholder="No limit" /></div>

          <div className="mt-5 space-y-3">
            <ToggleRow label="Active" description="Only active rules are used in cart/order calculation." checked={isActive} onChange={setIsActive} />
            <ToggleRow label="All Products" description="ON = every product can receive this discount." checked={applyToAllProducts} onChange={(value) => { setApplyToAllProducts(value); if (value) setExcludedProducts([]); }} />
          </div>

          <button type="button" onClick={() => void saveRule()} disabled={saving || loading} className="mt-5 h-14 w-full rounded-[14px] bg-[#A51D45] text-[12px] font-semibold uppercase tracking-[0.08em] text-white disabled:opacity-50">{saving ? "Saving..." : editingId ? "Update Rule" : "Add Rule"}</button>
        </section>

        <DiscountProductSelector selectedIds={excludedProducts} onChange={setExcludedProducts} disabled={applyToAllProducts} title="Products without automatic discount" description="Turn All Products off and select products that should be excluded from this rule." emptySelectionText="No products are excluded." />
      </div>

      <section className="mt-6 rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
        <div className="flex items-center justify-between border-b border-[#211A18]/8 pb-5"><div><h3 className="text-[18px] font-semibold">Automatic Discount Rules</h3><p className="mt-1 text-[11px] text-[#211A18]/40">Edit, delete, activate or deactivate any price range.</p></div><span className="rounded-full bg-[#F2EEEA] px-3 py-1.5 text-[10px] font-semibold text-[#211A18]/55">{rules.length} rules</span></div>
        {loading ? <div className="py-10 text-center text-[12px] text-[#211A18]/40">Loading...</div> : rules.length === 0 ? <div className="py-10 text-center text-[12px] text-[#211A18]/40">No rule created yet.</div> : <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[900px] border-separate border-spacing-y-2 text-left text-[11px]"><thead className="text-[9px] uppercase tracking-[0.08em] text-[#211A18]/40"><tr><th className="px-3 py-2">Value</th><th className="px-3 py-2">Base Price Range</th><th className="px-3 py-2">Excluded</th><th className="px-3 py-2">Status</th><th className="px-3 py-2 text-right">Actions</th></tr></thead><tbody>{rules.map((rule) => <tr key={rule._id} className="bg-[#FAF8F6]"><td className="rounded-l-[14px] px-3 py-3 font-semibold">{rule.valueType === "fixed" ? money(rule.fixedAmount || 0) : `${rule.percentage || 0}%`}</td><td className="px-3 py-3">{money(rule.minAmount)} – {rule.maxAmount === null || rule.maxAmount === undefined ? "No limit" : money(rule.maxAmount)}</td><td className="px-3 py-3">{Array.isArray(rule.excludedProducts) ? rule.excludedProducts.length : 0}</td><td className="px-3 py-3">{rule.isActive ? "Active" : "Inactive"}</td><td className="rounded-r-[14px] px-3 py-3"><div className="flex justify-end gap-2"><button type="button" onClick={() => editRule(rule)} className="rounded-xl border bg-white px-3 py-2 text-[10px] font-semibold">Edit</button><button type="button" disabled={busyId === rule._id} onClick={() => void toggleRule(rule)} className="rounded-xl border bg-white px-3 py-2 text-[10px] font-semibold disabled:opacity-40">{rule.isActive ? "Disable" : "Enable"}</button><button type="button" disabled={busyId === rule._id} onClick={() => void deleteRule(rule)} className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-semibold text-red-600 disabled:opacity-40">Delete</button></div></td></tr>)}</tbody></table></div>}
      </section>

      <section className="mt-6 rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
        <h3 className="text-[18px] font-semibold">Automatic Discount History</h3><p className="mt-1 text-[11px] text-[#211A18]/40">Create, edit, active/inactive and delete changes.</p>
        {history.length === 0 ? <div className="py-8 text-center text-[12px] text-[#211A18]/40">No history yet.</div> : <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-[11px]"><thead className="text-[9px] uppercase tracking-[0.08em] text-[#211A18]/40"><tr><th className="px-3 py-3">Changed</th><th className="px-3 py-3">Action</th><th className="px-3 py-3">Value</th><th className="px-3 py-3">Range</th><th className="px-3 py-3">Status</th></tr></thead><tbody>{history.map((item, index) => <tr key={item._id || `${item.ruleId}-${index}`} className="border-t border-[#211A18]/6"><td className="px-3 py-3">{dateTime(item.changedAt)}</td><td className="px-3 py-3 capitalize">{String(item.action || "updated").replaceAll("_", " ")}</td><td className="px-3 py-3 font-semibold">{item.valueType === "fixed" ? money(item.fixedAmount || 0) : `${item.percentage || 0}%`}</td><td className="px-3 py-3">{money(item.minAmount || 0)} – {item.maxAmount === null || item.maxAmount === undefined ? "No limit" : money(item.maxAmount)}</td><td className="px-3 py-3">{item.isActive ? "Active" : "Inactive"}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}

function MoneyInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="mt-4 block"><span className="text-[12px] font-semibold text-[#211A18]">{label}</span><div className="mt-3 flex h-12 items-center rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4"><span className="mr-2 text-[12px] font-semibold text-[#211A18]/45">₹</span><input type="number" min={0} step="0.01" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-[13px] outline-none" /></div></label>;
}

function NumberInput({ label, value, onChange, suffix }: { label: string; value: string; onChange: (value: string) => void; suffix: string }) {
  return <label className="mt-4 block"><span className="text-[12px] font-semibold text-[#211A18]">{label}</span><div className="mt-3 flex h-12 items-center rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4"><input type="number" min={0} max={100} step="0.01" value={value} onChange={(e) => onChange(e.target.value)} className="min-w-0 flex-1 bg-transparent text-[13px] outline-none" /><span className="text-[12px] font-semibold">{suffix}</span></div></label>;
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[16px] bg-[#FAF8F6] px-4 py-4"><span><span className="block text-[12px] font-semibold">{label}</span><span className="mt-1 block text-[10px] text-[#211A18]/45">{description}</span></span><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#A51D45]" /></label>;
}
