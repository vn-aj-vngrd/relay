import { type BillingPlan, mediaPolicy, storageLabel } from "./domain";

export const planDescriptions = {
  free: "For occasional games with friends.",
  plus: "For hosts organizing games regularly.",
  pro: "For frequent hosts bringing more players together.",
  unlimited: "Admin-managed hosting access.",
};

export function pricingStatus(plan: BillingPlan, acceptingPayments: boolean) {
  if (plan.id === "unlimited") return "Admin only";
  if (!plan.visible) return "Not publicly listed";
  if (plan.availability === "coming_soon") return "Coming soon";
  if (
    plan.availability === "paused" ||
    (plan.id !== "free" && !acceptingPayments)
  )
    return "Purchases paused";
  return "Available now";
}

export function pricingStorage(bytes: number) {
  return storageLabel(bytes).replace(".0 ", " ");
}

export function getPricingComparison(pricingPlans: BillingPlan[]) {
  return [
    {
      title: "Hosting capacity",
      rows: [
        {
          label: "Price per month",
          values: pricingPlans.map((plan) => `₱${plan.priceCents / 100}`),
        },
        {
          label: "Games you can create per month",
          values: pricingPlans.map((plan) => `${plan.games} games`),
        },
        {
          label: "When your game allowance resets",
          values: pricingPlans.map((plan) =>
            plan.id === "free"
              ? "1st of each month (PH time)"
              : "Each monthly term"
          ),
        },
        {
          label: "Photo storage · total, not monthly",
          values: pricingPlans.map((plan) => pricingStorage(plan.storageBytes)),
        },
        { label: "Players per game", values: ["40", "40", "40"] },
        { label: "Courts per game", values: ["20", "20", "20"] },
      ],
    },
    {
      title: "Included with every plan",
      rows: [
        {
          label: "Guest RSVP, invites and waitlist",
          values: ["Included", "Included", "Included"],
        },
        {
          label: "Joining games and co-hosting",
          values: ["Included", "Included", "Included"],
        },
        {
          label: "Groups and shared game links",
          values: ["Included", "Included", "Included"],
        },
        {
          label: "Play, rotations and scoring",
          values: ["Included", "Included", "Included"],
        },
        {
          label: "Basic recap and Story",
          values: ["Included", "Included", "Included"],
        },
        {
          label: "Text chat and reactions",
          values: ["Included", "Included", "Included"],
        },
        {
          label: "Game repayment tracking",
          values: ["Included", "Included", "Included"],
        },
      ],
    },
    {
      title: "Photo uploads",
      rows: [
        {
          label: "Whose storage is used?",
          values: ["Game owner’s", "Game owner’s", "Game owner’s"],
        },
        {
          label: "Maximum size per chat image",
          values: pricingPlans.map(() =>
            pricingStorage(mediaPolicy.chat.maxBytes)
          ),
        },
        {
          label: "Chat images per uploader per day",
          values: pricingPlans.map(() => String(mediaPolicy.chat.dailyUploads)),
        },
        {
          label: "Maximum size per game photo",
          values: pricingPlans.map(() =>
            pricingStorage(mediaPolicy.memory.maxBytes)
          ),
        },
        {
          label: "Game photos per uploader per day",
          values: pricingPlans.map(() =>
            String(mediaPolicy.memory.dailyUploads)
          ),
        },
      ],
    },
    {
      title: "Billing",
      rows: [
        {
          label: "Who subscribes?",
          values: pricingPlans.map((plan) =>
            plan.id === "free" ? "No payment needed" : "Individual host"
          ),
        },
        {
          label: "Renewal",
          values: pricingPlans.map((plan) =>
            plan.id === "free" ? "Not required" : "Manual, monthly"
          ),
        },
        { label: "Automatic charges", values: ["None", "None", "None"] },
        {
          label: "Paid access starts",
          values: pricingPlans.map((plan) =>
            plan.id === "free" ? "Not applicable" : "After payment approval"
          ),
        },
      ],
    },
  ];
}

export const pricingQuestions = [
  {
    question: "What counts as a game each month?",
    answer:
      "A game is one successfully created hosted game, not each match or round played on a court. Failed creation does not count. Deleting or cancelling a game does not give the allowance back. Unused games do not roll over.",
  },
  {
    question: "When does my monthly allowance reset?",
    answer:
      "Free resets on the 1st of each calendar month at midnight Philippine time. Paid plans use a one-calendar-month term, not a fixed 30 days. For example, a term starting April 10 ends May 10; January 31 clamps to the last day of February. Plan & billing shows your exact dates. Games already created in the current calendar month count toward your first paid term.",
  },
  {
    question: "Do players need a paid plan to join my game?",
    answer:
      "No. Joining, guest RSVP, Play, scoring and basic recap are included on every plan. The original game owner’s plan supplies hosting capacity. Players and co-hosts do not buy seats.",
  },
  {
    question: "What is photo storage used for?",
    answer:
      "Chat images and game photos uploaded by anyone in your hosted games share your total storage. It does not reset monthly. A Free player in a Pro host’s game uses the host’s storage, not their own. Participant uploads need the host’s permission and available storage. Avatars, group images and payment proofs do not count toward this allowance. Removing hosted photos frees space.",
  },
  {
    question: "Are photo upload limits different on paid plans?",
    answer:
      "No. Every plan uses the same per-file and per-uploader daily limits shown above. JPEG, PNG and WebP are supported; images must already fit the size limit because Relay does not automatically compress them. Daily limits reset at midnight Philippine time and apply across games for signed-in uploaders; guest limits are scoped to the game. Deleting an upload does not restore its daily allowance.",
  },
  {
    question: "How will monthly payments work?",
    answer:
      "When a paid plan is available, request it in Plan & billing, review the exact amount and payment instructions, pay externally, and submit the provider’s transaction reference. Access starts after an admin verifies received funds. A screenshot alone is not approval. Renewal is manual: no automatic debit and no annual commitment. Early renewal extends access after the current paid-through date.",
  },
  {
    question: "What happens when paid access expires or storage is full?",
    answer:
      "Without renewal, your account falls back to Free. Existing games and photos remain accessible. New game creation or image uploads stop when the relevant allowance is reached; text chat, Play and scoring remain available. Manage hosted photos to release storage. Your account page shows any complimentary access or admin allowance overrides.",
  },
  {
    question: "Is my subscription the same as paying for a court?",
    answer:
      "No. A Relay subscription pays for hosting capacity in the app. Court bookings and players’ game repayments are separate. Available payment methods, verification times and refund policies are shown before you pay for a subscription.",
  },
];
