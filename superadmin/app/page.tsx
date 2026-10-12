"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle, ShieldCheck } from "lucide-react";
type SessionUser = { name: string; username: string; mustChangePassword?: boolean };
export default function SuperadminLogin() {
  const router = useRouter();
  const [user,setUser] = useState<SessionUser | null>(null);
  const [checking,setChecking] = useState(true);
  const [busy,setBusy] = useState(false);
  const [visible,setVisible] = useState(false);
  const [error,setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/superadmin/me", { credentials: "include", cache: "no-store", signal: controller.signal })
      .then(async r => { if (r.ok) { const d=await r.json(); setUser(d.user); if (!d.user?.mustChangePassword) router.replace("/admin"); } })
      .catch(() => {}).finally(() => setChecking(false));
    return () => controller.abort();
  },[router]);
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f=new FormData(e.currentTarget); setBusy(true); setError("");
    try {
      const r=await fetch("/api/superadmin/login", { method:"POST", credentials:"include", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ username:f.get("username"), password:f.get("password") }), signal:AbortSignal.timeout(15000) });
      const d=await r.json().catch(()=>({})); if (!r.ok || !d.user) throw new Error(d.message || "Login failed");
      if (d.user.mustChangePassword) setUser(d.user);
      else { router.replace("/admin"); router.refresh(); }
    } catch(e) { setError(e instanceof Error ? e.message : "Connection failed"); }
    finally { setBusy(false); }
  }
  async function updatePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f=new FormData(e.currentTarget);setBusy(true);setError("");
    try {
      const r=await fetch("/api/superadmin/change-password",{ method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(f)),signal:AbortSignal.timeout(15000) });
      const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||"Unable to change password");
      router.replace("/admin");router.refresh();
    } catch(e) {setError(e instanceof Error ? e.message : "Unable to change password");}
    finally {setBusy(false);}
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#f6f2f3] p-5 text-[#211A18]">
    <section className="w-full max-w-md rounded-2xl border border-rose-100 bg-white p-8 shadow-xl">
      <div className="flex items-center justify-between"><b className="text-2xl">HivraSoft<span className="text-[#8c1839]">.</span></b><span className="rounded border border-rose-200 px-2 py-1 text-[10px] font-bold tracking-wider text-[#8c1839]">SUPERADMIN</span></div>
      <ShieldCheck className="mt-9 text-[#8c1839]" size={32}/>
      <h1 className="mt-6 text-3xl font-bold">{user?.mustChangePassword ? "Change temporary password" : "Superadmin sign in"}</h1>
      <p className="mt-2 text-sm text-gray-500">{user?.mustChangePassword ? "Set a new password before opening the dashboard." : "Sign in to manage products, blogs, orders and admins."}</p>
      {checking ? <p className="mt-8 text-sm">Checking your session…</p> : user?.mustChangePassword ? <form onSubmit={updatePassword} className="mt-6 space-y-4">
        {[["oldPassword","Current password"],["newPassword","New password"],["confirmPassword","Confirm password"]].map(([name,label])=><label key={name} className="block text-sm">{label}<input type="password" name={name} required minLength={name==="oldPassword"?1:12} className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-3"/></label>)}
        <button disabled={busy} className="h-12 w-full rounded-lg bg-[#8c1839] font-semibold text-white">Change password & open dashboard</button>
      </form> : <form onSubmit={login} className="mt-7 space-y-5">
        <label className="block text-sm font-medium">Email or Username<input name="username" required autoComplete="username" className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-3" placeholder="Superadmin username or email"/></label>
        <label className="block text-sm font-medium">Password<div className="relative mt-2"><input name="password" required type={visible?"text":"password"} autoComplete="current-password" className="h-11 w-full rounded-lg border border-gray-300 px-3 pr-16"/><button type="button" className="absolute right-3 top-3 text-xs text-[#8c1839]" onClick={()=>setVisible(x=>!x)}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
        <button disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#8c1839] font-semibold text-white">{busy?<LoaderCircle className="animate-spin" size={18}/>:null}{busy?"Signing in…":"Sign in to Dashboard →"}</button>
      </form>}
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <p className="mt-6 border-t pt-4 text-xs text-gray-500">Admin login: <a href={process.env.NEXT_PUBLIC_ADMIN_URL||"http://localhost:3001"} className="text-[#8c1839] underline">Open Admin panel</a></p>
    </section>
  </main>;
}
