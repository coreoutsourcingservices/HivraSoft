"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Filter, Send, Trash2, Users } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

type Audience = "all" | "filtered" | "selected";
type Customer = { _id: string; name: string; email: string; phone: string };
type AdminNotification = {
  _id: string; title: string; message: string; type: string; audience: Audience;
  recipientCount?: number; userIds?: Customer[]; filters?: Record<string, unknown>;
  link?: string; createdAt: string;
};
type TargetFilters = {
  accountStatus: string; search: string; joined: string; joinedFrom: string; joinedTo: string; lastActive: string;
  hasCart: string; cartCountMin: string; cartCountMax: string; minCartValue: string; maxCartValue: string; cartAgeMinDays: string; abandonedCartDays: string;
  hasWishlist: string; wishlistCountMin: string; wishlistCountMax: string; wishlistAgeMinDays: string;
  cartWishlist: string; orderStatus: string; orderCountMin: string; orderCountMax: string; minSpend: string; maxSpend: string; lastOrder: string; couponUsed: string; discountUsed: string;
};
const emptyTargetFilters: TargetFilters = {
  accountStatus: "active", search: "", joined: "", joinedFrom: "", joinedTo: "", lastActive: "",
  hasCart: "", cartCountMin: "", cartCountMax: "", minCartValue: "", maxCartValue: "", cartAgeMinDays: "", abandonedCartDays: "",
  hasWishlist: "", wishlistCountMin: "", wishlistCountMax: "", wishlistAgeMinDays: "", cartWishlist: "",
  orderStatus: "", orderCountMin: "", orderCountMax: "", minSpend: "", maxSpend: "", lastOrder: "", couponUsed: "", discountUsed: "",
};

async function readJson(response: Response) { try { return await response.json(); } catch { return {}; } }

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("general");
  const [link, setLink] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [filters, setFilters] = useState<TargetFilters>(emptyTargetFilters);
  const [presetUser, setPresetUser] = useState<Customer | null>(null);
  const [matchedCount, setMatchedCount] = useState(0);
  const [previewCustomers, setPreviewCustomers] = useState<Customer[]>([]);
  const [showMatchedUsers, setShowMatchedUsers] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const activeFilterCount = useMemo(() => Object.entries(filters).filter(([key, value]) => key !== "accountStatus" && value !== "").length, [filters]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        setLoading(true);
        const qs = new URLSearchParams(window.location.search);
        const userId = qs.get("user") || "";
        const requests: Promise<Response>[] = [fetch(`${API_URL}/api/admin/notifications`, { credentials: "include", cache: "no-store" })];
        if (userId) requests.push(fetch(`${API_URL}/api/admin/customers/${encodeURIComponent(userId)}`, { credentials: "include", cache: "no-store" }));
        const responses = await Promise.all(requests);
        const notificationData = await readJson(responses[0]);
        if (!responses[0].ok) throw new Error(notificationData?.message || "Unable to load notifications.");
        if (!active) return;
        setNotifications(Array.isArray(notificationData?.notifications) ? notificationData.notifications : []);
        if (responses[1]) {
          const userData = await readJson(responses[1]);
          if (responses[1].ok && userData?.customer?._id) {
            setPresetUser(userData.customer);
            setAudience("selected");
            setMatchedCount(1);
            setPreviewCustomers([userData.customer]);
          }
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load notification center.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (audience === "selected" && presetUser) { setMatchedCount(1); setPreviewCustomers([presetUser]); return; }
    const timer = window.setTimeout(() => void previewAudience(), audience === "filtered" ? 350 : 0);
    return () => window.clearTimeout(timer);
  }, [audience, filters, presetUser]);

  async function previewAudience() {
    try {
      setPreviewing(true);
      setError("");
      const response = await fetch(`${API_URL}/api/admin/notifications/preview`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audienceType: audience, filters: audience === "filtered" ? filters : {}, userIds: audience === "selected" && presetUser ? [presetUser._id] : [] }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to preview audience.");
      setMatchedCount(Number(data?.count || 0));
      setPreviewCustomers(Array.isArray(data?.customers) ? data.customers : []);
    } catch (previewError) {
      setMatchedCount(0); setPreviewCustomers([]);
      setError(previewError instanceof Error ? previewError.message : "Unable to preview audience.");
    } finally { setPreviewing(false); }
  }

  async function reloadHistory() {
    const response = await fetch(`${API_URL}/api/admin/notifications`, { credentials: "include", cache: "no-store" });
    const data = await readJson(response);
    if (response.ok) setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
  }

  async function sendNotification() {
    try {
      setSaving(true); setError(""); setSuccess("");
      if (!title.trim()) throw new Error("Notification title is required.");
      if (!message.trim()) throw new Error("Notification message is required.");
      if (audience !== "all" && matchedCount === 0) throw new Error("No customers match this audience.");
      const response = await fetch(`${API_URL}/api/admin/notifications`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), message: message.trim(), type, link: link.trim(), audienceType: audience, filters: audience === "filtered" ? filters : {}, userIds: audience === "selected" && presetUser ? [presetUser._id] : [], isActive: true }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to send notification.");
      setSuccess(data?.message || "Notification sent.");
      setTitle(""); setMessage(""); setLink(""); setType("general");
      await reloadHistory();
    } catch (sendError) { setError(sendError instanceof Error ? sendError.message : "Unable to send notification."); }
    finally { setSaving(false); }
  }

  async function deleteNotification(id: string) {
    if (!window.confirm("Delete this notification?")) return;
    try {
      setBusyId(id); setError("");
      const response = await fetch(`${API_URL}/api/admin/notifications/${id}`, { method: "DELETE", credentials: "include" });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to delete notification.");
      setNotifications((items) => items.filter((item) => item._id !== id));
    } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "Unable to delete notification."); }
    finally { setBusyId(""); }
  }

  return <div className="mx-auto w-full max-w-[1500px] pb-12">
    <section className="rounded-[30px] bg-[#211A18] px-7 py-8 text-white md:px-9">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#E7AE72]">Users</p><h1 className="mt-4 text-[34px] font-semibold tracking-[-0.04em]">Notifications</h1><p className="mt-3 max-w-2xl text-[13px] leading-6 text-white/60">Send one notification to all active users or a backend-filtered customer segment.</p></div>
        <div className="flex gap-3"><HeroStat label="History" value={notifications.length}/><HeroStat label="Matched" value={matchedCount}/></div>
      </div>
    </section>

    {(error || success) && <div className={`mt-5 rounded-2xl border px-4 py-3 text-[12px] ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error || success}</div>}

    <div className="mt-6 grid gap-5 xl:grid-cols-[470px_1fr]">
      <section className="h-fit rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
        <div className="flex items-center gap-3 border-b border-[#211A18]/8 pb-5"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F8E8ED] text-[#8C1839]"><Send size={18}/></div><div><h2 className="text-[17px] font-semibold">Send Notification</h2><p className="mt-1 text-[10px] text-[#211A18]/40">Audience is resolved on the backend.</p></div></div>
        <div className="mt-5 space-y-4">
          <Field label="Audience"><div className="grid grid-cols-2 gap-2"><AudienceButton active={audience === "all"} label="All Users" onClick={() => setAudience("all")}/><AudienceButton active={audience === "filtered"} label="Filtered Users" onClick={() => setAudience("filtered")}/></div>{presetUser && <button type="button" onClick={() => setAudience("selected")} className={`mt-2 h-11 w-full rounded-xl border text-[10px] font-semibold ${audience === "selected" ? "border-[#8C1839]/25 bg-[#FFF3F7] text-[#8C1839]" : "border-[#211A18]/10"}`}>Only {presetUser.name}</button>}</Field>
          <Field label="Title"><input value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} placeholder="Complete your order" className={inputClass}/></Field>
          <Field label="Message (safe HTML + inline CSS)"><textarea value={message} maxLength={2000} onChange={(e) => setMessage(e.target.value)} placeholder={`<div style="padding:16px"><strong>Complete your order</strong><p>Your cart is waiting.</p></div>`} className={`${inputClass} min-h-36 resize-y py-3 font-mono`}/><div className="mt-2 rounded-xl border border-[#211A18]/10 bg-white p-3"><p className="mb-2 text-[8px] font-semibold uppercase text-[#211A18]/35">HTML Preview</p><iframe title="Notification HTML preview" sandbox="" srcDoc={message} className="min-h-24 w-full rounded-lg border-0 bg-white" /></div></Field>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Type"><select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}><option value="general">General</option><option value="promotion">Promotion</option><option value="order">Order</option><option value="account">Account</option><option value="system">System</option></select></Field><Field label="Optional Link"><input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/account/card" className={inputClass}/></Field></div>
          <div className="rounded-2xl bg-[#FAF8F6] px-4 py-3"><p className="text-[9px] uppercase tracking-[0.08em] text-[#211A18]/40">Preview</p><p className="mt-1 text-[14px] font-semibold text-[#211A18]">{previewing ? "Matching users..." : `${matchedCount} user${matchedCount === 1 ? "" : "s"} matched`}</p></div>
          <button type="button" disabled={saving || previewing || matchedCount === 0} onClick={() => void sendNotification()} className="h-14 w-full rounded-[14px] bg-[#A51D45] text-[11px] font-semibold uppercase tracking-[0.09em] text-white disabled:opacity-40">{saving ? "Sending..." : audience === "all" ? "Send To All Users" : `Send To ${matchedCount} Matched Users`}</button>
        </div>
      </section>

      <section className="rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
        <div className="flex items-start justify-between border-b border-[#211A18]/8 pb-5"><div><h2 className="text-[17px] font-semibold">Audience Builder</h2><p className="mt-1 text-[10px] text-[#211A18]/40">Use the same cart, wishlist, order and activity filters as Customers.</p></div><Filter size={17} className="text-[#8C1839]"/></div>
        {audience === "all" ? <div className="mt-5 grid min-h-[420px] place-items-center rounded-[20px] border border-dashed border-[#8C1839]/20 bg-[#FFF9FB] p-8 text-center"><div><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#F8E8ED] text-[#8C1839]"><Users size={25}/></div><h3 className="mt-4 text-[17px] font-semibold">All Active Users</h3><p className="mx-auto mt-2 max-w-sm text-[11px] leading-5 text-[#211A18]/45">Every active customer account is included. The backend calculates the count before sending.</p></div></div> : audience === "selected" && presetUser ? <div className="mt-5 rounded-[20px] bg-[#FAF8F6] p-5"><p className="text-[13px] font-semibold">{presetUser.name}</p><p className="mt-1 text-[10px] text-[#211A18]/45">{presetUser.email} · {presetUser.phone}</p></div> : <>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <TextField label="Search Customer" value={filters.search} onChange={(v) => setFilters((f) => ({...f,search:v}))} placeholder="Name, email, phone or User ID"/>
            <SelectField label="Joined" value={filters.joined} onChange={(v) => setFilters((f) => ({...f,joined:v}))} options={[['','Any time'],['today','Today'],['7d','Last 7 Days'],['30d','Last 30 Days']]}/>
            <DateField label="Joined From" value={filters.joinedFrom} onChange={(v) => setFilters((f) => ({...f,joinedFrom:v}))}/>
            <DateField label="Joined To" value={filters.joinedTo} onChange={(v) => setFilters((f) => ({...f,joinedTo:v}))}/>
            <SelectField label="Last Active" value={filters.lastActive} onChange={(v) => setFilters((f) => ({...f,lastActive:v}))} options={[['','Any time'],['today','Today'],['24h','Last 24 Hours'],['3d','Last 3 Days'],['7d','Last 7 Days'],['30plus','Inactive 30+ Days']]}/>
            <SelectField label="Cart Status" value={filters.hasCart} onChange={(v) => setFilters((f) => ({...f,hasCart:v}))} options={[['','Any'],['true','Has Cart'],['false','Empty Cart']]}/>
            <NumberField label="Minimum Cart Items" value={filters.cartCountMin} onChange={(v) => setFilters((f) => ({...f,cartCountMin:v}))}/>
            <NumberField label="Maximum Cart Items" value={filters.cartCountMax} onChange={(v) => setFilters((f) => ({...f,cartCountMax:v}))}/>
            <NumberField label="Minimum Cart Value (₹)" value={filters.minCartValue} onChange={(v) => setFilters((f) => ({...f,minCartValue:v}))}/>
            <NumberField label="Maximum Cart Value (₹)" value={filters.maxCartValue} onChange={(v) => setFilters((f) => ({...f,maxCartValue:v}))}/>
            <SelectField label="Cart Item Age" value={filters.cartAgeMinDays} onChange={(v) => setFilters((f) => ({...f,cartAgeMinDays:v}))} options={[['','Any age'],['1','1+ day'],['3','3+ days'],['7','7+ days'],['30','30+ days']]}/>
            <SelectField label="Abandoned Cart" value={filters.abandonedCartDays} onChange={(v) => setFilters((f) => ({...f,abandonedCartDays:v}))} options={[['','Any'],['1','24h+'],['3','3 days+'],['7','7 days+'],['30','30 days+']]}/>
            <SelectField label="Wishlist Status" value={filters.hasWishlist} onChange={(v) => setFilters((f) => ({...f,hasWishlist:v}))} options={[['','Any'],['true','Has Wishlist'],['false','Empty Wishlist']]}/>
            <NumberField label="Minimum Wishlist Items" value={filters.wishlistCountMin} onChange={(v) => setFilters((f) => ({...f,wishlistCountMin:v}))}/>
            <NumberField label="Maximum Wishlist Items" value={filters.wishlistCountMax} onChange={(v) => setFilters((f) => ({...f,wishlistCountMax:v}))}/>
            <SelectField label="Wishlist Item Age" value={filters.wishlistAgeMinDays} onChange={(v) => setFilters((f) => ({...f,wishlistAgeMinDays:v}))} options={[['','Any age'],['1','1+ day'],['7','7+ days'],['30','30+ days'],['90','90+ days']]}/>
            <SelectField label="Cart + Wishlist" value={filters.cartWishlist} onChange={(v) => setFilters((f) => ({...f,cartWishlist:v}))} options={[['','Any'],['both','Product in both'],['cartOnly','Only Cart'],['wishlistOnly','Only Wishlist']]}/>
            <SelectField label="Orders" value={filters.orderStatus} onChange={(v) => setFilters((f) => ({...f,orderStatus:v}))} options={[['','Any'],['never','Never Ordered'],['has','Has Orders']]}/>
            <NumberField label="Minimum Orders" value={filters.orderCountMin} onChange={(v) => setFilters((f) => ({...f,orderCountMin:v}))}/>
            <NumberField label="Maximum Orders" value={filters.orderCountMax} onChange={(v) => setFilters((f) => ({...f,orderCountMax:v}))}/>
            <NumberField label="Minimum Total Spend (₹)" value={filters.minSpend} onChange={(v) => setFilters((f) => ({...f,minSpend:v}))}/>
            <NumberField label="Maximum Total Spend (₹)" value={filters.maxSpend} onChange={(v) => setFilters((f) => ({...f,maxSpend:v}))}/>
            <SelectField label="Last Order" value={filters.lastOrder} onChange={(v) => setFilters((f) => ({...f,lastOrder:v}))} options={[['','Any time'],['today','Today'],['7d','Last 7 Days'],['30d','Last 30 Days'],['90plus','90+ Days']]}/>
            <SelectField label="Coupon Used" value={filters.couponUsed} onChange={(v) => setFilters((f) => ({...f,couponUsed:v}))} options={[['','Any'],['true','Used'],['false','Never Used']]}/>
            <SelectField label="Discount Used" value={filters.discountUsed} onChange={(v) => setFilters((f) => ({...f,discountUsed:v}))} options={[['','Any'],['true','Yes'],['false','No']]}/>
          </div>
          <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#FAF8F6] px-4 py-3"><p className="text-[10px] text-[#211A18]/45">{activeFilterCount} targeting filter{activeFilterCount === 1 ? "" : "s"} active</p><button type="button" onClick={() => setFilters(emptyTargetFilters)} className="text-[10px] font-semibold text-[#8C1839]">Clear Filters</button></div>
          <div className="mt-4 flex justify-end"><button type="button" onClick={() => { setShowMatchedUsers(true); void previewAudience(); }} className="rounded-xl bg-[#211A18] px-4 py-2.5 text-[9px] font-semibold text-white">Show Matched Users</button></div>{showMatchedUsers && previewCustomers.length > 0 && <div className="mt-4"><p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#211A18]/40">Sample matched users</p><div className="max-h-44 space-y-2 overflow-y-auto">{previewCustomers.slice(0,8).map((customer) => <div key={customer._id} className="rounded-xl border border-[#211A18]/8 px-3 py-2"><p className="text-[10px] font-semibold">{customer.name}</p><p className="mt-0.5 text-[9px] text-[#211A18]/40">{customer.email}</p></div>)}</div></div>}
        </>}
      </section>
    </div>

    <section className="mt-6 rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
      <div className="flex items-center justify-between border-b border-[#211A18]/8 pb-5"><div><h2 className="text-[17px] font-semibold">Notification History</h2><p className="mt-1 text-[10px] text-[#211A18]/40">Saved admin notifications and recipient counts.</p></div><Bell size={18} className="text-[#8C1839]"/></div>
      {loading ? <div className="py-12 text-center text-[12px] text-[#211A18]/40">Loading...</div> : notifications.length === 0 ? <div className="py-12 text-center text-[12px] text-[#211A18]/40">No notifications sent yet.</div> : <div className="mt-4 space-y-3">{notifications.map((item) => <div key={item._id} className="flex flex-col gap-4 rounded-[18px] border border-[#211A18]/8 bg-[#FAF8F6] p-4 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-[12px] font-semibold">{item.title}</h3><Badge text={item.type}/><Badge text={item.audience === "all" ? "All Users" : item.audience === "filtered" ? `Filtered · ${item.recipientCount || item.userIds?.length || 0}` : `Selected · ${item.recipientCount || item.userIds?.length || 0}`}/></div><p className="mt-1.5 max-w-3xl text-[10px] leading-4 text-[#211A18]/55">{item.message}</p><p className="mt-2 text-[9px] text-[#211A18]/30">{new Date(item.createdAt).toLocaleString("en-IN")}</p></div><button type="button" disabled={busyId === item._id} onClick={() => void deleteNotification(item._id)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-[9px] font-semibold text-red-600 disabled:opacity-40"><Trash2 size={13}/> Delete</button></div>)}</div>}
    </section>
  </div>;
}

function HeroStat({ label, value }: { label: string; value: number }) { return <div className="min-w-[110px] rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3"><p className="text-[9px] uppercase tracking-[0.12em] text-white/35">{label}</p><p className="mt-1 text-[24px] font-semibold">{value}</p></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-[11px] font-semibold">{label}</span>{children}</label>; }
function AudienceButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) { return <button type="button" onClick={onClick} className={`h-12 rounded-[14px] border text-[11px] font-semibold ${active ? "border-[#8C1839]/25 bg-[#FFF3F7] text-[#8C1839]" : "border-[#211A18]/10 bg-white text-[#211A18]/60"}`}>{label}</button>; }
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string,string][] }) { return <label><span className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.06em] text-[#211A18]/45">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="h-12 w-full rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-3 text-[11px] outline-none">{options.map(([v,l]) => <option key={`${label}-${v}`} value={v}>{l}</option>)}</select></label>; }
function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) { return <label><span className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.06em] text-[#211A18]/45">{label}</span><input type="number" min="0" value={value} onChange={(e) => onChange(e.target.value)} className="h-12 w-full rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-3 text-[11px] outline-none"/></label>; }
function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) { return <label><span className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.06em] text-[#211A18]/45">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-12 w-full rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-3 text-[11px] outline-none"/></label>; }
function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) { return <label><span className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.06em] text-[#211A18]/45">{label}</span><input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="h-12 w-full rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-3 text-[11px] outline-none"/></label>; }
function Badge({ text }: { text: string }) { return <span className="rounded-full bg-white px-2 py-1 text-[8px] font-semibold uppercase text-[#8C1839]">{text}</span>; }
const inputClass = "min-h-12 w-full rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4 text-[12px] text-[#211A18] outline-none placeholder:text-[#211A18]/30 focus:border-[#8C1839]/30 focus:ring-4 focus:ring-[#8C1839]/5";
