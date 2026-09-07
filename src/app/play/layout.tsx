import { AdaptiveProductShell } from "@/components/shared/adaptive-product-shell";
import { FocusedMobileHeader } from "@/components/shared/focused-mobile-header";
import { getCurrentUser } from "@/features/auth/session";

export default async function QuickPlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <AdaptiveProductShell>
      <div className="quick-play-page w-full">
        <FocusedMobileHeader
          title="Quick Play"
          isAuthenticated={Boolean(user)}
        />
        {children}
      </div>
    </AdaptiveProductShell>
  );
}
