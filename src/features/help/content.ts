export type HelpArticle = {
  slug: string;
  category: string;
  title: string;
  summary: string;
  audience: string;
  prerequisites: readonly string[];
  steps: readonly string[];
  outcome: string;
  troubleshooting: readonly string[];
  related: readonly string[];
  sources: readonly string[];
  action?: { href: string; label: string };
  figures?: readonly {
    afterStep: number;
    src: string;
    width: number;
    height: number;
    alt: string;
    caption: string;
  }[];
};

export const helpReviewedAt = "2026-09-05";
export const helpOwner = "Relay product and support";

export const helpCategories = [
  {
    id: "start",
    title: "Start with Relay",
    description:
      "Choose a player or host path, and understand guests, accounts, and Quick Play.",
  },
  {
    id: "account",
    title: "Account and recovery",
    description:
      "Sign in, finish setup, and get back to the game you came for.",
  },
  {
    id: "discovery",
    title: "Find courts and games",
    description:
      "Explore the Philippines directory, Open games, and account Search.",
  },
  {
    id: "joining",
    title: "Join a game",
    description:
      "Shared links, invitations, approval, waitlists, and changing your response.",
  },
  {
    id: "hosting",
    title: "Plan and host",
    description: "Publish, invite, confirm the court, and manage a saved game.",
  },
  {
    id: "play",
    title: "Prepare and play",
    description:
      "Arrival, five rotation modes, live scores, and courtside recovery.",
  },
  {
    id: "payments",
    title: "Payments",
    description:
      "Coordinate external repayment, player shares, proof, and review.",
  },
  {
    id: "together",
    title: "Chat, memories, and repeat games",
    description: "Coordinate the crew, share a Story, and plan the next game.",
  },
  {
    id: "settings",
    title: "Settings and support",
    description:
      "Notifications, profile, installation, privacy, and getting help.",
  },
] as const;

export const helpArticles: readonly HelpArticle[] = [
  {
    slug: "illustrated-game-cycle",
    category: "start",
    title: "A saved game, from plan to repeat: illustrated walkthrough",
    summary:
      "Follow the whole saved-game procedure. Real screenshots currently cover planning and Review only—not a completed saved-game cycle.",
    audience: "New hosts and players",
    prerequisites: [
      "An account to publish and manage a saved game; guests can respond from its shared link. Screenshots use synthetic documentation details, not a real booking or real players.",
      "Capture status, 2026-09-05: planning and authentication handoff observed in the browser. Account creation and all later saved-game stages remain uncaptured pending a user-controlled signup email and any required verification. The separate Quick Play guide shows a completed device-local cycle, not proof of this saved-game lifecycle.",
    ],
    steps: [
      "Plan — captured. Open Plan a game and enter a recognizable name, court, date, and times. The example uses a manual Demo court, not a directory reservation. Complete Players and access with capacity and court count; choose link-only for a directly shared game. Add or skip optional Details.",
      "Review and account handoff — captured. Check the plan, access, price state, and details before publishing. Create account and publish opens signup with a return to the stored draft. Finish signup/verification and onboarding, then review and explicitly publish. This capture stops at signup: it does not show a created account or published game.",
      "Publish and share — source instructions; not captured. After publishing, use Share game or Show QR for public/link-only games. For account invitations, open Players, enter @username, select the correct account, and Invite. Do not distribute a private game's link as a public invitation.",
      "Join — source instructions; not captured. A guest opens the shared link, reads the plan and price, enters a recognizable name, and responds. Read the actual result: Going is confirmed roster capacity; Maybe reserves no spot; Pending waits for a host decision; Waitlisted is not confirmed attendance.",
      "Prepare the court and roster — source instructions; not captured. Confirm the external court arrangement. In Set up Play, review Players, Game options, and Review. At least four eligible players, resolved booking, and an open court are required; fix mode-specific constraints before Start Play. Repayment does not block Play.",
      "Score and finish — source instructions; not captured. Read the assigned teams, enter points or the final score using an authorized account, and choose Finish match. Review teams and the winning score before confirming. Resolve conflicts using the latest saved score; finish every active court before a synchronized next round.",
      "Coordinate repayment — source instructions; not captured. If truly free, set Player price to Free in Game settings → Invite before Play. Otherwise the host creates a collection in Payments, players pay externally and upload their own proof, and host/co-host confirms or requests replacement. No money was transferred and no proof was submitted for this walkthrough.",
      "Recap and repeat — source instructions; not captured. Finish active matches, then the host or designated lead ends the game. Play becomes Recap; Story exports supported factual imagery. The original host chooses Play again, supplies a new date, reviews, and publishes a fresh game. Old responses, booking, payments, chat, and scores are not copied.",
    ],
    outcome:
      "You have one ordered manual for the whole saved-game lifecycle and an honest record of which screens were captured. A complete saved-game browser cycle has NOT yet been demonstrated. For a fully observed local start/score/finish/reset sequence, open Run Quick Play on one device below.",
    troubleshooting: [
      "Do not mistake the demonstrated local Quick Play result for account history, repayment, or a shared-game recap.",
      "If signup requests email confirmation, use a mailbox you control. Never bypass verification or share credentials in a screenshot.",
      "For exact role/lifecycle exceptions and recovery, use the linked task articles rather than assuming a control is available to every viewer.",
    ],
    related: [
      "create-a-game",
      "guest-rsvp",
      "choose-a-play-mode",
      "run-live-play",
      "payments",
      "recap-story",
      "repeat-games",
      "quick-play",
    ],
    sources: [
      "src/features/sessions/create-session-form.tsx",
      "src/features/sessions/rsvp-control.tsx",
      "src/features/matches/actions.ts",
      "src/features/payments/actions.ts",
      "public/help/capture-manifest.json",
    ],
    figures: [
      {
        afterStep: 1,
        src: "/help/plan.webp",
        width: 680,
        height: 610,
        alt: "Plan form with a synthetic game name, manual demo court, date, and start/end times",
        caption:
          "Actual local browser capture, desktop 1440 × 1000, cropped to the Plan fields. Synthetic documentation example; no booking was made.",
      },
      {
        afterStep: 2,
        src: "/help/plan-review.webp",
        width: 692,
        height: 710,
        alt: "Review with four players, one court, link-only access, unset payment, and Create account and publish",
        caption:
          "Actual local browser capture of Review. Payment is not set up, and publication still requires account creation/sign-in. This is not a published game.",
      },
    ],
  },
  {
    slug: "player-start",
    category: "start",
    title: "Your first game as a player",
    summary:
      "Go from a friend's invitation to knowing where to go and whether you have a spot.",
    audience: "Guests and account players",
    prerequisites: [
      "A shared game link or an account invitation. You do not need a group.",
    ],
    steps: [
      "Open the link and read Overview: date, time, court, booking arrangement, price, and approval policy.",
      "Choose Going, Maybe, or Can’t go. If you are a guest, enter a recognizable name. Read the saved status before making travel plans.",
      "Use Players for the roster, Chat for coordination, and Payments for any external repayment instructions. Check in when you arrive, then open Play for assignments.",
      "After the host ends the game, return to Play for Recap and Story for sharing. To keep a guest response in account history, use Keep this game in Relay from the original browser.",
    ],
    outcome:
      "You have an explicit response and know the next action. Only Going is a confirmed roster spot; it is not a venue reservation.",
    troubleshooting: [
      "Awaiting approval and Waitlisted are not confirmed attendance. Ask the host about timing, not Relay support about approval.",
      "If a link is unavailable, confirm it with the host. Private games require authorized account access.",
    ],
    related: ["guest-rsvp", "rsvp-status", "payments", "arrival"],
    sources: [
      "src/features/sessions/rsvp-control.tsx",
      "src/components/shared/session-tabs.ts",
    ],
    action: { href: "/games/open", label: "Explore Open games" },
  },
  {
    slug: "host-start",
    category: "start",
    title: "Your first game as a host",
    summary:
      "Publish one plan, gather the crew, and run Play without making payments a setup gate.",
    audience: "New hosts",
    prerequisites: [
      "A proposed court and schedule. Publishing a saved game requires an account; planning does not.",
    ],
    steps: [
      "Find a court or enter one manually in Plan a game. Confirm availability and book externally if the venue requires it.",
      "Complete Plan, Players and access, optional Details, and Review. Sign in or create an account from Review, then review and publish the restored draft.",
      "Share the link or invite account players. Watch requests and waitlists in Players. In Game settings → Invite, explicitly set Player price to Free if true, or arrange repayment in Payments; Public visibility alone does not put a game in Open games.",
      "Confirm the court arrangement, choose Set up Play, check arrivals, choose a rotation, and start from Review. Finish active matches before ending the game.",
      "Use Recap to review results, Story to share, and Play again to start a fresh game with a new date.",
    ],
    outcome:
      "One saved game carries the plan, roster, courtside play, repayment, and memories. Booking and money movement remain outside Relay.",
    troubleshooting: [
      "You need at least four eligible players and a resolved court arrangement to start Play. Collecting payment is independent.",
      "Do not create a group just to start; save the crew later if you play regularly.",
    ],
    related: [
      "create-a-game",
      "public-discovery",
      "choose-a-play-mode",
      "repeat-games",
    ],
    sources: [
      "src/features/sessions/create-session-form.tsx",
      "src/features/sessions/readiness.ts",
    ],
    action: { href: "/games/new", label: "Plan a game" },
  },
  {
    slug: "relay-basics",
    category: "start",
    title: "Guests, accounts, and the game workspace",
    summary: "Understand what Relay saves and where each task belongs.",
    audience: "Everyone",
    prerequisites: [
      "None. Help, courts, Open games, planning, and Quick Play can be read or tried before sign-in.",
    ],
    steps: [
      "Choose a saved game for a durable shared plan and account history. Choose Quick Play only for temporary play on one browser.",
      "Read a public or link-only shared game without an account. RSVP by name to participate as a guest; use an account for cross-game history and account invitations. Private games need authorized access.",
      "Inside a game, use Overview for the plan; Players for roster and arrival; Play (later Recap) for courts and results; Chat for coordination; Payments for repayment; Story for images and memories.",
      "Use Home and Games for account invitations and saved games. Game settings changes a game; account Settings changes your own preferences. Replay the app tour after signing in if you need orientation.",
    ],
    outcome:
      "You can distinguish a court listing, a saved game, a recurring group, and temporary Quick Play. Relay does not reserve courts, transfer money, or assign professional ratings.",
    troubleshooting: [
      "Mobile game tabs replace the global bottom navigation. Leave the workspace through its navigation or return to Home.",
      "Organizer authority, RSVP, check-in, live availability, and payment status are separate. A co-host does not automatically occupy a playing spot.",
    ],
    related: ["quick-play", "guest-rsvp", "organizers", "settings-profile"],
    sources: [
      "PRODUCT.md",
      "src/components/shared/app-nav.tsx",
      "src/features/sessions/viewer.ts",
    ],
    action: { href: "/home?tour=1", label: "Replay app tour (account)" },
  },
  {
    slug: "quick-play",
    category: "start",
    title: "Run Quick Play on one device",
    summary:
      "Set up temporary players, courts, rotations, and scoring without an account.",
    audience: "Anyone courtside",
    prerequisites: [
      "One browser/device and at least four players. Quick Play supports up to 24 players and six courts, with four players per selected court.",
    ],
    steps: [
      "Open Quick Play and enter distinct player names and the number of courts.",
      "Choose a mode and complete any fixed pairs or timer options shown. Review the setup before starting.",
      "Use the court assignments and score controls on this device. Finish matches to advance; expand a scoreboard for courtside viewing.",
      "Return in the same browser to restore valid stored play. Use the end/reset confirmation when you are done.",
    ],
    outcome:
      "Play is stored locally in that browser, not as a shareable Relay game. It cannot be transferred into account history or another device.",
    troubleshooting: [
      "Clearing browser data, private browsing, or invalid storage can remove the local game. There is no account backup or import conversion.",
      "For invitations, chat, payments, and durable history, create a separate saved game instead. Do not assume cold-start offline navigation will work.",
    ],
    related: ["create-a-game", "rotation-modes", "install-offline"],
    sources: [
      "src/features/matches/quick-play-session.ts",
      "src/features/matches/public-quick-play.tsx",
    ],
    action: { href: "/play", label: "Open Quick Play" },
    figures: [
      {
        afterStep: 2,
        src: "/help/quick-play-review.webp",
        width: 692,
        height: 600,
        alt: "Quick Play Review lists four Demo players, one court, Paddle Stack, and This device only",
        caption:
          "Actual desktop browser capture, 2026-09-05. Four synthetic names were entered through the real setup. This is temporary Quick Play, not a saved game.",
      },
      {
        afterStep: 3,
        src: "/help/quick-play-finish.webp",
        width: 448,
        height: 198,
        alt: "Finish Court 1 confirmation showing Demo Alex and Demo Bea winning 3–1 over Demo Casey and Demo Drew",
        caption:
          "The demonstration used real point controls to enter 3–1, then confirmed Finish match. This short score demonstrates the interface, not a regulation match. Court 1 was closed before finishing so it would not receive another assignment.",
      },
      {
        afterStep: 4,
        src: "/help/quick-play-end.webp",
        width: 448,
        height: 198,
        alt: "End Quick Play confirmation warns that local recap and completed results will be removed",
        caption:
          "After the match appeared in completed results and standings, End Quick Play opened this warning. End and start over was confirmed and the browser returned to the four empty player fields. Only this device-local cycle was completed.",
      },
    ],
  },
  {
    slug: "account-setup",
    category: "account",
    title: "Create an account and finish setup",
    summary:
      "Confirm your email, choose an identity friends recognize, and return to your task.",
    audience: "New account players and hosts",
    prerequisites: [
      "Access to your email inbox. If you came from a game or draft, start authentication from that page to preserve its destination.",
    ],
    steps: [
      "Choose Sign up and complete the account form. Continue with Google is an alternative only when it is offered.",
      "If Relay shows Check your inbox, open the confirmation email. Check spam and the address you entered. The confirmation screen states the link expiry.",
      "Complete Identity with your recognizable name and an available username. Profile details are optional: add or skip photo, city, experience, dominant hand, and About you.",
      "Review Confirm and edit anything incorrect before saving. At All set, follow or skip the tour. Use Open saved game when offered, or return to the intended draft and explicitly publish it.",
    ],
    outcome:
      "Your account has a usable player identity. Signing up alone does not publish a draft or confirm a pending RSVP.",
    troubleshooting: [
      "Correct the inline username/name errors rather than using an unrecognizable placeholder.",
      "If confirmation or an alternate login returns you to Home, reopen your original game link. Draft restoration needs the same browser and the resume link in the related article.",
      "Never send passwords, confirmation links, or codes to support.",
    ],
    related: [
      "account-recovery",
      "resume-draft",
      "keep-guest-game",
      "settings-profile",
    ],
    sources: [
      "src/features/auth/auth-entry.tsx",
      "src/features/onboarding/setup-wizard.tsx",
      "src/features/auth/destination.ts",
    ],
    action: { href: "/signup", label: "Create an account" },
  },
  {
    slug: "account-recovery",
    category: "account",
    title: "Recover sign-in or reset a password",
    summary:
      "Use the account recovery path without exposing credentials or losing sight of your original game.",
    audience: "Account holders or people blocked during signup",
    prerequisites: [
      "Access to the email address used for Relay. Keep the original game link separately.",
    ],
    steps: [
      "Check the email address and the error shown on Log in. Use the same sign-in method you used for the account when it is available.",
      "For a forgotten password, open Reset your password, enter your account email, and follow the secure email link to choose a new password. A reset-request confirmation does not reveal whether an account exists.",
      "If already signed in, open Settings → Account → Change password. Follow the form requirements and any request to sign in again.",
      "After recovery, reopen the original game. If an expired confirmation link or missing email still blocks you, contact support with the route, approximate time, and a description of the error—not the secure link.",
    ],
    outcome:
      "You regain account access or have a safe escalation path. Help remains readable even when you cannot complete setup.",
    troubleshooting: [
      "Check spam and use the latest recovery email; request another reset when needed. Provider availability and email delivery can vary.",
      "A suspended-account or forced-password-change screen must be resolved through its stated path. Reading Help does not bypass account restrictions.",
    ],
    related: ["account-setup", "keep-guest-game", "support"],
    sources: [
      "src/app/forgot-password/page.tsx",
      "src/features/auth/session.ts",
      "src/app/(app)/settings/page.tsx",
    ],
    action: { href: "/forgot-password", label: "Reset your password" },
  },
  {
    slug: "find-a-court",
    category: "discovery",
    title: "Find and compare a Philippines court",
    summary:
      "Compare practical details and carry a selected court into a new game.",
    audience: "Visitors, players, and hosts",
    prerequisites: [
      "None. Location access is optional; directory coverage is Philippines only.",
    ],
    steps: [
      "Open Courts and search by court or location. Narrow results using the setting, parking, starting-price, hours, and other available filters.",
      "Use my location if you want on-device nearest-first sorting, or search manually. Switch between results and map; select a row or pin.",
      "Read court details, access restrictions, operating hours, listed prices, verification date, and external booking information. Not listed is missing information, not a promise that a facility is unavailable.",
      "Use Plan a game here from the detail page to prefill the court and address. Confirm access, availability, and reservation directly with the venue.",
    ],
    outcome:
      "You have a court choice and a prefilled plan, not a reservation. Operating hours and verification do not prove a court is free at your chosen time.",
    troubleshooting: [
      "If location permission fails, search by city or neighborhood. Location sorting does not continuously track you.",
      "Restricted courts can appear in the directory; respect member, resident, school, or invitation rules. Suggest an update when public evidence is outdated.",
    ],
    related: ["court-suggestions", "create-a-game", "court-arrangement"],
    sources: [
      "src/features/venues/court-details.tsx",
      "src/features/venues/court-finder.tsx",
      "src/app/privacy/page.tsx",
    ],
    action: { href: "/courts", label: "Open Courts" },
  },
  {
    slug: "court-suggestions",
    category: "discovery",
    title: "Suggest a court or correct a listing",
    summary:
      "Send a missing Philippines court or an evidence-backed correction for review.",
    audience: "Signed-in players",
    prerequisites: [
      "An account and public source evidence for a Philippines location.",
    ],
    steps: [
      "Choose Suggest a court in Courts, or Suggest an update on a court detail page.",
      "Choose a new court or a correction to an existing listing. Supply the location and the practical facts you can substantiate, with public source links.",
      "Review and submit. Return to your submission history to read its review status and any resolution note.",
    ],
    outcome:
      "Your suggestion is private pending review. The public directory changes only after verification; an outcome notification can explain applied, rejected, or duplicate submissions.",
    troubleshooting: [
      "Correct marked location or evidence fields. Do not send private game content as listing evidence.",
      "If a duplicate, unresolved-request limit, or rate limit is shown, check your existing submission or wait rather than sending repeated copies.",
    ],
    related: ["find-a-court", "notifications", "support"],
    sources: [
      "src/features/venues/venue-submission-form.tsx",
      "src/features/venues/actions.ts",
      "src/features/venues/venue-submission-history.tsx",
    ],
    action: { href: "/courts", label: "Open Courts" },
  },
  {
    slug: "find-open-games",
    category: "discovery",
    title: "Find an Open game or use Search",
    summary:
      "Find a plan with a disclosed price and understand who can join it.",
    audience: "Visitors and account players",
    prerequisites: [
      "No account is needed to browse Open games. Global Search and personal history require an account.",
    ],
    steps: [
      "Open Open games and filter by date/time, court or location, spots available, and price. Free is explicit; an unspecified amount is not Free.",
      "Read the host, schedule, court, player price, capacity, and approval policy. Open the game before deciding to join.",
      "Visitors open the shared link and can respond by name where allowed. Account players use their account identity and retain the game in their schedule.",
      "For authorized saved games, people, groups, and courts, open account Search. Type a term; results update without requiring Enter. Choose the appropriate result group.",
    ],
    outcome:
      "You reach a relevant game with enough plan and price context to choose a response. Search does not expose unauthorized private or link-only games.",
    troubleshooting: [
      "Broaden or clear filters when there are no results. Available spots can change before your response is saved.",
      "Public games with unset price, ended games, link-only games, and private games do not qualify for Open games. Ask the host for an invitation where needed.",
    ],
    related: ["guest-rsvp", "rsvp-status", "public-discovery"],
    sources: [
      "src/app/games/open/page.tsx",
      "src/features/sessions/session-access.ts",
      "src/features/search",
    ],
    action: { href: "/games/open", label: "Browse Open games" },
  },
  {
    slug: "guest-rsvp",
    category: "joining",
    title: "RSVP from a shared link without an account",
    summary:
      "Join by name, read the actual outcome, and update your response from the same browser.",
    audience: "Guest players",
    prerequisites: [
      "A public or link-only game accepting responses. Private games require an authorized account invitation.",
    ],
    steps: [
      "Open the host’s shared link and read the plan, cost, roster, and booking status.",
      "Enter your recognizable name and optionally your playing experience. Choose Going, Maybe, or Can’t go, then confirm.",
      "Read the saved state: Going, Awaiting approval, Waitlisted, Maybe, or Can’t go. Approval and capacity can change the outcome of a Going request.",
      "Keep the link and return in the same browser to update your response without re-entering your name. Optionally choose Keep this game in Relay after saving.",
    ],
    outcome:
      "Relay remembers a response for this game using a browser-bound guest identity. Registration is not required to save it.",
    troubleshooting: [
      "A guest name is not a password and does not restore identity on another device. Do not enter another response to try to recover an existing spot.",
      "A closed or locked roster may block changes; confirm with the host. Pending is not a participant state for collaboration.",
    ],
    related: ["keep-guest-game", "rsvp-status", "game-access"],
    sources: [
      "src/features/sessions/rsvp-control.tsx",
      "src/features/sessions/actions.ts",
      "src/features/sessions/viewer.ts",
    ],
  },
  {
    slug: "keep-guest-game",
    category: "joining",
    title: "Keep a guest response in your account",
    summary:
      "Attach the response you already saved rather than creating a second roster entry.",
    audience: "Guests creating or signing into an account",
    prerequisites: [
      "The original browser with its guest cookie and the original shared link. Save an RSVP first.",
    ],
    steps: [
      "Reopen the game in the browser where you responded. Confirm Relay recognizes your guest name and response.",
      "Choose Keep this game in Relay or Sign in from the saved-response area.",
      "Finish authentication and any required account setup. Open saved game returns you to the game; the existing guest response is attached to your account.",
    ],
    outcome:
      "The same roster response becomes account-linked and can appear in account history. Attaching it does not turn Maybe, Pending, or Waitlisted into Going.",
    troubleshooting: [
      "Canceling signup does not require a new RSVP; return to the original browser and link.",
      "If you lost the guest cookie or changed devices before attaching, Relay has no name-based self-service recovery. Ask the host to resolve the old roster entry before responding again.",
      "If authentication lands on Home, reopen the original link and check your status. Never email or share a guest token.",
    ],
    related: ["account-setup", "account-recovery", "guest-rsvp"],
    sources: [
      "src/features/auth/destination.ts",
      "src/features/sessions/viewer.ts",
      "src/features/sessions/rsvp-control.tsx",
    ],
  },
  {
    slug: "rsvp-status",
    category: "joining",
    title: "Invitations, approval, waitlists, and changing your response",
    summary:
      "Tell a saved response from a confirmed spot, and leave without confusing attendance with RSVP.",
    audience: "Guests and account players",
    prerequisites: [
      "Access to the game. Account invitations appear on Home and Games → Invites.",
    ],
    steps: [
      "Open your invitation or game. Read the plan and choose Going, Maybe, or Can’t go. An answered account invitation leaves Invites and appears with its response in Upcoming.",
      "Check the result. Going holds roster capacity. Maybe is tentative and reserves no spot. Awaiting approval means the host must decide. Waitlisted means there is no confirmed spot yet.",
      "To change plans, reopen Overview and update your response while responses are allowed. Use Can’t go or the available leave action rather than changing check-in to imply cancellation.",
      "Recheck after a host decision or waitlist movement. Approval is considered before capacity for a new Going request; an approved player can still be waitlisted.",
    ],
    outcome:
      "Your stated intent is saved separately from physical arrival, play availability, and payments. When a Going player leaves, the next waitlisted player can be promoted.",
    troubleshooting: [
      "Do not travel on the assumption that a pending request will be approved. Ask the host if you need a decision.",
      "The host may close responses or lock the roster; live-game restrictions can block leaving or changing participation. Contact the host rather than making duplicate entries.",
    ],
    related: ["guest-rsvp", "manage-players", "arrival", "game-access"],
    sources: [
      "src/features/sessions/roster.ts",
      "src/features/sessions/roster-management.ts",
      "src/app/(app)/home/page.tsx",
    ],
  },
  {
    slug: "game-access",
    category: "joining",
    title: "Troubleshoot a private link, closed roster, or unavailable game",
    summary:
      "Understand why reading a game and participating in it have different requirements.",
    audience: "All game viewers",
    prerequisites: ["The host’s current link or account invitation."],
    steps: [
      "Check that the full link was copied and ask the host whether the game is still available.",
      "For a private game, sign into the invited account and open the invitation. A private game does not become public because someone forwards a link.",
      "If the plan opens but RSVP is closed, read the lifecycle and roster message. Ask the organizer about reopening responses or your existing roster entry.",
      "If only some actions are unavailable, check your saved RSVP and identity. Going, Maybe, and Waitlisted can participate in chat; Pending and read-only link viewers cannot. Scoring has stricter rules.",
    ],
    outcome:
      "You can separate an access problem from a full game, pending request, closed roster, or read-only action.",
    troubleshooting: [
      "A different browser may not recognize a guest. Use the original browser or the account to which you attached the response.",
      "Cancelled games restrict changes; completed games are not new-join invitations. If an authorized game still cannot open, send safe reproduction details to support.",
    ],
    related: [
      "keep-guest-game",
      "visibility-sharing",
      "run-live-play",
      "support",
    ],
    sources: [
      "src/features/sessions/session-access.ts",
      "src/features/sessions/queries.ts",
      "src/features/sessions/viewer.ts",
    ],
  },
  {
    slug: "create-a-game",
    category: "hosting",
    title: "Create, review, and publish a saved game",
    summary:
      "Plan publicly and create durable account-owned game data only at publication.",
    audience: "Hosts",
    prerequisites: [
      "A court or manual venue, future schedule, and intended capacity. An account is required to publish.",
    ],
    steps: [
      "Open Plan a game. In Plan, enter the game name, court/address, date, and start/end times.",
      "In Players and access, set player capacity, court count, visibility, and approval policy. The form supports 2–40 players and 1–20 courts; actual Play has additional eligibility requirements.",
      "Use optional Details for color, player notes, and booking information, or continue without them. Payment starts unset.",
      "Read Review and use Edit to correct an earlier stage. Signed-out hosts choose the authentication option here; return to the restored Review and explicitly publish.",
      "After publication, use Share game, Show QR, or Preview shared link for public/link-only games. Private games direct you to account invitations instead.",
    ],
    outcome:
      "You own a saved game and can invite players. Selecting Public does not guarantee Open games listing until a price is disclosed.",
    troubleshooting: [
      "Fix marked fields at the indicated stage. Do not assume every keystroke is automatically saved; the anonymous draft is stored at authentication handoff.",
      "General plan/access edits lock when Play starts. Review the date, time, court count, and access policy before starting.",
    ],
    related: [
      "resume-draft",
      "visibility-sharing",
      "public-discovery",
      "edit-end-game",
    ],
    sources: [
      "src/features/sessions/create-session-form.tsx",
      "src/features/sessions/domain.ts",
      "src/app/games/new/page.tsx",
    ],
    action: { href: "/games/new", label: "Plan a game" },
  },
  {
    slug: "resume-draft",
    category: "hosting",
    title: "Resume a draft after signing in",
    summary:
      "Return to Review in the browser that handed your draft to authentication.",
    audience: "Hosts who planned while signed out",
    prerequisites: [
      "A draft stored when you selected login/signup from Review, and access to that same browser’s storage.",
    ],
    steps: [
      "Finish authentication from the draft’s Review step rather than using a generic login link elsewhere.",
      "When returned to the draft, read the restored Review and confirm the date, court, access, and optional details.",
      "If you reached Home instead, use Resume saved draft below in the same browser. Publish only after reviewing the restored values.",
    ],
    outcome:
      "A readable stored draft returns to Review. It is not a published game until you choose the publish action.",
    troubleshooting: [
      "Relay does not currently guarantee autosave before authentication handoff. Refreshing an earlier stage can lose work.",
      "Cleared/blocked storage, another browser, or an invalid saved draft can open a fresh form. There is no cloud draft recovery; re-enter the plan if restoration is unavailable.",
    ],
    related: ["create-a-game", "account-setup", "account-recovery"],
    sources: ["src/features/sessions/create-session-form.tsx"],
    action: { href: "/games/new?resume=draft", label: "Resume saved draft" },
  },
  {
    slug: "visibility-sharing",
    category: "hosting",
    title: "Choose visibility, share a link or QR, and invite players",
    summary:
      "Match access to the intended audience instead of treating every link as public.",
    audience: "Hosts and co-hosts",
    prerequisites: [
      "A saved game. Structural access settings must be set before Play starts.",
    ],
    steps: [
      "Choose Public for potential Open games discovery, Link-only for a game shared directly, or Private for invited/authorized account access.",
      "For Public or Link-only, choose Share game to share or copy the canonical link. Show QR supports scanning and a downloadable image; keep the plain code readable when printing.",
      "To invite account players, open Players, type @username in Guest name or Relay username, select the matching account, and choose Invite. Plain names add guests instead. For Private games, use account invitations rather than distributing a public link or QR.",
      "Ask players to respond to the invitation; being invited or being made co-host is not the same as Going.",
    ],
    outcome:
      "Players receive an access path suitable for the game. Public and link-only shared links can be forwarded; do not treat them as secret storage.",
    troubleshooting: [
      "Private games intentionally do not expose public QR/link prompts. Invite the correct account if a player cannot open one.",
      "If native sharing is unavailable, copy the link. Public listing also needs a disclosed price and eligible lifecycle.",
    ],
    related: ["public-discovery", "game-access", "organizers", "privacy"],
    sources: [
      "src/features/sessions/session-access.ts",
      "src/app/(app)/games/[id]/settings/page.tsx",
      "src/features/sessions/create-session-form.tsx",
      "src/features/sessions/player-roster-controls.tsx",
    ],
  },
  {
    slug: "public-discovery",
    category: "hosting",
    title: "Why isn’t my public game in Open games?",
    summary:
      "Publication, Public visibility, and discovery eligibility are separate milestones.",
    audience: "Hosts",
    prerequisites: ["A published saved game with Public visibility."],
    steps: [
      "Check Game settings for Public visibility. Link-only and Private games are not directory listings.",
      "Before Play, open Game settings → Invite → Player price, select Free if players owe nothing, and save. For a paid game, create a repayment collection in Payments. Unset payment is never treated as Free.",
      "Check the game is published or live and has not ended. Then open Open games and clear restrictive filters to find it.",
    ],
    outcome:
      "An eligible public game has a disclosed player price before a discoverer RSVPs. For multiple collections, Relay displays the highest aggregate assigned player total, not necessarily every player’s exact share.",
    troubleshooting: [
      "Publishing a game does not automatically set up payment. If the amount is still unset, the shared link can work while discovery remains unavailable.",
      "If eligibility looks correct, check filters and current game state before reporting a missing listing. Do not change the amount to Free unless players genuinely owe nothing.",
    ],
    related: ["host-payments", "visibility-sharing", "find-open-games"],
    sources: [
      "src/features/sessions/session-access.ts",
      "src/features/payments/domain.ts",
      "src/features/sessions/session-settings-form.tsx",
    ],
  },
  {
    slug: "manage-players",
    category: "hosting",
    title: "Manage requests, capacity, and the waitlist",
    summary:
      "Keep participation decisions in Players, separate from organizer authority.",
    audience: "Hosts and co-hosts",
    prerequisites: [
      "Organizer access to the saved game. Some roster changes are restricted once Play begins or responses are locked.",
    ],
    steps: [
      "Open Players and inspect join requests alongside current Going players and the ordered waitlist.",
      "Approve or decline requests with roster context. An approval fills an available spot or becomes Waitlisted if capacity is full.",
      "Use @username and select an account to Invite, or enter a plain name to Add a guest. Use the removal controls carefully and review the ordered waitlist. Adjust capacity in the game’s settings before Play; it cannot drop below the Going count.",
      "Close/lock responses when appropriate and tell the crew why. Check Players again after changes rather than assuming a notification alone proves attendance.",
    ],
    outcome:
      "The roster states reflect actual decisions, with capacity and waitlist promotion handled by Relay. Becoming an organizer is a separate action.",
    troubleshooting: [
      "A departing Going player promotes the next waitlisted player. Review the new roster before promising the freed spot to someone else.",
      "If another organizer changed the roster, reload and decide from the saved state. Do not work around live assignment restrictions by creating duplicate players.",
    ],
    related: ["rsvp-status", "organizers", "arrival"],
    sources: [
      "src/features/sessions/roster-management.ts",
      "src/features/sessions/roster.ts",
      "src/features/sessions/actions.ts",
    ],
  },
  {
    slug: "organizers",
    category: "hosting",
    title: "Add co-hosts and delegate game completion",
    summary:
      "Share management responsibility without automatically adding someone to Play.",
    audience: "Original host; co-hosts can view their authority",
    prerequisites: [
      "A saved game before or during Play and the co-host’s Relay account/username.",
    ],
    steps: [
      "Open Game settings → Organizers as the original host.",
      "Add a Relay member by username or give an existing account player Co-host access. Remove Co-host access there when needed.",
      "Choose a Lead organizer if a co-host should be allowed to end live Play. Delegating completion does not transfer ownership or deletion rights.",
      "Ask each organizer who wants to play to RSVP separately. Check their Going/arrival state before including them in rotations.",
    ],
    outcome:
      "Co-hosts can manage contextual game tasks without occupying capacity merely because of their role. Only the original host creates expense collections or deletes the game.",
    troubleshooting: [
      "Only the original host can change organizer authority. Completed/cancelled settings are view-only.",
      "Live scoring has an additional constraint: the host can score any court; a co-host must also be Going. Other signed-in Going players score only an assigned court.",
    ],
    related: ["manage-players", "run-live-play", "edit-end-game"],
    sources: [
      "src/features/sessions/organizer-actions.ts",
      "src/features/auth/permissions.ts",
      "src/features/matches/actions.ts",
    ],
  },
  {
    slug: "court-arrangement",
    category: "hosting",
    title: "Confirm the court arrangement",
    summary:
      "Record an external booking or explicitly say no booking is needed.",
    audience: "Hosts and co-hosts",
    prerequisites: [
      "Knowledge of the venue’s actual access and reservation requirements. Relay cannot book it for you.",
    ],
    steps: [
      "Contact or use the venue’s external booking service to confirm your time and access.",
      "In Game settings → Booking, record the relevant status, reference, amount, or notes. Keep booking facts separate from repayment collections.",
      "When Set up Play asks Is the court ready?, choose Booking confirmed or No booking needed only when true. Choose Not yet if unresolved.",
      "Recheck the arrangement if the court changes. Once resolved, proceed to the Players, Game options, and Review setup stages.",
    ],
    outcome:
      "Relay knows whether the court arrangement is ready for Play. Payment setup or repayment completion is not required to start.",
    troubleshooting: [
      "A court listing, game publication, or payment proof does not confirm a reservation.",
      "If booking changes during setup, answer the readiness prompt again. Do not choose No booking needed merely to bypass an unresolved booking.",
    ],
    related: ["find-a-court", "choose-a-play-mode", "host-payments"],
    sources: [
      "src/features/sessions/court-booking-gate.tsx",
      "src/features/sessions/readiness.ts",
      "src/features/sessions/actions.ts",
    ],
  },
  {
    slug: "edit-end-game",
    category: "hosting",
    title: "Edit, cancel, complete, or delete a game",
    summary:
      "Choose the lifecycle action that matches what happened, and respect locked history.",
    audience: "Hosts and authorized organizers",
    prerequisites: [
      "Organizer access. Deletion is host-only; live completion is for the host or designated lead organizer.",
    ],
    steps: [
      "For plan changes before Play, open Edit game / Game settings. During Play, structural plan/access controls are locked, but player notes and booking details remain editable.",
      "If a published game will not happen, open Game settings → Plan → Cancel game before Play. Choose a reason, add the required note when Other is selected, and confirm. The roster can still read the plan and reason. Coordinate any external refunds separately.",
      "If play happened, finish all active matches, then end the game from Play. The same Play destination becomes Recap.",
      "Deletion currently lives on the older More page: from your signed-in game Overview address, append /more. As the original host, find Danger zone → Delete game, type the exact game title, and confirm only if you intend permanent removal of the roster, payments, chat, matches, scores, and memories. This cannot be undone.",
    ],
    outcome:
      "Cancelled, completed, and deleted mean different things. Completed/cancelled Game settings are view-only; score correction is a separate controlled action in Play/Recap.",
    troubleshooting: [
      "An active match blocks completion. Finish it or use an appropriate organizer match-cancellation control before ending.",
      "Completion does not itself close repayment; cancellation closes payment changes. Relay does not refund or move money.",
      "Do not delete a game as a recovery step for a scoring or connection error. Ask support first if durable records may be at risk.",
    ],
    related: [
      "score-corrections",
      "host-payments",
      "recap-story",
      "organizers",
    ],
    sources: [
      "src/features/sessions/cancel-session-control.tsx",
      "src/features/sessions/delete-session-control.tsx",
      "src/app/(app)/games/[id]/more/page.tsx",
      "src/features/matches/actions.ts",
      "src/features/sessions/actions.ts",
    ],
  },
  {
    slug: "arrival",
    category: "play",
    title: "Check in, take a break, or return to the queue",
    summary:
      "Separate Going from being physically ready for a court assignment.",
    audience:
      "Going account/guest players; hosts and co-hosts managing arrivals",
    prerequisites: [
      "A Going roster spot. An organizer can update players; a player can update their own availability.",
    ],
    steps: [
      "Before Play, mark Here / Not here when you arrive. Hosts can review the crew’s arrivals.",
      "With no check-ins and nobody marked unavailable, all Going players remain eligible. Once attendance is explicit, only checked-in players enter the initial rotation.",
      "During Play, use the availability control to take a break. Waiting players leave the queue immediately; active players finish their current match first.",
      "When ready again or arriving late, return to availability. A nonactive returning player joins the queue’s end.",
    ],
    outcome:
      "Play reflects who can take a court without changing RSVP, past attendance, completed results, or standings.",
    troubleshooting: [
      "Not here or taking a break does not mean Can’t go and does not free a roster spot. Update RSVP separately when allowed.",
      "If the crew seems too small to start, review check-ins and unavailable markers rather than assuming every Going player is eligible.",
    ],
    related: ["choose-a-play-mode", "rsvp-status", "live-recovery"],
    sources: [
      "src/features/sessions/readiness.ts",
      "src/features/matches/availability.ts",
      "src/features/sessions/actions.ts",
    ],
  },
  {
    slug: "choose-a-play-mode",
    category: "play",
    title: "Set up Play and resolve start requirements",
    summary:
      "Review arrivals, court readiness, and mode rules before creating the first assignments.",
    audience: "Hosts and co-hosts of saved games",
    prerequisites: [
      "A game before Play, at least four eligible players, an open court, and Booking confirmed or No booking needed. Payments are independent.",
    ],
    steps: [
      "Choose Set up Play. Resolve Is the court ready? if it appears.",
      "In Players, check who is present and available. In Game options, choose the rotation, open courts, partner rules, and any available timer.",
      "Complete fixed pairs if your mode requires them. Pair every Going player once where required; at least two complete pairs must be present.",
      "Read Review, correct any inline requirement, then choose Start Play. If roster/court changes invalidate review, review the fresh setup before retrying.",
    ],
    outcome:
      "The first assignments are created only after Relay rechecks organizer authority, lifecycle, booking, arrivals, courts, and mode constraints.",
    troubleshooting: [
      "Court Climb needs at least two open courts and exactly four eligible players per open court. Choose another mode for uneven attendance.",
      "Saved Paddle Stack has no shared round timer. Round-based timers are optional, 5–60 minutes, and never finish scores automatically.",
      "If another organizer already started, reload and open the live game instead of retrying setup.",
    ],
    related: [
      "rotation-modes",
      "arrival",
      "court-arrangement",
      "run-live-play",
    ],
    sources: [
      "src/features/matches/actions.ts",
      "src/features/sessions/readiness.ts",
      "src/features/matches/play-setup-wizard.tsx",
    ],
  },
  {
    slug: "rotation-modes",
    category: "play",
    title: "Choose between the five rotation modes",
    summary:
      "Choose for attendance and the kind of game you want—not for a competitive rating.",
    audience: "Hosts, co-hosts, and Quick Play operators",
    prerequisites: [
      "At least four eligible players; some modes need complete pairs or multiple full courts.",
    ],
    steps: [
      "Choose Paddle Stack for drop-ins and changing attendance. Queue rules determine who stays and who rotates, with mixed or fixed partners.",
      "Choose Mix It Up for partner variety and fair rests, or Balanced Mix for fair rests followed by teams balanced using self-described experience.",
      "Choose Court Climb for full multiple courts with winners moving toward Court 1 and partners splitting, or Team Round Robin for complete fixed pairs playing each other once.",
      "Open the related mode article for requirements, then review the setup before starting.",
    ],
    outcome:
      "You choose a rotation suited to the actual roster. Self-described experience and session standings are not professional ratings.",
    troubleshooting: [
      "Do not force a mode that does not fit the number of arrivals or open courts. Resolve the displayed requirement or choose a different mode.",
      "Round-based modes wait for every active court to finish before the next round.",
    ],
    related: [
      "paddle-stack",
      "mix-it-up",
      "balanced-mix",
      "court-climb",
      "team-round-robin",
    ],
    sources: [
      "src/features/matches/play-mode-options.ts",
      "src/features/matches/rotation.ts",
    ],
  },
  {
    slug: "paddle-stack",
    category: "play",
    title: "Use Paddle Stack for drop-in play",
    summary:
      "Run a queue that adapts to changing attendance and your preferred stay-on rule.",
    audience: "Hosts, co-hosts, and Quick Play operators",
    prerequisites: [
      "Four or more eligible players and an open court. Fixed-partner play requires complete pairs.",
    ],
    steps: [
      "Select Paddle Stack in Game options.",
      "Choose Adaptive, Four-off, or Winners-stay. Adaptive uses winners-stay with a short queue and four-off when it is busy; Four-off returns all four players.",
      "Choose mixed partners or Keep pairs together, completing the pair builder if needed.",
      "Review and start. Finish each match to rotate that court; winners-stay is limited to two matches, with mixed winners splitting sides while fixed pairs stay together.",
    ],
    outcome:
      "Waiting players enter in queue order and each court can rotate as its match ends. Saved Paddle Stack does not use a shared round timer.",
    troubleshooting: [
      "Review the waiting queue before calling the next players. A returning player goes to the end, not straight onto court.",
      "If pairs are incomplete, fix the pair setup or choose mixed partners before starting.",
    ],
    related: ["rotation-modes", "arrival", "run-live-play"],
    sources: [
      "src/features/matches/rotation.ts",
      "src/features/matches/actions.ts",
    ],
  },
  {
    slug: "mix-it-up",
    category: "play",
    title: "Use Mix It Up for partner variety",
    summary: "Rotate the crew together for social games and fair rests.",
    audience: "Hosts, co-hosts, and Quick Play operators",
    prerequisites: [
      "At least four eligible players and enough arrivals for your open courts.",
    ],
    steps: [
      "Select Mix It Up in Game options and review court/player requirements.",
      "Optionally choose the shared round timer where offered, then review and start.",
      "Finish the match on every active court. Advance to the next round after all courts are complete and read the new teams and resting players.",
    ],
    outcome:
      "Relay varies partners and opponents while distributing rests. The timer signals elapsed time; it does not decide the winner.",
    troubleshooting: [
      "An unfinished active court blocks the next synchronized round. Check every court, not just yours.",
      "If attendance changes, use availability rather than altering RSVP to take a short break.",
    ],
    related: ["balanced-mix", "arrival", "run-live-play"],
    sources: [
      "src/features/matches/play-mode-options.ts",
      "src/features/matches/rotation.ts",
      "src/features/matches/actions.ts",
    ],
  },
  {
    slug: "balanced-mix",
    category: "play",
    title: "Use Balanced Mix for mixed experience",
    summary:
      "Prioritize fair rests, then balance teams using players’ self-described experience.",
    audience: "Hosts, co-hosts, and Quick Play operators",
    prerequisites: [
      "At least four eligible players. Account experience comes from the player’s profile; guests can provide experience with RSVP.",
    ],
    steps: [
      "Review the available player experience information; account players update their own profile rather than supplying a separate game rating.",
      "Select Balanced Mix, review courts and any timer, and start from Review.",
      "Finish every active court before the next round. Read fresh assignments instead of keeping last round’s teams.",
    ],
    outcome:
      "Relay attempts balanced recreational matches after fair rests. It does not calculate or certify a professional skill rating.",
    troubleshooting: [
      "Unexpected balance may reflect self-described or missing experience; discuss expectations with the crew.",
      "A timer expiring or one court finishing does not complete the whole round.",
    ],
    related: ["mix-it-up", "settings-profile", "run-live-play"],
    sources: [
      "src/features/matches/play-mode-options.ts",
      "src/features/matches/rotation.ts",
      "src/features/sessions/rsvp-control.tsx",
    ],
  },
  {
    slug: "court-climb",
    category: "play",
    title: "Use Court Climb on full multiple courts",
    summary:
      "Move winners toward Court 1 and split partners for the next round.",
    audience: "Hosts, co-hosts, and Quick Play operators",
    prerequisites: [
      "At least two open courts and exactly four eligible players per open court.",
    ],
    steps: [
      "Check the arrival count against open courts. Select Court Climb only when the counts fit exactly.",
      "Review and start the first assignments. Make Court 1 clear to the crew.",
      "Finish all active court scores, then advance the round. Winners move toward Court 1, losers move down, and partners split as Relay assigns the next teams.",
    ],
    outcome:
      "The crew moves through a synchronized multi-court rotation with no spare-player queue at setup.",
    troubleshooting: [
      "For spare players, missing arrivals, or only one court, change the court/arrival setup or choose another mode.",
      "Do not manually infer next teams from a corrected old result; historical corrections do not rewrite later assignments.",
    ],
    related: ["rotation-modes", "arrival", "score-corrections"],
    sources: [
      "src/features/matches/actions.ts",
      "src/features/matches/rotation.ts",
    ],
  },
  {
    slug: "team-round-robin",
    category: "play",
    title: "Use Team Round Robin with fixed pairs",
    summary:
      "Keep partners together while every pair plays every other pair once.",
    audience: "Hosts, co-hosts, and Quick Play operators",
    prerequisites: [
      "Complete fixed pairs, every required player paired once, and at least two complete pairs present.",
    ],
    steps: [
      "Select Team Round Robin and use the pair builder to assign explicit partners.",
      "Resolve unpaired or repeated players, review attendance and courts, then start.",
      "Finish each active round and follow the next scheduled pairings. An odd number of teams creates byes; a bye is not a missing assignment.",
    ],
    outcome:
      "Pairs stay together throughout a finite round-robin schedule. Pair identity is explicit, not inferred from adjacent names in a queue.",
    troubleshooting: [
      "If a partner is absent, resolve attendance and pair requirements before starting rather than pretending the pair is complete.",
      "When all pairings are done, review results and end the game; do not expect an endless queue rotation.",
    ],
    related: ["rotation-modes", "choose-a-play-mode", "edit-end-game"],
    sources: [
      "src/features/matches/rotation.ts",
      "src/features/matches/actions.ts",
    ],
  },
  {
    slug: "run-live-play",
    category: "play",
    title: "Record scores and finish a match",
    summary:
      "Use live controls or enter a final result, then confirm before the rotation advances.",
    audience:
      "Host; Going co-hosts; signed-in Going players assigned to the court",
    prerequisites: [
      "An active saved-game match and permission to score. Guests and unassigned viewers can read/expand scores but cannot change them.",
    ],
    steps: [
      "Open Play and confirm the court and both teams before entering points.",
      "Use plus/minus controls for live scoring or enter the final score. Open the full-screen view if needed; move between active courts there and use its close control or Escape to return.",
      "If a version conflict appears, read the restored saved score and deliberately retry only the still-needed change.",
      "Choose Finish match, review the teams and final score, then confirm. A winner is required; a tie cannot be finished.",
      "Read the next assignment. Paddle Stack can rotate a court independently; synchronized modes require every active court to finish.",
    ],
    outcome:
      "A completed match becomes durable history and contributes to standings. Optional timers survive refresh from saved start time but never auto-complete a score.",
    troubleshooting: [
      "The original host can score any court. Nonhost co-hosts must also be Going; other signed-in players must be Going and assigned. Guest identity is read-only for scoring.",
      "Confirm important updates after reconnecting. Repeated clicks cannot safely resolve a conflict.",
    ],
    related: [
      "score-corrections",
      "live-recovery",
      "rotation-modes",
      "edit-end-game",
    ],
    sources: [
      "src/features/matches/actions.ts",
      "src/features/matches/live-court.tsx",
    ],
  },
  {
    slug: "score-corrections",
    category: "play",
    title: "Correct a completed match result",
    summary:
      "Fix a factual score without rewriting the rotation that happened afterward.",
    audience: "Hosts and co-hosts",
    prerequisites: [
      "A completed match in Play/Recap and a known correct final score.",
    ],
    steps: [
      "Find the completed match in Play or Recap and open its score-correction control.",
      "Enter the corrected final scores (0–99), with a winner and an actual change from the saved result.",
      "Review and save. Confirm that the completed result and standings reflect the correction.",
    ],
    outcome:
      "Relay updates the winner, standings, and recap and preserves the correction record. Later court assignments remain as played.",
    troubleshooting: [
      "Ties, unchanged scores, stale versions, and matches that are no longer completed are rejected. Reload, inspect the latest result, and retry deliberately.",
      "To cancel an active match, use the organizer’s match-cancellation control with a reason, not a fabricated final score.",
    ],
    related: ["run-live-play", "live-recovery", "recap-story"],
    sources: [
      "src/features/matches/actions.ts",
      "docs/SESSION_SURFACE_PARITY.md",
    ],
  },
  {
    slug: "live-recovery",
    category: "play",
    title: "Handle queue changes, closed courts, and reconnecting",
    summary:
      "Recover from stale or interrupted courtside state without inventing scores or losing the crew’s place.",
    audience:
      "All viewers; court/queue/cancellation controls are organizer-only",
    prerequisites: [
      "Access to a live saved game. A network connection is needed for collaborative changes.",
    ],
    steps: [
      "If Relay shows reconnecting or read-only state, wait for the authoritative refresh before relying on assignments or saved scores.",
      "For attendance changes, use availability. Organizers can use the available court and queue controls; read the current order before reordering.",
      "Close an unavailable court through its organizer control. Its active match can finish and history stays; it receives no new assignment.",
      "If a match must be voided, use the cancellation control and give a clear reason. In Paddle Stack this affects that court; synchronized modes cancel the affected rotation.",
      "After a stale-change error, reload, review the latest courts/queue/scores, and retry only what remains necessary.",
    ],
    outcome:
      "The shared game returns to server-saved state. Voided matches do not contribute to standings, and closed courts retain their history.",
    troubleshooting: [
      "Relay does not promise offline score synchronization or cached private workspaces. Keep track of an unsaved result outside the interface until a permitted save is confirmed.",
      "For a next-round blocker, check unfinished matches, occupied courts, and the available waiting players. Report persistent failures with safe route and timing details.",
    ],
    related: ["arrival", "run-live-play", "install-offline", "support"],
    sources: [
      "src/features/matches/actions.ts",
      "src/features/matches/availability.ts",
      "public/sw.js",
    ],
  },
  {
    slug: "host-payments",
    category: "payments",
    title: "Mark Free or set up repayment and player shares",
    summary:
      "Record an expense paid upfront by the host without turning Relay into a payment processor.",
    audience:
      "Host creates collections; host/co-host reviews and adjusts shares",
    prerequisites: [
      "A published game. Know the actual expense and external repayment instructions.",
    ],
    steps: [
      "For a free game before Play, open Game settings → Invite → Player price, choose Free, and save. For repayment, open Payments and as host create a collection for an expense you covered.",
      "Enter the amount and external payment instructions. Optionally attach the host receipt and payment QR image in the game.",
      "Review the split. The host is paid upfront and excluded from player shares; amounts are split in integer cents with rounding handled by Relay.",
      "Use organizer controls to adjust individual amounts or exclude eligible shares. Review totals after recalculation, especially when there are multiple collections.",
      "Tell players to pay externally and submit proof in Payments. Review each sent proof rather than assuming upload confirms a transfer.",
    ],
    outcome:
      "Relay records repayment obligations. For discovery, it sums each player’s collections and shows the highest player total; the amount advertised can differ from an individual’s share.",
    troubleshooting: [
      "Reviewed payments cannot simply be excluded. Correct invalid totals using the allowed share controls, not by silently marking a real expense Free.",
      "Payments never block Play. Completion allows repayment to continue; cancellation closes changes and any refund must be coordinated externally.",
    ],
    related: [
      "payments",
      "review-proof",
      "public-discovery",
      "court-arrangement",
    ],
    sources: [
      "src/features/payments/actions.ts",
      "src/features/payments/domain.ts",
    ],
  },
  {
    slug: "payments",
    category: "payments",
    title: "Pay externally and submit payment proof",
    summary:
      "Check your share, follow the host’s instructions, and track review status in the game.",
    audience: "Account and browser-recognized guest players with a share",
    prerequisites: [
      "Your own roster identity, a payment collection, and the external method supplied by the host.",
    ],
    steps: [
      "Open Payments and read your amount, recipient, and payment instructions. The host is excluded from player shares because they paid upfront.",
      "Pay outside Relay using the stated method. Relay does not move money or automatically verify a bank transaction.",
      "Upload one clear proof image through your own share in Payments: JPG, PNG, or WebP, up to 5 MB. Confirm the upload succeeds.",
      "Wait for host/co-host review. Proof sent is not confirmed payment. If replacement is requested, read the note and upload a clearer correct image in the game.",
    ],
    outcome:
      "Your payment proof is attached to your own share and has an explicit review state. Only organizer review confirms it in Relay.",
    troubleshooting: [
      "If upload fails, check type/size and connection, wait after an upload limit, and retry. Reload if another change made your view stale.",
      "Use the original browser for an unclaimed guest share. Cancelled games close payment changes; contact the host about external settlement.",
      "Never email payment screenshots or private payment content to support.",
    ],
    related: ["review-proof", "keep-guest-game", "host-payments", "support"],
    sources: [
      "src/features/payments/actions.ts",
      "src/features/payments/domain.ts",
    ],
  },
  {
    slug: "review-proof",
    category: "payments",
    title: "Confirm proof or request a clearer image",
    summary:
      "Review a submitted proof and communicate a concrete correction when needed.",
    audience: "Hosts and co-hosts",
    prerequisites: [
      "A sent payment proof in an accessible game that has not been cancelled.",
    ],
    steps: [
      "Open Payments and select the submitted proof for the correct player/share.",
      "Compare the proof with the external transaction and expected amount/recipient. Relay does not verify the payment provider for you.",
      "Confirm only when satisfied, or request replacement with a short note explaining what must be clearer.",
      "After a replacement arrives, review again and confirm the saved status.",
    ],
    outcome:
      "Players see confirmation or an actionable replacement request instead of an unexplained pending proof.",
    troubleshooting: [
      "A replacement request needs a submitted proof. If a status changed concurrently, reload before reviewing again.",
      "For incorrect shares, use amount-management controls within their restrictions. Do not use proof confirmation to conceal a mismatch.",
    ],
    related: ["payments", "host-payments", "support"],
    sources: ["src/features/payments/actions.ts"],
  },
  {
    slug: "chat",
    category: "together",
    title: "Coordinate in Chat and share a photo",
    summary:
      "Keep game conversation beside the plan without treating a shared link as private messaging.",
    audience: "Organizers and joined account/guest participants",
    prerequisites: [
      "Recognized account or guest identity. Going, Maybe, and Waitlisted are participating states; Pending is not.",
    ],
    steps: [
      "Open Chat in the game and read the current conversation before sending a repeated question.",
      "Write text (up to 1,000 characters), attach one supported photo, or combine them. Send and confirm it appears in the thread.",
      "Use reactions for a quick acknowledgment. Open a photo thumbnail for the viewer and close it when done.",
    ],
    outcome:
      "Your message joins the game conversation. People with access to a public/link-only shared game may read it; avoid sensitive information.",
    troubleshooting: [
      "Sending needs text or a photo. Check the upload guidance for supported JPG/PNG/WebP images and the current limit.",
      "Wait after a rate limit and confirm messages after reconnection. Cancelled-game Chat is intentionally read-only.",
      "If you are recognized only as Pending or a link viewer, wait for a participating state rather than trying to bypass the control.",
    ],
    related: ["rsvp-status", "privacy", "live-recovery", "recap-story"],
    sources: [
      "src/features/chat/actions.ts",
      "src/features/chat/config.ts",
      "src/features/sessions/viewer.ts",
    ],
  },
  {
    slug: "recap-story",
    category: "together",
    title: "Read Recap, add memories, and share a Story",
    summary:
      "Keep factual results distinct from the image you choose to share.",
    audience: "Game viewers; photo contribution needs eligible participation",
    prerequisites: [
      "Access to the game. Shared memory uploads require completion and host/co-host or Going participant identity, including eligible guests.",
    ],
    steps: [
      "After the host ends the game, open Play, now Recap, for completed results and standings. No scored matches means no invented winner.",
      "Open Story to create an invitation before play, a safe live update during play, or a completed-game portrait afterward.",
      "Choose the available focus, layout, background, crop, contrast, and words. Preview the image and use supported native sharing or download the PNG.",
      "After completion, use Story’s Photos surface to add shared game memories. Upload JPG, PNG, or WebP under 10 MB and confirm the photo saved.",
    ],
    outcome:
      "Recap preserves the factual game; Story exports an image based on supported game data. A custom device background stays local unless separately uploaded as a shared photo.",
    troubleshooting: [
      "Not every focus is available in every phase or without supporting results. Do not manufacture scores to unlock a Story.",
      "If photo retrieval or image generation fails, choose another background and retry. If native sharing is unsupported or canceled, use PNG download.",
      "A memory upload requires the right lifecycle and identity; an arbitrary link viewer cannot add photos.",
    ],
    related: ["score-corrections", "repeat-games", "privacy"],
    sources: [
      "src/features/memories/session-memories.tsx",
      "src/features/memories/permissions.ts",
      "src/features/memories/actions.ts",
      "src/features/memories/recap-share-card.tsx",
    ],
  },
  {
    slug: "repeat-games",
    category: "together",
    title: "Play again or save the crew as a group",
    summary:
      "Reuse a practical plan without copying old responses, expenses, or results.",
    audience:
      "Original hosts for replay/save-crew; account group members for new group games",
    prerequisites: [
      "A completed game for Play again. Saving an ungrouped crew requires the game’s host.",
    ],
    steps: [
      "As the original host, choose Play again from the completed game or its Games entry.",
      "Review the carried plan, access policy, group, and suggested account invitees. Choose a new date and finish the normal creation Review before publishing.",
      "For a repeating standalone crew, choose Save this crew in Recap. Give the group its name; eligible Going account players can become members, not guest-only identities.",
      "Alternatively, open Groups to create a named crew. The owner edits details/image and adds account members by username. A group member can start a group game using available practical defaults.",
    ],
    outcome:
      "The next game is a fresh saved game. Replay never copies old RSVP responses, guests, booking state, payments, chat, photos, matches, or scores.",
    troubleshooting: [
      "Only the original host replays a completed source. A group role does not automatically grant co-host powers in its games.",
      "For an unknown or duplicate username, check the account identity rather than re-adding the same person. A crew already linked to a group does not need to be saved again.",
    ],
    related: ["create-a-game", "organizers", "recap-story"],
    sources: [
      "src/app/games/new/page.tsx",
      "src/features/groups/actions.ts",
      "src/features/groups/domain.ts",
    ],
    action: { href: "/groups", label: "Open Groups (account)" },
  },
  {
    slug: "notifications",
    category: "settings",
    title: "Set notifications, reminders, and push devices",
    summary:
      "Use the inbox as the factual source and opt into external delivery where supported.",
    audience: "Account players",
    prerequisites: [
      "A signed-in account. Push needs a supported browser and permission on each device.",
    ],
    steps: [
      "Open Notifications and follow a row to its game/action. Resolve requests in Players rather than assuming that reading a notification approves them.",
      "Open Settings → Notifications and choose email/push categories, reminder timing, time zone, and quiet hours.",
      "Choose to enable push on this device, then respond to the browser permission prompt. Repeat on each device you want to register.",
      "Review registered devices and disable a device when no longer needed. Check delivery preferences after changing browsers.",
    ],
    outcome:
      "Your account has explicit channel and device preferences. In-app events do not imply every event will also be sent by email or push.",
    troubleshooting: [
      "Installation alone does not grant push permission. Review browser permission if blocked, or use the inbox when push is unsupported.",
      "Check category, reminder, time-zone, and quiet-hour settings before assuming delivery failed. Retry a failed device registration/removal from its control.",
    ],
    related: ["install-offline", "rsvp-status", "support"],
    sources: [
      "src/features/notifications/preferences.ts",
      "src/features/notifications/push-device-control.tsx",
      "src/app/(app)/settings/page.tsx",
    ],
    action: {
      href: "/settings?section=notifications",
      label: "Notification settings (account)",
    },
  },
  {
    slug: "settings-profile",
    category: "settings",
    title: "Edit your profile and personal preferences",
    summary:
      "Keep your player identity current and change the way Relay looks and organizes games.",
    audience: "Account players",
    prerequisites: [
      "A signed-in account. Profile editing and game settings are different destinations.",
    ],
    steps: [
      "Open your own Profile and choose Edit profile. Update supported name, bio, city, playing experience, dominant hand, and photo fields.",
      "For an avatar, use JPG, PNG, or WebP smaller than 5 MB. Save and check the updated profile.",
      "Open Settings → Appearance for Light, Dark, or System and app installation. Use Settings → Games for game-view preferences and Settings → Account for password changes.",
      "Use Games and Groups view controls to choose available list/grid/calendar presentation. These are viewing preferences, not changes to the underlying game order or access.",
    ],
    outcome:
      "Your profile and preferred presentation are updated. Account playing experience also updates your account roster information; it is not a professional rating.",
    troubleshooting: [
      "Fix marked field or image errors and wait after rate limits. There is no documented self-service username-change or profile-visibility switch here.",
      "To edit a game’s plan or organizers, open that game’s settings rather than your personal Settings.",
    ],
    related: [
      "account-recovery",
      "notifications",
      "install-offline",
      "privacy",
    ],
    sources: [
      "src/features/players/actions.ts",
      "src/features/players/avatar-validation.ts",
      "src/app/(app)/settings/page.tsx",
    ],
    action: { href: "/settings", label: "Open Settings (account)" },
  },
  {
    slug: "install-offline",
    category: "settings",
    title: "Install Relay and understand offline limits",
    summary:
      "Add a home-screen shortcut without assuming private games are available offline.",
    audience:
      "Account players installing Relay; all readers troubleshooting connectivity",
    prerequisites: [
      "A browser that supports installation or a home-screen shortcut. Network access for fresh collaborative game data.",
    ],
    steps: [
      "Open Settings → Appearance and find Install Relay under the Relay app section.",
      "Use the installation prompt when offered. On iOS Safari, use Share → Add to Home Screen; otherwise follow the browser-menu guidance shown.",
      "Open the installed app and sign in as needed. Enable push separately if desired.",
      "When offline, reconnect and reopen the page. Confirm live assignments and scores after the game refreshes.",
    ],
    outcome:
      "Relay can open like an app, but installation does not create an offline copy of private game data or a guarantee of queued score synchronization.",
    troubleshooting: [
      "A dismissed, unsupported, or already-installed prompt may need the browser’s manual path.",
      "The service worker provides an offline fallback and static assets, not cached private workspaces, APIs, media, or maps. Browser-local Quick Play persistence is separate and does not guarantee a cold offline launch.",
    ],
    related: ["quick-play", "notifications", "live-recovery"],
    sources: [
      "src/features/pwa/install-app-control.tsx",
      "public/sw.js",
      "src/app/(app)/settings/page.tsx",
    ],
    action: {
      href: "/settings?section=appearance",
      label: "Appearance and installation (account)",
    },
  },
  {
    slug: "privacy",
    category: "settings",
    title: "Understand game privacy and request account assistance",
    summary:
      "Choose what you share, understand guest identity, and use the published privacy process.",
    audience: "Everyone",
    prerequisites: [
      "None. Read the Privacy Policy for the full data and request terms.",
    ],
    steps: [
      "Check game visibility before sharing. Public/link-only links can expose the plan, roster, scores, and conversation to link viewers; private games require authorized access.",
      "Keep sensitive information out of chat and Story exports. Submit payment proof only through the game’s intended payment surface.",
      "Use the same browser for guest continuity, or attach the response to an account from the original link. Do not share guest tokens.",
      "For privacy/account-deletion assistance, use the contact process in the Privacy Policy. There is no self-service deletion procedure promised in Help.",
    ],
    outcome:
      "You know the visibility boundary and where to request privacy assistance without assuming link-only means confidential.",
    troubleshooting: [
      "Changing a profile preference does not privatize a previously shared image or link.",
      "For suspected unauthorized access or credential exposure, use the security-reporting instructions rather than an ordinary feature request. Send only minimal safe evidence.",
    ],
    related: ["visibility-sharing", "keep-guest-game", "support"],
    sources: [
      "src/app/privacy/page.tsx",
      "src/features/sessions/session-access.ts",
      "docs/SUPPORT.md",
    ],
    action: { href: "/privacy", label: "Read Privacy Policy" },
  },
  {
    slug: "feedback",
    category: "settings",
    title: "Report a bug, request a feature, or track feedback",
    summary:
      "Send specific, safe context and see the public review status of your own submissions.",
    audience: "Account players; signed-out readers can email support",
    prerequisites: [
      "An account for in-app feedback. Completed-game feedback requires eligible account participation.",
    ],
    steps: [
      "Open Send feedback and choose Bug report, Feature request, or General feedback, then select the affected area.",
      "Write a specific title and description: what you tried, expected, and saw. Add a local Relay page path when useful and choose whether you permit follow-up contact.",
      "Submit and use your feedback history to check status. New, Reviewing, Planned, Resolved, and Closed describe review, not a delivery promise.",
      "After a completed game, Smooth records the recap check-in; Had some issues opens this feedback flow with game context. You can dismiss that check-in without blocking results.",
    ],
    outcome:
      "Your account has a recorded submission and visible public status. Private triage notes are not shown to players.",
    troubleshooting: [
      "Fix marked fields; titles need 5–100 characters and descriptions 15–3,000. The optional path must be local to Relay.",
      "Wait after a submission limit and do not duplicate an already-recorded completed-game review. If unable to sign in, use email support instead.",
    ],
    related: ["support", "account-recovery", "recap-story"],
    sources: [
      "src/features/feedback/validation.ts",
      "src/features/feedback/actions.ts",
      "src/app/(app)/feedback/page.tsx",
    ],
    action: { href: "/feedback", label: "Send feedback (account)" },
  },
  {
    slug: "support",
    category: "settings",
    title: "Contact support safely or report a security concern",
    summary:
      "Get help even before sign-in, with safe evidence and realistic response expectations.",
    audience: "Everyone, including guests and people blocked by account setup",
    prerequisites: [
      "A description of the problem. Never send a password, one-time code, guest token, payment screenshot, database dump, or private game content by email.",
    ],
    steps: [
      "For routine beta support, email vanajvanguardia@gmail.com. Describe the affected Relay route, approximate time, what you expected, what happened, and safe steps to reproduce.",
      "For suspected credential exposure, unauthorized access, or abuse, open the published security reporting instructions at /.well-known/security.txt and follow that channel. Preserve only minimal evidence.",
      "For a product idea or bug while signed in, use Send feedback to retain its public review status in your account.",
      "Allow for acknowledgment targets: within 24 hours for security/active abuse; two business days for blocked game, RSVP, Play, payment-proof, or account access; five business days for court corrections and general feedback.",
    ],
    outcome:
      "Support receives a safe, actionable report. These are acknowledgment targets, not promises of resolution or a guaranteed fix date.",
    troubleshooting: [
      "Host decisions such as approval, court booking, or external repayment should first be clarified with the host or venue.",
      "Do not forward secure email links, private screenshots, or tokens to prove identity. If uncertain what evidence is safe, start with a text description only.",
    ],
    related: ["feedback", "account-recovery", "privacy"],
    sources: [
      "docs/SUPPORT.md",
      "public/.well-known/security.txt",
      "src/app/privacy/page.tsx",
    ],
    action: {
      href: "mailto:vanajvanguardia@gmail.com",
      label: "Email Relay support",
    },
  },
];

// Fragments cannot be redirected on the server. Keep visible, useful landing
// targets for the original manuals and FAQ section links.
export const legacyHelpLinks = [
  { id: "find-a-court", slug: "find-a-court" },
  { id: "create-a-game", slug: "create-a-game" },
  { id: "payments", slug: "payments" },
  { id: "choose-a-play-mode", slug: "choose-a-play-mode" },
  { id: "run-live-play", slug: "run-live-play" },
  { id: "play-mode-reference", slug: "rotation-modes" },
  { id: "quick-answers", slug: "relay-basics" },
  { id: "getting-started", slug: "player-start" },
  { id: "invites-and-players", slug: "rsvp-status" },
  { id: "chat-and-notifications", slug: "chat" },
  { id: "play-and-scores", slug: "run-live-play" },
  { id: "privacy-and-history", slug: "privacy" },
] as const;

export function getHelpArticle(slug: string) {
  return helpArticles.find((article) => article.slug === slug);
}

export function searchHelpArticles(rawQuery: string, category?: string) {
  const terms = rawQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return helpArticles.filter((article) => {
    if (category && article.category !== category) return false;
    const categoryTitle =
      helpCategories.find((item) => item.id === article.category)?.title ?? "";
    const text = [
      article.title,
      article.summary,
      article.audience,
      categoryTitle,
      ...article.prerequisites,
      ...article.steps,
      article.outcome,
      ...article.troubleshooting,
    ]
      .join(" ")
      .toLowerCase();
    return terms.every((term) => text.includes(term));
  });
}
