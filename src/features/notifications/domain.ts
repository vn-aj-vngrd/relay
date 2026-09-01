export type NotificationTone = "session" | "players" | "payment" | "play" | "system";

export type NotificationPresentation = {
  title: string;
  body: string;
  href: string;
  tone: NotificationTone;
};

type NotificationInput = {
  type: string;
  sessionId: string | null;
  sessionTitle: string | null;
  payload: Record<string, unknown>;
};

function changedFields(payload: Record<string, unknown>) {
  const fields = Array.isArray(payload.fields)
    ? payload.fields.filter((field): field is string => typeof field === "string")
    : [];
  return fields.length ? `Changed: ${fields.join(", ")}.` : "Open the game to review the updated plan.";
}

export function notificationPresentation({
  type,
  sessionId,
  sessionTitle,
  payload,
}: NotificationInput): NotificationPresentation {
  const game = sessionTitle ?? "Your game";
  const gameHref = sessionId ? `/games/${sessionId}` : "/games";
  const customTitle = typeof payload.title === "string" ? payload.title : null;
  const customBody = typeof payload.body === "string" ? payload.body : null;
  const fallback = {
    title: customTitle ?? type.replaceAll("_", " "),
    body: customBody ?? "Open Relay for details.",
    href: gameHref,
    tone: "system" as const,
  };

  switch (type) {
    case "session_invite":
      return {
        title: customTitle ?? "You’re invited",
        body: customBody ?? `${game} has a spot for you.`,
        href: gameHref,
        tone: "session",
      };
    case "session_details_changed":
      return {
        title: customTitle ?? `${game} was updated`,
        body: customBody ?? changedFields(payload),
        href: gameHref,
        tone: "session",
      };
    case "session_cost_changed":
      return {
        title: customTitle ?? `${game} cost updated`,
        body: customBody ?? "Open the game to review the updated cost per player.",
        href: gameHref,
        tone: "payment",
      };
    case "booking_confirmed":
      return {
        title: customTitle ?? "Court booking confirmed",
        body: customBody ?? `${game} is booked and ready for the crew.`,
        href: gameHref,
        tone: "session",
      };
    case "join_request": {
      const guest = typeof payload.guestName === "string" ? payload.guestName : "A player";
      return {
        title: customTitle ?? "New join request",
        body: customBody ?? `${guest} wants to join ${game}.`,
        href: `${gameHref}/players`,
        tone: "players",
      };
    }
    case "player_joined": {
      const player = typeof payload.guestName === "string" ? payload.guestName : "A player";
      return {
        title: customTitle ?? "Player joined",
        body: customBody ?? `${player} joined ${game}.`,
        href: `${gameHref}/players`,
        tone: "players",
      };
    }
    case "player_left": {
      const player = typeof payload.guestName === "string" ? payload.guestName : "A player";
      return {
        title: customTitle ?? "Player left",
        body: customBody ?? `${player} left ${game}.`,
        href: `${gameHref}/players`,
        tone: "players",
      };
    }
    case "join_approved":
      return {
        title: customTitle ?? "You’re in",
        body: customBody ?? `Your spot for ${game} was approved.`,
        href: gameHref,
        tone: "players",
      };
    case "moved_to_waitlist":
      return {
        title: customTitle ?? "You’re on the waitlist",
        body: customBody ?? `${game} is currently full. We’ll let you know when a spot opens.`,
        href: `${gameHref}/players`,
        tone: "players",
      };
    case "moved_from_waitlist":
      return {
        title: customTitle ?? "A spot opened up",
        body: customBody ?? `You’re now going to ${game}.`,
        href: `${gameHref}/players`,
        tone: "players",
      };
    case "removed_from_session":
      return {
        title: customTitle ?? "Roster updated",
        body: customBody ?? `You’re no longer on the roster for ${game}.`,
        href: "/games",
        tone: "players",
      };
    case "payment_requested":
      return {
        title: customTitle ?? "Your share is ready",
        body: customBody ?? `The host added the repayment details for ${game}.`,
        href: `${gameHref}/payments`,
        tone: "payment",
      };
    case "payment_sent":
      return {
        title: customTitle ?? "Payment proof received",
        body: customBody ?? `A player sent payment proof for ${game}.`,
        href: `${gameHref}/payments`,
        tone: "payment",
      };
    case "payment_confirmed":
      return {
        title: customTitle ?? "Payment confirmed",
        body: customBody ?? `The host confirmed your payment for ${game}.`,
        href: `${gameHref}/payments`,
        tone: "payment",
      };
    case "payment_proof_requested":
      return {
        title: customTitle ?? "New payment proof needed",
        body:
          customBody ??
          (typeof payload.note === "string" ? payload.note : `The host asked you to check your proof for ${game}.`),
        href: `${gameHref}/payments`,
        tone: "payment",
      };
    case "payment_updated":
      return {
        title: customTitle ?? "Your payment changed",
        body: customBody ?? `Review your updated share for ${game}.`,
        href: `${gameHref}/payments`,
        tone: "payment",
      };
    case "match_assignment":
      return {
        title: customTitle ?? "Your court is ready",
        body:
          customBody ??
          (typeof payload.courtLabel === "string"
            ? `Head to ${payload.courtLabel} for your next match.`
            : `Your next match in ${game} is ready.`),
        href: `${gameHref}/play`,
        tone: "play",
      };
    case "session_starting_soon":
      return {
        title: customTitle ?? "Game starting soon",
        body: customBody ?? `${game} starts in about an hour. Check the venue and mark yourself here when you arrive.`,
        href: `${gameHref}/play`,
        tone: "play",
      };
    case "session_tomorrow":
      return {
        title: customTitle ?? "Game tomorrow",
        body:
          customBody ?? `${game} is coming up tomorrow. Check the time, venue, and anything you still need to settle.`,
        href: gameHref,
        tone: "session",
      };
    case "session_completed":
      return {
        title: customTitle ?? "Game wrapped",
        body: customBody ?? `${game} is now saved with its scores and standings.`,
        href: gameHref,
        tone: "play",
      };
    default:
      return fallback;
  }
}

export type NotificationGroup = "Today" | "This week" | "Earlier";

export function notificationGroup(date: Date, now = new Date()): NotificationGroup {
  const calendar = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  if (calendar.format(date) === calendar.format(now)) return "Today";
  if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) return "This week";
  return "Earlier";
}

export function notificationTime(date: Date, group: NotificationGroup) {
  if (group === "Today")
    return new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" }).format(
      date,
    );
  if (group === "This week")
    return new Intl.DateTimeFormat("en-PH", { weekday: "short", timeZone: "Asia/Manila" }).format(date);
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" }).format(date);
}
