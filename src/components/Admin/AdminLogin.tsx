"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");
const RECOVERY_EMAIL = "hivrasoft@gmail.com";

type Mode = "login" | "otp" | "reset";

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export default function AdminLogin({ unavailable = false }: { unavailable?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [visible, setVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(unavailable ? "Server is unavailable. Please try again shortly." : "");
  const [success, setSuccess] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.message || "Unable to sign in.");
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function sendResetOtp() {
    try {
      setBusy(true);
      setError("");
      setSuccess("");
      const response = await fetch(`${API_URL}/api/admin/forgot-password/send-otp`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.message || "Unable to send OTP.");
      setMode("otp");
      setOtp("");
      setSuccess(data.message || `OTP sent to ${RECOVERY_EMAIL}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send OTP.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyResetOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setBusy(true);
      setError("");
      setSuccess("");
      const response = await fetch(`${API_URL}/api/admin/forgot-password/verify-otp`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.message || "OTP verification failed.");
      if (!data.resetToken) throw new Error("Password reset session could not be created.");
      setResetToken(String(data.resetToken));
      setMode("reset");
      setSuccess("OTP verified. Enter your new password.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed.");
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      setSuccess("");
      const response = await fetch(`${API_URL}/api/admin/forgot-password/reset`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword, confirmPassword }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.message || "Unable to reset password.");
      setMode("login");
      setResetToken("");
      setOtp("");
      setSuccess(data.message || "Password reset successfully. Sign in with the new password.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f4f5f7] px-5 py-12 text-[#202124]">
      <div className="w-full max-w-[380px]">
        <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#8C1839]">
          <ArrowLeft size={16} /> Back to store
        </Link>

        <section className="rounded-lg border border-gray-200 bg-white p-7 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-lg font-bold">HivraSoft<span className="text-[#8C1839]">.</span></span>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f8edf1] text-[#8C1839]">
              {mode === "login" ? <LockKeyhole size={20} /> : mode === "otp" ? <Mail size={20} /> : <KeyRound size={20} />}
            </span>
          </div>

          <h1 className="text-2xl font-semibold">
            {mode === "login" ? "Admin sign in" : mode === "otp" ? "Verify OTP" : "Set new password"}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {mode === "login"
              ? "Welcome back to your store."
              : mode === "otp"
                ? `Enter the OTP sent to ${RECOVERY_EMAIL}.`
                : "Enter and confirm your new admin password."}
          </p>

          {mode === "login" && (
            <form onSubmit={submit} className="mt-7 space-y-5">
              <div>
                <label htmlFor="admin-username" className="mb-2 block text-sm font-medium">Login ID</label>
                <input
                  id="admin-username"
                  name="username"
                  autoComplete="username"
                  required
                  maxLength={100}
                  placeholder="Enter login ID"
                  disabled={busy}
                  className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#8C1839] focus:ring-2 focus:ring-[#8C1839]/10"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="admin-password" className="block text-sm font-medium">Password</label>
                  <button
                    type="button"
                    onClick={() => void sendResetOtp()}
                    disabled={busy}
                    className="text-xs font-semibold text-[#8C1839] hover:underline disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="admin-password"
                    name="password"
                    type={visible ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    maxLength={256}
                    placeholder="Enter password"
                    disabled={busy}
                    className="h-11 w-full rounded-md border border-gray-300 bg-white pl-3 pr-12 text-sm outline-none focus:border-[#8C1839] focus:ring-2 focus:ring-[#8C1839]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setVisible(!visible)}
                    aria-label={visible ? "Hide password" : "Show password"}
                    className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-gray-500"
                  >
                    {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
              {success && <p role="status" className="text-sm text-emerald-700">{success}</p>}

              <button disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#8C1839] text-sm font-semibold text-white hover:bg-[#72132e] disabled:opacity-60">
                {busy ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowRight size={17} />}
                {busy ? "Signing in..." : "Sign in"}
              </button>
            </form>
          )}

          {mode === "otp" && (
            <form onSubmit={verifyResetOtp} className="mt-7 space-y-5">
              <div>
                <label htmlFor="admin-reset-otp" className="mb-2 block text-sm font-medium">6 digit OTP</label>
                <input
                  id="admin-reset-otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  minLength={6}
                  maxLength={6}
                  placeholder="Enter OTP"
                  className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-center text-lg tracking-[0.35em] outline-none focus:border-[#8C1839] focus:ring-2 focus:ring-[#8C1839]/10"
                />
              </div>

              {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
              {success && <p role="status" className="text-sm text-emerald-700">{success}</p>}

              <button disabled={busy || otp.length !== 6} className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#8C1839] text-sm font-semibold text-white disabled:opacity-60">
                {busy ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowRight size={17} />}
                Verify OTP
              </button>

              <div className="flex items-center justify-between gap-3 text-xs">
                <button type="button" disabled={busy} onClick={() => void sendResetOtp()} className="font-semibold text-[#8C1839] hover:underline disabled:opacity-50">Resend OTP</button>
                <button type="button" onClick={() => { setMode("login"); setError(""); setSuccess(""); }} className="text-gray-500 hover:text-[#8C1839]">Back to sign in</button>
              </div>
            </form>
          )}

          {mode === "reset" && (
            <form onSubmit={resetPassword} className="mt-7 space-y-5">
              <div>
                <label htmlFor="admin-new-password" className="mb-2 block text-sm font-medium">New password</label>
                <div className="relative">
                  <input
                    id="admin-new-password"
                    name="newPassword"
                    type={visible ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={128}
                    placeholder="Enter new password"
                    className="h-11 w-full rounded-md border border-gray-300 bg-white pl-3 pr-12 text-sm outline-none focus:border-[#8C1839] focus:ring-2 focus:ring-[#8C1839]/10"
                  />
                  <button type="button" onClick={() => setVisible(!visible)} className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-gray-500">
                    {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="admin-confirm-password" className="mb-2 block text-sm font-medium">Confirm password</label>
                <div className="relative">
                  <input
                    id="admin-confirm-password"
                    name="confirmPassword"
                    type={confirmVisible ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={128}
                    placeholder="Confirm new password"
                    className="h-11 w-full rounded-md border border-gray-300 bg-white pl-3 pr-12 text-sm outline-none focus:border-[#8C1839] focus:ring-2 focus:ring-[#8C1839]/10"
                  />
                  <button type="button" onClick={() => setConfirmVisible(!confirmVisible)} className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-gray-500">
                    {confirmVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
              {success && <p role="status" className="text-sm text-emerald-700">{success}</p>}

              <button disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#8C1839] text-sm font-semibold text-white disabled:opacity-60">
                {busy ? <LoaderCircle size={17} className="animate-spin" /> : <KeyRound size={17} />}
                {busy ? "Saving..." : "Save new password"}
              </button>
            </form>
          )}
        </section>

        <p className="mt-6 text-center text-xs text-gray-500">HivraSoft Administration</p>
      </div>
    </main>
  );
}
