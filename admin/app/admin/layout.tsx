import type {
  ReactNode,
} from "react";

import {
  cookies,
} from "next/headers";

import AdminLogin from "@/src/components/Admin/AdminLogin";

import AdminShell from "@/src/components/Admin/AdminShell";

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

    unavailable =
      response.status >=
      500;
  } catch {
    unavailable =
      true;
  }

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
    <AdminShell>
      {children}
    </AdminShell>
  );
}