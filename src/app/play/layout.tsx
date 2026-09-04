import { AdaptiveProductShell } from "@/components/shared/adaptive-product-shell";

export default function QuickPlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdaptiveProductShell>{children}</AdaptiveProductShell>;
}
