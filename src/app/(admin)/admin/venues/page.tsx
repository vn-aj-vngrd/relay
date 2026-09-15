export const metadata = { title: "Venues · Admin" };

import { redirect } from "next/navigation";

export default function LegacyAdminVenuesPage() {
  redirect("/admin/courts");
}
