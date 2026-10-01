import {
  API_URL,
} from "./api";

/* =========================================================
   AUTHENTICATION CHECK

   GET /api/auth/me
========================================================= */

export async function isAuthenticated(): Promise<boolean> {
  try {
    const response =
      await fetch(
        `${API_URL}/api/auth/me`,
        {
          method: "GET",

          credentials:
            "include",

          cache:
            "no-store",

          headers: {
            Accept:
              "application/json",
          },
        }
      );

    return response.ok;
  } catch {
    return false;
  }
}