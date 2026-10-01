"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bell, Clock3, Heart, PackageCheck, ReceiptText, ShoppingBag, Sparkles, UserRound, Star, MessageSquare } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");
type AnyRecord = Record<string, any>;
type Tab = "overview" | "cart" | "wishlist" | "orders" | "reviews" | "activity";
type DetailResponse = {
  success: boolean; customer: AnyRecord; account?: AnyRecord | null; summary: AnyRecord;
  cart: { items: AnyRecord[]; totalItems: number; subtotal: number; updatedAt?: string };
  wishlist: { items: AnyRecord[]; count: number; updatedAt?: string };
  addresses: AnyRecord[]; activities: AnyRecord[]; orders: AnyRecord[];
};

function money(value: unknown) { return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`; }
function dateTime(value: unknown) { if (!value) return "—"; const d = new Date(String(value)); if (Number.isNaN(d.getTime())) return "—"; return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
function duration(msValue: unknown) { const ms = Number(msValue || 0); if (!Number.isFinite(ms) || ms <= 0) return "Just added"; const day=86400000,hour=3600000,min=60000; if(ms>=day){const d=Math.floor(ms/day),h=Math.floor((ms%day)/hour);return `${d} day${d===1?"":"s"}${h?` ${h}h`:""}`;} if(ms>=hour){const h=Math.floor(ms/hour),m=Math.floor((ms%hour)/min);return `${h}h${m?` ${m}m`:""}`;} return `${Math.max(1,Math.floor(ms/min))}m`; }
function activityLabel(item: AnyRecord) { const labels: Record<string,string>={register:"Account created",login:"Logged in",logout:"Logged out",wishlist_add:"Wishlist item added",wishlist_remove:"Wishlist item removed",wishlist_clear:"Wishlist cleared",cart_add:"Cart item added",cart_remove:"Cart item removed",cart_update:"Cart quantity updated",cart_clear:"Cart cleared",checkout_started:"Checkout started",order_created:"Order created",order_paid:"Order paid",order_cancelled:"Order cancelled",order_delivered:"Order delivered",cart_purchase:"Cart product purchased",wishlist_purchase:"Wishlist product purchased",product_view:"Product viewed"}; return labels[String(item?.type||"")] || String(item?.type||"Activity").replaceAll("_"," "); }

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customerId = String(params?.id || "");
  const [data, setData] = useState<DetailResponse | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState<AnyRecord[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => { if(!customerId)return; let active=true; void(async()=>{try{setLoading(true);setError("");const r=await fetch(`${API_URL}/api/admin/customers/${customerId}`,{credentials:"include",cache:"no-store"});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j?.message||"Unable to load customer details.");if(active)setData(j);}catch(e){if(active)setError(e instanceof Error?e.message:"Unable to load customer details.");}finally{if(active)setLoading(false);}})(); return()=>{active=false};},[customerId]);
  const stats = useMemo(() => data?.summary || {}, [data]);

  useEffect(() => {
    if (!customerId) return;
    let active = true;
    void (async () => {
      try {
        setReviewsLoading(true);
        const r = await fetch(`${API_URL}/api/admin/users/${customerId}/reviews`, { credentials: "include", cache: "no-store" });
        const j = await r.json().catch(() => ({}));
        if (r.ok && active) setReviews(Array.isArray(j?.reviews) ? j.reviews : []);
      } finally { if (active) setReviewsLoading(false); }
    })();
    return () => { active = false; };
  }, [customerId]);

  if (loading) return <div className="grid min-h-[65vh] place-items-center rounded-[28px] bg-white text-[12px] text-[#211A18]/45">Loading customer...</div>;
  if (error || !data) return <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-red-700"><p className="text-[13px] font-semibold">{error || "Customer not found."}</p><Link href="/admin/customers" className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold"><ArrowLeft size={13}/> Back to customers</Link></div>;

  const customer = data.customer || {};
  const accountStatus = customer.accountStatus || (customer.isActive ? "active" : "inactive");

  return <div className="mx-auto w-full max-w-[1500px] pb-12">
    <section className="rounded-[30px] bg-[#211A18] px-7 py-8 text-white md:px-9">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><Link href="/admin/customers" className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45 hover:text-white"><ArrowLeft size={13}/> Customers</Link><div className="mt-5 flex items-center gap-4"><div className="grid h-16 w-16 place-items-center rounded-full bg-[#F8E8ED] text-[25px] font-semibold text-[#8C1839]">{String(customer.name||"U").charAt(0).toUpperCase()}</div><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-[30px] font-semibold tracking-[-0.04em]">{customer.name||"Customer"}</h1><span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${accountStatus==="active"?"bg-emerald-500/15 text-emerald-200":"bg-red-500/15 text-red-200"}`}>{String(accountStatus).toUpperCase()}</span></div><p className="mt-2 text-[11px] text-white/50">{customer.email||"—"} · {customer.phone||"—"}</p></div></div></div><Link href={`/admin/notifications?user=${customerId}`} className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[#F4DCE3] px-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64142D]"><Bell size={15}/> Send Notification</Link></div>
    </section>

    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric icon={<ReceiptText size={17}/>} label="Orders" value={stats.totalOrders||0} note={`${stats.deliveredOrders||0} delivered`}/><Metric icon={<PackageCheck size={17}/>} label="Total Spend" value={money(stats.totalOrderValue)} note={`Last order ${dateTime(stats.lastOrderAt)}`}/><Metric icon={<ShoppingBag size={17}/>} label="Cart" value={stats.cartQuantity||0} note={money(stats.cartSubtotal)}/><Metric icon={<Heart size={17}/>} label="Wishlist" value={stats.wishlistItems||0} note="saved products"/><Metric icon={<Sparkles size={17}/>} label="Last Active" value={dateTime(stats.lastActivityAt || customer.lastActiveAt || customer.updatedAt)} note={`${stats.activities||0} activities`}/></div>

    <div className="mt-6 overflow-x-auto rounded-[18px] border border-[#211A18]/10 bg-white p-2"><div className="flex min-w-max gap-2">{([['overview','Overview',UserRound],['cart','Cart',ShoppingBag],['wishlist','Wishlist',Heart],['orders','Orders',ReceiptText],['reviews','Ratings & Reviews',Star],['activity','Activity',Clock3]] as const).map(([key,label,Icon])=><button key={key} type="button" onClick={()=>setTab(key)} className={`inline-flex h-11 items-center gap-2 rounded-[12px] px-4 text-[10px] font-semibold ${tab===key?"bg-[#A51D45] text-white":"text-[#211A18]/55 hover:bg-[#FAF8F6]"}`}><Icon size={14}/>{label}</button>)}</div></div>

    <div className="mt-5">
      {tab === "overview" && <div className="grid gap-5 xl:grid-cols-2"><Section title="Customer Overview" description="Account identity and engagement." icon={<UserRound size={17}/>}><div className="grid gap-3 sm:grid-cols-2"><Info label="Name" value={customer.name}/><Info label="Email" value={customer.email}/><Info label="Phone" value={customer.phone}/><Info label="Gender" value={String(customer.gender||"other").toUpperCase()}/><Info label="Account Status" value={accountStatus}/><Info label="Joined" value={dateTime(customer.createdAt)}/><Info label="Last Active" value={dateTime(stats.lastActivityAt || customer.lastActiveAt || customer.updatedAt)}/><Info label="Cart Count" value={stats.cartQuantity||0}/><Info label="Cart Value" value={money(stats.cartSubtotal)}/><Info label="Wishlist Count" value={stats.wishlistItems||0}/><Info label="Order Count" value={stats.totalOrders||0}/><Info label="Total Spend" value={money(stats.totalOrderValue)}/><Info label="Last Order" value={dateTime(stats.lastOrderAt)}/></div></Section><Section title="Addresses" description="Saved customer addresses." icon={<UserRound size={17}/>}>{data.addresses.length===0?<Empty text="No saved addresses."/>:<div className="space-y-3">{data.addresses.map((a:AnyRecord)=><div key={a._id} className="rounded-2xl bg-[#FAF8F6] p-4 text-[10px] leading-5 text-[#211A18]/60"><p className="font-semibold text-[#211A18]">{a.fullName||a.name||customer.name}</p><p>{[a.addressLine1,a.addressLine2,a.city,a.state,a.postalCode].filter(Boolean).join(", ")}</p></div>)}</div>}</Section></div>}

      {tab === "cart" && <Section title="Cart" description="Product, variant, quantity, price, added date and exact time in cart." icon={<ShoppingBag size={17}/>}>{data.cart.items.length===0?<Empty text="Cart is empty."/>:<div className="overflow-x-auto"><table className="min-w-[850px] w-full text-left text-[10px]"><thead className="text-[#211A18]/40"><tr>{['Product','Variant','Qty','Price','Total','Added At','Time In Cart'].map(x=><th key={x} className="px-3 py-3 font-semibold">{x}</th>)}</tr></thead><tbody className="divide-y divide-[#211A18]/8">{data.cart.items.map((item:AnyRecord)=><tr key={item._id}><td className="px-3 py-4 font-semibold text-[#211A18]">{item.product?.name||"Product"}</td><td className="px-3 py-4">{[item.product?.colorName,item.product?.size].filter(Boolean).join(" / ")||"—"}</td><td className="px-3 py-4">{item.quantity}</td><td className="px-3 py-4">{money(item.unitPrice)}</td><td className="px-3 py-4">{money(item.lineTotal)}</td><td className="px-3 py-4">{dateTime(item.addedAt)}</td><td className="px-3 py-4 font-semibold text-[#8C1839]">{duration(item.ageMs)}</td></tr>)}</tbody></table></div>}</Section>}

      {tab === "wishlist" && <Section title="Wishlist" description="Product, variant, price, added date and wishlist age." icon={<Heart size={17}/>}>{data.wishlist.items.length===0?<Empty text="Wishlist is empty."/>:<div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left text-[10px]"><thead className="text-[#211A18]/40"><tr>{['Product','Variant','Price','Added At','Time In Wishlist'].map(x=><th key={x} className="px-3 py-3 font-semibold">{x}</th>)}</tr></thead><tbody className="divide-y divide-[#211A18]/8">{data.wishlist.items.map((item:AnyRecord)=><tr key={item._id}><td className="px-3 py-4 font-semibold text-[#211A18]">{item.product?.name||"Product"}</td><td className="px-3 py-4">{[item.product?.colorName,item.product?.size].filter(Boolean).join(" / ")||"—"}</td><td className="px-3 py-4">{money(item.product?.showPrice)}</td><td className="px-3 py-4">{dateTime(item.addedAt)}</td><td className="px-3 py-4 font-semibold text-[#8C1839]">{duration(item.ageMs)}</td></tr>)}</tbody></table></div>}</Section>}

      {tab === "orders" && <Section title="Orders" description="Existing order system data for this customer." icon={<ReceiptText size={17}/>}>{data.orders.length===0?<Empty text="No orders yet."/>:<div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left text-[10px]"><thead className="text-[#211A18]/40"><tr>{['Order ID','Date','Amount','Status','Payment Status'].map(x=><th key={x} className="px-3 py-3 font-semibold">{x}</th>)}</tr></thead><tbody className="divide-y divide-[#211A18]/8">{data.orders.map((o:AnyRecord)=><tr key={o._id}><td className="px-3 py-4 font-semibold text-[#211A18]">{o.orderNumber||o._id}</td><td className="px-3 py-4">{dateTime(o.createdAt)}</td><td className="px-3 py-4">{money(o.total)}</td><td className="px-3 py-4 uppercase">{o.status||"—"}</td><td className="px-3 py-4 uppercase">{o.paymentStatus||"—"}</td></tr>)}</tbody></table></div>}</Section>}

      {tab === "reviews" && <Section title="Ratings & Reviews" description="Reviews, uploaded Cloudinary media and public conversations from this customer." icon={<Star size={17}/>}>{reviewsLoading?<div className="py-10 text-center text-[11px] text-[#211A18]/40">Loading reviews...</div>:reviews.length===0?<Empty text="This customer has not submitted any reviews."/>:<div className="space-y-4">{reviews.map((r:AnyRecord)=><article key={r._id} className="rounded-2xl bg-[#FAF8F6] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700"><Star size={11} fill="currentColor"/>{r.rating}/5</span>{r.isVerified&&<span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-semibold text-emerald-700">VERIFIED ORDER</span>}</div><h3 className="mt-2 text-[12px] font-semibold">{r.title||"Review"}</h3></div><span className="text-[9px] text-[#211A18]/35">{dateTime(r.createdAt)}</span></div><p className="mt-2 text-[10px] leading-5 text-[#211A18]/60">{r.comment}</p>{Array.isArray(r.media)&&r.media.length>0&&<div className="mt-3 flex flex-wrap gap-2">{r.media.map((m:AnyRecord,i:number)=>m.type==="video"?<video key={`${r._id}-v-${i}`} controls src={m.url} className="h-28 w-32 rounded-xl bg-black object-cover"/>:<img key={`${r._id}-i-${i}`} src={m.url} alt="Review upload" className="h-28 w-32 rounded-xl object-cover"/>)}</div>}<div className="mt-3 rounded-xl bg-white p-3"><div className="flex items-center justify-between"><p className="flex items-center gap-1 text-[9px] font-semibold"><MessageSquare size={11}/> Conversation</p><span className="text-[8px] text-[#211A18]/35">{r.userQuestionCount||0}/5 questions</span></div>{Array.isArray(r.conversation)&&r.conversation.length>0?<div className="mt-2 space-y-2">{r.conversation.map((m:AnyRecord,i:number)=><div key={m._id||i} className={`rounded-lg p-2 text-[9px] ${m.sender==="admin"?"bg-[#F8E8ED]":"bg-[#FAF8F6]"}`}><b>{m.sender==="admin"?"Admin":"Customer"}</b><p className="mt-1">{m.message}</p></div>)}</div>:<p className="mt-2 text-[9px] text-[#211A18]/35">No conversation yet.</p>}</div></article>)}</div>}</Section>}

      {tab === "activity" && <Section title="Activity" description="Tracked customer events from the existing activity system." icon={<Clock3 size={17}/>}>{data.activities.length===0?<Empty text="No activity recorded."/>:<div className="space-y-3">{data.activities.map((item:AnyRecord)=><div key={item._id} className="flex items-start justify-between gap-4 rounded-2xl bg-[#FAF8F6] p-4"><div><p className="text-[11px] font-semibold text-[#211A18]">{activityLabel(item)}</p><p className="mt-1 text-[9px] text-[#211A18]/40">{item.product?.name || item.order?.orderNumber || "Customer activity"}</p></div><p className="shrink-0 text-[9px] text-[#211A18]/35">{dateTime(item.createdAt)}</p></div>)}</div>}</Section>}
    </div>
  </div>;
}

function Metric({icon,label,value,note}:{icon:React.ReactNode;label:string;value:React.ReactNode;note:string}){return <div className="rounded-[20px] border border-[#211A18]/10 bg-white p-4"><div className="flex items-center gap-2 text-[#8C1839]">{icon}<span className="text-[9px] font-semibold uppercase tracking-[0.08em]">{label}</span></div><p className="mt-3 text-[19px] font-semibold text-[#211A18]">{value}</p><p className="mt-1 truncate text-[9px] text-[#211A18]/35">{note}</p></div>}
function Section({title,description,icon,children}:{title:string;description:string;icon:React.ReactNode;children:React.ReactNode}){return <section className="rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6"><div className="mb-5 flex items-start gap-3 border-b border-[#211A18]/8 pb-4"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#F8E8ED] text-[#8C1839]">{icon}</div><div><h2 className="text-[16px] font-semibold">{title}</h2><p className="mt-1 text-[10px] text-[#211A18]/40">{description}</p></div></div>{children}</section>}
function Info({label,value}:{label:string;value:React.ReactNode}){return <div className="rounded-2xl bg-[#FAF8F6] p-4"><p className="text-[9px] uppercase tracking-[0.08em] text-[#211A18]/35">{label}</p><p className="mt-2 text-[11px] font-semibold text-[#211A18]">{value || "—"}</p></div>}
function Empty({text}:{text:string}){return <div className="grid min-h-36 place-items-center rounded-2xl border border-dashed border-[#211A18]/10 bg-[#FAF8F6] text-[11px] text-[#211A18]/35">{text}</div>}
