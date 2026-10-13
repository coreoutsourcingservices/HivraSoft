"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "@/src/components/Admin/ZoneLink";
const API = "";
type RequestRow = { _id: string; name: string; email: string; phone: string; status: string; createdAt: string; emailVerified: boolean };
type Admin = { _id:string; name:string; username?:string; email:string; phone:string; isActive:boolean; accountStatus:string; createdAt:string; lastLoginAt?:string };
async function request(url:string,method="GET",body?:unknown) {
  const r=await fetch(`${API}/api/superadmin${url}`,{ method, credentials:"include",headers:{"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined,cache:"no-store",signal:AbortSignal.timeout(20000) });
  const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||"Request failed");return d;
}
const fmt=(s?:string)=>s?new Date(s).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"}):"—";
export default function StaffManagement(){
  const [requests,setRequests]=useState<RequestRow[]>([]);
  const [admins,setAdmins]=useState<Admin[]>([]);
  const [q,setQ]=useState(""); const [status,setStatus]=useState("pending_approval");
  const [loading,setLoading]=useState(true);const [busy,setBusy]=useState("");const [message,setMessage]=useState("");const [error,setError]=useState("");
  const [page,setPage]=useState(1);const [pages,setPages]=useState(1);
  const [deleteId,setDeleteId]=useState("");
  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try { const [r,a]=await Promise.all([request(`/requests?status=${encodeURIComponent(status)}`),request(`/admins?page=${page}&search=${encodeURIComponent(q)}`)]);setRequests(r.requests||[]);setAdmins(a.admins||[]);setPages(a.pages||1); }
    catch(e){setError(e instanceof Error?e.message:"Connection failed");}finally{setLoading(false);}
  },[status,q,page]);
  useEffect(()=>{const timer=setTimeout(()=>{void load();},0);return()=>clearTimeout(timer);},[load]);
  async function act(url:string,confirmText:string,body?:unknown,method="POST"){
    if(!window.confirm(confirmText))return;setBusy(url);setMessage("");setError("");
    try {const result=await request(url,method,body);setMessage(result.message||"Saved successfully.");await load();}
    catch(e){setError(e instanceof Error?e.message:"Action failed");}finally{setBusy("");}
  }
  const button="rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50";
  return <main className="space-y-7 p-5 md:p-8 text-[#211A18]">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold">Admin Approvals & Accounts</h1><p className="mt-1 text-sm text-gray-500">Review OTP-verified registrations and manage access.</p></div><button onClick={()=>void load()} className="rounded-lg border px-4 py-2 text-sm">Refresh</button></div>
    {error&&<div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}{message&&<div role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</div>}
    <section className="rounded-xl border bg-white p-5 shadow-sm"><div className="mb-4 flex flex-wrap items-center justify-between gap-4"><h2 className="text-lg font-semibold">Registration requests</h2><select aria-label="Request status" value={status} onChange={e=>setStatus(e.target.value)} className="rounded-lg border p-2 text-sm"><option value="pending_approval">Awaiting approval</option><option value="email_failed">Credentials email failed</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="all">All requests</option></select></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[740px] text-left text-sm"><thead className="border-b text-xs uppercase text-gray-500"><tr><th className="p-3">Admin name</th><th className="p-3">Email / Phone</th><th className="p-3">Applied (IST)</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead><tbody>{requests.map(x=><tr key={x._id} className="border-b last:border-0"><td className="p-3 font-medium">{x.name}</td><td className="p-3">{x.email}<div className="text-xs text-gray-500">{x.phone}</div></td><td className="p-3">{fmt(x.createdAt)}</td><td className="p-3"><span className="rounded-lg bg-gray-100 px-2 py-1 text-xs">{x.status.replaceAll("_"," ")}</span></td><td className="flex flex-wrap gap-2 p-3">{x.status==="pending_approval"&&<><button className={`${button} bg-green-700 text-white`} disabled={!!busy} onClick={()=>void act(`/requests/${x._id}/approve`,`Approve ${x.name} and send login details by email?`)}>Approve</button><button className={`${button} border border-red-300 text-red-700`} disabled={!!busy} onClick={()=>void act(`/requests/${x._id}/reject`,`Reject ${x.name}?`)}>Reject</button></>}{x.status==="email_failed"&&<button className={`${button} bg-[#8c1839] text-white`} disabled={!!busy} onClick={()=>void act(`/requests/${x._id}/resend`,`Generate and email new credentials for ${x.name}?`)}>Resend credentials</button>}</td></tr>)}</tbody></table>{!loading&&requests.length===0&&<p className="p-5 text-sm text-gray-500">No requests found.</p>}</div></section>
    <section className="rounded-xl border bg-white p-5 shadow-sm"><div className="mb-4 flex flex-wrap items-center justify-between gap-4"><h2 className="text-lg font-semibold">All admin accounts</h2><input aria-label="Search admins" placeholder="Search name, email, username" value={q} onChange={e=>{setQ(e.target.value);setPage(1);}} className="rounded-lg border p-2 text-sm"/></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b text-xs uppercase text-gray-500"><tr><th className="p-3">Admin</th><th className="p-3">Email / Phone</th><th className="p-3">Status</th><th className="p-3">Last login</th><th className="p-3">Management</th></tr></thead><tbody>{admins.map(x=><tr key={x._id} className="border-b last:border-0"><td className="p-3 font-medium"><Link href={`/admin/staff/${x._id}`} className="text-[#8c1839] underline underline-offset-4">{x.name}</Link><div className="text-xs text-gray-500">@{x.username||"—"}</div></td><td className="p-3">{x.email}<div className="text-xs text-gray-500">{x.phone}</div></td><td className="p-3">{x.accountStatus}</td><td className="p-3">{fmt(x.lastLoginAt)}</td><td className="flex flex-wrap gap-2 p-3"><Link href={`/admin/audit-logs?adminId=${x._id}`} className={`${button} border`}>Activity logs</Link>{x.accountStatus!=="active"?<button className={`${button} bg-green-700 text-white`} disabled={!!busy} onClick={()=>void act(`/admins/${x._id}/status`,`Activate ${x.name}?`,{status:"active"},"PATCH")}>Activate</button>:<button className={`${button} border`} disabled={!!busy} onClick={()=>void act(`/admins/${x._id}/status`,`Deactivate ${x.name}?`,{status:"inactive"},"PATCH")}>Deactivate</button>}{x.accountStatus!=="blocked"&&<button className={`${button} border border-red-300 text-red-700`} disabled={!!busy} onClick={()=>void act(`/admins/${x._id}/status`,`Block ${x.name}? This revokes API access.`,{status:"blocked"},"PATCH")}>Block</button>}</td></tr>)}</tbody></table>{!loading&&admins.length===0&&<p className="p-5 text-sm text-gray-500">No admins found.</p>}</div>
      <div className="mt-4 flex items-center justify-end gap-4"><button disabled={page<=1||loading} onClick={()=>setPage(x=>x-1)} className="rounded border px-3 py-1 disabled:opacity-30">Previous</button><span className="text-xs">Page {page} / {Math.max(1,pages)}</span><button disabled={page>=pages||loading} onClick={()=>setPage(x=>x+1)} className="rounded border px-3 py-1 disabled:opacity-30">Next</button></div>
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4">
        <label htmlFor="delete-admin" className="text-sm">Delete admin</label>
        <select id="delete-admin" value={deleteId} onChange={e=>setDeleteId(e.target.value)} className="rounded-lg border p-2 text-sm">
          <option value="">Select an admin on this page</option>
          {admins.map(admin=><option key={admin._id} value={admin._id}>{admin.name} ({admin.email})</option>)}
        </select>
        <button className={`${button} border border-red-300 text-red-700`} disabled={!!busy||!admins.some(a=>a._id===deleteId)} onClick={()=>void act(`/admins/${deleteId}`,`Permanently delete ${admins.find(a=>a._id===deleteId)?.name}? This removes their login account.`,undefined,"DELETE")}>Delete permanently</button>
      </div>
    </section>
  </main>;
}
