import type { ReactNode } from "react";
import { cookies, headers } from "next/headers";
import StaffAccess from "@/src/components/Admin/StaffAccess";
import AdminShell from "@/src/components/Admin/AdminShell";
import type { AdminIdentity } from "@/src/components/Admin/AdminUserContext";
export default async function AdminLayout({ children }: { children: ReactNode }) {
 const superadmin = (await headers()).get("x-admin-zone") === "superadmin";
 const cookieName = superadmin ? "superadminToken" : "accessToken";
 const token = (await cookies()).get(cookieName)?.value;
 let user: AdminIdentity | null = null, unavailable = false, mustChange = false;
 if (token) { try {
 const backend = (process.env.API_URL || "http://localhost:5000").replace(/\/$/, "");
 const response = await fetch(backend + "/api/" + (superadmin ? "superadmin" : "admin") + "/me", { headers: { Cookie: cookieName + "=" + token }, cache: "no-store", signal: AbortSignal.timeout(8000) });
 unavailable = response.status >= 500;
 if (response.ok) { const data = await response.json(); user = data.user; mustChange = Boolean(data.user?.mustChangePassword); }
 } catch { unavailable = true; } }
 if (!user || (superadmin && user.role !== "super_admin")) return <StaffAccess superadmin={superadmin} unavailable={unavailable} />;
 if (mustChange) return <StaffAccess initialMode="change" superadmin={superadmin} />;
 return <AdminShell user={user}>{children}</AdminShell>;
}
