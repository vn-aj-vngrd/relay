import { CircleCheck, CircleDashed, CircleDollarSign, Radio } from "lucide-react";

const styles = {
  confirmed: { icon: CircleCheck, className: "text-success", label: "Court confirmed" },
  pending: { icon: CircleDashed, className: "text-muted", label: "Booking pending" },
  paid: { icon: CircleDollarSign, className: "text-success", label: "Paid" },
  due: { icon: CircleDollarSign, className: "text-warning", label: "Payment due" },
  live: { icon: Radio, className: "text-danger", label: "Live now" },
};

export function Status({ kind, label }: { kind: keyof typeof styles; label?: string }) {
  const item = styles[kind];
  const Icon = item.icon;
  return <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${item.className}`}><Icon aria-hidden size={16} /><span>{label ?? item.label}</span></span>;
}
