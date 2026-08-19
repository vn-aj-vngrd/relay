import type { Metadata } from "next";

import { LegalPage } from "@/components/shared/legal-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms for using Relay to organize recreational pickleball sessions.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      summary="Relay is a coordination tool for recreational pickleball with friends. Use it honestly, safely, and with respect for the people in each session."
      updated="August 19, 2026"
    >
      <section>
        <h2>Using Relay</h2>
        <p>
          You must provide accurate account and session information, protect access to your account and shared links,
          and use Relay only for lawful purposes. You are responsible for activity performed through your account or
          guest session identity.
        </p>
      </section>

      <section>
        <h2>Host and participant responsibilities</h2>
        <ul>
          <li>
            Hosts are responsible for session details, invitations, roster decisions, court booking, and corrections.
          </li>
          <li>Participants are responsible for their own RSVP, attendance, play, payments, uploads, and conduct.</li>
          <li>Everyone must have permission to upload photos or information about another person.</li>
          <li>Shared links should be sent only to people the host intends to invite.</li>
        </ul>
      </section>

      <section>
        <h2>No booking or payment service</h2>
        <p>
          Relay does not reserve courts, guarantee venue availability, hold funds, process transfers, issue refunds, or
          verify that a payment occurred. Booking references, receipts, account details, and proof images are records
          supplied by users. Resolve reservation and payment disputes directly with the venue or people involved.
        </p>
      </section>

      <section>
        <h2>Recreational play and safety</h2>
        <p>
          Pickleball involves physical activity and risk. Relay’s playing-experience labels, rotations, court
          assignments, scores, standings, and timers are organizational aids—not professional ratings, officiating,
          medical advice, or safety guarantees. Players decide whether they are fit to participate and must follow venue
          rules and applicable laws.
        </p>
      </section>

      <section>
        <h2>Your content</h2>
        <p>
          You keep ownership of content you add. You give Relay permission to store, process, resize, and display it
          only as needed to operate and share the relevant session. Do not upload illegal, abusive, misleading,
          infringing, or malicious content. Relay may remove content or restrict accounts to protect users and the
          service.
        </p>
      </section>

      <section>
        <h2>Service availability</h2>
        <p>
          Relay may change, suspend, or discontinue features and may experience interruptions. Collaborative state is
          designed to reconnect to authoritative saved data, but users should verify important venue, payment, and score
          changes. The service is provided as available without a guarantee that it will always be uninterrupted or
          error-free.
        </p>
      </section>

      <section>
        <h2>Accounts and enforcement</h2>
        <p>
          Relay may suspend access for abuse, security risk, unlawful behavior, or material violation of these terms.
          You may stop using Relay at any time. Shared session history may remain visible to other participants after an
          account is removed where necessary to keep their records coherent.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms may be sent to{" "}
          <a href="mailto:vanajvanguardia@gmail.com">vanajvanguardia@gmail.com</a>.
        </p>
      </section>
    </LegalPage>
  );
}
