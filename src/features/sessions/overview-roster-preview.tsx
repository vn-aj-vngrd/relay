import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { Avatar, AvatarStack } from "@/components/shared/avatar-stack";
import { ButtonLink } from "@/components/ui/button";
import { spotsRemainingLabel } from "./format";

export function OverviewRosterPreview({
  id,
  hrefBase,
  names,
  imageUrls,
  roles,
  capacity,
  waitlistCount,
  className = "",
  terminal = false,
}: {
  id: string;
  hrefBase: string;
  names: string[];
  imageUrls: Array<string | undefined>;
  roles: string[];
  capacity: number;
  waitlistCount: number;
  className?: string;
  terminal?: boolean;
}) {
  const spots = Math.max(0, capacity - names.length);
  return (
    <section aria-labelledby={id} className={className}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 id={id} className="text-lg font-bold">
            {terminal ? "Final roster" : "Who’s playing"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {terminal ? (
              `${names.length} Going ${names.length === 1 ? "response" : "responses"}`
            ) : (
              <>
                {names.length} of {capacity} going ·{" "}
                <strong className="text-primary">
                  {spots
                    ? spotsRemainingLabel(spots)
                    : waitlistCount
                      ? `${waitlistCount} waitlisted`
                      : "Waitlist open"}
                </strong>
              </>
            )}
          </p>
        </div>
        <AvatarStack
          names={names.slice(0, 3)}
          imageUrls={imageUrls.slice(0, 3)}
          total={names.length}
        />
      </div>
      {names.length ? (
        <ul className="divide-y divide-line border-y border-line">
          {names.slice(0, 5).map((name, index) => (
            <li
              key={`${name}-${index}`}
              className="flex min-h-14 items-center gap-3 py-2"
            >
              <Avatar
                name={name}
                imageUrl={imageUrls[index]}
                index={index}
                size="sm"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {name}
              </span>
              <span className="text-xs text-muted">
                {roles[index] === "host"
                  ? "Host"
                  : roles[index] === "cohost"
                    ? "Co-host"
                    : "Going"}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-y border-line py-6 text-sm text-muted">
          {terminal
            ? "No Going responses were recorded."
            : "Be the first to join."}
        </p>
      )}
      <ButtonLink
        href={`${hrefBase}/play?panel=players`}
        variant="quiet"
        className="mt-2 w-full"
      >
        View all players <CaretRight aria-hidden size={14} />
      </ButtonLink>
    </section>
  );
}
