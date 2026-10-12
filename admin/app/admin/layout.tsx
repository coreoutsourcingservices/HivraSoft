import type {
  ReactNode,
} from "react";
import { redirect } from "next/navigation";

import {
  cookies,
} from "next/headers";

import AdminLogin from "@/src/components/Admin/AdminLogin";

import AdminShell from "@/src/components/Admin/AdminShell";
import type { AdminIdentity } from "@/src/components/Admin/AdminUserContext";

export default async function AdminLayout({
  children,
}: {
  children:
    ReactNode;
}) {
  /* =========================================================
     GET ADMIN ACCESS TOKEN
  ========================================================= */

  const token =
    (
      await cookies()
    ).get(
      "accessToken",
    )?.value;

  /* =========================================================
     NO TOKEN

     Existing behavior preserved.
  ========================================================= */

  if (
    !token
  ) {
    return (
      <AdminLogin />
    );
  }

  /* =========================================================
     ADMIN AUTH STATE
  ========================================================= */

  let authenticated =
    false;

  let unavailable =
    false;

  let mustChange = false;
  let adminUser: AdminIdentity | null = null;

  /* =========================================================
     VERIFY ADMIN
  ========================================================= */

  try {
    const response =
      await fetch(
        `${
          process.env.API_URL ||
          process.env.NEXT_PUBLIC_API_URL ||
          "http://localhost:5000"
        }/api/admin/me`,
        {
          headers: {
            Cookie:
              `accessToken=${token}`,
          },

          cache:
            "no-store",

          signal:
            AbortSignal.timeout(
              8000,
            ),
        },
      );

    authenticated =
      response.ok;
    if (response.ok) {
      const data = await response.json();
      adminUser = data.user ? { name: data.user.name || "", email: data.user.email || "", role: data.user.role || "admin" } : null;
      mustChange = Boolean(data.user?.mustChangePassword);
    }

    unavailable =
      response.status >=
      500;
  } catch {
    unavailable =
      true;
  }

  if (mustChange) redirect("/change-password");

  /* =========================================================
     NOT AUTHENTICATED

     Existing login behavior preserved.
  ========================================================= */

  if (
    !authenticated
  ) {
    return (
      <AdminLogin
        unavailable={
          unavailable
        }
      />
    );
  }

  /* =========================================================
     AUTHENTICATED ADMIN

     IMPORTANT:

     Calendar reminder aur profile-completion notification
     storefront components me /admin route check se hidden hain.

     Isliye existing AdminShell ya admin pages me kuch remove
     nahi kiya gaya hai.
  ========================================================= */

  return (
    <AdminShell user={adminUser}>
      {children}
    </AdminShell>
  );
}
