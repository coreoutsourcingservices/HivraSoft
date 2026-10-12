"use client";
import { useState, type FormEvent } from "react";
const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");
export default function AdminRegister() {
  const [email,setEmail]=useState(""); const [otp,setOtp]=useState("");
  const [registrationToken,setRegistrationToken]=useState("");
  const [stage,setStage]=useState<"form"|"otp"|"pending">("form");
  const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [notice,setNotice]=useState("");
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const form=new FormData(e.currentTarget);setBusy(true);setError("");setNotice("");
    try { const r=await fetch(`${API}/api/admin-registration/signup`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:form.get("name"),email:form.get("email"),phone:form.get("phone")}),signal:AbortSignal.timeout(45000)});
      const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||"Unable to send OTP");setRegistrationToken(d.registrationToken);setEmail(String(form.get("email")));setStage("otp");setNotice(d.message||"OTP sent to your email");
    }catch(e){setError(e instanceof Error?e.message:"Server unavailable");}finally{setBusy(false);}
  }
  async function verify(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setError("");
    try {const r=await fetch(`${API}/api/admin-registration/verify-otp`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({registrationToken,otp}),signal:AbortSignal.timeout(15000)});
      const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||"OTP invalid");setStage("pending");setNotice(d.message||"Approval pending");
    }catch(e){setError(e instanceof Error?e.message:"Server unavailable");}finally{setBusy(false);}
  }
  const field="mt-2 h-11 w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-[#8c1839]";
  return <main className="flex min-h-screen items-center justify-center bg-[#f5f5f6] p-5 text-[#211A18]"><section className="w-full max-w-md rounded-xl border bg-white p-8 shadow-lg">
    <p className="font-bold text-xl">HivraSoft<span className="text-[#8c1839]">.</span></p>
    <h1 className="mt-6 text-2xl font-bold">{stage==="pending"?"Waiting for approval":stage==="otp"?"Verify email OTP":"Admin Registration"}</h1>
    <p className="mt-2 text-sm text-gray-500">{stage==="form"?"Enter your details to request Admin access.":stage==="otp"?`Enter the 6-digit code sent to ${email}. It expires in 5 minutes.`:"Your verified application is now visible to Superadmin. Your login details will be emailed after approval."}</p>
    {stage==="form"?<form onSubmit={submit} className="mt-7 space-y-4">
      <label className="block text-sm font-medium">Full name<input name="name" required minLength={2} maxLength={100} autoComplete="name" className={field}/></label>
      <label className="block text-sm font-medium">Email address<input name="email" required type="email" autoComplete="email" className={field}/></label>
      <label className="block text-sm font-medium">Mobile number<input name="phone" required type="tel" pattern="[+0-9 -]{10,18}" autoComplete="tel" className={field}/></label>
      <button disabled={busy} className="h-11 w-full rounded-lg bg-[#8c1839] font-semibold text-white">{busy?"Sending OTP…":"Submit & Send OTP"}</button>
    </form>:stage==="otp"?<form onSubmit={verify} className="mt-7 space-y-4"><label className="block text-sm font-medium">6 digit OTP<input value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,"").slice(0,6))} required inputMode="numeric" pattern="[0-9]{6}" className={field} placeholder="123456"/></label>
      <button disabled={busy} className="h-11 w-full rounded-lg bg-[#8c1839] font-semibold text-white">{busy?"Verifying…":"Verify OTP & Request Approval"}</button>
      <button type="button" disabled={busy} onClick={()=>setStage("form")} className="text-sm text-[#8c1839] underline">Resend OTP (after 60 seconds)</button></form>:<div className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-800">Email verified. Superadmin will approve or reject your application.</div>}
    {notice&&<p role="status" className="mt-4 text-sm text-green-700">{notice}</p>}
    {error&&<p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <a className="mt-7 inline-block text-sm text-[#8c1839] underline" href="/admin">← Back to Admin login</a>
  </section></main>;
}
