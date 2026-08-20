import { redirect } from "next/navigation";

export default function LegacyAdminVenuesPage() {
  redirect("/admin/courts");
}
