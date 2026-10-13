"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "@/src/components/Admin/navigation";
import ActivityDetails from "@/src/components/Admin/ActivityDetails";
const API = "";
type Actor = {name?:string;username?:string;email?:string};
type Log = {_id:string;action:string;module:string;recordId:string;recordName:string;createdAt:string;performedBy?:Actor|null;actor?:Actor;status?:string;metadata?:Record<string,unknown>};
type AdminOption = Actor & {_id:string};
const actorName=(log:Log)=>log.performedBy?.name||log.actor?.name||String(log.metadata?.actorName||"Deleted / unknown admin");
const actorEmail=(log:Log)=>log.performedBy?.email||log.actor?.email||String(log.metadata?.actorEmail||"");
const result=(log:Log)=>log.status==="failure"||log.metadata?.success===false?"Failed":"Recorded";
function LogScreen(){
 const params=useSearchParams();const [adminId,setAdminId]=useState(params.get("adminId")||"");
 const [admins,setAdmins]=useState<AdminOption[]>([]);
 useEffect(()=>{setAdminId(params.get("adminId")||"");setPage(1);},[params]);
 useEffect(()=>{const controller=new AbortController();void(async()=>{try{const items:AdminOption[]=[];let page=1,pages=1;do{const response=await fetch(`${API}/api/superadmin/admins?page=${page}`,{credentials:"include",cache:"no-store",signal:controller.signal});if(!response.ok)throw new Error("Unable to load admin filter.");const data=await response.json();items.push(...(data.admins||[]));pages=Number(data.pages)||1;page++;}while(page<=pages);setAdmins(items);}catch(error){if(!controller.signal.aborted)setError(error instanceof Error?error.message:"Unable to load admins.");}})();return()=>controller.abort();},[]);
 const [logs,setLogs]=useState<Log[]>([]),[total,setTotal]=useState(0),[page,setPage]=useState(1),[pages,setPages]=useState(1);
 const [action,setAction]=useState(""),[module,setModule]=useState(""),[from,setFrom]=useState(""),[to,setTo]=useState("");
 const [loading,setLoading]=useState(true),[error,setError]=useState("");
 const load=useCallback(async()=>{setLoading(true);setError("");try{
  const query=new URLSearchParams({page:String(page)});if(adminId)query.set("adminId",adminId);if(action)query.set("action",action);if(module)query.set("module",module);if(from)query.set("from",`${from}T00:00:00+05:30`);if(to)query.set("to",`${to}T23:59:59.999+05:30`);
  const r=await fetch(`${API}/api/superadmin/logs?${query}`,{credentials:"include",cache:"no-store",signal:AbortSignal.timeout(15000)});
  const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||"Cannot load audit logs");setLogs(d.logs||[]);setPage(Number(d.page||1));setPages(Math.max(1,Number(d.pages)||1));setTotal(d.total||0);
 }catch(e){setError(e instanceof Error?e.message:"Unable to load");}finally{setLoading(false);}},[action,module,from,to,page,adminId]);
 useEffect(()=>{void load();},[load]);
 function download(){const esc=(v:unknown)=>{const text=String(v??"");return `"${(/^[=+@\-\t\r]/.test(text)?"'":"")+text.replaceAll('"','""')}"`;};const headings=["Timestamp IST","Admin","Email","Action","Module","Record","Status"];
 const rows=logs.map(x=>[new Date(x.createdAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"}),actorName(x),actorEmail(x),x.action,x.module,x.recordName,result(x)]);
 const csv=[headings,...rows].map(cols=>cols.map(esc).join(",")).join("\r\n");const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=`admin-audit-page-${page}.csv`;link.click();URL.revokeObjectURL(url);
 }
 return <main className="space-y-6 p-5 md:p-8 text-[#211A18]"><div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-2xl font-bold">Admin Activity Logs</h1><p className="mt-1 text-sm text-gray-500">{total} recorded actions. Times are shown in IST.</p></div><div className="flex gap-2"><button onClick={()=>void load()} className="rounded-lg border px-3 py-2 text-sm">Refresh</button><button disabled={!logs.length} onClick={download} className="rounded-lg bg-[#8c1839] px-3 py-2 text-sm text-white disabled:opacity-40">Export current page CSV</button></div></div>
 <label className="block text-sm font-medium">Admin
  <select value={adminId} onChange={event=>{setAdminId(event.target.value);setPage(1);}} className="ml-3 rounded border bg-white p-2 text-sm">
   <option value="">All admins</option>
   {adminId&&!admins.some(admin=>admin._id===adminId)&&<option value={adminId}>Selected / deleted admin</option>}
   {admins.map(admin=><option key={admin._id} value={admin._id}>{admin.name} — {admin.email}</option>)}
  </select>
 </label>
 <section className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap gap-3 pb-4"><select aria-label="Action" value={action} onChange={e=>{setAction(e.target.value);setPage(1);}} className="rounded border p-2 text-sm"><option value="">All actions</option>{["CREATE","UPDATE","SOFT_DELETE","RESTORE","PERMANENT_DELETE","LOGIN","LOGOUT","APPROVE","REJECT","SET_STATUS","DELETE","BLOCK","UNBLOCK","EXPORT"].map(x=><option key={x}>{x}</option>)}</select><input placeholder="Module (e.g. admin)" aria-label="Module" value={module} onChange={e=>{setModule(e.target.value);setPage(1);}} className="rounded border p-2 text-sm"/><label className="text-xs text-gray-600">From <input type="date" value={from} onChange={e=>{setFrom(e.target.value);setPage(1);}} className="block rounded border p-2 text-sm"/></label><label className="text-xs text-gray-600">To <input type="date" value={to} onChange={e=>{setTo(e.target.value);setPage(1);}} className="block rounded border p-2 text-sm"/></label></div>
 {error&&<p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
 <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="border-b text-xs uppercase text-gray-500"><tr><th className="p-3">Time (IST)</th><th className="p-3">Performed by</th><th className="p-3">Action</th><th className="p-3">Module</th><th className="p-3">Details</th><th className="p-3">Result</th></tr></thead><tbody>{logs.map(x=><tr key={x._id} className="border-b last:border-0"><td className="whitespace-nowrap p-3">{new Date(x.createdAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})}</td><td className="p-3"><b>{actorName(x)}</b><div className="text-xs text-gray-500">{actorEmail(x)}</div></td><td className="p-3">{x.action}</td><td className="p-3">{x.module}</td><td className="max-w-sm break-words p-3">{x.recordName}<details className="mt-2"><summary className="cursor-pointer text-[#8c1839]">View details</summary><ActivityDetails metadata={x.metadata} recordId={x.recordId}/></details></td><td className="p-3">{result(x)}</td></tr>)}</tbody></table>{!loading&&logs.length===0&&<p className="p-5 text-sm text-gray-500">No activity in this selection.</p>}</div><div className="mt-4 flex justify-end gap-4"><button disabled={page<=1||loading} className="rounded border px-3 py-1 disabled:opacity-30" onClick={()=>setPage(x=>x-1)}>Previous</button><span className="text-xs">{page} / {pages}</span><button disabled={page>=pages||loading} className="rounded border px-3 py-1 disabled:opacity-30" onClick={()=>setPage(x=>x+1)}>Next</button></div></section></main>;
}
export default function AdminAuditLogs(){return <Suspense fallback={<div className="p-8">Loading logs…</div>}><LogScreen/></Suspense>;}
