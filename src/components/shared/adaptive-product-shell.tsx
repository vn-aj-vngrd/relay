import { getCurrentUser, requireUser } from "@/features/auth/session";

import { AuthenticatedAppShell } from "./authenticated-app-shell";
import { PublicProductShell } from "./public-product-shell";

export async function AdaptiveProductShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user) {
    const verifiedUser = await requireUser();
    return (
      <AuthenticatedAppShell user={verifiedUser}>
        {children}
      </AuthenticatedAppShell>
    );
  }
  return <PublicProductShell>{children}</PublicProductShell>;
}
