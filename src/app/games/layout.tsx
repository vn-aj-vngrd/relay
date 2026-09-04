import { AdaptiveProductShell } from "@/components/shared/adaptive-product-shell";

export default function PublicGamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdaptiveProductShell>{children}</AdaptiveProductShell>;
}
