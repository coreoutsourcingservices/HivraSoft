import { headers } from "next/headers";
import StaffAccess from "@/src/components/Admin/StaffAccess";
export default async function ChangePasswordPage() {
  return <StaffAccess initialMode="change" superadmin={(await headers()).get("x-admin-zone") === "superadmin"} />;
}
