import { isAdmin } from "@/lib/adminAuth";
import AdminBar from "@/components/admin/AdminBar";

/**
 * Administrationen använder samma smala spalt som den riktiga sidan, så att
 * knapparna ser ut precis som de gör för farmor och farfar. Enda tillägget
 * är fältet högst upp.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {isAdmin() && <AdminBar />}
      {children}
    </>
  );
}
