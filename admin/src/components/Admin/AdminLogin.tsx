import StaffAccess from "./StaffAccess";
export default function AdminLogin({ unavailable = false }: { unavailable?: boolean }) { return <StaffAccess unavailable={unavailable} />; }
