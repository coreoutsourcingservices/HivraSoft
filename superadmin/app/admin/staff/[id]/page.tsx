"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck, UserRound } from "lucide-react";
import ActivityDetails from "@/src/components/Admin/ActivityDetails";

type Admin = { _id:string; name:string; username?:string; email:string; phone:string; role:string; accountStatus:string; emailVerified:boolean; createdAt:string; lastLoginAt?:string; lastActiveAt?:string; mustChangePassword?:boolean };
type Activity = { _id:string; action:string; module:string; createdAt:string; recordName?:string; recordId?:string; status?:string; metadata?:Record<string,unknown> };
const time=(value?:string)=>value?new Date(value).toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}):"Not recorded";
async function request(path:string, method="GET", body?:unknown) {
  const response=await fetch(`/api/superadmin/${path}`,{method,credentials:"include",cache:"no-store",headers:body?{"Content-Type":"application/json"}:undefined,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});
  const data=await response.json();if(!response.ok)throw new Error(data.message||"Unable to load admin.");return data;
}
export default function AdminProfile() {
  const { id }=useParams<{id:string}>();
  const [admin,setAdmin]=useState<Admin|null>(null),[logs,setLogs]=useState<Activity[]>([]),[total,setTotal]=useState(0);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const load=useCallback(async()=>{
    setError("");setLoading(true);
    try { const [profile,activity]=await Promise.all([request(`admins/${encodeURIComponent(id)}`),request(`logs?adminId=${encodeURIComponent(id)}`)]);setAdmin(profile.user);setLogs(activity.logs||[]);setTotal(activity.total||0); }
    catch(error){setError(error instanceof Error?error.message:"Unable to load admin.");}finally{setLoading(false);}
  },[id]);
  useEffect(()=>{void load();},[load]);
  async function setStatus(status:string) {
    setBusy(true);setError("");
    try {await request(`admins/${id}/status`,"PATCH",{status});await load();}
    catch(error){setError(error instanceof Error?error.message:"Unable to change status.");}finally{setBusy(false);}
  }
  return <main className="min-w-0 space-y-5 text-[#211A18]">
    <Link href="/admin/staff" className="inline-flex items-center gap-2 text-sm font-medium text-[#8c1839]"><ArrowLeft size={16}/> All admins</Link>
    {error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {!admin?<div className="rounded-xl border bg-white p-6">{loading?"Loading admin profile…":<button onClick={()=>void load()}>Retry loading profile</button>}</div>:<>
      <section className="rounded-2xl bg-[#211A18] p-5 text-white sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-rose-100 text-xl font-bold text-[#8c1839]">{Array.from(admin.name)[0]?.toUpperCase()||"A"}</div><div className="min-w-0"><p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-rose-200"><ShieldCheck size={13}/> Admin profile</p><h1 className="mt-2 break-words text-2xl font-bold">{admin.name}</h1><p className="mt-1 break-all text-sm text-white/60">{admin.username?`@${admin.username}`:admin.email}</p></div></div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase ${admin.accountStatus==="active"?"bg-emerald-400/20 text-emerald-200":"bg-rose-400/20 text-rose-200"}`}>{admin.accountStatus}</span>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button disabled={busy} onClick={()=>void setStatus(admin.accountStatus==="active"?"inactive":"active")} className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#211A18] disabled:opacity-50">{admin.accountStatus==="active"?"Deactivate admin":"Activate admin"}</button>
          {admin.accountStatus!=="blocked"&&<button disabled={busy} onClick={()=>void setStatus("blocked")} className="rounded-lg border border-white/30 px-4 py-2.5 text-sm disabled:opacity-50">Block admin</button>}
          <button disabled={busy||loading} onClick={()=>void load()} className="rounded-lg border border-white/30 px-4 py-2.5 text-sm">Refresh profile</button>
        </div>
      </section>
      <section className="rounded-2xl border bg-white p-5 sm:p-6"><h2 className="flex items-center gap-2 text-lg font-bold"><UserRound size={19}/> Admin information</h2><dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Object.entries({"Full name":admin.name,Username:admin.username||"Not assigned",Email:admin.email,"Mobile number":admin.phone,Role:"Admin","Account status":admin.accountStatus,"Email verified":admin.emailVerified?"Yes":"No",Registered:time(admin.createdAt),"Last login (IST)":time(admin.lastLoginAt),"Last active (IST)":time(admin.lastActiveAt||admin.lastLoginAt),"First password change":admin.mustChangePassword?"Pending":"Completed","Recorded activities":String(total)}).map(([label,value])=><div key={label} className="rounded-xl bg-[#faf8f6] p-4"><dt className="text-xs text-gray-500">{label}</dt><dd className="mt-1 break-words text-sm font-semibold">{value}</dd></div>)}</dl></section>
      <section className="rounded-2xl border bg-white p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Admin activity</h2><p className="mt-1 text-sm text-gray-500">{total} recorded actions · Times in IST</p></div><Link href={`/admin/audit-logs?adminId=${id}`} className="rounded-lg border px-3 py-2 text-sm text-[#8c1839]">All activity & filters</Link></div>
        <div className="mt-5 space-y-3">{logs.map(log=><article key={log._id} className="rounded-xl border border-gray-100 bg-[#faf8f6] p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-sm font-semibold">{log.action.replaceAll("_"," ")} · {log.module.replaceAll("-"," ")}</h3><p className="mt-1 text-xs text-gray-500">{log.recordName||"Admin account activity"}</p></div><time className="text-xs text-gray-500">{time(log.createdAt)}</time></div><p className="mt-2 text-xs font-medium">{log.status==="failure"||log.metadata?.success===false?"Failed":"Recorded"}</p><details className="mt-3"><summary className="cursor-pointer text-sm text-[#8c1839]">View activity details</summary><ActivityDetails metadata={log.metadata} recordId={log.recordId}/></details></article>)}{!logs.length&&<p className="py-4 text-sm text-gray-500">No activity recorded for this admin yet.</p>}</div>
      </section>
    </>}
  </main>;
}
