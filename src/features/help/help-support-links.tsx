import Link from "next/link";

export function HelpSupportLinks() {
  return (
    <div className="mt-4 border-t border-line pt-2">
      <div className="flex flex-wrap gap-x-5 text-sm font-semibold text-primary">
        <Link
          href="/help/support"
          className="inline-flex min-h-11 items-center hover:underline"
        >
          Contact support
        </Link>
        <Link
          href="/home?tour=1"
          className="inline-flex min-h-11 items-center hover:underline"
        >
          Replay app tour (account)
        </Link>
      </div>
      <details>
        <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium">
          Support options
        </summary>
        <p className="text-sm leading-6 text-muted">
          Email is available without an account. Send only a route, approximate
          time, and safe steps to reproduce—not passwords, codes, guest tokens,
          payment screenshots, database dumps, or private game content.
          Acknowledgment targets are not resolution promises.
        </p>
        <ul className="mt-2 text-sm font-semibold text-primary">
          <li>
            <a
              href="mailto:vanajvanguardia@gmail.com"
              className="inline-flex min-h-11 items-center hover:underline"
            >
              Email Relay support
            </a>
          </li>
          <li>
            <Link
              href="/feedback"
              className="inline-flex min-h-11 items-center hover:underline"
            >
              Send feedback (account)
            </Link>
          </li>
          <li>
            <a
              href="/.well-known/security.txt"
              className="inline-flex min-h-11 items-center hover:underline"
            >
              Report a security concern
            </a>
          </li>
        </ul>
      </details>
    </div>
  );
}
