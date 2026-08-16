import { LockKey } from "@phosphor-icons/react/dist/ssr";
import { Brand } from "@/components/shared/brand";
import { ButtonLink } from "@/components/ui/button";

export const metadata = { title: "Admin access required" };

export default function AdminAccessDeniedPage() {
  return <main id="main-content" className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-5 py-6 sm:justify-center sm:py-12"><Brand href="/home" /><div className="mt-20 sm:mt-12"><span className="grid h-11 w-11 place-items-center rounded-full bg-surface-strong text-muted"><LockKey aria-hidden size={22} weight="fill" /></span><h1 className="mt-5 text-2xl font-bold tracking-[-0.025em]">Admin access required</h1><p className="mt-3 max-w-md leading-7 text-muted">Your account is signed in, but it is not allowed to manage Relay’s production space.</p><div className="mt-7"><ButtonLink href="/home">Back to Relay</ButtonLink></div></div></main>;
}
