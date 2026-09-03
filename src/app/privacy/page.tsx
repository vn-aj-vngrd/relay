import type { Metadata } from "next";

import { LegalPage } from "@/components/shared/legal-page";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How Relay collects, uses, and protects information around pickleball sessions.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      summary="Relay uses only the information needed to organize a game, keep participants in sync, and preserve the session afterward."
      updated="September 3, 2026"
    >
      <section>
        <h2>Information Relay stores</h2>
        <ul>
          <li>
            Account details such as email, name, username, avatar, city, and
            optional playing experience.
          </li>
          <li>
            Session details, RSVP status, guest names, groups, court
            assignments, scores, and waitlist position.
          </li>
          <li>
            Messages, reactions, photos, booking evidence, payment instructions,
            and payment proof you choose to add.
          </li>
          <li>
            Operational records such as notification preferences, registered
            push-device endpoints, delivery status, feedback and its optional
            game context, moderation history, and a small set of product
            lifecycle events.
          </li>
        </ul>
      </section>

      <section>
        <h2>Guests and shared links</h2>
        <p>
          A guest can RSVP with a name without creating an account. Relay stores
          a secure, device-bound cookie so that guest can return to the same
          game. If the guest later signs in from that link, Relay can attach the
          guest spot and its session history to the account.
        </p>
        <p>
          Anyone with a link-visible session URL may view its plan, roster,
          scores, and session conversation. Hosts should treat the link like an
          invitation and avoid placing sensitive information in notes or chat.
        </p>
      </section>

      <section>
        <h2>How information is used</h2>
        <p>
          Relay uses session information to render the shared game, enforce
          capacity and permissions, calculate fair rotations and standings,
          coordinate repayment, deliver notifications, sync collaborative
          updates, and create recaps. Relay does not sell personal information
          or use private game content for advertising.
        </p>
      </section>

      <section>
        <h2>Service providers</h2>
        <ul>
          <li>
            Supabase provides authentication, PostgreSQL, file storage, realtime
            updates, and scheduled jobs.
          </li>
          <li>
            Vercel hosts the application and provides privacy-conscious
            aggregate web analytics and runtime logs.
          </li>
          <li>
            Resend delivers account email and game reminder email only when the
            relevant channel is enabled.
          </li>
          <li>
            Browser push providers deliver opted-in device notifications through
            encrypted push subscriptions.
          </li>
          <li>
            Geoapify supplies map tiles through Relay’s server-side proxy.
            Game-creation suggestions come from Relay’s reviewed court
            directory, so typed search text is not sent to Geoapify.
          </li>
        </ul>
        <p>
          These providers process data under their own terms and security
          practices.
        </p>
      </section>

      <section>
        <h2>Payment and location boundaries</h2>
        <p>
          Relay never receives card or wallet credentials and never moves money.
          Payment details and proof images only coordinate repayment between the
          people in a session. Relay does not continuously track a player’s
          location. If a player chooses Use my location in Court Finder, the
          browser uses the approximate location on that device to sort courts;
          Relay does not store it.
        </p>
      </section>

      <section>
        <h2>Retention and control</h2>
        <p>
          Hosts may delete sessions they own. Players may update profile
          details, RSVP status, notification categories, reminder timing, quiet
          hours, email delivery, and registered push devices. Email includes an
          unsubscribe path. Some completed-session and moderation facts may be
          retained to preserve shared history, prevent abuse, or meet legal
          obligations. Account deletion requests are handled with care for
          records shared with other participants.
        </p>
      </section>

      <section>
        <h2>Security and contact</h2>
        <p>
          Relay uses server-side authorization, database row-level security,
          private storage for sensitive uploads, encrypted transport, and scoped
          guest tokens. No online service can guarantee absolute security.
          Report a privacy or security concern to{" "}
          <a href="mailto:vanajvanguardia@gmail.com">
            vanajvanguardia@gmail.com
          </a>
          . Security and account-access reports are reviewed first; Relay aims
          to acknowledge them within 24 hours and two business days,
          respectively.
        </p>
      </section>
    </LegalPage>
  );
}
