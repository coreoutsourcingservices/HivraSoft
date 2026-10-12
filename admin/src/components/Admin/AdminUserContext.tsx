"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AdminIdentity = { name: string; email: string; role: string };
const AdminUserContext = createContext<AdminIdentity | null>(null);

export function AdminUserProvider({ user, children }: { user: AdminIdentity | null; children: ReactNode }) {
  const [current, setCurrent] = useState(user);
  useEffect(() => { setCurrent(user); }, [user]);
  useEffect(() => {
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const response = await fetch("/api/admin/me", { credentials: "include", cache: "no-store", signal: controller.signal });
        if (response.ok) { const data = await response.json(); setCurrent(data.user); }
      } catch { /* Keep the authenticated identity if the refresh is unavailable. */ }
    };
    window.addEventListener("admin-profile-updated", refresh);
    return () => { controller.abort(); window.removeEventListener("admin-profile-updated", refresh); };
  }, []);
  return <AdminUserContext.Provider value={current}>{children}</AdminUserContext.Provider>;
}

export const useAdminUser = () => useContext(AdminUserContext);
