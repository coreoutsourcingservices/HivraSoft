"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";

export default function AdminLogin({ unavailable = false }: { unavailable?: boolean }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(unavailable ? "Server is unavailable. Please try again shortly." : "");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/login`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to sign in.");
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in. Please try again.");
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
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f8edf1] text-[#8C1839]"><LockKeyhole size={20} /></span>
          </div>
          <h1 className="text-2xl font-semibold">Admin sign in</h1>
          <p className="mt-2 text-sm text-gray-500">Welcome back to your store.</p>
          <form onSubmit={submit} className="mt-7 space-y-5">
            <div>
              <label htmlFor="admin-username" className="mb-2 block text-sm font-medium">Login ID</label>
              <input id="admin-username" name="username" autoComplete="username" required maxLength={100}
                placeholder="Enter login ID" disabled={busy}
                className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#8C1839] focus:ring-2 focus:ring-[#8C1839]/10" />
            </div>
            <div>
              <label htmlFor="admin-password" className="mb-2 block text-sm font-medium">Password</label>
              <div className="relative">
                <input id="admin-password" name="password" type={visible ? "text" : "password"} autoComplete="current-password"
                  required maxLength={256} placeholder="Enter password" disabled={busy}
                  className="h-11 w-full rounded-md border border-gray-300 bg-white pl-3 pr-12 text-sm outline-none focus:border-[#8C1839] focus:ring-2 focus:ring-[#8C1839]/10" />
                <button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Hide password" : "Show password"}
                  title={visible ? "Hide password" : "Show password"} className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-gray-500">
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#8C1839] text-sm font-semibold text-white hover:bg-[#72132e] disabled:opacity-60">
              {busy ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowRight size={17} />}
              {busy ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </section>
        <p className="mt-6 text-center text-xs text-gray-500">HivraSoft Administration</p>
      </div>
    </main>
  );
}
