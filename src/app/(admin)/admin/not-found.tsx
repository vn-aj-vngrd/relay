import { LockKey } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/button";

export default function AdminNotFound() {
  return <main id="main-content" className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5 py-16"><span className="grid h-11 w-11 place-items-center rounded-full bg-surface-strong text-muted"><LockKey aria-hidden size={22} weight="fill" /></span><h1 className="mt-5 text-2xl font-bold tracking-[-0.025em]">This page is unavailable</h1><p className="mt-3 leading-7 text-muted">The admin page may not exist, or your account may not have permission to open it.</p><div className="mt-7"><ButtonLink href="/home">Back to Relay</ButtonLink></div></main>;
}
