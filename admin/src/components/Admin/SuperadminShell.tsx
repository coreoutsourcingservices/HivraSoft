"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { AdminUserProvider, type AdminIdentity } from "./AdminUserContext";

export default function SuperadminShell({ user, children }: { user: AdminIdentity; children: ReactNode }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/superadmin/logout", { method: "POST", credentials: "include" });
      if (!response.ok) throw new Error("Sign out failed. Please retry.");
      window.location.assign("/superadmin");
    } catch (error) { setError(error instanceof Error ? error.message : "Sign out failed."); setBusy(false); }
  }
  return <AdminUserProvider user={user}>
    <div className="admin-shell min-h-dvh bg-[#F7F3EF] text-[#211A18]">
      <header className="bg-[#211A18] text-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-8">
          <Link href="/superadmin" className="text-lg font-semibold">HIVRASOFT · Superadmin</Link>
          <nav aria-label="Superadmin navigation" className="flex flex-wrap items-center gap-2 text-sm">
            <Link className="rounded-lg px-3 py-3 hover:bg-white/10 focus-visible:outline" href="/superadmin">Admin approvals</Link>
            <Link className="rounded-lg px-3 py-3 hover:bg-white/10 focus-visible:outline" href="/superadmin/audit-logs">Activity logs</Link>
            <Link className="rounded-lg px-3 py-3 hover:bg-white/10 focus-visible:outline" href="/superadmin/change-password">Change password</Link>
            <button disabled={busy} onClick={() => void logout()} className="rounded-lg border border-white/30 px-3 py-3 disabled:opacity-50">{busy ? "Signing out…" : "Sign out"}</button>
          </nav>
        </div>
      </header>
      <main className="admin-content mx-auto w-full max-w-[1600px] px-2 py-4 sm:px-6">
        {error && <p role="alert" className="p-4 text-red-700">{error}</p>}
        {children}
      </main>
    </div>
  </AdminUserProvider>;
}
