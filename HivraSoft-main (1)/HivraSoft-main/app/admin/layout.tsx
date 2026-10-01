import type { ReactNode } from "react";
import { cookies } from "next/headers";
import AdminLogin from "@/src/components/Admin/AdminLogin";

import AdminShell from "@/src/components/Admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const token = (await cookies()).get("accessToken")?.value;
  if (!token) return <AdminLogin />;
  let authenticated = false;
  let unavailable = false;
  try {
    const response = await fetch(`${process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/me`, {
      headers: { Cookie: `accessToken=${token}` }, cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    authenticated = response.ok;
    unavailable = response.status >= 500;
  } catch {
    unavailable = true;
  }
  if (!authenticated) return <AdminLogin unavailable={unavailable} />;
  return (
    <AdminShell>
      {children}
    </AdminShell>
  );
}
