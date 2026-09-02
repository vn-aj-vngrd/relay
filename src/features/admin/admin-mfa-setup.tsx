"use client";

import { CheckCircle, ShieldCheck } from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { Button, ButtonSpinner } from "@/components/ui/button";

import { prepareAdminMfaAction, verifyAdminMfaAction } from "./admin-mfa-actions";

type Setup = { factorId: string; qrCode?: string; secret?: string; enrolled: boolean };

export function normalizeMfaQrCode(qrCode: string) {
  const trimmed = qrCode.trim();
  const separator = trimmed.indexOf(",");
  if (!trimmed.startsWith("data:image/svg+xml") || separator === -1) return trimmed;
  const svg = trimmed.slice(separator + 1);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function AdminMfaSetup() {
  const [setup, setSetup] = useState<Setup | null>(null);
  const preparationStarted = useRef(false);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("Preparing administrator security…");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (preparationStarted.current) return;
    preparationStarted.current = true;

    void prepareAdminMfaAction()
      .then((result) => {
        if (!result.ok) {
          if (result.message === "Administrator security is already verified.") {
            window.location.replace("/admin");
            return;
          }
          setError(result.message);
          setBusy(false);
          return;
        }
        setSetup(result);
        setMessage(
          result.enrolled
            ? "Enter the current code from your authenticator app."
            : "Scan the QR code, then enter the six-digit code to secure admin access.",
        );
        setBusy(false);
      })
      .catch(() => {
        setError("Administrator security could not be prepared. Sign out, sign in, and try again.");
        setBusy(false);
      });
  }, []);

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!setup || !/^\d{6}$/.test(code)) {
      setError("Enter the six-digit code from your authenticator app.");
      return;
    }
    setBusy(true);
    setError("");
    const result = await verifyAdminMfaAction({ factorId: setup.factorId, code });
    if (!result.ok) {
      setError(result.message);
      setBusy(false);
      return;
    }
    setMessage("Administrator security confirmed. Opening the console…");
    window.location.replace("/admin");
  }

  return (
    <section
      className="w-full max-w-lg rounded-xl border border-line bg-surface p-6 sm:p-8"
      aria-labelledby="mfa-title"
    >
      <ShieldCheck aria-hidden className="text-primary" size={30} />
      <h1 id="mfa-title" className="mt-4 text-[1.75rem] font-[680] leading-tight tracking-[-0.025em]">
        Secure admin access
      </h1>
      <p className="mt-3 text-[15px] leading-6 text-muted">{message}</p>

      {busy && !setup ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted" role="status">
          <ButtonSpinner /> Preparing authenticator setup…
        </div>
      ) : null}

      {setup && !setup.enrolled ? (
        <div className="mt-6 border-y border-line py-6">
          <Image
            src={normalizeMfaQrCode(setup.qrCode!)}
            alt="QR code for the Relay administrator authenticator"
            width={208}
            height={208}
            unoptimized
            className="mx-auto rounded-lg bg-white p-2"
          />
          <p className="mt-4 text-center text-xs leading-5 text-muted">
            Can’t scan? Enter this setup key manually:
            <code className="mt-1 block break-all font-mono text-[13px] font-semibold text-ink">{setup.secret!}</code>
          </p>
        </div>
      ) : null}

      {setup ? (
        <form noValidate onSubmit={verify} className="mt-6 space-y-4">
          <div>
            <label htmlFor="admin-mfa-code" className="text-sm font-[650]">
              Six-digit code
            </label>
            <input
              id="admin-mfa-code"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoFocus
              className="field font-mono tabular-nums tracking-[0.18em]"
            />
          </div>
          <Button className="h-11 w-full" disabled={busy}>
            {busy ? <ButtonSpinner /> : <CheckCircle aria-hidden size={18} />}
            {busy ? "Verifying…" : "Verify and open Admin Console"}
          </Button>
        </form>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 text-sm leading-5 text-danger">
          {error}
        </p>
      ) : null}
    </section>
  );
}
