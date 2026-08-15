import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CreateSessionForm } from "@/features/sessions/create-session-form";

export default function NewGamePage() {
  return <div className="mx-auto max-w-2xl"><Link href="/" className="mb-6 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><ChevronLeft size={18} />Back home</Link><div className="mb-8"><h1 className="text-[28px] font-bold tracking-[-0.035em] sm:text-4xl">Create a game</h1><p className="mt-2 text-pretty text-muted">Set the plan now. You can sort payments, rotations, and the rest when you need them.</p></div><CreateSessionForm /></div>;
}
