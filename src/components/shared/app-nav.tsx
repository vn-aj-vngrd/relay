import { CalendarDays, Home, Plus, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";

export function AppNav({ username }: { username: string }) {
  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/games", label: "Games", icon: CalendarDays },
    { href: "/games/new", label: "Create", icon: Plus, create: true },
    { href: "/groups", label: "Groups", icon: UsersRound },
    { href: `/profile/${username}`, label: "Profile", icon: UserRound },
  ];
  return <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/95 px-2 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
    <ul className="safe-bottom mx-auto flex max-w-lg items-end justify-around pt-1.5 md:max-w-none md:gap-1 md:p-0">
      {items.map(({ href, label, icon: Icon, create }) => <li key={href} className="flex-1 md:flex-none">
        <Link href={href} className={`pressable flex min-h-12 flex-col items-center justify-center gap-1 rounded-[10px] text-[11px] font-medium md:min-h-10 md:flex-row md:px-3 md:text-sm ${create ? "text-primary" : "text-muted hover:bg-surface hover:text-ink"}`}>
          <span className={create ? "-mt-5 grid h-11 w-11 place-items-center rounded-full bg-primary text-white md:mt-0 md:h-auto md:w-auto md:bg-transparent md:text-primary" : ""}><Icon aria-hidden size={create ? 23 : 21} strokeWidth={2} /></span><span>{label}</span>
        </Link>
      </li>)}
    </ul>
  </nav>;
}
