import { ButtonLink } from "@/components/ui/button";
import { playerPriceDisclosure } from "./player-price";
import {
  type PublicDiscoveryInput,
  publicDiscoveryReasons,
} from "./public-discovery";

export function SessionListingStatus({
  session,
  hasExpense,
  isOriginalHost,
  now,
}: {
  session: PublicDiscoveryInput & { id: string; slug: string };
  hasExpense: boolean;
  isOriginalHost: boolean;
  now: Date;
}) {
  if (session.visibility !== "public") {
    return (
      <section
        aria-label="Game access"
        className="border-b border-line py-4 text-sm font-semibold"
      >
        {session.visibility === "private" ? "Invite only" : "Anyone with link"}
      </section>
    );
  }
  const reasons = publicDiscoveryReasons(session, now);
  const terminal =
    session.status === "completed" || session.status === "cancelled";
  const price = playerPriceDisclosure({ ...session, hasExpense });
  const explanations = terminal
    ? [session.status === "completed" ? "Game ended." : "Game cancelled."]
    : reasons.flatMap((reason) => {
        if (reason === "expired") return ["Scheduled end time has passed."];
        if (reason === "draft" || reason === "unpublished")
          return ["Game is not published."];
        if (reason === "price")
          return [
            `${price.label}. ${price.context} Open games requires a stated player price.`,
          ];
        return [];
      });
  const canEditSchedule =
    reasons.includes("expired") &&
    ["draft", "published"].includes(session.status);
  const canConfigurePrice =
    reasons.includes("price") && !terminal && isOriginalHost;
  return (
    <section
      aria-label="Public listing"
      className="flex flex-col gap-2 border-b border-line py-4"
    >
      <p className="text-sm font-semibold">
        {reasons.length ? "Not listed in Open games" : "Listed in Open games"}
      </p>
      {explanations.map((text) => (
        <p key={text} className="text-sm text-muted">
          {text}
        </p>
      ))}
      {!terminal && reasons.includes("price") && !isOriginalHost ? (
        <p className="text-sm text-muted">
          Only the original host can configure player payment.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {!reasons.length ? (
          <ButtonLink
            href={`/s/${session.slug}?source=open-games`}
            variant="quiet"
          >
            View listing
          </ButtonLink>
        ) : null}
        {canEditSchedule ? (
          <ButtonLink
            href={`/games/${session.id}/settings#settings-date`}
            variant="quiet"
          >
            Edit schedule
          </ButtonLink>
        ) : null}
        {canConfigurePrice ? (
          <ButtonLink
            href={`/games/${session.id}/settings?section=payments#player-payment`}
            variant="quiet"
          >
            Payment settings
          </ButtonLink>
        ) : null}
      </div>
    </section>
  );
}
