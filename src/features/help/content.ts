export type HelpGuide = {
  id: string;
  title: string;
  summary: string;
  time: string;
  action: { href: string; label: string };
  steps: readonly { title: string; detail: string }[];
  notes?: readonly string[];
};

export const helpGuides = [
  {
    id: "find-a-court",
    title: "Find a court",
    summary:
      "Search Relay’s verified Philippines directory, compare practical details, and carry your choice into a new game.",
    time: "About 2 minutes",
    action: { href: "/courts", label: "Open Court Finder" },
    steps: [
      {
        title: "Search or filter",
        detail:
          "Open Court and search by court name, neighborhood, price text, or amenity. Use your location only if you want nearest-first sorting.",
      },
      {
        title: "Select a verified court",
        detail:
          "Choose a row or map pin. Check the address, setting, court count, hours, rental options, and any external booking link.",
      },
      {
        title: "Plan the game there",
        detail:
          "Choose Plan a game here. Relay prefills the court and address; you still confirm availability and book directly with the venue.",
      },
    ],
    notes: [
      "Court Finder covers the Philippines only. The reviewed directory is growing, and you can suggest a missing court.",
      "Relay lists courts but does not show live availability or make bookings.",
    ],
  },
  {
    id: "create-a-game",
    title: "Create and share a game",
    summary:
      "Set a recognizable plan, publish it once, and send friends one link that stays useful through the whole game.",
    time: "About 3 minutes",
    action: { href: "/games/new", label: "Create a game" },
    steps: [
      {
        title: "Set the plan",
        detail:
          "Add a game name, court, date, and start and end times. Use a name your friends will recognize in a message or notification.",
      },
      {
        title: "Set capacity and costs",
        detail:
          "Enter player capacity, number of courts, and an optional estimated cost. More options cover booking status, notes, approvals, and game color.",
      },
      {
        title: "Publish and share",
        detail:
          "Publish game creates the shared link. Friends can read the plan and RSVP from that link, even without an account.",
      },
    ],
    notes: [
      "You can edit the plan later.",
      "A full game sends new Going responses to the waitlist automatically.",
    ],
  },
  {
    id: "payments",
    title: "Coordinate repayment",
    summary:
      "Split an expense the host already covered, pay outside Relay, and keep proof and review status with the game.",
    time: "About 2 minutes",
    action: { href: "/games", label: "Choose a game" },
    steps: [
      {
        title: "Review your share",
        detail:
          "Open the game’s Payments tab. Confirm the expense, your amount, and the payment method supplied by the host.",
      },
      {
        title: "Pay the host outside Relay",
        detail:
          "Use GCash, Maya, bank transfer, cash, or the method shown. Relay coordinates repayment but never moves money.",
      },
      {
        title: "Submit one clear screenshot",
        detail:
          "Upload proof showing the amount and recipient. The status stays Proof sent until the host confirms it or requests a clearer image.",
      },
    ],
    notes: [
      "The host is shown as paid upfront and is excluded from player shares.",
      "Hosts can adjust or exclude individual shares.",
    ],
  },
  {
    id: "choose-a-play-mode",
    title: "Check in and choose a play mode",
    summary:
      "Tell Relay who is physically present, then pick the rotation that matches the crew and number of courts.",
    time: "About 2 minutes",
    action: { href: "/games", label: "Open one of your games" },
    steps: [
      {
        title: "Mark who is here",
        detail:
          "Players can check themselves in and hosts can update anyone. If nobody checks in, every Going player remains eligible.",
      },
      {
        title: "Choose the rotation",
        detail:
          "Pick Paddle Stack, Mix It Up, Balanced Mix, Court Climb, or Team Round Robin. Relay explains when a mode needs a different roster or court count.",
      },
      {
        title: "Confirm settings and start",
        detail:
          "Add an optional shared timer or mode-specific partner and queue rules, then choose Start Play to create the first assignments.",
      },
    ],
    notes: [
      "A timer never finishes a score automatically.",
      "Check-in changes Play eligibility, not RSVP or game history.",
    ],
  },
  {
    id: "run-live-play",
    title: "Run courts and record scores",
    summary:
      "Keep assignments visible, update the score from courtside, finish the match, and move the queue forward.",
    time: "During play",
    action: { href: "/games", label: "Go to your games" },
    steps: [
      {
        title: "Confirm the assignment",
        detail:
          "Each court names both sides above the scores. The queue shows who rests and who is next so the crew can prepare between rallies.",
      },
      {
        title: "Record points or only the result",
        detail:
          "Use the large minus and plus zones for live scoring, or enter the final result after the match. Assigned signed-in players may score their own court. Waiting players can sit out immediately; active players can sit out after their match; anyone returning joins the queue’s end.",
      },
      {
        title: "Finish and advance",
        detail:
          "Choose Finish match, review the teams and final score, then confirm. Relay moves the result into history and creates the next supported rotation.",
      },
    ],
    notes: [
      "Expand a scoreboard for a full-screen courtside view.",
      "A score conflict restores the latest saved result and explains how to retry.",
      "Hosts and co-hosts can correct a completed result. Standings and recap update, while later court assignments stay as played.",
    ],
  },
] as const satisfies readonly HelpGuide[];

export const playModes = [
  {
    mode: "Paddle Stack",
    bestFor: "Drop-ins and changing attendance",
    howItMoves:
      "Waiting players enter in queue order; choose adaptive, four-off, or winners-stay rules.",
    needs: "4+ players",
  },
  {
    mode: "Mix It Up",
    bestFor: "Social games with partner variety",
    howItMoves: "Relay rotates partners, opponents, and rests each round.",
    needs: "4+ players",
  },
  {
    mode: "Balanced Mix",
    bestFor: "Closer games across mixed experience",
    howItMoves:
      "Relay uses self-described experience to make balanced teams, then rotates rounds.",
    needs: "4+ players",
  },
  {
    mode: "Court Climb",
    bestFor: "A full crew on multiple courts",
    howItMoves:
      "Winners move toward Court 1 and partners split for the next round.",
    needs: "Exactly 4 players per court and at least 2 courts",
  },
  {
    mode: "Team Round Robin",
    bestFor: "Fixed-pair nights",
    howItMoves:
      "Every pair plays every other pair once; an odd number of teams creates byes.",
    needs: "At least 2 complete pairs",
  },
] as const;

export const faqSections = [
  {
    title: "Getting started",
    items: [
      [
        "What is Relay for?",
        "Relay keeps a casual pickleball game’s plan, invite, roster, shared costs, courts, scores, and memories in one place. It is not a league or rating platform.",
      ],
      [
        "Do I need a group before creating a game?",
        "No. Start with a standalone game. Create a group later when the same crew plays regularly.",
      ],
      [
        "How do I add a missing Philippines court?",
        "Choose Suggest a court in Court Finder and send the name, location, source link, and any court count, setting, hours, pricing, amenities, or booking details you know. The suggestion stays private until Relay verifies it.",
      ],
      [
        "Can I replay the app tour?",
        "Yes. Choose Replay tour at the top of Help Center. It points out the real navigation controls without changing your profile or games.",
      ],
      [
        "How do I report a problem or request a feature?",
        "Choose Send feedback from the sidebar or profile, select Bug report, Feature request, or General feedback, and add specific context.",
      ],
    ],
  },
  {
    title: "Invites and players",
    items: [
      [
        "Can friends view a game without an account?",
        "Yes. The shared link shows the plan, roster, open spots, estimated cost, and booking status before sign-in.",
      ],
      [
        "How does guest RSVP work?",
        "A guest enters a name and chooses Going, Maybe, or Can’t go. Relay remembers the response on that device for that game.",
      ],
      [
        "What happens when the game is full?",
        "New Going responses join the waitlist. If a going player leaves, the first eligible waitlisted player is promoted.",
      ],
      [
        "Can the host change the roster?",
        "Hosts can add or remove players, adjust capacity, manage waitlist order, and lock the roster when assignments are final.",
      ],
    ],
  },
  {
    title: "Chat and notifications",
    items: [
      [
        "Who can use game chat?",
        "Anyone with the shared link can read. Joined account players and guest players can send messages, react, and share one photo at a time.",
      ],
      [
        "Does chat update live?",
        "Yes. Relay shows connection state if updates pause and catches up after reconnecting.",
      ],
      [
        "What appears in notifications?",
        "Invitations, join requests, waitlist movement, booking changes, reminders, payment updates, and court assignments link to the relevant part of the game.",
      ],
    ],
  },
  {
    title: "Payments",
    items: [
      [
        "Does Relay process money?",
        "No. Players pay outside Relay. Relay only coordinates amounts, proof, and review status.",
      ],
      [
        "Can the host share the original receipt?",
        "Yes. The host may attach one receipt to the expense so players can see what was paid upfront.",
      ],
      [
        "Can player amounts be different?",
        "Yes. Hosts can adjust or exclude individual shares.",
      ],
    ],
  },
  {
    title: "Play and scores",
    items: [
      [
        "Do we have to score every point?",
        "No. Use live point controls during a match or enter only the final result afterward.",
      ],
      [
        "Who can change scores?",
        "Hosts and co-hosts can manage every court. A signed-in player assigned to an active match can update that scoreboard; other viewers remain read-only.",
      ],
      [
        "What if the connection drops?",
        "Collaborative views refresh when the connection returns. Confirm important score changes after reconnecting.",
      ],
      [
        "What happens after the game ends?",
        "Play becomes the factual recap with completed results and standings. Story unlocks shareable portraits supported by the game’s real data and photos.",
      ],
    ],
  },
  {
    title: "Privacy and history",
    items: [
      [
        "Are profile statistics competitive ratings?",
        "No. Sessions, matches, and wins are a lightweight history of games with friends. Relay does not calculate a professional rating.",
      ],
      [
        "Who can see a shared game?",
        "Anyone with the link can view the plan, roster, scores, and conversation. Host controls and payment review remain private.",
      ],
      [
        "What is the difference between a guest and an account player?",
        "Both can join and participate in one game. Account players also keep profile history across games; guests remain attached to that game and device.",
      ],
    ],
  },
] as const;

export function helpSectionId(title: string) {
  return title.toLowerCase().replaceAll(" ", "-");
}
