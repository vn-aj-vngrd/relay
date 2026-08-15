import Link from "next/link";

export function Brand() {
  return <Link href="/" className="inline-flex items-center gap-2.5 rounded-md font-bold tracking-[-0.025em]" aria-label="Relay home">
    <span className="relative grid h-7 w-7 place-items-center rounded-[8px] bg-primary text-white"><span className="absolute h-px w-4 rotate-[-28deg] bg-white/75" /><span className="h-2.5 w-2.5 rounded-full border-2 border-white" /></span>
    <span className="text-lg">Relay</span>
  </Link>;
}
