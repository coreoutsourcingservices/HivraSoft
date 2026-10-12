import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminShell from "@/src/components/Admin/AdminShell";
export default async function SuperadminDashboardLayout({ children }: { children: ReactNode }) {
  const cookieJar = await cookies();
  const token = cookieJar.get("superadminToken")?.value;
  if (!token) redirect("/");
  let authorized = false;
  try {
    const backend = (process.env.API_URL || "http://localhost:5000").replace(/\/$/, "");
    const response = await fetch(`${backend}/api/superadmin/me`, { headers: { Cookie: `superadminToken=${token}` }, cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (response.ok) { const data = await response.json(); authorized = !data.user?.mustChangePassword; }
  } catch { /* Fail closed: dashboard must never be shown without Superadmin validation. */ }
  if (!authorized) redirect("/");
  return <AdminShell>{children}</AdminShell>;
}
