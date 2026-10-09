"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

type Customer = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  resolvedAccountStatus?: "active" | "inactive" | "blocked";
  createdAt: string;
  resolvedLastActiveAt?: string | null;
  cartItemCount?: number;
  cartQuantity?: number;
  cartValue?: number;
  oldestCartItemAt?: string | null;
  wishlistCount?: number;
  oldestWishlistItemAt?: string | null;
  orderCount?: number;
  totalSpend?: number;
  lastOrderAt?: string | null;
};

type Pagination = { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean };
type Filters = {
  search: string;
  accountStatus: string;
  joined: string;
  joinedFrom: string;
  joinedTo: string;
  lastActive: string;
  hasCart: string;
  cartCountMin: string;
  cartCountMax: string;
  minCartValue: string;
  maxCartValue: string;
  cartAge: string;
  abandonedCartDays: string;
  hasWishlist: string;
  wishlistCountMin: string;
  wishlistCountMax: string;
  wishlistAge: string;
  cartWishlist: string;
  orderStatus: string;
  orderCountMin: string;
  orderCountMax: string;
  minSpend: string;
  maxSpend: string;
  lastOrder: string;
  couponUsed: string;
  discountUsed: string;
};

const emptyFilters: Filters = {
  search: "", accountStatus: "", joined: "", joinedFrom: "", joinedTo: "", lastActive: "", hasCart: "", cartCountMin: "", cartCountMax: "", minCartValue: "", maxCartValue: "", cartAge: "", abandonedCartDays: "",
  hasWishlist: "", wishlistCountMin: "", wishlistCountMax: "", wishlistAge: "", cartWishlist: "", orderStatus: "", orderCountMin: "", orderCountMax: "", minSpend: "", maxSpend: "", lastOrder: "", couponUsed: "", discountUsed: "",
};

function money(value: unknown) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function age(value?: string | null) {
  if (!value) return "—";
  const ms = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${Math.max(1, min)}m`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 60) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

function shortDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
}

async function readJson(response: Response) {
  try { return await response.json(); } catch { return {}; }
}

export default function AdminCustomersPage() {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [searchDraft, setSearchDraft] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((current) => current.search === searchDraft ? current : { ...current, search: searchDraft });
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchDraft]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams({ page: String(page), limit: "20" });
        Object.entries(filters).forEach(([key, value]) => { if (value !== "") params.set(key, String(value)); });
        const response = await fetch(`${API_URL}/api/admin/customers?${params}`, { credentials: "include", cache: "no-store" });
        const data = await readJson(response);
        if (!response.ok) throw new Error(data?.message || "Unable to load customers.");
        if (!active) return;
        setRows(Array.isArray(data?.customers) ? data.customers : []);
        setPagination(data?.pagination || { page, limit: 20, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: page > 1 });
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load customers.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [filters, page]);

  const activeFilterCount = useMemo(() => Object.entries(filters).filter(([key, value]) => key !== "search" && value !== "").length, [filters]);
  const setFilter = (key: keyof Filters, value: string) => { setFilters((current) => ({ ...current, [key]: value })); setPage(1); };
  const clearAll = () => { setFilters(emptyFilters); setSearchDraft(""); setPage(1); };

  return (
    <div className="mx-auto w-full max-w-[1600px] pb-12">
      <section className="rounded-[30px] bg-[#211A18] px-7 py-8 text-white md:px-9">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#E7AE72]">Users</p>
            <h1 className="mt-4 text-[34px] font-semibold tracking-[-0.04em]">Customers</h1>
            <p className="mt-3 max-w-2xl text-[13px] leading-6 text-white/60">Search and segment customers by activity, cart age/value, wishlist age and order history.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3">
            <p className="text-[9px] uppercase tracking-[0.12em] text-white/40">Matched customers</p>
            <p className="mt-1 text-[26px] font-semibold">{pagination.total}</p>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-[24px] border border-[#211A18]/10 bg-white p-4 md:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4">
            <Search size={16} className="shrink-0 text-[#211A18]/35" />
            <input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Search customer by name, email, phone or User ID..." className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#211A18]/30" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setDrawer(true)} className="inline-flex h-12 items-center gap-2 rounded-[13px] border border-[#211A18]/10 px-4 text-[10px] font-semibold"><SlidersHorizontal size={14} /> Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}</button>
            <QuickSelect label="Cart" value={filters.hasCart} onChange={(v) => setFilter("hasCart", v)} options={[['', 'Cart'], ['true','Has Cart'], ['false','Empty Cart']]} />
            <QuickSelect label="Wishlist" value={filters.hasWishlist} onChange={(v) => setFilter("hasWishlist", v)} options={[['','Wishlist'],['true','Has Wishlist'],['false','Empty Wishlist']]} />
            <QuickSelect label="Orders" value={filters.orderStatus} onChange={(v) => setFilter("orderStatus", v)} options={[['','Orders'],['has','Has Orders'],['never','Never Ordered']]} />
            <QuickSelect label="Last Active" value={filters.lastActive} onChange={(v) => setFilter("lastActive", v)} options={[['','Last Active'],['today','Today'],['24h','24h'],['3d','3 Days'],['7d','7 Days'],['30plus','30+ Days']]} />
            <button type="button" onClick={clearAll} className="h-12 rounded-[13px] px-3 text-[10px] font-semibold text-[#8C1839]">Clear All</button>
          </div>
        </div>
      </section>

      {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">{error}</div>}

      <section className="mt-5 overflow-hidden rounded-[24px] border border-[#211A18]/10 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[1420px] w-full text-left">
            <thead className="bg-[#FAF8F6] text-[9px] uppercase tracking-[0.08em] text-[#211A18]/45">
              <tr>{["Customer","Email / Phone","Cart","Cart Value","Oldest Cart Item","Wishlist","Oldest Wishlist Item","Orders","Total Spend","Last Active","Joined","Action"].map((label) => <th key={label} className="px-4 py-4 font-semibold">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#211A18]/7">
              {loading ? (
                <tr><td colSpan={12} className="px-6 py-16 text-center text-[12px] text-[#211A18]/40">Loading customers...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={12} className="px-6 py-16 text-center text-[12px] text-[#211A18]/40">No customers match these filters.</td></tr>
              ) : rows.map((customer) => {
                const status = customer.resolvedAccountStatus || (customer.isActive ? "active" : "inactive");
                return (
                  <tr key={customer._id} className="text-[11px] text-[#211A18]/65 hover:bg-[#FCFAF8]">
                    <td className="px-4 py-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#F4E8EC] text-[11px] font-semibold text-[#8C1839]">{customer.name?.charAt(0)?.toUpperCase() || "U"}</div><div><p className="font-semibold text-[#211A18]">{customer.name}</p><StatusBadge status={status} /></div></div></td>
                    <td className="px-4 py-4"><p>{customer.email}</p><p className="mt-1 text-[9px] text-[#211A18]/40">{customer.phone}</p></td>
                    <td className="px-4 py-4 font-semibold text-[#211A18]">{customer.cartItemCount || 0}</td>
                    <td className="px-4 py-4">{money(customer.cartValue)}</td>
                    <td className="px-4 py-4">{age(customer.oldestCartItemAt)}</td>
                    <td className="px-4 py-4 font-semibold text-[#211A18]">{customer.wishlistCount || 0}</td>
                    <td className="px-4 py-4">{age(customer.oldestWishlistItemAt)}</td>
                    <td className="px-4 py-4">{customer.orderCount || 0}</td>
                    <td className="px-4 py-4 font-semibold text-[#211A18]">{money(customer.totalSpend)}</td>
                    <td className="px-4 py-4">{age(customer.resolvedLastActiveAt)}</td>
                    <td className="px-4 py-4">{shortDate(customer.createdAt)}</td>
                    <td className="px-4 py-4"><Link href={`/admin/customers/${customer._id}`} className="inline-flex h-9 items-center rounded-xl bg-[#211A18] px-3 text-[9px] font-semibold uppercase tracking-[0.06em] text-white">View</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-[#211A18]/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] text-[#211A18]/45">Page {pagination.page} of {pagination.totalPages} · {pagination.total} records</p>
          <div className="flex gap-2">
            <button type="button" disabled={!pagination.hasPrevPage || loading} onClick={() => setPage((v) => Math.max(1, v - 1))} className="h-10 rounded-xl border border-[#211A18]/10 px-4 text-[10px] font-semibold disabled:opacity-35">Previous</button>
            <button type="button" disabled={!pagination.hasNextPage || loading} onClick={() => setPage((v) => v + 1)} className="h-10 rounded-xl bg-[#A51D45] px-4 text-[10px] font-semibold text-white disabled:opacity-35">Next</button>
          </div>
        </div>
      </section>

      {drawer && <FilterDrawer filters={filters} setFilter={setFilter} onClose={() => setDrawer(false)} onClear={clearAll} />}
    </div>
  );
}

function FilterDrawer({ filters, setFilter, onClose, onClear }: { filters: Filters; setFilter: (key: keyof Filters, value: string) => void; onClose: () => void; onClear: () => void }) {
  return <div className="fixed inset-0 z-[80] bg-black/35" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="ml-auto h-full w-full max-w-[470px] overflow-y-auto bg-[#F7F3EF] p-5 shadow-2xl md:p-6">
      <div className="flex items-center justify-between"><div><p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8C1839]">Advanced Filters</p><h2 className="mt-1 text-[22px] font-semibold">Customer Segments</h2></div><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl bg-white"><X size={17}/></button></div>
      <div className="mt-6 space-y-5">
        <FilterSection title="Customer"><SelectField label="Account Status" value={filters.accountStatus} onChange={(v) => setFilter("accountStatus", v)} options={[['','Any status'],['active','Active'],['inactive','Inactive'],['blocked','Blocked']]} /><SelectField label="Joined" value={filters.joined} onChange={(v) => setFilter("joined", v)} options={[['','Any time'],['today','Today'],['7d','Last 7 Days'],['30d','Last 30 Days']]} /><DateField label="Joined From" value={filters.joinedFrom} onChange={(v) => setFilter("joinedFrom", v)} /><DateField label="Joined To" value={filters.joinedTo} onChange={(v) => setFilter("joinedTo", v)} /></FilterSection>
        <FilterSection title="Activity"><SelectField label="Last Active" value={filters.lastActive} onChange={(v) => setFilter("lastActive", v)} options={[['','Any time'],['today','Today'],['24h','Last 24 Hours'],['3d','Last 3 Days'],['7d','Last 7 Days'],['30plus','30+ Days']]} /></FilterSection>
        <FilterSection title="Cart"><SelectField label="Cart Status" value={filters.hasCart} onChange={(v) => setFilter("hasCart", v)} options={[['','Any'],['true','Has Cart Items'],['false','Empty Cart']]} /><NumberField label="Minimum Cart Items" value={filters.cartCountMin} onChange={(v) => setFilter("cartCountMin", v)} /><NumberField label="Maximum Cart Items" value={filters.cartCountMax} onChange={(v) => setFilter("cartCountMax", v)} /><NumberField label="Minimum Cart Value (₹)" value={filters.minCartValue} onChange={(v) => setFilter("minCartValue", v)} /><NumberField label="Maximum Cart Value (₹)" value={filters.maxCartValue} onChange={(v) => setFilter("maxCartValue", v)} /><SelectField label="Product In Cart Since" value={filters.cartAge} onChange={(v) => setFilter("cartAge", v)} options={[['','Any age'],['lt1h','<1 Hour'],['1-24h','1–24 Hours'],['1-3d','1–3 Days'],['3-7d','3–7 Days'],['7-30d','7–30 Days'],['30plus','30+ Days']]} /><SelectField label="Abandoned Cart" value={filters.abandonedCartDays} onChange={(v) => setFilter("abandonedCartDays", v)} options={[['','Any'],['1','24h+'],['3','3 Days+'],['7','7 Days+'],['30','30 Days+']]} /></FilterSection>
        <FilterSection title="Wishlist"><SelectField label="Wishlist Status" value={filters.hasWishlist} onChange={(v) => setFilter("hasWishlist", v)} options={[['','Any'],['true','Has Wishlist'],['false','Empty Wishlist']]} /><NumberField label="Minimum Wishlist Items" value={filters.wishlistCountMin} onChange={(v) => setFilter("wishlistCountMin", v)} /><NumberField label="Maximum Wishlist Items" value={filters.wishlistCountMax} onChange={(v) => setFilter("wishlistCountMax", v)} /><SelectField label="Product In Wishlist Since" value={filters.wishlistAge} onChange={(v) => setFilter("wishlistAge", v)} options={[['','Any age'],['today','Today'],['1-7d','1–7 Days'],['7-30d','7–30 Days'],['30-90d','30–90 Days'],['90plus','90+ Days']]} /><SelectField label="Cart + Wishlist" value={filters.cartWishlist} onChange={(v) => setFilter("cartWishlist", v)} options={[['','Any'],['both','Product in both'],['cartOnly','Only Cart'],['wishlistOnly','Only Wishlist']]} /></FilterSection>
        <FilterSection title="Orders & Spending"><SelectField label="Order Status" value={filters.orderStatus} onChange={(v) => setFilter("orderStatus", v)} options={[['','Any'],['never','Never Ordered'],['has','Has Orders']]} /><NumberField label="Minimum Orders" value={filters.orderCountMin} onChange={(v) => setFilter("orderCountMin", v)} /><NumberField label="Maximum Orders" value={filters.orderCountMax} onChange={(v) => setFilter("orderCountMax", v)} /><NumberField label="Minimum Spend (₹)" value={filters.minSpend} onChange={(v) => setFilter("minSpend", v)} /><NumberField label="Maximum Spend (₹)" value={filters.maxSpend} onChange={(v) => setFilter("maxSpend", v)} /><SelectField label="Last Order" value={filters.lastOrder} onChange={(v) => setFilter("lastOrder", v)} options={[['','Any time'],['today','Today'],['7d','Last 7 Days'],['30d','Last 30 Days'],['90plus','90+ Days']]} /><SelectField label="Coupon Used" value={filters.couponUsed} onChange={(v) => setFilter("couponUsed", v)} options={[['','Any'],['true','Used'],['false','Never Used']]} /><SelectField label="Discount Used" value={filters.discountUsed} onChange={(v) => setFilter("discountUsed", v)} options={[['','Any'],['true','Yes'],['false','No']]} /></FilterSection>
      </div>
      <div className="sticky bottom-0 mt-6 flex gap-2 border-t border-[#211A18]/10 bg-[#F7F3EF] pt-4"><button onClick={onClear} className="h-12 flex-1 rounded-xl border border-[#211A18]/10 bg-white text-[10px] font-semibold">Clear All</button><button onClick={onClose} className="h-12 flex-1 rounded-xl bg-[#A51D45] text-[10px] font-semibold text-white">Apply Filters</button></div>
    </aside>
  </div>;
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-[20px] border border-[#211A18]/10 bg-white p-4"><div className="mb-4 flex items-center gap-2"><Filter size={14} className="text-[#8C1839]"/><h3 className="text-[12px] font-semibold">{title}</h3></div><div className="grid gap-3 sm:grid-cols-2">{children}</div></section>; }
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string,string][] }) { return <label><span className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.06em] text-[#211A18]/45">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-[#211A18]/10 bg-[#FAF8F6] px-3 text-[11px] outline-none">{options.map(([v,l]) => <option key={`${label}-${v}`} value={v}>{l}</option>)}</select></label>; }
function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label><span className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.06em] text-[#211A18]/45">{label}</span><input type="number" min="0" value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-[#211A18]/10 bg-[#FAF8F6] px-3 text-[11px] outline-none"/></label>; }
function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label><span className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.06em] text-[#211A18]/45">{label}</span><input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-[#211A18]/10 bg-[#FAF8F6] px-3 text-[11px] outline-none"/></label>; }
function QuickSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string,string][] }) { return <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="h-12 rounded-[13px] border border-[#211A18]/10 bg-white px-3 text-[10px] font-semibold outline-none">{options.map(([v,l]) => <option key={`${label}-${v}`} value={v}>{l}</option>)}</select>; }
function StatusBadge({ status }: { status: string }) { const cls = status === "active" ? "bg-emerald-50 text-emerald-700" : status === "blocked" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"; return <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[8px] font-semibold uppercase ${cls}`}>{status}</span>; }
