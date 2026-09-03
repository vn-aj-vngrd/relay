import {
  Broadcast,
  CheckCircle,
  CircleDashed,
  CurrencyCircleDollar,
} from "@phosphor-icons/react/dist/ssr";

const styles = {
  confirmed: {
    icon: CheckCircle,
    className: "text-success",
    label: "Court confirmed",
  },
  pending: {
    icon: CircleDashed,
    className: "text-muted",
    label: "Booking pending",
  },
  paid: {
    icon: CurrencyCircleDollar,
    className: "text-success",
    label: "Paid",
  },
  due: {
    icon: CurrencyCircleDollar,
    className: "text-warning",
    label: "Payment due",
  },
  live: { icon: Broadcast, className: "text-live", label: "Live now" },
};

export function Status({
  kind,
  label,
}: {
  kind: keyof typeof styles;
  label?: string;
}) {
  const item = styles[kind];
  const Icon = item.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm font-medium ${item.className}`}
    >
      <Icon aria-hidden size={16} weight="regular" />
      <span>{label ?? item.label}</span>
    </span>
  );
}
