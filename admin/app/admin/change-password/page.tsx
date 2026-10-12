"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");
export default function FirstPasswordChange(){
 const router=useRouter();const [busy,setBusy]=useState(false),[error,setError]=useState("");
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");const form=new FormData(e.currentTarget);
 try {const response=await fetch(`${API}/api/admin/change-password`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(form)),signal:AbortSignal.timeout(15000)});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.message||"Password change failed");router.replace("/admin");router.refresh();}
 catch(e){setError(e instanceof Error?e.message:"Unable to change password");}finally{setBusy(false);}}
 return <main className="flex min-h-screen items-center justify-center bg-gray-100 p-4"><form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 shadow-lg"><h1 className="text-2xl font-bold">Change temporary password</h1><p className="text-sm text-gray-600">Set a new password with at least 8 characters, including letters and numbers, before managing HivraSoft.</p>{[["oldPassword","Current password"],["newPassword","New password"],["confirmPassword","Confirm password"]].map(([name,label])=><label key={name} className="block text-sm font-medium">{label}<input name={name} type="password" required minLength={name==="oldPassword"?1:8} className="mt-2 h-11 w-full rounded border px-3"/></label>)}{error&&<p className="text-sm text-red-700">{error}</p>}<button disabled={busy} className="h-11 w-full rounded bg-[#8c1839] text-white">{busy?"Updating…":"Change password"}</button></form></main>;
}
