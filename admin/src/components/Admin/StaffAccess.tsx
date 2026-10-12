"use client";
import { useState, type FormEvent, type InputHTMLAttributes } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "register" | "verify" | "pending" | "recovery" | "recovery-verify" | "reset" | "change";
const API = "";
function PasswordInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  return <div className="relative mb-4">
    <input {...props} type={visible ? "text" : "password"} className={`${className} !mb-0 pr-16`}/>
    <button type="button" aria-label={`${visible ? "Hide" : "Show"} ${props.id === "oldPassword" ? "current password" : props.id === "confirmPassword" ? "confirm password" : props.id === "newPassword" ? "new password" : "password"}`} aria-pressed={visible} onClick={()=>setVisible(value=>!value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-1 py-2 text-xs font-semibold text-[#8C1839] focus-visible:outline focus-visible:outline-2">{visible ? "Hide" : "Show"}</button>
  </div>;
}
export default function StaffAccess({ initialMode = "login", unavailable = false }: { initialMode?: Mode; unavailable?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [busy, setBusy] = useState(false), [error, setError] = useState(unavailable ? "Server unavailable. Please retry." : "");
  const [message, setMessage] = useState("");
  const [registration, setRegistration] = useState({ name: "", email: "", phone: "" });
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [registrationToken, setRegistrationToken] = useState("");
  const [resendAt, setResendAt] = useState(0);
  async function post(path: string, body: unknown) {
    const response = await fetch(`${API}/api/admin/${path}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(45000) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Request failed. Try again.");
    return data;
  }
  function move(next: Mode) { setMode(next); setError(""); setMessage(""); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (mode === "login") {
        const data = await post("login", fields);
        if (data.mustChangePassword) move("change");
        else { window.location.assign("/admin"); }
      } else if (mode === "register") {
        const input = { name: String(fields.name), email: String(fields.email), phone: String(fields.phone) };
        const data = await post("register/send-otp", input); setRegistrationToken(data.registrationToken); setRegistration(input); setEmail(input.email); setResendAt(Date.now() + 60000); move("verify"); setMessage(data.message);
      } else if (mode === "verify") {
        await post("register/verify-otp", { registrationToken, otp: fields.otp }); setRegistrationToken(""); move("pending");
      } else if (mode === "recovery") {
        const data = await post("forgot-password/send-otp", { email: fields.email }); setEmail(String(fields.email)); setResendAt(Date.now() + 60000); move("recovery-verify"); setMessage(data.message);
      } else if (mode === "recovery-verify") {
        const data = await post("forgot-password/verify-otp", { email, otp: fields.otp }); setResetToken(data.resetToken); move("reset");
      } else if (mode === "reset") {
        const data = await post("forgot-password/reset", { ...fields, resetToken }); setResetToken(""); move("login"); setMessage(data.message);
      } else if (mode === "change") {
        await post("change-password", fields); window.location.assign("/admin"); router.refresh();
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Request failed."); }
    finally { setBusy(false); }
  }
  async function resend() {
    if (Date.now() < resendAt) { setError("Wait 60 seconds between OTP requests."); return; }
    setBusy(true); setError("");
    try { const data = await post(mode === "verify" ? "register/send-otp" : "forgot-password/send-otp", mode === "verify" ? registration : { email }); if (mode === "verify") setRegistrationToken(data.registrationToken); setMessage(data.message); setResendAt(Date.now() + 60000); }
    catch (err) { setError(err instanceof Error ? err.message : "Resend failed."); }
    finally { setBusy(false); }
  }
  const titles: Record<Mode, string> = { login: "Admin sign in", register: "Request admin access", verify: "Verify your email", pending: "Awaiting approval", recovery: "Recover your account", "recovery-verify": "Verify recovery code", reset: "Choose a new password", change: "Change temporary password" };
  const inputClass = "mt-1 mb-4 w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm";
  return <main className="flex min-h-dvh items-center justify-center bg-[#f4f5f7] px-5 py-12 text-[#202124]"><section className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
    <p className="mb-6 text-xl font-bold">HivraSoft<span className="text-[#8C1839]">.</span></p>
    <h1 className="mb-3 text-2xl font-semibold">{titles[mode]}</h1>
    {mode === "pending" ? <p className="my-6 text-gray-600">Your email is verified. A superadmin will review your request. Your login credentials will arrive by email after approval.</p> : <form onSubmit={submit} key={mode}>
      {mode === "change" && <p className="mb-4 text-sm text-gray-600">Set your own password before accessing the dashboard. Use at least 8 characters with letters and numbers.</p>}
      {mode === "register" && <><label htmlFor="name">Full name</label><input className={inputClass} id="name" name="name" autoComplete="name" required minLength={2} maxLength={100}/></>}
      {(mode === "register" || mode === "recovery") && <><label htmlFor="email">Email address</label><input className={inputClass} id="email" name="email" type="email" autoComplete="email" required maxLength={254}/></>}
      {mode === "register" && <><label htmlFor="phone">Mobile number</label><input className={inputClass} id="phone" name="phone" type="tel" autoComplete="tel" required pattern="[+0-9 ()-]{10,20}"/></>}
      {mode === "login" && <><label htmlFor="username">Email or Username</label><input className={inputClass} id="username" name="username" autoComplete="username" required maxLength={254}/><label htmlFor="password">Password</label><PasswordInput className={inputClass} id="password" name="password" type="password" autoComplete="current-password" required maxLength={256}/></>}
      {(mode === "verify" || mode === "recovery-verify") && <><p className="mb-4 text-sm">Enter the code sent to {email}. It expires in five minutes.</p><label htmlFor="otp">Six-digit code</label><input className={inputClass} id="otp" name="otp" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" required maxLength={6}/></>}
      {mode === "change" && <><label htmlFor="oldPassword">Current / temporary password</label><PasswordInput className={inputClass} id="oldPassword" name="oldPassword" type="password" autoComplete="current-password" required maxLength={256}/></>}
      {(mode === "reset" || mode === "change") && <><label htmlFor="newPassword">New password</label><PasswordInput className={inputClass} id="newPassword" name="newPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={128}/><label htmlFor="confirmPassword">Confirm password</label><PasswordInput className={inputClass} id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={128}/></>}
      <button disabled={busy} className="w-full rounded-lg bg-[#8C1839] p-3 font-medium text-white disabled:opacity-50">{busy ? "Please wait…" : mode === "login" ? "Sign in" : mode === "register" ? "Register" : mode.includes("verify") ? "Verify OTP" : "Continue"}</button>
    </form>}
    {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}{message && <p className="mt-4 text-sm text-green-800" role="status">{message}</p>}
    <div className="mt-6 flex flex-wrap gap-4 text-sm text-[#8C1839]">
      {mode === "login" && <><button onClick={() => move("register")}>Register as admin</button><button onClick={() => move("recovery")}>Forgot password?</button></>}
      {(mode === "verify" || mode === "recovery-verify") && <button disabled={busy} onClick={resend}>Resend OTP</button>}
      {mode !== "login" && mode !== "change" && <button disabled={busy} onClick={() => move("login")}>Back to sign in</button>}
      {mode === "change" && <button disabled={busy} onClick={async () => { try { await post("logout", {}); window.location.assign("/admin"); } catch { setError("Sign out failed."); } }}>Sign out</button>}
    </div>
  </section></main>;
}
