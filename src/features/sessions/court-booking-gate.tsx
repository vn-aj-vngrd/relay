"use client";

import { MapPin } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { type ReactNode, useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { ConfirmationIcon } from "@/components/shared/confirmation-icon";
import { ActionNotice } from "@/components/ui/action-notice";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

import { confirmCourtBooking } from "./court-booking-actions";

function BookingChoices({ onCancel }: { onCancel: () => void }) {
  const { pending } = useFormStatus();
  return (
    <div className="mt-5 flex flex-col gap-2">
      <Button type="submit" name="booking" value="confirmed" disabled={pending}>
        {pending ? "Saving…" : "Booking confirmed"}
      </Button>
      <Button
        type="submit"
        name="booking"
        value="not_required"
        variant="secondary"
        disabled={pending}
      >
        No booking needed
      </Button>
      <Button
        type="button"
        variant="quiet"
        onClick={onCancel}
        disabled={pending}
      >
        Not yet
      </Button>
    </div>
  );
}

export function CourtBookingGate({
  sessionId,
  version,
  ready,
  children,
}: {
  sessionId: string;
  version: number;
  ready: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [state, action] = useActionState(confirmCourtBooking, {});

  useEffect(() => {
    if (ready && dialog.current?.open) {
      dialog.current.close();
      const heading = Array.from(
        content.current?.querySelectorAll<HTMLElement>("h2") ?? []
      ).find((element) => !element.closest("[hidden]"));
      heading?.focus();
    } else if (!ready && !dialog.current?.open) dialog.current?.showModal();
  }, [ready]);

  function cancel() {
    router.push(`/games/${sessionId}/play`);
  }

  return (
    <>
      <Dialog
        ref={dialog}
        aria-labelledby="court-booking-title"
        aria-describedby="court-booking-description"
        onCancel={(event) => {
          event.preventDefault();
          cancel();
        }}
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <ConfirmationIcon>
              <MapPin size={20} />
            </ConfirmationIcon>
            <div>
              <h2 id="court-booking-title" className="text-lg font-bold">
                Is the court ready?
              </h2>
              <p
                id="court-booking-description"
                className="mt-2 text-sm leading-6 text-muted"
              >
                Confirm your court arrangement before setting up Play.
              </p>
            </div>
          </div>
          {state.error ? (
            <ActionNotice message={state.error} response={state} />
          ) : null}
          <form action={action} noValidate>
            <input type="hidden" name="sessionId" value={sessionId} />
            <input type="hidden" name="version" value={version} />
            <BookingChoices onCancel={cancel} />
          </form>
        </div>
      </Dialog>
      <div ref={content} hidden={!ready}>
        {children}
      </div>
    </>
  );
}
