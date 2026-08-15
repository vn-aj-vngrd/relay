import Link from "next/link";

export function Brand() {
  return <Link href="/" className="-mx-1 inline-flex min-h-11 items-center gap-2.5 rounded-lg px-1 font-[720] tracking-[-0.025em]" aria-label="Relay home">
    <span className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-[10px] bg-primary text-white shadow-[inset_0_1px_0_oklch(1_0_0/.22)]"><span className="absolute h-px w-6 rotate-[-28deg] bg-white/65" /><span className="relative h-2.5 w-2.5 rounded-full bg-signal ring-2 ring-white" /></span>
    <span className="text-[17px]">Relay</span>
  </Link>;
}
